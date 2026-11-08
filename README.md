<div align="center">

# SpecGen

**Better kernels. Before the thinking ends.**

[![Website](https://img.shields.io/badge/Website-SpecGen-6fdde8?style=flat-square)](https://agent4infra-lab.github.io/specgen-app/)
[![PPoPP 2027](https://img.shields.io/badge/PPoPP_2027-Accepted-8b5cf6?style=flat-square)](#paper)
[![arXiv](https://img.shields.io/badge/arXiv-2606.17518-b31b1b?style=flat-square)](https://arxiv.org/abs/2606.17518)
[![GitHub Pages](https://github.com/agent4infra-lab/specgen-app/actions/workflows/pages.yml/badge.svg)](https://github.com/agent4infra-lab/specgen-app/actions/workflows/pages.yml)

[Website](https://agent4infra-lab.github.io/specgen-app/) · [中文](https://agent4infra-lab.github.io/specgen-app/zh/) · [Paper](https://arxiv.org/pdf/2606.17518) · [Experiments](https://agent4infra-lab.github.io/specgen-app/#experiments)

</div>

https://github.com/user-attachments/assets/4b0330a9-7b33-4825-9a5e-15db3c13aaaa

**SpecGen in one minute.** English narration; [English and Chinese captions on the website](https://agent4infra-lab.github.io/specgen-app/#film).

## Speculative generation for kernel optimization

Agentic kernel optimization follows a loop: generate a GPU kernel, check its correctness, profile its performance, and use the feedback to improve the next candidate. Long reasoning generations leave validation and profiling GPUs waiting.

**SpecGen starts useful work before reasoning finishes.** It forks fast, non-reasoning generations from the main model’s reasoning prefix. These candidates are validated and profiled while the main generation continues. When a candidate meets the stopping criterion, SpecGen ends the main generation early and passes the feedback to the next iteration.

- **SpecController** detects useful design decisions in the reasoning stream, launches speculative candidates, and decides when to stop.
- **ElasticScheduler** allocates validation and profiling resources and prioritizes requests to return feedback sooner.
- **Shared prefix caching** reuses the reasoning already performed, including remote KV storage in spare GPU memory.

SpecGen works around an existing reasoning model and search algorithm. If no speculative candidate qualifies, the main generation remains the fallback.

## Results

The paper evaluates SpecGen with two reasoning models on H200 GPUs against CudaForge, AlphaEvolve, and KernelAgent.

| Outcome | Reported result |
| --- | --- |
| End-to-end optimization speedup | **1.68–1.82×** |
| More profiling feedback | **1.58–1.98×** |
| Validation / profiling resource busy time | **88.2–96.1%** |
| Relative improvement in final kernel performance | **1.24–1.91×** |

Ranges span different baseline comparisons. See [§8 of the paper](https://arxiv.org/pdf/2606.17518#page=9) for workloads, budgets, and aggregation.

The [experiment explorer](https://agent4infra-lab.github.io/specgen-app/#experiments) also includes a separate set of recorded B300 runs: square matmul, RMSNorm, Matmul–GELU–Softmax, and MLP, each with 20 iterations. Compare time and token budgets, follow individual candidates, and inspect captured reasoning prefixes. The explorer identifies precision changes and distinguishes these recordings from the paper’s experiments and the explanatory animations.

## Paper

**[SpecGen: Accelerating Agentic Kernel Optimization with Speculative Generation](https://arxiv.org/abs/2606.17518)**

**Accepted at PPoPP 2027.**

Jihu Guo\*, Sitian Lu\*, Tenghui Ma, Wei Gao, Zhisheng Ye, Xingcheng Zhang, Dahua Lin

\* Equal contribution.

```bibtex
@article{guo2026specgen,
  title={SpecGen: Accelerating Agentic Kernel Optimization with Speculative Generation},
  author={Guo, Jihu and Lu, Sitian and Ma, Tenghui and Gao, Wei and Ye, Zhisheng and Zhang, Xingcheng and Lin, Dahua},
  journal={arXiv preprint arXiv:2606.17518},
  year={2026},
  note={Accepted at PPoPP 2027}
}
```

## Website development

This repository contains the SpecGen project website, experiment explorer, and explainer video. For local setup, deployment, data imports, and video generation, see the [development guide](docs/README.md).
