import type { Budget, RecordedDetail, RecordedTask } from '../lib/recorded';
import { curvePath } from '../lib/recorded';
import type { Lang } from '../data/scenarios';
export default function RecordedCurve({detail,task,budget,lang}:{detail:RecordedDetail;task:RecordedTask;budget:Budget;lang:Lang}){
 const m=task.metrics[budget],end=Math.max(m.spec.seconds,m.base.seconds),max=Math.max(m.spec.best,m.base.best)*1.12;
 const x=(t:number)=>65+t/end*735,y=(v:number)=>225-v/max*185;
 return <div className="recorded-curve"><div className="recorded-curve-heading"><span>{lang==='en'?'Best kernel found over active run time':'随有效运行时间找到的最优 kernel'}</span><div><i className="color-dot cyan"/>SpecGen<i className="color-dot muted"/>Baseline</div></div><svg viewBox="0 0 840 275" role="img" aria-label={lang==='en'?'Recorded best-so-far kernel speedup against the reference':'实测 best-so-far kernel 相对参考实现的加速比'}>
  {[0,.25,.5,.75,1].map(p=><g key={p}><line x1="65" x2="800" y1={y(p*max)} y2={y(p*max)} stroke="#2b3e4c" strokeWidth=".6"/><text x="53" y={y(p*max)+4} fill="#829eaf" textAnchor="end" fontSize="10" fontFamily="monospace">{(p*max).toFixed(1)}×</text><text x={x(p*end)} y="250" fill="#829eaf" textAnchor="middle" fontSize="10" fontFamily="monospace">{(p*end/60).toFixed(0)}m</text></g>)}
  <polyline points={curvePath(detail.curves.base,Math.min(m.base.seconds,detail.base.duration),x,y)} stroke="#8094a2" strokeWidth="2.2" fill="none" strokeDasharray="6 5"/>
  <polyline points={curvePath(detail.curves.spec,Math.min(m.spec.seconds,detail.spec.duration),x,y)} stroke="#78dfe8" strokeWidth="2.5" fill="none"/>
  {(['spec','base'] as const).map(side=>{const color=side==='spec'?'#78dfe8':'#91a2ad';const last=detail.curves[side].filter(p=>p[0]<=m[side].seconds).at(-1);return last&&<circle key={side} cx={x(last[0])} cy={y(m[side].best)} r="4" fill={color}><title>{`${side}: ${m[side].best.toFixed(2)}× at ${(last[0]/60).toFixed(1)} min`}</title></circle>;})}
 </svg><p>{lang==='en'?'Each curve stops at its selected budget cutoff. Speedup is relative to the KernelBench reference.':'每条曲线截止于所选预算；加速比均相对于 KernelBench 参考实现。'}</p></div>;
}
