import rawManifest from '../data/recorded-experiments.json';
import type { Localized } from '../data/scenarios';
export type Budget = 'time' | 'tokens' | 'iters';
export type RunSide = 'spec' | 'base';
export interface BudgetResult {
  best:number;seconds:number;iterations:number;cut:boolean;profiler:number;validator:number;
  tokens:{in:number;in_hit_free:number;in_hit_1_50:number;out:number;main_out:number;spec_out:number;equivalent:number;cached:number};
}
export interface RecordedTask {
 id:string;name:Localized;benchmark:string;level:string;model:string;gpu:string;allocation:string;
 termination:{enabled:boolean;criteria:string;margin:number;confirm:number;grace_ratio:number};
 metrics:Record<Budget,{spec:BudgetResult;base:BudgetResult}>;
 outcomes:{spec:{best:number;end:number;first:number;evaluated:number;valid:number;aborted:number;reach:number|null};base:{best:number;end:number;first:number;evaluated:number;valid:number;aborted:number}};
 fp8:boolean;nonFp8Best:number|null;candidateCount:number;statusCounts:Partial<Record<string,number>>;hasOmittedPause:boolean;
}
export interface Stage {kind:'build'|'validate'|'benchmark'|'ncu';queued:number|null;start:number|null;end:number|null;outcome:string}
export interface RecordedKernel {id:string;iteration:number;source:'spec'|'main';trigger:number|null;status:string;selected:boolean;valid:boolean;speedup:number|null;generation:{start:number;end:number;cancelled:boolean};stages:Stage[];timings:{time:number;speedup:number}[]}
export interface Trigger {iteration:number;index:number;time:number;reason:string;keyword:string;tokens:number;forks:number;excerpt:string}
export interface Span {iteration:number;start:number;end:number;end_reason:string;selected:string|null;termination:{criterion:string;kernel:string;speedup:number;baseline:number;t:number}|null}
export interface RecordedRun {duration:number;spans:Span[];triggers:Trigger[];mains:{iteration:number;start:number;end:number;aborted:boolean|null;reasoning_tokens:number|null}[];kernels:RecordedKernel[];hasOmittedPause:boolean}
export interface RecordedDetail {id:string;spec:RecordedRun;base:RecordedRun;curves:{spec:[number,number][];base:[number,number][]}}
export const recordedManifest=rawManifest as {source:{filename:string;sha256:string};tasks:RecordedTask[]};
export const stageColors={generation:'#edbd7c',reasoning:'#6fdde8',build:'#73879a',validate:'#8dd6aa',benchmark:'#b6a2ed',ncu:'#75a7e8'};
export function kernelEnd(k:RecordedKernel){return Math.max(k.generation.end,...k.stages.map(s=>s.end??k.generation.end));}
export function phaseAt(k:RecordedKernel,t:number):string {
 if(t<k.generation.start)return 'pending';
 if(t<k.generation.end)return 'generation';
 const active=k.stages.find(s=>s.start!==null&&s.end!==null&&s.start<=t&&t<s.end);
 if(active)return active.kind;
 if(t<kernelEnd(k))return 'queued';
 return k.status;
}
export function bestAt(curve:[number,number][],until:number){return curve.reduce((best,[t,value])=>t<=until?Math.max(best,value):best,0);}
export function curvePath(curve:[number,number][],until:number,x:(n:number)=>number,y:(n:number)=>number){
 const points:[number,number][]=[[0,0]];let best=0;
 for(const [t,v] of curve){if(t>until)break;points.push([t,best]);best=Math.max(best,v);points.push([t,best]);}
 points.push([until,best]);return points.map(([t,v])=>`${x(t)},${y(v)}`).join(' ');
}
export function iterationWindow(run:RecordedRun,iteration:number){
 const span=run.spans.find(s=>s.iteration===iteration)!;
 const kernels=run.kernels.filter(k=>k.iteration===iteration);
 const main=run.mains.find(m=>m.iteration===iteration);
 return {span,kernels,main,duration:Math.max(span.end,main?.end??span.end,...kernels.map(kernelEnd))-span.start};
}
export function triggerFor(run:RecordedRun,k:RecordedKernel){return run.triggers.find(t=>t.iteration===k.iteration&&t.index===k.trigger);}
export function compactNumber(n:number){return n>=1e6?`${(n/1e6).toFixed(2)}M`:n>=1e3?`${(n/1e3).toFixed(1)}K`:n.toFixed(0);}
export function minutes(n:number){return `${(n/60).toFixed(1)} min`;}
export function formatStatus(status:string){return status.replaceAll('_',' ');}
