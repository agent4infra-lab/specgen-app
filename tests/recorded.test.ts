import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recordedManifest,curvePath,iterationWindow,triggerFor,type RecordedDetail} from '../src/lib/recorded';
const details=recordedManifest.tasks.map(t=>JSON.parse(readFileSync(`public/data/experiments/${t.id}.json`,'utf8')) as RecordedDetail);
test('recorded experiment retains all four tasks, twenty iterations and actual setup',()=>{
 assert.equal(recordedManifest.tasks.length,4);
 const mlpLast=details[3].spec;assert.equal(Boolean(mlpLast.mains.find(m=>m.iteration===19)?.aborted),false);assert.ok(mlpLast.spans[19].termination);
 for(const [i,task] of recordedManifest.tasks.entries()){
  assert.equal(task.gpu,'B300');assert.equal(task.model,'DeepSeek-V4-Flash');assert.equal(task.allocation,'fixed');assert.equal(task.termination.criteria,'best');
  assert.equal(task.termination.margin,.03);assert.equal(task.termination.confirm,2);
  assert.equal(details[i].spec.spans.length,20);assert.equal(details[i].base.spans.length,20);
  assert.equal(details[i].spec.kernels.length,task.candidateCount);
 }
});
test('matched budget data keeps costs and unfavorable outcomes',()=>{
 for(const task of recordedManifest.tasks){
  const time=task.metrics.time,tokens=task.metrics.tokens;
  assert.ok(Math.abs(time.spec.seconds-time.base.seconds)<.2);
  assert.ok(Math.abs(tokens.spec.tokens.equivalent-tokens.base.tokens.equivalent)<1000);
  for(const result of Object.values(task.metrics))for(const side of [result.spec,result.base])assert.equal(side.tokens.equivalent,side.tokens.in_hit_1_50+4*side.tokens.out);
 }
 for(const id of ['sqmm','mlp']){const t=recordedManifest.tasks.find(t=>t.id===id)!;assert.ok(t.metrics.tokens.spec.best<t.metrics.tokens.base.best);}
 assert.equal(recordedManifest.tasks[0].fp8,true);assert.equal(recordedManifest.tasks[0].nonFp8Best,15.87);
});
test('records preserve source IDs, stage times and real captured prefixes',()=>{
 for(const d of details){
  for(const span of d.spec.spans){
   const w=iterationWindow(d.spec,span.iteration);assert.ok(w.duration>=span.end-span.start);
   if(span.selected)assert.ok(w.kernels.some(k=>k.id===span.selected),span.selected);
  }
  for(const k of d.spec.kernels){
   assert.ok(k.generation.end>=k.generation.start);
   for(const s of k.stages)if(s.start!==null&&s.end!==null)assert.ok(s.end>=s.start);
   if(k.source==='spec'&&k.trigger!==null)assert.ok(triggerFor(d.spec,k));
   assert.ok(!('code' in k));
  }
 }
});
test('published data excludes internal paths, addresses and estimated policies',()=>{
 for(const task of recordedManifest.tasks){
  const text=readFileSync(`public/data/experiments/${task.id}.json`,'utf8');
  assert.ok(!/\/(ytech|Users|home|apdcephfs)/.test(text));
  assert.ok(!/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(text));
  assert.ok(!/"(hist_avg|first_valid)"/.test(text));
 }
 assert.ok(!JSON.stringify(recordedManifest).includes('"hist_avg"'));
});
test('curve rendering holds best-so-far and stops at the budget cutoff',()=>{
 const path=curvePath([[1,2],[2,1],[5,9]],3,x=>x,y=>y);
 assert.equal(path,'0,0 1,0 1,2 2,2 2,2 3,2');
});
