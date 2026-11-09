import type { Payload } from 'payload'

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
 * Performance-task responses waiting for a rater. Candidates are shown by a code, never by name,
 * so raters mark the answer and not the person (spec G7).
 */
export async function ratingQueue(payload: Payload) {
  const attempts = await payload.find({ collection: 'test-attempts', overrideAccess: true, depth: 0, limit: 50, where: { status: { equals: 'awaiting_rating' } }, sort: 'submittedAt' })
  const ids = [...new Set(attempts.docs.flatMap((a) => (a.itemOrder ?? []) as number[]))]
  const items = ids.length
    ? (await payload.find({ collection: 'test-items', overrideAccess: true, depth: 0, limit: ids.length, where: { and: [{ id: { in: ids } }, { type: { equals: 'performance_task' } }] } })).docs
    : []
  const byId = new Map(items.map((i) => [i.id, i]))
  const tasks: {
    attemptId: number
    candidateCode: string
    item: (typeof items)[number]
    answer: string
    rated?: number
  }[] = []
  for (const a of attempts.docs) {
    const responses = (a.responses ?? {}) as Record<string, { text?: string }>
    const points = (a.points ?? {}) as Record<string, number>
    const ratings = (a.ratings ?? {}) as Record<string, unknown>
    for (const itemId of (a.itemOrder ?? []) as number[]) {
      const item = byId.get(itemId)
      if (!item) continue
      tasks.push({
        attemptId: a.id,
        candidateCode: `K-${String(a.id).padStart(5, '0')}`,
        item,
        answer: responses[String(itemId)]?.text ?? '',
        rated: ratings[String(itemId)] ? points[String(itemId)] : undefined,
      })
    }
  }
  return tasks
}
