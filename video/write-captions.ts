import {writeFileSync} from 'node:fs';
import {captions} from './captions';
const timestamp=(seconds:number,separator:string)=>`00:${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}${separator}000`;
for(const lang of ['en','zh'] as const){
 const srt=captions.map((c,i)=>`${i+1}\n${timestamp(c.start,',')} --> ${timestamp(c.end,',')}\n${c[lang]}\n`).join('\n');
 const vtt='WEBVTT\n\n'+captions.map(c=>`${timestamp(c.start,'.')} --> ${timestamp(c.end,'.')}\n${c[lang]}\n`).join('\n');
 writeFileSync(`public/media/specgen.${lang}.srt`,srt);writeFileSync(`public/media/specgen.${lang}.vtt`,vtt);
}
