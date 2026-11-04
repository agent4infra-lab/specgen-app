"""Generate a timed voiceover and original quiet electronic bed using macOS voices."""
import array
import json
import math
import os
from pathlib import Path
import subprocess
import wave

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'artifacts/audio'
WORK.mkdir(parents=True, exist_ok=True)
segments = json.loads((ROOT / 'video/narration.json').read_text())
SR = 48000
samples = array.array('f', [0.0]) * (SR * 60)
for index, segment in enumerate(segments):
    textfile = WORK / f'{index:02}.txt'
    aiff = WORK / f'{index:02}.aiff'
    wav = WORK / f'{index:02}.wav'
    textfile.write_text(segment['text'])
    rate = 165
    for attempt in range(3):
        subprocess.run(['say', '-v', 'Samantha', '-r', str(rate), '-f', str(textfile), '-o', str(aiff)], check=True)
        subprocess.run(['afconvert', '-f', 'WAVE', '-d', 'LEI16@48000', '-c', '1', str(aiff), str(wav)], check=True)
        with wave.open(str(wav), 'rb') as stream:
            assert stream.getframerate() == SR and stream.getnchannels() == 1
            pcm = array.array('h', stream.readframes(stream.getnframes()))
        duration = len(pcm) / SR
        available = segment['end'] - segment['start'] - .25
        if duration <= available:
            break
        rate = math.ceil(rate * duration / available * 1.02)
    else:
        raise RuntimeError(f'Speech segment {index} does not fit its scene')
    start = round((segment['start'] + .12) * SR)
    for n, value in enumerate(pcm):
        if start + n < len(samples):
            samples[start+n] += value / 32768 * .83
    print(f'Scene {index+1}: {duration:.2f}s, {rate} wpm')

# An original, restrained harmonic atmosphere. Always well below the narrator.
output = array.array('h')
for n, voice in enumerate(samples):
    t = n / SR
    fade = min(1.0, t/2, (60-t)/2)
    swell = .7 + .3 * math.sin(t * math.tau / 12)
    bed = .0055 * swell * (math.sin(math.tau*110*t) + .35*math.sin(math.tau*165*t) + .2*math.sin(math.tau*220*t))
    tick = 0.0
    for trigger in [8,14,18,26,34,39,44,49,53]:
        age = t - trigger
        if 0 <= age < .18:
            tick += .012 * math.exp(-age*32) * math.sin(math.tau*(680-age*1100)*age)
    value = max(-.98, min(.98, voice + (bed+tick)*fade))
    output.extend([int(value*32767), int(value*32767)])
master = WORK / 'master.wav'
with wave.open(str(master), 'wb') as stream:
    stream.setnchannels(2); stream.setsampwidth(2); stream.setframerate(SR); stream.writeframes(output.tobytes())
subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '160000', str(master), str(ROOT/'public/media/specgen-audio.m4a')], check=True)
print('Wrote public/media/specgen-audio.m4a (voice + original sound bed).')
