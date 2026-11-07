import type { RecordedDetail, RecordedKernel } from '../lib/recorded';
import { iterationWindow,phaseAt,stageColors,formatStatus } from '../lib/recorded';
import type { Lang } from '../data/scenarios';
export default function RecordedTimeline({detail,iteration,selected,time,onSelect,lang}:{detail:RecordedDetail;iteration:number;selected:string;time:number;onSelect:(id:string)=>void;lang:Lang}){
 const a=iterationWindow(detail.spec,iteration),b=iterationWindow(detail.base,iteration),duration=Math.max(a.duration,b.duration),width=920,left=170,right=865;
 const x=(t:number)=>left+Math.max(0,t)/duration*(right-left),height=95+(a.kernels.length+1)*29+70;
 const draw=(kernel:RecordedKernel,offset:number,row:number,baseline=false)=>{
  const y=55+row*29,now=time+offset,phase=phaseAt(kernel,now),isSelected=kernel.id===selected&&!baseline;
  return <g key={`${baseline?'base':'spec'}-${kernel.id}`} role={!baseline?'button':undefined} tabIndex={!baseline?0:undefined} onClick={()=>!baseline&&onSelect(kernel.id)} onKeyDown={e=>{if(!baseline&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onSelect(kernel.id);}}} aria-label={`${kernel.id}: ${formatStatus(phase)}`} className="recorded-lane">
   <rect x="8" y={y-12} width="895" height="27" rx="4" fill={isSelected?'#24404a':'transparent'}/>
   <text x="18" y={y+4} fill={isSelected?'#bfe6ec':baseline?'#a0aeb9':'#91aab9'} fontFamily="monospace" fontSize="10">{baseline?'Baseline':kernel.id}{kernel.selected&&!baseline?' ★':''}</text>
   <rect x={x(kernel.generation.start-offset)} y={y-7} width={Math.max(1,x(Math.min(kernel.generation.end-offset,time))-x(kernel.generation.start-offset))} height="13" rx="2" fill={baseline?'#536b7b':kernel.source==='main'?stageColors.reasoning:stageColors.generation} opacity={time<kernel.generation.start-offset?0:.8}/>
   {kernel.stages.map((stage,index)=>{if(stage.start===null||stage.end===null||time<stage.start-offset)return null;const start=stage.start-offset,end=Math.min(stage.end-offset,time);return <rect key={index} x={x(start)} y={y-7} width={Math.max(1,x(end)-x(start))} height="13" rx="1" fill={stageColors[stage.kind]} opacity={stage.outcome==='done'?.95:.45}><title>{`${stage.kind}: ${(stage.end-stage.start).toFixed(3)} s (${stage.outcome})`}</title></rect>;})}
   <title>{`${kernel.id} · ${kernel.source} · ${formatStatus(phase)}${kernel.speedup?` · ${kernel.speedup.toFixed(3)}×`:''}`}</title>
  </g>;
 };
 return <div className="recorded-timeline-scroll"><svg viewBox={`0 0 ${width} ${height}`} style={{minWidth:780}} role="group" aria-label={lang==='en'?'Recorded candidate timelines, aligned to each run’s iteration start':'真实候选时间轴，以各自运行的迭代起点对齐'}>
  {[0,.25,.5,.75,1].map(p=><g key={p}><line x1={x(p*duration)} x2={x(p*duration)} y1="32" y2={height-22} stroke="#2c414e" strokeDasharray="3 6"/><text x={x(p*duration)} y="22" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#768f9f">{(p*duration).toFixed(0)}s</text></g>)}
  {a.main&&<g><text x="18" y="59" fontFamily="monospace" fontSize="10" fill="#89d6e0">{lang==='en'?'Main reasoning':'主推理'}</text><rect x={x(a.main.start-a.span.start)} y="48" width={Math.max(0,x(Math.max(a.main.start-a.span.start,Math.min(time,a.main.end-a.span.start)))-x(a.main.start-a.span.start))} height="13" rx="2" fill={stageColors.reasoning}/>{time>=a.main.end-a.span.start&&<text x={Math.min(820,x(a.main.end-a.span.start)+6)} y="58" fill="#8ecba5" fontFamily="monospace" fontSize="8">{a.main.aborted?(lang==='en'?'stopped':'已停止'):(lang==='en'?'complete':'已完成')}</text>}</g>}
  {a.kernels.map((k,i)=>draw(k,a.span.start,i+1))}
  <line x1="12" x2="900" y1={65+(a.kernels.length+1)*29} y2={65+(a.kernels.length+1)*29} stroke="#3d515e"/>
  {b.kernels.slice(0,1).map(k=>draw(k,b.span.start,a.kernels.length+2,true))}
  <line x1={x(time)} x2={x(time)} y1="32" y2={height-22} stroke="#d3e6ed" opacity=".45"/>
  {a.span.termination&&<line x1={x(a.span.termination.t-a.span.start)} x2={x(a.span.termination.t-a.span.start)} y1="32" y2={65+(a.kernels.length+1)*29} stroke="#a4d9b4" strokeDasharray="5 4"><title>{lang==='en'?'Recorded iteration end':'实测迭代结束'}</title></line>}
 </svg></div>;
}
