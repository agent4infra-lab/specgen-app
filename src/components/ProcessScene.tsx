import { candidateStatus, stateAt, thresholdFor } from '../lib/replay';
import { type Lang, type Candidate, scenarios } from '../data/scenarios';
const colors={cyan:'#77e4ed',amber:'#efbe78',green:'#91e0b0',purple:'#baa8ff',red:'#ed9699',muted:'#71889a'};
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const mix=(a:number,b:number,p:number)=>a+(b-a)*clamp(p);
export function ProcessScene({time,lang='en',selected,onSelect,idPrefix='process'}:{time:number;lang?:Lang;selected?:string;onSelect?:(id:string)=>void;idPrefix?:string}){
 const s=scenarios[0],state=stateAt(s,time),candidates=s.candidates.slice(0,3);
 const chosen=candidates.find(c=>c.id===selected)??[...candidates].reverse().find(c=>time>=c.spawn)??candidates[0];
 const winner=state.winner, stopped=time>=s.iterations[0].end;
 const notes=[{t:0,en:'A[batch, head, M, K] @ B[K, N]',zh:'A[batch, head, M, K] @ B[K, N]'}, {t:4,en:'Map batch × head onto blocks',zh:'将 batch × head 映射到线程块'}, {t:8,en:'32 × 32 tiles in shared memory',zh:'共享内存中的 32 × 32 分块'}, {t:14,en:'Vectorize loads; check tail masks',zh:'向量化加载；检查尾部掩码'}, {t:22,en:'32 × 64 tile; reuse registers',zh:'32 × 64 分块；复用寄存器'}];
 const prefixRows=notes.filter(n=>n.t<=chosen.spawn).length;
 const drawTime=Math.min(time,33);
 const arrow=`url(#${idPrefix}-arrow)`;
 const label=(en:string,zh:string)=>lang==='en'?en:zh;
 function dot(c:Candidate){
  if(time<c.spawn||time>(c.profiled??c.validated))return null;
  let dx=0;
  if(time<c.generated)dx=mix(333,532,(time-c.spawn)/(c.generated-c.spawn));
  else if(time<c.validated)dx=mix(551,675,(time-c.generated)/(c.validated-c.generated));
  else dx=mix(699,860,(time-c.validated)/((c.profiled??time+1)-c.validated));
  const y=119+candidates.indexOf(c)*111, color=time<c.generated?colors.amber:time<c.validated?colors.green:colors.purple;
  return <g key={c.id}><circle cx={dx} cy={y} r="11" fill={color} opacity=".12"/><circle cx={dx} cy={y} r="4" fill={color}/></g>;
 }
 return <svg className="process-scene" viewBox="0 0 1040 570" role={onSelect?'group':'img'} aria-label={label('Reasoning prefixes branch into kernels, flow through correctness checks and profiling, then return a stopping signal.','推理前缀分叉为 kernel，通过正确性检查与 profiling 后，返回停止信号。')}>
  <defs><pattern id={`${idPrefix}-dots`} width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#37505f" opacity=".5"/></pattern><linearGradient id={`${idPrefix}-ray`}><stop stopColor={colors.cyan} stopOpacity=".1"/><stop offset="1" stopColor={colors.amber} stopOpacity=".6"/></linearGradient><marker id={`${idPrefix}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 8 4 0 8" fill="none" stroke={colors.green} strokeWidth="1.4"/></marker></defs>
  <rect width="1040" height="570" fill="#0c151e"/><rect width="1040" height="570" fill={`url(#${idPrefix}-dots)`}/>
  <g fontFamily="'JetBrains Mono Variable',monospace">
   <text x="32" y="35" fill={colors.cyan} fontSize="10" letterSpacing="1.6">{label('REASONING STREAM','主推理流')}</text><text x="397" y="35" fill={colors.amber} fontSize="10" letterSpacing="1.3">{label('SPECULATIVE FORKS','推测分叉')}</text><text x="601" y="35" fill={colors.green} fontSize="10">{label('VALIDATE','验证')}</text><text x="795" y="35" fill={colors.purple} fontSize="10">PROFILE</text>
   <rect x="30" y="57" width="298" height="324" rx="9" fill="#101f2a" stroke={stopped?'#43755c':'#365361'}/>
   <circle cx="48" cy="78" r="3" fill={stopped?colors.green:colors.cyan}/><text x="60" y="82" fill={stopped?colors.green:colors.cyan} fontSize="9">{stopped?label('STOPPED · USEFUL KERNEL FOUND','已停止 · 找到达标 KERNEL'):label('THINKING · MAIN PATH IS LIVE','思考中 · 主路径继续')}</text>
   <path d="M30 95H328" stroke="#304653"/>
   <rect x="42" y="106" width="273" height={Math.min(239, prefixRows*45+5)} rx="4" fill={colors.amber} opacity={time>=8?'.055':'0'} stroke={colors.amber} strokeDasharray="4 4"/>
   {notes.map((n,i)=><g key={n.t} opacity={time>=n.t?1:.15}><circle cx="51" cy={128+i*45} r="2" fill={i>=2?colors.amber:colors.muted}/><text x="74" y={132+i*45} fill={i<prefixRows&&time>=8?'#e2c79e':'#a8c4d3'} fontSize="9.4">{n[lang]}</text>{time>=n.t&&time<n.t+2&&<rect x="75" y={137+i*45} height="1" width={mix(0,218,(time-n.t)/2)} fill={colors.cyan}/>}</g>)}
   <rect x="48" y="348" width="262" height="17" rx="2" fill="#1a2f3c"/><rect x="48" y="348" width={262*drawTime/43} height="17" rx="2" fill={stopped?'#42765a':'#356873'}/><text x="57" y="360" fill="#c6dbe6" fontSize="8">{stopped?label('REMAINING REASONING CANCELLED','剩余推理已取消'):label('REASONING CONTINUES IN PARALLEL','主推理与候选并行执行')}</text>
   {time>=8&&<><path d={`M330 ${130+(prefixRows-1)*45}H351Q369 ${130+(prefixRows-1)*45} 369 210V ${119+candidates.indexOf(chosen)*111}H395`} fill="none" stroke={colors.amber} strokeWidth="2" opacity=".6"/><text x="341" y="402" fill={colors.amber} fontSize="9">{label('REUSE REASONING PREFIX','复用推理前缀')}</text></>}
   {candidates.map((c,n)=>{
    const y=82+n*111,status=candidateStatus(s,c,time),started=time>=c.spawn,failed=status==='failed';
    const validationDone=time>=c.validated,profileDone=Boolean(c.profiled&&time>=c.profiled),active=chosen.id===c.id;
    const variant=['shared_tile_32','vector_load_v2','register_tile_v3'][n];
    return <g key={c.id} opacity={started?1:.18}>
     <path d={`M328 ${132+(n===0?2:n===1?3:4)*45}H355V${y+37}H398M552 ${y+37}H600M700 ${y+37}H783M900 ${y+37}H998`} fill="none" stroke="#3a5262" strokeWidth="1.3" strokeDasharray={started?undefined:'4 5'}/>
     {started&&<path d={`M328 ${132+(n===0?2:n===1?3:4)*45}H355V${y+37}H398`} fill="none" stroke={colors.amber} strokeWidth="1.5" strokeDasharray="5 6" strokeDashoffset={-time*18}/>}
     <g onClick={()=>onSelect?.(c.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect?.(c.id);}}} role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} aria-label={`${c.id} ${variant}`} style={{cursor:onSelect?'pointer':undefined}}>
      <rect x="397" y={y} width="155" height="73" rx="7" fill={active?'#342b21':'#1c2327'} stroke={active?colors.amber:'#6c604e'} strokeWidth={active?1.5:1}/><text x="410" y={y+20} fill={colors.amber} fontSize="12">{c.id}</text><text x="410" y={y+39} fill="#d9cfbf" fontSize="8">{variant}</text><text x="410" y={y+58} fill={colors.muted} fontSize="8">{time<c.generated?label('WRITING CUDA…','生成 CUDA…'):label('CUDA EMITTED','CUDA 已生成')}</text>
     </g>
     <rect x="600" y={y+8} width="101" height="57" rx="7" fill={failed?'#332128':'#14271f'} stroke={failed?'#b66f75':validationDone?'#73b28d':'#345145'}/>
     <text x="650" y={y+29} textAnchor="middle" fill={failed?colors.red:colors.green} fontSize="10">{failed?'× MISMATCH':validationDone?'✓ CORRECT':time>=c.generated?'CHECKING…':'QUEUED'}</text>
     <text x="650" y={y+47} textAnchor="middle" fill={colors.muted} fontSize="8">{failed?'tail mask':'compile / run / diff'}</text>
     <rect x="784" y={y+8} width="115" height="57" rx="7" fill={failed?'#111c25':'#241f35'} stroke={profileDone?colors.purple:'#4d425f'} strokeDasharray={failed?'3 4':undefined}/>
     <text x="841" y={y+32} textAnchor="middle" fill={failed?colors.muted:colors.purple} fontSize={profileDone?'19':'10'}>{failed?'SKIPPED':profileDone?`${c.speedup!.toFixed(2)}×`:time>=c.validated?'MEASURING…':'QUEUED'}</text><text x="841" y={y+51} textAnchor="middle" fill={colors.muted} fontSize="7">{failed?label('incorrect kernel','错误 kernel'):label('speedup vs. reference','相对 reference 的加速')}</text>
     {profileDone&&<><circle cx="974" cy={y+37} r="14" fill={n===2?'#224933':'#272d3d'} stroke={n===2?colors.green:colors.purple}/><text x="974" y={y+41} textAnchor="middle" fill={n===2?colors.green:colors.purple} fontSize="13">{n===2?'✓':'↩'}</text></>}
    </g>;
   })}
   {candidates.map(dot)}
   <path d="M972 356V429H185V390" stroke={winner?colors.green:'#385863'} strokeWidth={winner?'2':'1.2'} fill="none" markerEnd={arrow} strokeDasharray={winner?'7 5':'3 6'} strokeDashoffset={-time*20} opacity={time>=21?1:.25}/>
   <rect x="344" y="450" width="657" height="91" rx="8" fill={winner?'#142b22':'#121f2a'} stroke={winner?'#4e926c':'#344e60'}/>
   <text x="363" y="474" fill={winner?colors.green:colors.purple} fontSize="9" letterSpacing="1">{label('FEEDBACK → CONTROLLER','反馈 → 控制器')}</text>
   <text x="363" y="499" fill="#dce9ee" fontSize="13">{winner?label(`${winner.id}: ${winner.speedup!.toFixed(2)}× > prior mean ${thresholdFor(s,winner).toFixed(3)}×`,`${winner.id}：${winner.speedup!.toFixed(2)}× > 此前均值 ${thresholdFor(s,winner).toFixed(3)}×`):time>=21?label('K01 is correct, but not good enough. Keep reasoning.','K01 正确，但尚未达标。继续主推理。'):label('Waiting for profiling feedback.','等待 profiling 反馈。')}</text>
   <text x="363" y="522" fill={winner?colors.green:colors.muted} fontSize="9">{winner?label('STOP MAIN STREAM + CANCEL K04 · PASS FEEDBACK FORWARD','停止主推理 + 取消 K04 · 将反馈带入下一轮'):label('Correctness first. Performance feedback second.','先验证正确性，再获得性能反馈。')}</text>
   <text x="33" y="472" fill={colors.muted} fontSize="9">{label('PREFIX SNAPSHOT','前缀快照')}</text><text x="33" y="500" fill={colors.amber} fontSize="12">{chosen.id} ← {prefixRows} {label('design notes','条设计记录')}</text><text x="33" y="521" fill={colors.muted} fontSize="8">{onSelect?label('SELECT A KERNEL TO SEE ITS PREFIX','选择 KERNEL 查看继承前缀'):label('ILLUSTRATIVE EXAMPLE','示意案例')}</text>
  </g>
 </svg>;
}

