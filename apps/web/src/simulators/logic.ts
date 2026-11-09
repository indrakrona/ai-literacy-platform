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
