import { candidateStatus, stateAt, thresholdFor, timelineEnd } from '../lib/replay';
import { type Lang, type Scenario } from '../data/scenarios';
const C = { cyan: '#6fdde8', amber: '#edbd7c', green: '#8dd6aa', purple: '#b6a2ed', muted: '#627181', red: '#e38e91', text: '#d8e4ed' };
export function KernelScene({ scenario: s, time, lang = 'en', selected, onSelect, idPrefix = 'scene' }: { scenario: Scenario; time: number; lang?: Lang; selected?: string; onSelect?: (id: string) => void; idPrefix?: string }) {
  const state = stateAt(s, time);
  const current = state.iteration;
  const x = (t: number) => 138 + t / timelineEnd(s) * 786;
  const activeTime = Math.min(time, s.duration);
  const statusLabel: Record<string, string> = lang === 'en' ? { waiting: 'NOT STARTED', generating: 'GENERATING', validating: 'VALIDATING', profiling: 'PROFILING', passed: 'PROFILED', failed: 'REJECTED', cancelled: 'CANCELLED' } : { waiting: '尚未开始', generating: '生成中', validating: '验证中', profiling: 'PROFILING', passed: '已测量', failed: '已拒绝', cancelled: '已取消' };
  const gpuActive = s.candidates.filter(c => ['validating', 'profiling'].includes(candidateStatus(s, c, time)));
  return <svg className="kernel-scene" viewBox="0 0 1000 456" role={onSelect ? "group" : "img"} aria-label={lang === 'en' ? 'Timeline of reasoning, speculative kernel candidates, and GPU activity' : '主推理、推测候选与 GPU 活动的时间轴'}>
    <defs>
      <pattern id={`${idPrefix}-grid`} width="39.3" height="38" patternUnits="userSpaceOnUse"><path d="M39.3 0H0V38" fill="none" stroke="#26313d" strokeWidth=".6" opacity=".42"/></pattern>
      <linearGradient id={`${idPrefix}-reason`}><stop stopColor={C.cyan} stopOpacity=".15"/><stop offset="1" stopColor={C.cyan} stopOpacity=".7"/></linearGradient>
    </defs>
    <rect x="130" y="48" width="808" height="286" fill={`url(#${idPrefix}-grid)`}/>
    <text x="27" y="28" fill={C.muted} fontSize="10" letterSpacing="2" fontFamily="monospace">{lang === 'en' ? 'EXECUTION TRACE' : '执行轨迹'}</text>
    <text x="929" y="28" textAnchor="end" fill={C.muted} fontSize="10" fontFamily="monospace">{lang === 'en' ? 'ILLUSTRATIVE' : '示意数据'}</text>
    <text x="27" y="83" fill={C.cyan} fontSize="12" fontFamily="monospace">{lang === 'en' ? 'REASONING' : '主推理'}</text>
    {s.iterations.map(i => {
      const end = i.stop === 'early' ? i.end : i.plannedEnd;
      const drawn = Math.max(i.start, Math.min(time, end));
      return <g key={i.id} opacity={time < i.start ? .22 : 1}>
        <rect x={x(i.start)} y="65" width={x(i.plannedEnd) - x(i.start)} height="28" rx="4" fill="#121c26" stroke="#344553" strokeDasharray="4 5"/>
        <rect x={x(i.start)} y="65" width={Math.max(0, x(drawn) - x(i.start))} height="28" rx="4" fill={`url(#${idPrefix}-reason)`}/>
        <text x={x(i.start) + 9} y="83" fill={C.cyan} fontSize="10" fontFamily="monospace">{lang === 'en' ? `ITER ${i.id}` : `第 ${i.id} 轮`}</text>
        {time >= i.end && i.stop === 'early' && <><path d={`M${x(i.end)} 53v48`} stroke={C.green} strokeWidth="2"/><text x={x(i.end) - 6} y="49" textAnchor="end" fill={C.green} fontSize="10" fontFamily="monospace">{lang === 'en' ? 'EARLY STOP' : '提前结束'}</text></>}
        {time >= i.plannedEnd && i.stop === 'fallback' && <text x={x(i.plannedEnd) + 8} y="83" fill={C.cyan} fontSize="9" fontFamily="monospace">{lang === 'en' ? 'MAIN RESULT' : '主路径结果'}</text>}
      </g>;
    })}
    {s.candidates.map((c, index) => {
      const y = 131 + index * 48;
      const status = candidateStatus(s, c, time);
      const i = s.iterations.find(i => i.id === c.iteration)!;
      const hasStarted = time >= c.spawn;
      const stop = Math.min(i.end, c.profiled ?? c.validated);
      const passed = status === 'passed';
      const color = status === 'failed' ? C.red : passed ? C.green : status === 'profiling' ? C.purple : status === 'validating' ? C.green : C.amber;
      const stage = (start: number, end: number, color: string, label: string) => {
        const drawEnd = Math.min(time, end, i.end);
        if (drawEnd <= start) return null;
        return <g><rect x={x(start)} y={y - 11} width={Math.max(1, x(drawEnd) - x(start))} height="22" rx="3" fill={color} opacity=".22"/><path d={`M${x(start)} ${y}H${x(drawEnd)}`} stroke={color} strokeWidth="2"/>{x(drawEnd) - x(start) > 37 && <text x={(x(start)+x(drawEnd))/2} y={y-16} textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace">{label}</text>}</g>;
      };
      return <g key={c.id} opacity={hasStarted ? 1 : .24} onClick={() => onSelect?.(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(c.id); } }} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={`${c.id}: ${statusLabel[status]}`} style={{ cursor: onSelect ? 'pointer' : 'default' }}>
        <rect x="17" y={y-20} width="958" height="40" rx="6" fill={selected === c.id ? '#20303a' : 'transparent'} stroke={selected === c.id ? '#5b737e' : 'transparent'}/>
        <text x="27" y={y+4} fill={hasStarted ? color : C.muted} fontSize="12" fontFamily="monospace">{c.id}</text>
        <text x="27" y={y+16} fill={C.muted} fontSize="7" fontFamily="monospace">{statusLabel[status]}</text>
        <path d={`M${x(c.spawn)} 94V${y}H${x(stop)}`} fill="none" stroke="#34424e" strokeDasharray="3 4"/>
        {hasStarted && <circle cx={x(c.spawn)} cy="94" r="3" fill={C.amber}/>}
        {stage(c.spawn, c.generated, C.amber, 'GEN')}
        {stage(c.generated, c.validated, C.green, 'CHECK')}
        {c.outcome === 'pass' && c.profiled && stage(c.validated, c.profiled, C.purple, 'PROFILE')}
        {hasStarted && <circle cx={x(Math.min(time, stop))} cy={y} r="4" fill={color} stroke="#0c1219" strokeWidth="2"/>}
        {(passed || status === 'failed' || status === 'cancelled') && <text x={x(stop)+10} y={y+4} fill={color} fontSize="11" fontFamily="monospace">{passed ? `${c.speedup!.toFixed(2)}×${c.speedup! > thresholdFor(s,c) ? ' ✓' : ''}` : status === 'failed' ? '×' : '—'}</text>}
      </g>;
    })}
    <path d={`M${x(activeTime)} 100V330`} stroke={C.text} opacity=".18" strokeDasharray="2 5"/>
    <g fontSize="9" fontFamily="monospace" fill={C.muted}>{[0,.25,.5,.75,1].map(p => <text key={p} x={x(p * timelineEnd(s))} y="347" textAnchor="middle">{Math.round(p*timelineEnd(s))}s</text>)}</g>
    <line x1="27" y1="367" x2="974" y2="367" stroke="#26333f"/>
    <text x="27" y="392" fill={C.muted} fontFamily="monospace" fontSize="10" letterSpacing="1">GPU POOL</text>
    {Array.from({length:8}, (_,n) => {
      const validation = n < current.validationGPUs;
      const task = gpuActive.filter(c => candidateStatus(s,c,time) === (validation ? 'validating' : 'profiling'))[validation ? n : n-current.validationGPUs];
      const color = validation ? C.green : C.purple;
      return <g key={n}><rect x={138+n*99} y="383" width="83" height="48" rx="5" fill={task ? color : '#121b25'} fillOpacity={task ? .13 : 1} stroke={task ? color : '#34414f'}/><text x={179+n*99} y="401" textAnchor="middle" fill={color} fontFamily="monospace" fontSize="8">{validation ? 'VALIDATE' : 'PROFILE'}</text><text x={179+n*99} y="418" textAnchor="middle" fill={task ? C.text : C.muted} fontFamily="monospace" fontSize="10">{task ? task.id : lang === 'en' ? 'READY' : '就绪'}</text></g>;
    })}
    <text x="27" y="410" fill={C.muted} fontFamily="monospace" fontSize="8">{current.validationGPUs}V / {current.profilingGPUs}P</text>
  </svg>;
}
