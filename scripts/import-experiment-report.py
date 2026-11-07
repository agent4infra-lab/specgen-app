#!/usr/bin/env python3
"""Import a provided SpecGen report, retaining measured best-policy data only.

Usage: python3 scripts/import-experiment-report.py /path/to/report.html
The source report stays outside the repository. Public output excludes host paths,
device identities, pauses between resumed sessions, and counterfactual policies.
"""
import hashlib
import json
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
class ReportParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.capture=False; self.parts=[]
    def handle_starttag(self, tag, attrs):
        if tag == 'script' and dict(attrs).get('id') == 'run-data': self.capture=True
    def handle_endtag(self, tag):
        if tag == 'script': self.capture=False
    def handle_data(self, data):
        if self.capture: self.parts.append(data)

def redact(text):
    text=re.sub(r'/(?:ytech[^/\s]*|Users|home|apdcephfs[^/\s]*|mnt|tmp)(?:/[^\s`"\'<>)]*)*','[local path]',text)
    text=re.sub(r'\b(?:\d{1,3}\.){3}\d{1,3}\b','[address]',text)
    text=re.sub(r'(?i)(?:sk-[A-Za-z0-9_-]{16,}|gh[op]_[A-Za-z0-9]{20,}|bearer\s+[A-Za-z0-9._-]{20,})','[redacted]',text)
    return text

def normalize(run):
    # Source timeline is already on an active clock: restart pauses are omitted.
    spans=[{k:s.get(k) for k in ['iteration','start','end','end_reason','selected','termination']} for s in run['spans']]
    triggers=[{'iteration':t['iteration'],'index':t['index'],'time':t['t'],'reason':t['reason'],'keyword':t.get('keyword',''),'tokens':t['fired_tokens'],'forks':t['k'],'excerpt':redact(t.get('excerpt',''))} for t in run.get('triggers',[])]
    specs={s['kernel']:s for s in run.get('specs',[])}
    mains={m['iteration']:m for m in run['mains']}
    jobs={}
    for j in run['jobs']:
        jobs.setdefault(j['kernel'],[]).append({k:j.get(k) for k in ['kind','queued','start','end','outcome']})
    benchmarks={}
    for b in run['benchmarks'] if 'benchmarks' in run else []:
        benchmarks.setdefault(b['kernel'],[]).append({'time':b['t'],'speedup':b['speedup']})
    kernels=[]
    for raw in run['kernels'].values():
        gen=specs.get(raw['kernel']) if raw['source']=='spec' else mains.get(raw['iteration'])
        if not gen: continue
        kernel={
            'id':raw['kernel'],'iteration':raw['iteration'],'source':raw['source'],
            'trigger':gen.get('trigger') if raw['source']=='spec' else None,
            'status':raw['status'],'selected':bool(raw.get('selected')),
            'valid':bool(raw.get('valid')),'speedup':raw.get('speedup'),
            'generation':{'start':gen['start'],'end':gen['end'],'cancelled':bool(gen.get('aborted') or gen.get('cancelled'))},
            'stages':sorted(jobs.get(raw['kernel'],[]),key=lambda j:j['start'] if j['start'] is not None else float('inf')),
            'timings':benchmarks.get(raw['kernel'],[]),
        }
        kernels.append(kernel)
    # Baseline benchmark observations are not embedded separately; use the report's
    # recorded curve for plotting, never fabricate individual timing events.
    return {'duration':run['duration'],'spans':spans,'triggers':triggers,
            'mains':[{k:m.get(k) for k in ['iteration','start','end','aborted','reasoning_tokens']} for m in run['mains']],
            'kernels':sorted(kernels,key=lambda k:(k['iteration'],k['generation']['start'],k['id'])),
            'hasOmittedPause':bool(run.get('resumes'))}

NAMES={
 'sqmm':{'en':'Square matrix multiplication','zh':'方阵乘'},
 'rmsnorm':{'en':'RMSNorm','zh':'RMSNorm'},
 'gelusoftmax':{'en':'Matmul · GELU · Softmax','zh':'矩阵乘 · GELU · Softmax'},
 'mlp':{'en':'MLP','zh':'MLP'},
}

def main(path):
    raw=Path(path).read_bytes();parser=ReportParser();parser.feed(raw.decode())
    report=json.loads(''.join(parser.parts))
    manifest={'source':{'filename':Path(path).name,'sha256':hashlib.sha256(raw).hexdigest()},'tasks':[]}
    for section in report['sections']:
        key=section['anchor'];task=section['tasks'][0];cmp=section['compare'];row=cmp['rows'][0]
        metrics={dimension:section['overview']['best|'+dimension] for dimension in ['time','tokens','iters']}
        for m in metrics.values():
            for side in ['spec','base']:
                tokens=m[side]['tokens'];tokens['equivalent']=tokens['in_hit_1_50']+4*tokens['out']
                tokens['cached']=tokens['in']-tokens['in_hit_free']
        entry={
            'id':key,'name':NAMES[key],'benchmark':task,'level':section['level'],
            'model':section['run']['model'],'gpu':section['run']['gpu_type'],
            'allocation':section['run']['allocation'],'termination':section['run']['termination'],
            'metrics':metrics,
            'outcomes':{'spec':{k:row['a'].get(k) for k in ['best','end','first','evaluated','valid','aborted','reach']},'base':{k:row['b'].get(k) for k in ['best','end','first','evaluated','valid','aborted']}},
            'fp8': key=='sqmm','nonFp8Best':15.87 if key=='sqmm' else None,
            'candidateCount':len(section['kernels']),
            'statusCounts':dict(Counter(k['status'] for k in section['kernels'].values())),
            'hasOmittedPause':bool(section.get('resumes') or cmp['timeline'].get('resumes')),
        }
        detail={'id':key,'spec':normalize(section),'base':normalize(cmp['timeline']),
                'curves':{'spec':cmp['curves'][task][0],'base':cmp['curves'][task][1]}}
        # Supply baseline end points from its recorded stages, not synthetic jobs.
        out=ROOT/f'public/data/experiments/{key}.json'
        out.write_text(json.dumps(detail,ensure_ascii=False,separators=(',',':'))+'\n')
        manifest['tasks'].append(entry)
        print(key,len(detail['spec']['kernels']),'candidates',out.stat().st_size,'bytes')
    (ROOT/'src/data/recorded-experiments.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':
    main(sys.argv[1])
