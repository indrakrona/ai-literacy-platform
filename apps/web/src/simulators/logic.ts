/** Pure logic for the lesson simulators, kept separate so it can be unit-tested. */

export interface SortCard {
  id: string
  text: { id: string; en: string }
  bin: 'a' | 'b'
  why: { id: string; en: string }
}

export function scoreSort(cards: SortCard[], answers: Record<string, 'a' | 'b'>) {
  const answered = cards.filter((c) => answers[c.id])
  const correct = answered.filter((c) => answers[c.id] === c.bin)
  return { answered: answered.length, correct: correct.length, total: cards.length }
}

/**
 * Toy "model confidence" for the data trainer. Confidence grows with the number of examples
 * the model has seen of the test case's kind, and drops when that kind is missing from training.
 * It is a teaching model, not real machine learning: the point is the shape of the curve.
 */
export function trainerConfidence(examplesOfKind: number, totalExamples: number, wrongLabels = 0): number {
  if (totalExamples === 0) return 0
  const coverage = examplesOfKind / totalExamples
  const amount = 1 - Math.exp(-examplesOfKind / 4)
  const noise = Math.max(0, 1 - (wrongLabels / Math.max(totalExamples, 1)) * 2)
  const raw = (0.35 + 0.65 * amount) * (0.5 + 0.5 * Math.min(1, coverage * 2)) * noise
  const pct = examplesOfKind === 0 ? Math.min(15, raw * 100) : raw * 100
  return Math.round(Math.max(0, Math.min(99, pct)))
}

export type PromptPart = 'goal' | 'context' | 'format'

/** Quality of a prompt for the literal-robot simulator: 0 (vague) to 3 (goal + context + format). */
export function promptQuality(parts: PromptPart[]): 0 | 1 | 2 | 3 {
  const has = new Set(parts)
  if (!has.has('goal')) return 0
  return (1 + (has.has('context') ? 1 : 0) + (has.has('format') ? 1 : 0)) as 1 | 2 | 3
}

/** Recommendation feed: watching a topic makes the algorithm show more of it. */
export function watchTopic(weights: Record<string, number>, topic: string, boost = 1.8): Record<string, number> {
  return { ...weights, [topic]: (weights[topic] ?? 1) * boost }
}

/** The next n feed slots, shared out by weight (largest remainder), most-weighted first. */
export function feedFor(weights: Record<string, number>, n = 6): string[] {
  const keys = Object.keys(weights)
  const total = keys.reduce((a, k) => a + weights[k]!, 0) || 1
  const exact = keys.map((k) => ({ k, v: (weights[k]! / total) * n }))
  const slots = exact.map((e) => ({ k: e.k, n: Math.floor(e.v), r: e.v - Math.floor(e.v) }))
  let left = n - slots.reduce((a, s) => a + s.n, 0)
  for (const s of [...slots].sort((a, b) => b.r - a.r)) {
    if (left <= 0) break
    s.n++
    left--
  }
  return slots.sort((a, b) => (weights[b.k]! - weights[a.k]!)).flatMap((s) => Array.from({ length: s.n }, () => s.k))
}

/** How varied a feed is: distinct topics shown out of all topics (0–1). */
export function variety(feed: string[], topics: number): number {
  return topics ? new Set(feed).size / topics : 0
}

/** Hallucination hunt score: wrong sentences found, and correct ones flagged by mistake. */
export function scoreHunt(flags: boolean[], wrong: boolean[]): { found: number; missed: number; falseAlarms: number } {
  let found = 0
  let missed = 0
  let falseAlarms = 0
  wrong.forEach((w, i) => {
    if (w && flags[i]) found++
    else if (w) missed++
    else if (flags[i]) falseAlarms++
  })
  return { found, missed, falseAlarms }
}
