export type Lang = 'en' | 'zh';
export type Localized = { en: string; zh: string };
export type Outcome = 'pass' | 'compile-error' | 'numerical-error';
export interface Candidate {
  id: string; iteration: number; spawn: number; generated: number; validated: number; profiled?: number;
  speedup?: number; outcome: Outcome; trigger: Localized; design: Localized; code: string; feedback: Localized;
}
export interface Iteration {
  id: number; start: number; plannedEnd: number; end: number; stop: 'early' | 'fallback';
  validationGPUs: number; profilingGPUs: number; mainSpeedup?: number;
}
export interface Scenario {
  id: string; name: Localized; tag: Localized; description: Localized; shape: string; dtype: string;
  prompt: string; reference: string; history: number[]; duration: number; candidates: Candidate[];
  iterations: Iteration[]; source: { kind: 'illustrative'; label: Localized };
}
const L = (en: string, zh: string): Localized => ({ en, zh });
const source = { kind: 'illustrative' as const, label: L('Illustrative replay · not a measured run', '示意回放 · 非实测运行') };
export const scenarios: Scenario[] = [
  {
    id: 'tensor-matmul', name: L('4D tensor matmul', '四维张量矩阵乘'), tag: L('THE CORE IDEA', '核心机制'),
    description: L('A useful design becomes a faster candidate before the main reasoning finishes.', '主推理仍在继续，已有设计先成为可验证的候选。'),
    shape: '[8, 16, 128, 256] × [256, 128]', dtype: 'FP32',
    prompt: 'Optimize a 4D tensor–matrix multiplication kernel for an NVIDIA H200. Input A has shape [8, 16, 128, 256] and B has shape [256, 128], both FP32. Preserve the reference output within atol=1e-3, rtol=1e-3. Explore tiled loading and shared-memory reuse. Return a CUDA kernel and its launch configuration.',
    reference: 'def forward(A, B):\n    # A: [batch, heads, M, K]\n    # B: [K, N]\n    return torch.matmul(A, B)',
    history: [1.30, 1.50, 1.70], duration: 44,
    iterations: [{ id: 1, start: 0, plannedEnd: 43, end: 33, stop: 'early', validationGPUs: 4, profilingGPUs: 4 }], source,
    candidates: [
      { id: 'K01', iteration: 1, spawn: 8, generated: 13, validated: 17, profiled: 21, speedup: 1.36, outcome: 'pass', trigger: L('Tile shape committed', '确定分块尺寸'), design: L('32 × 32 tiles; coalesced global loads', '32 × 32 分块；合并全局内存访问'), code: '// Illustrative CUDA excerpt\nconstexpr int TILE = 32;\n__shared__ float a_tile[TILE][TILE];\nint row = blockIdx.y * TILE + threadIdx.y;\nint col = blockIdx.x * TILE + threadIdx.x;\n// Load tiles, synchronize, accumulate.\nfloat acc = 0.0f;\nfor (int k = 0; k < TILE; ++k)\n  acc += a_tile[threadIdx.y][k] * b_tile[k][threadIdx.x];', feedback: L('Correct, but below the historical mean. Keep reasoning.', '结果正确，但低于历史平均值。继续主推理。') },
      { id: 'K02', iteration: 1, spawn: 14, generated: 19, validated: 24, outcome: 'numerical-error', trigger: L('Vectorized loads proposed', '提出向量化加载'), design: L('Vectorized loads with an incomplete tail mask', '向量化加载，但尾部掩码不完整'), code: '// Illustrative CUDA excerpt — rejected\nint offset = base + threadIdx.x * 4;\nfloat4 values = *reinterpret_cast<const float4*>(A + offset);\n// Missing bounds handling for the final tile.\n// Validation rejects this candidate.', feedback: L('Numerical mismatch at the boundary. Rejected before profiling.', '边界处数值不匹配。在 profiling 前被拒绝。') },
      { id: 'K03', iteration: 1, spawn: 22, generated: 26, validated: 29, profiled: 33, speedup: 1.82, outcome: 'pass', trigger: L('Completed kernel body', '完成 kernel 函数体'), design: L('Reuse shared tiles; mask both boundary dimensions', '复用共享分块；覆盖两个维度的边界掩码'), code: '// Illustrative CUDA excerpt\nconstexpr int BM = 32, BN = 64, BK = 16;\nbool valid = row < M && col < N;\nfor (int tile = 0; tile < ceil_div(K, BK); ++tile) {\n  load_masked_tiles(A, B, tile);\n  __syncthreads();\n  accumulate_tile(acc);\n  __syncthreads();\n}\nif (valid) C[row * N + col] = acc;', feedback: L('1.82× exceeds the prior mean of 1.465×. Stop the main generation and pending forks.', '1.82× 超过此前平均值 1.465×。停止主生成及未完成的分支。') },
      { id: 'K04', iteration: 1, spawn: 28, generated: 37, validated: 41, outcome: 'pass', trigger: L('Alternative launch configuration', '替代 launch 配置'), design: L('An additional branch still generating at termination', '提前终止时仍在生成的候选分支'), code: '// Illustrative CUDA excerpt\n// This branch is cancelled when K03 meets the threshold.\n// No validation or profiling result is available.', feedback: L('Cancelled with the main generation. No result is fabricated.', '与主生成一起取消，不产生验证或 profiling 结果。') },
    ],
  },
  {
    id: 'transpose', name: L('Transposed matmul', '转置矩阵乘'), tag: L('LEARNING FROM FAILURE', '从失败中获得反馈'),
    description: L('Not every branch works. Correctness gates every performance result.', '并非每个分支都成功。性能结果必须先通过正确性检查。'),
    shape: '[1024, 512] × [2048, 512]ᵀ', dtype: 'FP32',
    prompt: 'Optimize C = A @ B.T on an NVIDIA H200. A is [1024, 512], B is [2048, 512], both FP32. Pay attention to the transposed operand and edge tiles. Match torch.matmul within atol=1e-3, rtol=1e-3. Return the CUDA kernel and launch configuration.',
    reference: 'def forward(A, B):\n    # Transpose changes the access pattern.\n    return A @ B.transpose(-1, -2)',
    history: [1.1, 1.5, 1.6], duration: 46,
    iterations: [{ id: 1, start: 0, plannedEnd: 45, end: 35, stop: 'early', validationGPUs: 4, profilingGPUs: 4 }], source,
    candidates: [
      { id: 'K01', iteration: 1, spawn: 7, generated: 12, validated: 16, outcome: 'compile-error', trigger: L('First implementation', '首次实现'), design: L('A shared-memory layout with a compile error', '包含编译错误的共享内存布局'), code: '// Illustrative CUDA excerpt — rejected\n__shared__ float tile[BM][BK];\n// Error: BK is not defined in this specialization.\n// Compile validation fails.', feedback: L('Compilation failed: undefined tile dimension. No profiling request.', '编译失败：分块维度未定义。不提交 profiling。') },
      { id: 'K02', iteration: 1, spawn: 14, generated: 20, validated: 24, outcome: 'numerical-error', trigger: L('Address arithmetic revised', '修改地址计算'), design: L('Compiled, but B uses the wrong stride', '编译成功，但 B 的步长有误'), code: '// Illustrative CUDA excerpt — rejected\nfloat b = B[k * N + col];\n// For B.T, the source address must respect B\'s original stride.\n// Numerical validation catches this error.', feedback: L('Numerical mismatch: transposed addressing is incorrect. Rejected.', '数值不匹配：转置寻址错误。候选被拒绝。') },
      { id: 'K03', iteration: 1, spawn: 23, generated: 28, validated: 31, profiled: 35, speedup: 1.78, outcome: 'pass', trigger: L('Transpose-aware tile complete', '完成转置感知分块'), design: L('Correct transposed indexing and coalesced loads', '正确的转置索引与合并加载'), code: '// Illustrative CUDA excerpt\nint b_row = blockIdx.x * BN + threadIdx.x;\nint k = tile_id * BK + threadIdx.y;\nb_tile[threadIdx.x][threadIdx.y] =\n  (b_row < N && k < K) ? B[b_row * K + k] : 0.0f;\n__syncthreads();\n// Accumulate A tile against transposed B tile.', feedback: L('Correctness passed. 1.78× exceeds 1.40×: early termination.', '正确性通过。1.78× 超过 1.40×：提前终止。') },
    ],
  },
  {
    id: 'fused-gemm', name: L('GEMM + bias + ReLU', 'GEMM + bias + ReLU'), tag: L('THE FALLBACK PATH', '保留主推理路径'),
    description: L('When no branch is good enough, finish the main path and improve the next iteration.', '当分支尚未达标时，完成主推理，并利用反馈改进下一轮。'),
    shape: '[512, 1024] × [1024, 512] + [512]', dtype: 'FP32',
    prompt: 'Fuse C = relu(A @ B + bias) into a CUDA kernel for an NVIDIA H200. A is [512, 1024], B is [1024, 512], bias is [512], all FP32. Avoid writing intermediate tensors. Preserve reference correctness within atol=1e-3, rtol=1e-3. Explore register accumulation and a fused epilogue.',
    reference: 'def forward(A, B, bias):\n    x = torch.matmul(A, B)\n    return torch.relu(x + bias)',
    history: [1.8, 2.0, 2.2], duration: 66,
    iterations: [
      { id: 1, start: 0, plannedEnd: 30, end: 35, stop: 'fallback', validationGPUs: 4, profilingGPUs: 4, mainSpeedup: 1.94 },
      { id: 2, start: 39, plannedEnd: 78, end: 60, stop: 'early', validationGPUs: 3, profilingGPUs: 5 },
    ], source,
    candidates: [
      { id: 'K01', iteration: 1, spawn: 6, generated: 10, validated: 14, profiled: 19, speedup: 1.72, outcome: 'pass', trigger: L('Fused epilogue proposed', '提出融合 epilogue'), design: L('Fused bias and ReLU, but register pressure is high', '融合 bias 和 ReLU，但寄存器压力较高'), code: '// Illustrative CUDA excerpt\nfloat out = acc + bias[col];\nC[row * N + col] = fmaxf(out, 0.0f);\n// Correct, but the tile uses too many registers.', feedback: L('1.72× is below the historical mean. Main generation continues.', '1.72× 低于历史均值。主生成继续。') },
      { id: 'K02', iteration: 1, spawn: 13, generated: 18, validated: 22, profiled: 28, speedup: 1.81, outcome: 'pass', trigger: L('Smaller register tile', '缩小寄存器分块'), design: L('Lower register pressure; still below the threshold', '寄存器压力降低，但仍未达阈值'), code: '// Illustrative CUDA excerpt\nconstexpr int BM = 32, BN = 32;\n// Smaller tiles improve occupancy.\nfloat out = fmaxf(acc + bias[col], 0.0f);\nif (row < M && col < N) C[row * N + col] = out;', feedback: L('Below the prior mean. The main path finishes and returns 1.94×.', '低于此前均值。主路径完成，返回 1.94×。') },
      { id: 'K03', iteration: 2, spawn: 43, generated: 48, validated: 52, profiled: 56, speedup: 1.82, outcome: 'pass', trigger: L('Use profiling feedback', '使用上一轮 profiling 反馈'), design: L('New iteration with more profiling capacity', '新一轮为 profiling 分配更多 GPU'), code: '// Illustrative CUDA excerpt\n// Previous feedback: register-limited occupancy.\nconstexpr int BM = 16, BN = 64, BK = 16;\n// Try a narrower row tile and wider output reuse.', feedback: L('Another valid measurement. Continue exploring.', '得到新的有效测量。继续探索。') },
      { id: 'K04', iteration: 2, spawn: 48, generated: 52, validated: 56, profiled: 60, speedup: 2.24, outcome: 'pass', trigger: L('Fused body complete', '完成融合函数体'), design: L('Balanced register tile and fused output epilogue', '平衡寄存器分块与融合输出 epilogue'), code: '// Illustrative CUDA excerpt\n// Tiled GEMM accumulates directly in registers.\nfloat value = fmaxf(acc + bias[col], 0.0f);\nif (row < M && col < N)\n  C[row * N + col] = value;\n// A single final store; no intermediate tensor.', feedback: L('2.24× exceeds the accumulated historical mean. End iteration 2 early.', '2.24× 超过累计历史均值。第二轮提前结束。') },
    ],
  },
];
export const text = (value: Localized, lang: Lang) => value[lang];
