/**
 * Double marking of AILIS performance tasks (spec G7).
 * Two different raters mark each answer blind. If they agree within ADJACENT_TOLERANCE points the final
 * score is their average; otherwise a third rater adjudicates and their mark is final.
 */
export const ADJACENT_TOLERANCE = 1

export interface Mark {
  rater: number
  points: number
  at: string
  role?: 'first' | 'second' | 'adjudication' | 'single'
}

export interface ItemRating {
  marks: Mark[]
  final?: number
  status: 'needs_first' | 'needs_second' | 'needs_adjudication' | 'final'
}

/** Accept the old single-rating shape {points, rater, at} as one mark. */
export function normalizeRating(raw: unknown): Mark[] {
  if (!raw || typeof raw !== 'object') return []
  const r = raw as { marks?: Mark[]; points?: number; rater?: number; at?: string }
  if (Array.isArray(r.marks)) return r.marks
  if (typeof r.points === 'number' && typeof r.rater === 'number') return [{ rater: r.rater, points: r.points, at: r.at ?? '', role: 'single' }]
  return []
}

/** Where an item stands given its marks and whether the form uses double marking. */
export function resolve(marks: Mark[], doubleMarking: boolean): ItemRating {
  if (!marks.length) return { marks, status: 'needs_first' }
  const adjudication = marks.find((m) => m.role === 'adjudication')
  if (adjudication) return { marks, status: 'final', final: adjudication.points }
  if (!doubleMarking || marks[0]?.role === 'single') return { marks, status: 'final', final: marks[0]!.points }
  if (marks.length === 1) return { marks, status: 'needs_second' }
  const [a, b] = marks as [Mark, Mark]
  if (Math.abs(a.points - b.points) <= ADJACENT_TOLERANCE) return { marks, status: 'final', final: (a.points + b.points) / 2 }
  return { marks, status: 'needs_adjudication' }
}

/** Add a rater's mark. Refuses a second mark from the same rater on the same answer. */
export function addMark(marks: Mark[], rater: number, points: number, doubleMarking: boolean, at = new Date().toISOString()): { ok: true; marks: Mark[] } | { ok: false; reason: string } {
  const state = resolve(marks, doubleMarking)
  if (state.status === 'final') return { ok: false, reason: 'already final' }
  if (marks.some((m) => m.rater === rater)) return { ok: false, reason: 'you already marked this answer' }
  const role: Mark['role'] = !doubleMarking ? 'single' : state.status === 'needs_first' ? 'first' : state.status === 'needs_second' ? 'second' : 'adjudication'
  return { ok: true, marks: [...marks, { rater, points, at, role }] }
}

export interface Agreement {
  pairs: number
  exact: number
  adjacent: number
  meanAbsDiff: number
  adjudicated: number
}

/** Agreement between first and second marks across many answers (optionally only pairs involving one rater). */
export function agreement(ratings: Mark[][], rater?: number): Agreement {
  let pairs = 0
  let exact = 0
  let adjacent = 0
  let diff = 0
  let adjudicated = 0
  for (const marks of ratings) {
    const first = marks.find((m) => m.role === 'first')
    const second = marks.find((m) => m.role === 'second')
    if (!first || !second) continue
    if (rater !== undefined && first.rater !== rater && second.rater !== rater) continue
    pairs++
    const d = Math.abs(first.points - second.points)
    diff += d
    if (d === 0) exact++
    if (d <= ADJACENT_TOLERANCE) adjacent++
    if (marks.some((m) => m.role === 'adjudication')) adjudicated++
  }
  return { pairs, exact: pairs ? exact / pairs : 0, adjacent: pairs ? adjacent / pairs : 0, meanAbsDiff: pairs ? diff / pairs : 0, adjudicated }
}
