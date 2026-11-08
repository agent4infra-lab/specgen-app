# SpecGen website development

[Project overview](../README.md) · [Website](https://agent4infra-lab.github.io/specgen-app/) · [中文](https://agent4infra-lab.github.io/specgen-app/zh/)

The website uses Astro, React, TypeScript, Motion, SVG, and Remotion. It is a static site: no backend, credentials, model endpoint, or GPU is needed to serve it.

## Local setup

Use Node.js 24 and npm.

```sh
git clone https://github.com/agent4infra-lab/specgen-app.git
cd specgen-app
npm ci
npm run dev
```

Open the printed local URL, normally `http://localhost:4321/`. English is `/`, Chinese is `/zh/`, and the recorded experiment section is `#experiments`. Language changes retain the current section.

```sh
npm run build     # Type checking and static production build into dist/
npm run preview   # Serve the production build
npm run test      # Replay, trace, and experiment-data tests
```

The fonts and media are served locally. The external paper opens only when a reader follows its link.

## GitHub Pages

[Deploy GitHub Pages](../.github/workflows/pages.yml) builds, tests, and deploys each push to `main`. It also supports manual runs. Repository Settings → Pages must use **GitHub Actions** as its source.

Production uses `BASE_PATH=/specgen-app` and `SITE_URL=https://agent4infra-lab.github.io`. Internal links, media, fonts, data requests, and language switching respect the base path. Local development defaults to `/`.

```sh
BASE_PATH=/specgen-app SITE_URL=https://agent4infra-lab.github.io npm run build
BASE_PATH=/specgen-app npm run preview
```

Open the preview server at `/specgen-app/`. For a different repository or custom domain, change the workflow environment values. CI publishes the already-rendered MP4; it does not need a voice engine or video renderer.

## Content and data

| Source | Purpose |
| --- | --- |
| [copy.ts](../src/data/copy.ts) | English and Chinese copy |
| [Page.astro](../src/layouts/Page.astro) | Page structure, paper metrics, authors, and BibTeX |
| [scenarios.ts](../src/data/scenarios.ts) | Illustrative mechanism scenarios |
| [replay.ts](../src/lib/replay.ts) | Pure time-to-state reducer and stopping logic |
| [ProcessScene.tsx](../src/components/ProcessScene.tsx) | Causal schematic shared with the video |
| [RecordedLab.tsx](../src/components/RecordedLab.tsx) | Recorded experiments, budget comparisons, and candidate inspection |
| [recorded-experiments.json](../src/data/recorded-experiments.json) | Small comparison manifest and source checksum |
| [public/data/experiments](../public/data/experiments/) | Per-task records, loaded on demand |
| [import-experiment-report.py](../scripts/import-experiment-report.py) | Allowlisted import from the original report |

The original illustrative workbench remains in [Lab.tsx](../src/components/Lab.tsx) and [traces.ts](../src/data/traces.ts); it is not rendered as the current Kernel Lab.

### Recorded experiment provenance

The current records come from `SpecGen_vs_Baseline_4tasks_20iter.html`, supplied on November 7, 2026. Its SHA-256 is stored in the manifest. The original HTML is not published. The importer retains measurements, reasoning excerpts, and candidate metadata; it excludes internal run directories and device identities, and redacts local paths and addresses in excerpts.

```sh
python3 scripts/import-experiment-report.py /path/to/SpecGen_vs_Baseline_4tasks_20iter.html
```

These recordings use DeepSeek-V4-Flash via API, B300, fixed validation/profiling pools, and the actual `best` stopping policy: 3% margin, two confirming timings, and 5% grace ratio. They are separate from the paper’s H200 experiments.

- Only `best|time`, `best|tokens`, and `best|iters` are presented as measurements. Counterfactual `hist_avg` and `first_valid` estimates are excluded.
- Equivalent token cost is `uncached input + cached input / 50 + 4 × output`, following the report, not current API pricing. Matched-token slices can differ by a few tokens due to rounding.
- Comparison end time is the last iteration boundary. Replay retains trailing Nsight work; downtime between resumed sessions is already excluded from the source clock.
- Comparison cutoffs are rounded to 0.1 seconds in the report. A 0.051-second tolerance includes boundary measurements without moving the plotted budget endpoint.
- The square-matmul peaks 21.94× and 23.02× use FP8 e4m3. The report gives 15.87× excluding FP8. Not every candidate has a precision label, so there is no synthetic precision filter.
- The report contains kernel IDs, statuses, and phase intervals, but not complete CUDA source. The explorer shows recorded prefixes and metadata rather than labeling illustrative kernels as real outputs.

### Illustrative mechanism scenarios

The animation’s timings and code snippets in `scenarios.ts` are illustrative. They explain the algorithm; they are not measured kernels. Paper metrics are labeled separately and sourced to arXiv:2606.17518, v1, §§8.2–8.6 and Table 4.

When editing the scenarios or adding recordings:

1. Failed validation must not produce a profiling result.
2. Add speedups to history only when profiling finishes; exclude the current result from its own stopping threshold.
3. Cancel pending work at its iteration boundary. Do not invent results for cancelled candidates.
4. Include main-path results when the speculative candidates do not qualify.
5. Change resource allocation only at an iteration boundary.
6. Derive visible state from the selected time so seeking and replay remain deterministic.

Resource utilization means stage busy time, not hardware SM utilization. Keep precision, budget, and aggregation conditions attached to results.

## Video

The generated assets are in [public/media](../public/media/):

- `specgen-explainer.mp4`: H.264, 1920×1080, 30 fps, approximately 60 seconds, English narration and an original quiet sound bed.
- `specgen-poster.png`: video cover.
- `specgen-audio.m4a`: timed narration and sound bed.
- `specgen.en.srt` / `specgen.zh.srt`: standalone subtitles.
- `specgen.en.vtt` / `specgen.zh.vtt`: website subtitle tracks.

```sh
npm run video:audio      # macOS: regenerate with the built-in Samantha voice
npm run video:captions
npm run video:poster
npm run video:render
```

The existing audio file works on every rendering platform. Regenerating it uses macOS `say` and `afconvert`; edit [narration.json](../video/narration.json) or replace the audio file with a studio voiceover. Segment boundaries match [captions.ts](../video/captions.ts).

Remotion may download Chromium on first use. `npm run video:studio` opens the frame-based composition. The film and website share the causal schematic and candidate state functions. Rebuild the site after regenerating media.

The root README embeds a GitHub-hosted video attachment as a standalone URL. GitHub renders this as an inline player; external MP4 URLs do not provide the same README behavior. After replacing the film, upload the new MP4 through GitHub’s Markdown attachment control and update the stable `https://github.com/user-attachments/assets/...` URL. Do not commit temporary signed media URLs. Website subtitles remain available in the website player.

## Design and validation

Cyan represents reasoning, amber speculative generation, green validation, and purple profiling. Labels and shapes also communicate state. The website preserves native scrolling, supports keyboard controls, and provides a vertical mechanism layout on mobile. Manual steps work with reduced motion; offscreen and hidden-tab replays pause their clocks. The main explanation, results, and paper links remain readable without JavaScript.

Tests cover historical thresholds, failed and cancelled candidates, fallback, resource-allocation boundaries, deterministic seeking, recorded-data provenance, budget cutoffs, and trace causality. For UI changes, check both languages, desktop and mobile, language switching, playback, and candidate selection. For deployment changes, verify the `/specgen-app/` base path and the data/media URLs.
