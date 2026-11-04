import { timelineEnd } from '../lib/replay';
import type { Scenario, Lang } from '../data/scenarios';
export default function BaselineStrip({scenario:s,time,lang}:{scenario:Scenario;time:number;lang:Lang}){
 const x=(t:number)=>138+t/timelineEnd(s)*786;
 return <svg className="baseline-strip" viewBox="0 0 1000 66" role="img" aria-label={lang==='en'?'Sequential comparison on the same time scale':'相同时间尺度上的串行对照'}>
  <text x="27" y="23" fill="#91a5b2" fontSize="9" fontFamily="monospace">{lang==='en'?'SEQUENTIAL':'串行对照'}</text>
  <text x="27" y="37" fill="#627181" fontSize="7" fontFamily="monospace">{lang==='en'?'SAME TIME SCALE':'相同时间尺度'}</text>
  {s.iterations.map(i=><g key={i.id}><rect x={x(i.start)} y="14" width={x(i.plannedEnd)-x(i.start)} height="27" rx="3" fill="#182c36" stroke="#39535f"/><text x={x(i.start)+7} y="31" fill="#82b5c3" fontSize="8" fontFamily="monospace">{lang==='en'?'REASONING':'推理'}</text><rect x={x(i.plannedEnd)} y="14" width={x(i.plannedEnd+4)-x(i.plannedEnd)} height="27" fill="#213c2c"/><rect x={x(i.plannedEnd+4)} y="14" width={x(i.plannedEnd+8)-x(i.plannedEnd+4)} height="27" fill="#392d4b"/></g>)}
  <path d={`M${x(time)} 9V47`} stroke="#d8e4ed" opacity=".45"/>
  <text x="924" y="59" fill="#627181" textAnchor="end" fontFamily="monospace" fontSize="8">{lang==='en'?'ILLUSTRATIVE · CHECK / PROFILE FOLLOW GENERATION':'示意 · 生成结束后才能验证与 PROFILING'}</text>
 </svg>
}
