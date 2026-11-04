# SpecGen research website

Website: https://agent4infra-lab.github.io/specgen_demo/

中文: https://agent4infra-lab.github.io/specgen_demo/zh/

An English/Chinese static research site with an interactive mechanism schematic and a three-case trace/code/comparison workbench and a narrated 60-second explainer video. Built with Astro, React, TypeScript, Motion, SVG and Remotion.

## Run locally

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open the printed local URL (normally http://localhost:4321). English is `/`; Chinese is `/zh/`. Language changes retain the current section.

```sh
npm run build     # Type checking + static production build into dist/
npm run preview   # Serve the production build
npm run test      # Deterministic replay and scientific-semantics tests
```

`dist/` can be served by any static host. No backend, credentials, GPU access or external runtime API is required. The site uses self-hosted fonts; the external paper opens only when a reader follows its link.

## GitHub Pages

The `Deploy GitHub Pages` workflow builds, tests, and deploys every push to `main`. It can also be started manually from Actions. In repository Settings → Pages, the source must be **GitHub Actions**.

The workflow sets `BASE_PATH=/specgen_demo` and `SITE_URL=https://agent4infra-lab.github.io`. Internal links, media, fonts, and language switching respect that base path. Normal local development keeps `/`. To reproduce the hosted build:

```sh
BASE_PATH=/specgen_demo SITE_URL=https://agent4infra-lab.github.io npm run build
BASE_PATH=/specgen_demo npm run preview
```

Then open the preview server at `/specgen_demo/`. For a different repository or custom domain, update the two workflow environment values. The rendered MP4 is committed with the source; CI does not need a voice engine or video renderer.

## Content and replay data

- `src/data/copy.ts`: English and Chinese site copy.
- `src/data/scenarios.ts`: three illustrative scenarios, task prompts, shapes, reference excerpts, initial speedup history, candidate event timestamps and iteration boundaries.
- `src/lib/replay.ts`: pure time-to-state reducer, result history, historical-mean thresholds and cancellation semantics.
- `src/components/ProcessScene.tsx`: the causal prefix → fork → correctness → profiling → stopping renderer shared by the explanation and video.
- `src/data/traces.ts`: generated bilingual event records, distinct CUDA design excerpts, baseline comparison fixtures and a line-based diff. Replace these curated records with real experimental traces later.
- `src/components/Lab.tsx`: trace console, kernel source browser, code diff and paired baseline comparison. It deliberately uses a different representation from the mechanism schematic.
- `src/layouts/Page.astro`: static page, attributed paper metrics, author information and BibTeX.

### Replace illustrative traces with recorded runs

Adapt real logs into the `Scenario` interface. All event times are elapsed seconds on one monotonic run clock, not animation frame numbers. Candidate IDs are unique within a scenario. Each candidate records its iteration, fork time, generation end, validation end and (only when correct) profiling end and speedup. Iterations record the planned reasoning end, actual completion, stopping reason and GPU split. Extend the `source.kind` union from `illustrative` to `recorded` together with a real run identifier and provenance link; update its visible label only after the values come from that run.

Keep these invariants:

1. Failed validation never produces a profiling result.
2. Speedups enter the history after profiling completes; the current result is excluded from its own stopping threshold.
3. Pending forks are cancelled at the actual end of their iteration. Do not invent results for them.
4. Main-path results are added for fallback iterations.
5. GPU allocation changes only at an iteration boundary.
6. Derive every visible state from the selected time. Never append mutable history during playback.

The data currently demonstrates system behavior; its timings, kernel speedups, shapes and code excerpts are **illustrative**. Code snippets are not runnable kernels. Paper metrics are separately labeled and sourced to arXiv:2606.17518, v1, §§8.2–8.6 and Table 4. They use different baselines/aggregations; do not combine the ranges into a single claimed experiment. Validation/profiling utilization is resource busy time, not hardware SM utilization.

## Video

Outputs are already included in `public/media/`:

- `specgen-explainer.mp4`: H.264, 1920×1080, 30 fps, 60 seconds, English narration, an original quiet electronic sound bed, and English on-screen text.
- `specgen-poster.png`: preview image.
- `specgen-audio.m4a`: timed narration and original sound bed.
- `specgen.en.srt`, `specgen.zh.srt`: standalone subtitles.
- `specgen.en.vtt`, `specgen.zh.vtt`: website subtitle tracks.

Regenerate after updating the shared renderer or data:

```sh
npm run video:audio      # macOS: regenerate with the built-in Samantha voice
npm run video:captions
npm run video:poster
npm run video:render
```

The existing audio file works on every rendering platform. Audio regeneration uses macOS `say` and `afconvert`; edit `video/narration.json` for the script or replace the audio file with a studio voiceover. The soundtrack is exactly 60 seconds, with segment boundaries matching `video/captions.ts`.

Remotion may download its Chromium renderer on first use. `npm run video:studio` opens the frame-based composition for editing. The composition uses the same candidate state functions and causal schematic as the site; its pacing maps 60 seconds of narration to illustrative event time. Rebuild the site after producing new media so `dist/` contains the current outputs.

## Design and accessibility

Cyan = reasoning, amber = speculative generation, green = validation, purple = profiling. Shapes, labels and status text also communicate state. The site preserves native scrolling and provides keyboard-operable controls. The mechanism can play continuously or advance by scroll/step; mobile uses a vertical flow. The lab offers a timestamped trace, syntax-highlighted distinct CUDA variants, a real line-level diff and a paired illustrative baseline view. Manual steps remain available with reduced motion. Offscreen or hidden-tab replays pause their clocks. The main explanation, results and paper links remain available without JavaScript.

## Validation

Automated tests also check generated-trace causality and distinct kernel diffs. They cover history ordering, the current-result exclusion, failed candidates, cancellation, fallback, resource reallocation boundaries and deterministic seeking. Browser QA covers English/Chinese, desktop/tablet/mobile layouts, scenario switching, playback controls, expanded details and paper actions. No model API is invoked. GitHub Pages publishes the static build from `main`.
