import type { Candidate, Scenario } from '../data/scenarios';
export type CandidateStatus = 'waiting' | 'generating' | 'validating' | 'profiling' | 'passed' | 'failed' | 'cancelled';
export const timelineEnd = (s: Scenario) => Math.max(s.duration, ...s.iterations.map(i => i.plannedEnd + 8));
export const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
export function candidateStatus(s: Scenario, c: Candidate, time: number): CandidateStatus {
  if (time < c.spawn) return 'waiting';
  const iteration = s.iterations.find(i => i.id === c.iteration)!;
  const completed = c.profiled ?? c.validated;
  if (time >= iteration.end && completed > iteration.end) return 'cancelled';
  if (time < c.generated) return 'generating';
  if (time < c.validated) return 'validating';
  if (c.outcome !== 'pass') return 'failed';
  if (c.profiled === undefined) return time >= iteration.end ? 'cancelled' : 'profiling';
  return time < c.profiled ? 'profiling' : 'passed';
}
export function historyAt(s: Scenario, time: number, inclusive = true): number[] {
  const history = [...s.history];
  const results = s.candidates.filter(c => c.outcome === 'pass' && c.profiled !== undefined && c.speedup !== undefined && (inclusive ? c.profiled <= time : c.profiled < time) && c.profiled <= s.iterations.find(i => i.id === c.iteration)!.end).map(c => ({ time: c.profiled!, speedup: c.speedup! }));
  for (const i of s.iterations) if (i.mainSpeedup !== undefined && (inclusive ? i.end <= time : i.end < time)) results.push({ time: i.end, speedup: i.mainSpeedup });
  return history.concat(results.sort((a, b) => a.time - b.time).map(r => r.speedup));
}
export function thresholdFor(s: Scenario, c: Candidate) { return mean(historyAt(s, c.profiled ?? s.duration, false)); }
export function stateAt(s: Scenario, time: number) {
  const t = Math.max(0, Math.min(s.duration, time));
  const iteration = [...s.iterations].reverse().find(i => t >= i.start) ?? s.iterations[0];
  const history = historyAt(s, t);
  const active = s.candidates.filter(c => c.spawn <= t);
  const feedback = s.candidates.filter(c => candidateStatus(s, c, t) === 'passed');
  const winner = feedback.find(c => c.iteration === iteration.id && c.speedup! > thresholdFor(s, c));
  const feedbackCount = feedback.length + s.iterations.filter(i => i.mainSpeedup !== undefined && i.end <= t).length;
  return { time: t, iteration, active, feedback, feedbackCount, history, threshold: mean(history), best: Math.max(...history), winner, finished: t >= iteration.end, mainRunning: t >= iteration.start && t < (iteration.stop === 'early' ? iteration.end : iteration.plannedEnd) };
}
