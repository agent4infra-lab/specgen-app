import type { Lang } from './scenarios';
export const copy = {
 en: {
  nav: ['Overview', 'How it works', 'Demo', 'Results', 'Paper'],
  title1: 'Better kernels.', title2: 'Before the', title3: 'thinking ends.',
  subtitle: 'Turn the waiting inside AI reasoning into useful work. SpecGen generates, validates, and profiles GPU kernels while the model is still thinking.', explore: 'Explore the mechanism', watch: 'Watch the 60s film',
  problemTitle: 'The bottleneck is the wait.', problemBody: 'A kernel optimizer thinks, generates code, then asks the GPU to test it. Most of the time, the testing hardware is waiting. What if useful candidates arrived sooner?', baseline: 'Sequential workflow', proposed: 'With speculative generation', idle: 'GPU waiting', useful: 'Useful work starts earlier', comparisonNote: 'Conceptual timeline · shared time scale · not a measured run',
  storyTitle: 'Don’t wait for the final thought.', storyBody: 'Follow one idea as it becomes a candidate, a measurement, and a reason to stop early.',
  steps: [
   ['Start with a kernel.', 'A small GPU program. A clear correctness target. The model begins exploring how to make it faster.'],
   ['An idea is enough to branch.', 'As the reasoning commits to a concrete design, SpecController captures the prefix. The main stream keeps going.'],
   ['Make the idea executable.', 'Fast, non-reasoning generations inherit that prefix and produce alternative candidate kernels.'],
   ['Let the hardware answer.', 'Validate first. Profile only correct kernels. Every usable measurement becomes feedback.'],
   ['Stop when there is a better path.', 'A candidate beats the prior average speedup. End the main generation, cancel pending forks, and carry the feedback forward.'],
  ], labTitle: 'Inside the kernel search.', labBody: 'Read the agent’s trace. Compare the CUDA it writes. See what arrives earlier than a sequential baseline.', labLabel: 'KERNEL LAB', prompt: 'OPTIMIZATION PROMPT', reference: 'PYTORCH REFERENCE', run: 'Play replay', replay: 'Replay', pause: 'Pause', candidates: 'Candidates', feedback: 'Profiled', threshold: 'Historical mean', best: 'Best so far', iteration: 'ITERATION', selected: 'CANDIDATE INSPECTOR', empty: 'Select a branch to inspect its design and feedback.', design: 'Inherited design', code: 'Illustrative code excerpt', detail: 'Task prompt & reference', hide: 'Close task details',
  systemTitle: 'A good idea needs a good system.', systemBody: 'SpecController creates the opportunity. ElasticScheduler makes sure it can reach the hardware.',
  systemCards: [
   ['01', 'Move capacity to the work.', 'An elastic GPU pool splits between validation and profiling. At each iteration boundary, queue pressure determines the next split.'],
   ['02', 'Get useful feedback sooner.', 'Validation favors the latest arrivals, with longer reasoning prefixes. Profiling serves the oldest validated candidate first.'],
   ['03', 'Reuse the thinking.', 'Shared reasoning prefixes reuse KV state. Spare memory on validation and profiling GPUs can hold remote prefix caches.'],
  ], resultsTitle: 'Less waiting. More discovery.', resultsBody: 'System efficiency and kernel quality are different outcomes. SpecGen improves both.', reported: 'REPORTED IN THE PAPER', metricLabels: ['Faster optimization', 'More profiling feedback', 'GPU resource busy time', 'Better final kernels'], metricDescriptions: ['End-to-end speedup over three baseline systems', 'Relative increase in usable profiling feedback', 'Validation / profiling resource utilization', 'Relative improvement over baseline kernel performance'],
  resultNote: 'H200 experiments with GLM-5.1 and DeepSeek-V4-Pro. Ranges span the paper’s baseline comparisons; see §8 for workloads, budgets, and aggregation.', utilizationTitle: 'Give the GPU something to do.', utilizationNote: 'Validation / profiling resource busy time · Table 4', chartLabels: ['Baselines', 'SpecGen'],
  filmTitle: 'The whole idea, in one minute.', filmBody: 'English narration, with English and Chinese captions.',
  paperTitle: 'Go deeper.', paperSubtitle: 'SpecGen: Accelerating Agentic Kernel Optimization with Speculative Generation', read: 'Read the paper', cite: 'Copy BibTeX', copied: 'Copied',
 },
 zh: {
  nav: ['概览', '工作原理', '交互演示', '实验效果', '论文'], title1: '更好的 kernel。', title2: '不必等到', title3: '思考结束。', subtitle: '把 AI 推理中的等待变成有效工作。模型仍在思考时，SpecGen 已经开始生成、验证和 profiling GPU kernel。', explore: '探索工作原理', watch: '观看 60 秒短片', 
  problemTitle: '瓶颈，藏在等待里。', problemBody: '模型思考、生成代码，然后交给 GPU 测试。大部分时间，测试硬件都在等待。如果候选能更早到来呢？', baseline: '串行工作流', proposed: '使用推测生成', idle: 'GPU 等待', useful: '有效工作更早开始', comparisonNote: '概念时间轴 · 使用相同时间尺度 · 非实测运行',
  storyTitle: '不必等待最后一个想法。', storyBody: '跟随一个设计，看它如何成为候选、测量结果，以及提前结束推理的理由。',
  steps: [['从一个 kernel 开始。', '一段 GPU 程序，一个明确的正确性目标。模型开始探索如何让它更快。'], ['一个设计，就足以分叉。', '推理形成具体设计时，SpecController 捕获此刻的前缀。主推理继续前进。'], ['让想法成为代码。', '快速的非推理生成继承此前缀，产出不同的候选 kernel。'], ['让硬件给出答案。', '先验证，再对正确的 kernel 做 profiling。每次有效测量都成为反馈。'], ['找到更好的路径，就提前结束。', '候选超过此前的平均 speedup。结束主生成、取消未完成分支，将反馈带入下一轮。']],
  labTitle: '走进 kernel 优化现场。', labBody: '阅读 agent 的执行记录，比较生成的 CUDA 实现，观察它如何比串行 baseline 更早获得结果。', labLabel: 'KERNEL 实验室', prompt: '优化 PROMPT', reference: 'PYTORCH 参考', run: '播放回放', replay: '重播', pause: '暂停', candidates: '已生成候选', feedback: 'Profiling 反馈', threshold: '历史平均值', best: '目前最优', iteration: '迭代', selected: '候选检查器', empty: '选择一个分支，查看其设计与反馈。', design: '继承的设计', code: '示意代码片段', detail: '任务与参考实现', hide: '收起任务详情',
  systemTitle: '好想法，也需要好系统。', systemBody: 'SpecController 创造机会，ElasticScheduler 让机会抵达硬件。', systemCards: [['01', '让资源跟着任务走。', '弹性 GPU 池分配给验证与 profiling。每轮迭代开始时，根据此前队列压力决定新的比例。'], ['02', '让有用反馈更早返回。', '验证优先处理最新到达、继承更长前缀的候选。Profiling 优先处理最早通过验证的候选。'], ['03', '复用已经完成的思考。', '共享的推理前缀复用 KV 状态。验证与 profiling GPU 的空闲显存可存放远程前缀缓存。']],
  resultsTitle: '更少等待，更多发现。', resultsBody: '系统效率与 kernel 质量是不同的结果。SpecGen 同时改善两者。', reported: '论文报告的实验结果', metricLabels: ['优化流程更快', '更多 profiling 反馈', 'GPU 资源忙碌率', '最终 kernel 更快'], metricDescriptions: ['相对三种基线系统的端到端加速', '可用 profiling 反馈的相对增加', '验证 / profiling 资源利用率', '相对基线最终 kernel 性能的提升'], resultNote: '使用 H200、GLM-5.1 与 DeepSeek-V4-Pro 的实验结果。范围涵盖论文中的不同基线比较；工作负载、预算与聚合方式见 §8。', utilizationTitle: '让 GPU 有事可做。', utilizationNote: '验证 / profiling 资源忙碌率 · 表 4', chartLabels: ['基线', 'SpecGen'],
  filmTitle: '一分钟，看懂整个想法。', filmBody: '英文解说，提供中英字幕。', paperTitle: '继续深入。', paperSubtitle: 'SpecGen: Accelerating Agentic Kernel Optimization with Speculative Generation', read: '阅读论文', cite: '复制 BibTeX', copied: '已复制',
 }
};
export const getCopy = (lang: Lang) => copy[lang];
