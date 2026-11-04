import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scenarios} from '../src/data/scenarios';
import {traceEvents,variantFor,lineDiff,baselineData} from '../src/data/traces';
test('trace events preserve causal order and contain no fabricated cancelled results',()=>{
 for(const s of scenarios){const events=traceEvents(s);for(let n=1;n<events.length;n++)assert.ok(events[n].time>=events[n-1].time);
 for(const c of s.candidates){const own=events.filter(e=>e.candidateId===c.id);assert.equal(own[0].kind,'fork');if(c.outcome!=='pass')assert.ok(!own.some(e=>e.kind==='profile'));const end=s.iterations.find(i=>i.id===c.iteration)!.end;assert.ok(own.every(e=>e.time<=end));}
 }
});
test('kernel variants are distinct, with real line-level changes',()=>{
 for(const s of scenarios){const variants=s.candidates.map(c=>variantFor(s,c));assert.equal(new Set(variants.map(v=>v.code)).size,variants.length);const diff=lineDiff(variants[0].code,variants.at(-1)!.code);assert.ok(diff.some(l=>l.type==='added'));assert.ok(diff.some(l=>l.type==='removed'));}
 assert.deepEqual(lineDiff('a\nb','a\nc').filter(l=>l.type!=='same').map(l=>[l.type,l.text]),[['added','c'],['removed','b']]);
});
test('paired illustrative comparison finishes after the corresponding speculative run',()=>{
 for(const s of scenarios){const b=baselineData(s);assert.ok(b.completedAt>s.iterations.at(-1)!.end);assert.ok(b.speedup>=Math.max(...s.history));}
});