export function ProcessMobile({time,lang='en',selected,onSelect}:{time:number;lang?:Lang;selected?:string;onSelect:(id:string)=>void}){
 const s=scenarios[0],state=stateAt(s,time),candidates=s.candidates.slice(0,3),chosen=candidates.find(c=>c.id===selected)??[...candidates].reverse().find(c=>time>=c.spawn)??candidates[0];
 const status=candidateStatus(s,chosen,time),winner=state.winner,label=(en:string,zh:string)=>lang==='en'?en:zh;
 return <div className="mobile-process">
  <div className="mobile-process-card prefix"><span className="micro-label">{label('REASONING PREFIX','推理前缀')}</span><strong>{time>=33?label('Main reasoning stopped','主推理已停止'):label('The model keeps thinking','模型继续思考')}</strong><code>Map batch × head to blocks<br/><mark>Use shared-memory tiles</mark><br/>{chosen.spawn>=14?'Vectorize loads; guard tails':''}<br/>{chosen.spawn>=22?'Register tile: 32 × 64':''}</code><span className="mobile-prefix-label">{chosen.id} ← {label('inherits this design','继承这份设计')}</span></div>
  <div className="mobile-flow-arrow">↓ <span>{label('Fork from the shared prefix','从共享前缀分叉')}</span></div>
  <div className="mobile-process-card forks"><span className="micro-label">{label('CANDIDATE KERNELS','候选 KERNEL')}</span>{candidates.map(c=>{const st=candidateStatus(s,c,time);return <button key={c.id} onClick={()=>onSelect(c.id)} className={chosen.id===c.id?'active':''}><b>{c.id}</b><span>{c.design[lang]}</span><i className={`kernel-led ${st}`}/></button>;})}</div>
  <div className="mobile-flow-arrow">↓ <span>{label('Only correct kernels reach profiling','只有正确的 kernel 才进入 profiling')}</span></div>
  <div className="mobile-gate-pair"><div className={`mobile-process-card ${status==='failed'?'failed':''}`}><span className="micro-label">{label('VALIDATION','正确性验证')}</span><strong>{time<chosen.generated?label('Queued','排队中'):time<chosen.validated?label('Checking…','检查中…'):status==='failed'?label('× Rejected','× 被拒绝'):label('✓ Correct','✓ 正确')}</strong><small>compile · run · compare</small></div><div className="mobile-process-card profiling"><span className="micro-label">PROFILING</span><strong>{status==='failed'?label('Skipped','跳过'):status==='passed'?`${chosen.speedup!.toFixed(2)}×`:time>=chosen.validated?label('Measuring…','测量中…'):label('Queued','排队中')}</strong><small>{label('speedup vs. reference','相对 reference 的 speedup')}</small></div></div>
  <div className="mobile-flow-arrow">↓ <span>{label('Feedback returns to the controller','反馈返回控制器')}</span></div>
  <div className={`mobile-process-card final ${winner?'winner':''}`}><span className="micro-label">{label('STOPPING DECISION','停止决策')}</span><strong>{winner?`${winner.speedup!.toFixed(2)}× > ${thresholdFor(s,winner).toFixed(3)}×`:label('Wait for a useful result','等待达标结果')}</strong><p>{winner?label('Stop the main stream. Cancel unfinished forks. Carry feedback forward.','停止主流，取消未完成分支，将反馈带入下一轮。'):label('Keep reasoning until a validated and profiled candidate beats the prior mean.','继续推理，直到经过验证和 profiling 的候选超过此前均值。')}</p></div>
 </div>;
}
