import type { Payload } from 'payload'
import { normalizeRating, resolve } from './marking'

export const idOf = (v: unknown): number => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number))

/** Total and maximum of a rubric marking (each criterion 1–4). */
export function rubricTotal(scores: unknown): { total: number; max: number } | null {
  if (!Array.isArray(scores) || !scores.length) return null
  const nums = scores.map(Number)
  return { total: nums.reduce((a, c) => a + c, 0), max: nums.length * 4 }
}

/** Submissions of a class, oldest ungraded first, then graded. */
export async function gradingQueue(payload: Payload, classId: number) {
  const res = await payload.find({
    collection: 'submissions',
    overrideAccess: true,
    depth: 1,
    limit: 200,
    where: { class: { equals: classId } },
    sort: 'submittedAt',
  })
  const pending = res.docs.filter((d) => d.status === 'submitted')
  const graded = res.docs.filter((d) => d.status === 'graded')
  return { pending, graded }
}

/**
 * Performance-task answers this rater can mark now. Candidates are shown by a code, never by name, and
 * marking is blind: other raters' scores are never shown (spec G7).
 */
export async function ratingQueue(payload: Payload, raterId?: number) {
  const attempts = await payload.find({ collection: 'test-attempts', overrideAccess: true, depth: 0, limit: 100, where: { status: { equals: 'awaiting_rating' } }, sort: 'submittedAt' })
  const ids = [...new Set(attempts.docs.flatMap((a) => (a.itemOrder ?? []) as number[]))]
  const items = ids.length
    ? (await payload.find({ collection: 'test-items', overrideAccess: true, depth: 0, limit: ids.length, where: { and: [{ id: { in: ids } }, { type: { equals: 'performance_task' } }] } })).docs
    : []
  const formIds = [...new Set(attempts.docs.map((a) => idOf(a.form)))]
  const forms = formIds.length ? (await payload.find({ collection: 'test-forms', overrideAccess: true, depth: 0, limit: formIds.length, where: { id: { in: formIds } } })).docs : []
  const doubleOf = new Map(forms.map((f) => [f.id, f.doubleMarking !== false]))
  const byId = new Map(items.map((i) => [i.id, i]))
  const tasks: {
    attemptId: number
    candidateCode: string
    item: (typeof items)[number]
    answer: string
    stage: 'first' | 'second' | 'adjudication' | 'single'
  }[] = []
  for (const a of attempts.docs) {
    const responses = (a.responses ?? {}) as Record<string, { text?: string }>
    const ratings = (a.ratings ?? {}) as Record<string, unknown>
    const double = doubleOf.get(idOf(a.form)) ?? true
    for (const itemId of (a.itemOrder ?? []) as number[]) {
      const item = byId.get(itemId)
      if (!item) continue
      const marks = normalizeRating(ratings[String(itemId)])
      const state = resolve(marks, double)
      if (state.status === 'final') continue
      if (raterId !== undefined && marks.some((m) => m.rater === raterId)) continue
      tasks.push({
        attemptId: a.id,
        candidateCode: `K-${String(a.id).padStart(5, '0')}`,
        item,
        answer: responses[String(itemId)]?.text ?? '',
        stage: !double ? 'single' : state.status === 'needs_first' ? 'first' : state.status === 'needs_second' ? 'second' : 'adjudication',
      })
    }
  }
  // Adjudications first, then second marks, so answers get finished.
  const rank = { adjudication: 0, second: 1, first: 2, single: 2 }
  return tasks.sort((x, y) => rank[x.stage] - rank[y.stage])
}

/** All mark sets ever recorded, for rater agreement statistics. */
export async function markHistory(payload: Payload) {
  const attempts = await payload.find({ collection: 'test-attempts', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { status: { in: ['awaiting_rating', 'scored'] } } })
  return attempts.docs.flatMap((a) => Object.values((a.ratings ?? {}) as Record<string, unknown>).map(normalizeRating)).filter((m) => m.length)
}
