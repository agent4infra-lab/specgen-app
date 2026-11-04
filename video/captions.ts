export const captions = [
 {start:0,end:8,en:'Kernel optimization spends a lot of time waiting for reasoning to finish.',zh:'Kernel 优化过程中，大量时间用于等待推理完成。'},
 {start:8,end:14,en:'SpecGen watches the reasoning stream for useful design decisions.',zh:'SpecGen 在推理流中捕获有用的设计决策。'},
 {start:14,end:18,en:'A shared reasoning prefix becomes the starting point for new candidates.',zh:'共享推理前缀成为新候选的起点。'},
 {start:18,end:26,en:'Fast, non-reasoning generations produce kernels while the main stream continues.',zh:'主推理继续时，快速的非推理生成已经产出候选 kernel。'},
 {start:26,end:34,en:'Validate correctness first. Profile only the kernels that pass.',zh:'先验证正确性，只对通过的 kernel 做 profiling。'},
 {start:34,end:39,en:'A candidate beats the historical mean. The main generation can stop early.',zh:'候选超过历史平均值，主生成便可提前结束。'},
 {start:39,end:44,en:'Feedback goes to the next iteration. If no candidate qualifies, the main path remains.',zh:'反馈进入下一轮；如果候选未达标，则继续保留主推理路径。'},
 {start:44,end:49,en:'An elastic GPU pool adapts at iteration boundaries to keep work moving.',zh:'弹性 GPU 池在迭代边界调整分配，让任务继续推进。'},
 {start:49,end:53,en:'Shared prefix caches reuse the work already done by the model.',zh:'共享前缀缓存复用模型已经完成的工作。'},
 {start:53,end:60,en:'Less waiting. More feedback. Better kernels. Read the SpecGen paper.',zh:'更少等待，更多反馈，更好的 kernel。阅读 SpecGen 论文。'},
];
