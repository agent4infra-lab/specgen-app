import type { Candidate, Localized, Scenario } from './scenarios';
import { thresholdFor } from '../lib/replay';
export interface KernelVariant { name: string; strategy: Localized; launch: string; tags: string[]; code: string; }
export interface TraceEvent { id: string; time: number; kind: 'reasoning'|'fork'|'code'|'validation'|'profile'|'stop'|'iteration'; candidateId?: string; level: 'info'|'success'|'error'; title: Localized; detail: Localized; }
const l=(en:string,zh:string):Localized=>({en,zh});
const references:Record<string,number>={'tensor-matmul':210,transpose:160,'fused-gemm':280};
const baseSpeedups:Record<string,number>={'tensor-matmul':1.76,transpose:1.65,'fused-gemm':2.22};
export const referenceLatency=(s:Scenario)=>references[s.id];
export const baselineData=(s:Scenario)=>({completedAt:Math.max(...s.iterations.map(i=>i.plannedEnd+8)),feedback:s.iterations.length,speedup:baseSpeedups[s.id]});
export function variantFor(s:Scenario,c:Candidate):KernelVariant {
 const n=s.candidates.indexOf(c),transposed=s.id==='transpose',fused=s.id==='fused-gemm';
 const rows=fused?[32,16,16,16]:[32,32,32,32],cols=fused?[32,32,64,64]:[32,32,64,64];
 const bm=rows[n],bn=cols[n],bk=n>=2?16:32;
 const name=transposed?['shared_transpose_v1','stride_fix_v2','transpose_tiled_v3'][n]:fused?['fused_epilogue_v1','smaller_tile_v2','wide_output_v3','register_fused_v4'][n]:['shared_tile_v1','vector_load_v2','register_tile_v3','alternate_launch_v4'][n];
 const names=fused?[l('Fuse the epilogue','融合 epilogue'),l('Reduce register pressure','降低寄存器压力'),l('Widen the output tile','加宽输出分块'),l('Vectorized fused output','向量化融合输出')]:transposed?[l('Stage a transposed tile','暂存转置分块'),l('Revise the address stride','修改地址步长'),l('Transpose-aware shared layout','转置感知的共享布局')]:[l('Shared-memory tiling','共享内存分块'),l('Vectorized global loads','向量化全局加载'),l('Register-blocked accumulation','寄存器分块累积'),l('Alternative launch geometry','替代 launch 配置')];
 const tags=[`BM=${bm}`,`BN=${bn}`,`BK=${bk}`,n===1&&!fused?'float4 loads':n>=2?'register reuse':'shared memory',fused?'fused epilogue':transposed?'transposed B':'batched GEMM'];
 const bAddress=transposed?(n===1?'B[k * N + col]':'B[col * K + k]'): 'B[k * N + col]';
 let code=`// ${name}.cu
// ${s.shape}, ${s.dtype}
constexpr int BM = ${bm};
constexpr int BN = ${bn};
constexpr int BK = ${bk};

__global__ void ${name}(
    const float* __restrict__ A,
    const float* __restrict__ B,${fused?'\n    const float* __restrict__ bias,':''}
    float* __restrict__ C, int M, int N, int K) {
  const int row = blockIdx.y * BM + threadIdx.y;
  const int col = blockIdx.x * BN + threadIdx.x;
${s.id==='tensor-matmul'?'  const int batch = blockIdx.z;\n  A += batch * M * K; C += batch * M * N;\n':''}  __shared__ float As[BM][BK];
  __shared__ float Bs[BK][BN];
  float acc = 0.0f;

  for (int base = 0; base < K; base += BK) {
    int k = base + threadIdx.x;
${n===1&&!fused?'    // Experiment: vectorize global loads.\n    float4 a4 = *reinterpret_cast<const float4*>(A + row*K + k);\n    As[threadIdx.y][threadIdx.x] = a4.x;\n':'    As[threadIdx.y][threadIdx.x] =\n      (row < M && k < K) ? A[row * K + k] : 0.0f;\n'}    Bs[threadIdx.y][threadIdx.x] =
      (k < K && col < N) ? ${bAddress} : 0.0f;
    __syncthreads();
    #pragma unroll
    for (int j = 0; j < BK; ++j)
      acc = fmaf(As[threadIdx.y][j], Bs[j][threadIdx.x], acc);
    __syncthreads();
  }
${fused?'  // Fuse bias + ReLU: avoid an intermediate tensor.\n  acc = fmaxf(acc + bias[col], 0.0f);\n':''}  if (row < M && col < N)
    C[row * N + col] = acc;
}
// Launch: block(${n>=2?'32, 8':'32, 32'}), grid(ceil(N/BN), ceil(M/BM)${s.id==='tensor-matmul'?', batch*heads':''})
`;
 if(n>=2){
  const tm=bm/8,tn=2;
  code=`// ${name}.cu
constexpr int BM = ${bm}, BN = ${bn}, BK = ${bk};
constexpr int TM = ${tm}, TN = ${tn};
__global__ void ${name}(
    const float* __restrict__ A,
    const float* __restrict__ B,${fused?'\n    const float* __restrict__ bias,':''}
    float* __restrict__ C, int M, int N, int K) {
  int tx = threadIdx.x, ty = threadIdx.y;
  int tid = ty * 32 + tx;  // 256 cooperating threads
  int row0 = blockIdx.y * BM, col0 = blockIdx.x * BN;
${s.id==='tensor-matmul'?'  A += blockIdx.z * M * K; C += blockIdx.z * M * N;\n':''}  __shared__ float As[BM][BK], Bs[BK][BN];
  float acc[TM][TN] = {};  // multiple outputs per thread
  for (int base = 0; base < K; base += BK) {
    for (int idx = tid; idx < BM * BK; idx += 256) {
      int r = idx / BK, k = idx % BK;
      As[r][k] = (row0+r < M && base+k < K)
        ? A[(row0+r)*K + base+k] : 0.0f;
    }
    for (int idx = tid; idx < BK * BN; idx += 256) {
      int k = idx / BN, col = idx % BN;
      Bs[k][col] = (base+k < K && col0+col < N)
        ? ${transposed?'B[(col0+col)*K + base+k]':'B[(base+k)*N + col0+col]'} : 0.0f;
    }
    __syncthreads();
    #pragma unroll
    for (int k = 0; k < BK; ++k)
      for (int r = 0; r < TM; ++r)
        for (int col = 0; col < TN; ++col)
          acc[r][col] = fmaf(As[ty*TM+r][k],
                            Bs[k][tx*TN+col], acc[r][col]);
    __syncthreads();
  }
${fused&&n===3?`  // Vectorized fused epilogue: one float2 store per pair.
  for (int r = 0; r < TM; ++r) {
    int row = row0 + ty*TM + r, col = col0 + tx*TN;
    float2 out = make_float2(
      fmaxf(acc[r][0] + bias[col], 0.0f),
      fmaxf(acc[r][1] + bias[col+1], 0.0f));
    if (row < M && col + 1 < N)
      *reinterpret_cast<float2*>(C + row*N + col) = out;
  }`:`  for (int r = 0; r < TM; ++r)
    for (int col = 0; col < TN; ++col) {
      int row = row0 + ty*TM + r, j = col0 + tx*TN + col;
      if (row < M && j < N)
        C[row*N+j] = ${fused?'fmaxf(acc[r][col] + bias[j], 0.0f)':'acc[r][col]'};
    }`}
}
`;
 }
 if(c.outcome==='compile-error') code=code.replace(`constexpr int BK = ${bk};`, "// BK was not defined in this specialization.");
 return {name,strategy:names[n],tags,launch:`block(${n>=2?'32, 8':`32, ${bm}`}) · tile(${bm}, ${bn}, ${bk})`,code};
}
export function baselineCode(s:Scenario):string {
 const fused=s.id==='fused-gemm',transpose=s.id==='transpose';
 return `// Sequential baseline — one output per thread
__global__ void naive_matmul(
    const float* A, const float* B,${fused?'\n    const float* bias,':''}
    float* C, int M, int N, int K) {
  int row = blockIdx.y * blockDim.y + threadIdx.y;
  int col = blockIdx.x * blockDim.x + threadIdx.x;
  if (row >= M || col >= N) return;
  float acc = 0.0f;
  for (int k = 0; k < K; ++k)
    acc += A[row * K + k] * ${transpose?'B[col * K + k]':'B[k * N + col]'};
  C[row * N + col] = ${fused?'fmaxf(acc + bias[col], 0.0f)':'acc'};
}`;
}
export function traceEvents(s:Scenario):TraceEvent[]{
 const events:TraceEvent[]=[{id:'input',time:0,kind:'iteration',level:'info',title:l('Task loaded · optimization starts','任务载入 · 开始优化'),detail:l(`${s.shape}; ${s.dtype}. Correctness: atol=1e-3, rtol=1e-3.`,`${s.shape}；${s.dtype}。正确性容差：atol=1e-3，rtol=1e-3。`)},{id:'design',time:4,kind:'reasoning',level:'info',title:l('Reasoning commits to a tile-based design','推理形成分块设计'),detail:l('Stage reusable inputs in shared memory. Keep the main generation running while testing concrete variants.','将可复用输入放入共享内存。在测试具体变体时，主生成继续运行。')}];
 for(const c of s.candidates){
  const v=variantFor(s,c),i=s.iterations.find(i=>i.id===c.iteration)!;
  events.push({id:`${c.id}-fork`,time:c.spawn,kind:'fork',candidateId:c.id,level:'info',title:l(`${c.id} forked from reasoning prefix`,`${c.id} 从推理前缀分叉`),detail:l(`${c.trigger.en}. Inherit the prompt and accumulated design; generate ${v.name}.`,`${c.trigger.zh}。继承 prompt 与已有设计，生成 ${v.name}。`)});
  if(c.generated<=i.end)events.push({id:`${c.id}-code`,time:c.generated,kind:'code',candidateId:c.id,level:'info',title:l(`Emitted ${v.name}.cu`,`生成 ${v.name}.cu`),detail:l(`${v.strategy.en}. ${v.launch}.`,`${v.strategy.zh}。${v.launch}。`)});
  if(c.validated<=i.end)events.push({id:`${c.id}-validate`,time:c.validated,kind:'validation',candidateId:c.id,level:c.outcome==='pass'?'success':'error',title:c.outcome==='pass'?l(`${c.id} passed correctness checks`,`${c.id} 通过正确性检查`):l(`${c.id} rejected: ${c.outcome}`,`${c.id} 被拒绝：${c.outcome}`),detail:c.outcome==='pass'?l('Compilation, execution and numerical comparison passed. Submit to the profiling queue.','编译、运行及数值比较均通过。提交到 profiling 队列。'):c.feedback});
  if(c.profiled!==undefined&&c.profiled<=i.end)events.push({id:`${c.id}-profile`,time:c.profiled,kind:'profile',candidateId:c.id,level:'success',title:l(`${c.id} profiled · ${c.speedup!.toFixed(2)}×`,`${c.id} 完成 profiling · ${c.speedup!.toFixed(2)}×`),detail:l(`Latency ${(referenceLatency(s)/c.speedup!).toFixed(1)} µs. Prior mean ${thresholdFor(s,c).toFixed(3)}×; ${c.speedup!>thresholdFor(s,c)?'threshold exceeded':'continue reasoning'}.`,`延迟 ${(referenceLatency(s)/c.speedup!).toFixed(1)} µs。此前均值 ${thresholdFor(s,c).toFixed(3)}×；${c.speedup!>thresholdFor(s,c)?'超过阈值':'继续主推理'}。`)});
 }
 for(const i of s.iterations){events.push({id:`end-${i.id}`,time:i.end,kind:'stop',level:'success',title:i.stop==='early'?l(`Iteration ${i.id}: early termination`,`第 ${i.id} 轮：提前终止`):l(`Main path completed · ${i.mainSpeedup}×`,`主路径完成 · ${i.mainSpeedup}×`),detail:i.stop==='early'?l('A measured candidate beat the prior mean. Cancel the main stream and outstanding forks; retain returned feedback.','已测量候选超过此前均值。取消主流及未完成分支，保留已经返回的反馈。'):l('No speculative candidate beat the threshold. Use the main result and preserve the best kernel.','推测候选未超过阈值。使用主路径结果，并保留最佳 kernel。')});if(i.id>1)events.push({id:`iteration-${i.id}`,time:i.start,kind:'iteration',level:'info',title:l(`Iteration ${i.id} · GPU pool reallocated`,`第 ${i.id} 轮 · 重新分配 GPU 池`),detail:l(`Previous profiling queue pressure → ${i.validationGPUs} validation / ${i.profilingGPUs} profiling GPUs.`,`上一轮 profiling 队列压力较高 → ${i.validationGPUs} 张验证 GPU / ${i.profilingGPUs} 张 profiling GPU。`)});}
 return events.sort((a,b)=>a.time-b.time);
}
export interface DiffLine {type:'same'|'added'|'removed';text:string;oldLine?:number;newLine?:number}
export function lineDiff(before:string,after:string):DiffLine[]{
 const a=before.split('\n'),b=after.split('\n'),dp=Array.from({length:a.length+1},()=>new Array<number>(b.length+1).fill(0));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const out:DiffLine[]=[];let i=0,j=0;
 while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){out.push({type:'same',text:a[i],oldLine:++i,newLine:++j});}else if(j<b.length&&(i===a.length||dp[i][j+1]>=dp[i+1][j]))out.push({type:'added',text:b[j],newLine:++j});else out.push({type:'removed',text:a[i],oldLine:++i});}
 return out;
}
