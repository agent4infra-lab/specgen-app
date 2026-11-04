import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scenarios} from '../src/data/scenarios';
import {candidateStatus, historyAt, mean, stateAt, thresholdFor} from '../src/lib/replay';

test('the current candidate is excluded from its historical stopping threshold',()=>{
 const s=scenarios[0],winner=s.candidates[2];
 assert.equal(thresholdFor(s,winner),1.465);
 assert.equal(historyAt(s,33,false).length,4);
 assert.equal(historyAt(s,33).length,5);
 assert.equal(stateAt(s,33).winner?.id,'K03');
});
test('failed candidates never create profiling feedback',()=>{
 for(const s of scenarios){for(const c of s.candidates.filter(c=>c.outcome!=='pass')){
  assert.equal(c.profiled,undefined);
  assert.equal(candidateStatus(s,c,c.validated),'failed');
  assert.ok(!stateAt(s,s.duration).feedback.some(f=>f.id===c.id));
 }}
});
test('pending forks cancel at early termination, without fabricated results',()=>{
 const s=scenarios[0],pending=s.candidates[3];
 assert.equal(candidateStatus(s,pending,32),'generating');
 assert.equal(candidateStatus(s,pending,33),'cancelled');
 assert.equal(candidateStatus(s,pending,44),'cancelled');
 assert.ok(!stateAt(s,44).feedback.includes(pending));
});
test('fallback returns the main result and reallocates only at the next iteration',()=>{
 const s=scenarios[2];
 assert.equal(stateAt(s,29).mainRunning,true);
 assert.equal(stateAt(s,30).mainRunning,false);
 assert.equal(stateAt(s,34).iteration.profilingGPUs,4);
 assert.equal(stateAt(s,38).iteration.profilingGPUs,4);
 assert.equal(stateAt(s,39).iteration.profilingGPUs,5);
 assert.ok(historyAt(s,35).includes(1.94));
 assert.equal(stateAt(s,35).winner,undefined);
 assert.equal(stateAt(s,60).winner?.id,'K04');
 assert.equal(stateAt(s,66).feedbackCount,5);
});
test('seek is deterministic and history is rebuilt rather than accumulated',()=>{
 for(const s of scenarios){
  const initial=stateAt(s,0);
  stateAt(s,s.duration);stateAt(s,s.duration/2);
  assert.deepEqual(stateAt(s,0),initial);
  for(let t=0;t<=s.duration;t+=.5){const result=stateAt(s,t);assert.equal(result.threshold,mean(result.history));assert.ok(result.best>=Math.max(...s.history));}
 }
});
test('fixture event ordering and boundaries are internally consistent',()=>{
 for(const s of scenarios){for(const c of s.candidates){
  assert.ok(c.spawn<c.generated&&c.generated<c.validated);
  if(c.profiled!==undefined)assert.ok(c.validated<c.profiled);
 }
 for(const i of s.iterations){
  assert.equal(i.validationGPUs+i.profilingGPUs,8);
  if(i.stop==='early')assert.ok(i.end<i.plannedEnd);
 }
 }
});
