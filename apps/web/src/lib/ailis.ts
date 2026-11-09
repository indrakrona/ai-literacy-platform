import type { Payload } from 'payload'
import type { Competency } from '@ailit/shared'
import { assembleForm, buildReport, scoreChoice, type EngineItem } from '@ailit/test-engine'
import type { TestAttempt, TestItem } from '../payload-types'

export function toEngineItem(item: TestItem): EngineItem {
  const isTask = item.type === 'performance_task'
  return {
    id: item.id,
    type: item.type,
    competency: item.competency as Competency,
    difficulty: Number(item.difficulty) as 1 | 2 | 3,
    correct: isTask ? undefined : (item.options ?? []).flatMap((o, i) => (o.correct ? [i] : [])),
    maxPoints: isTask ? Math.max(0, ...(item.rubric ?? []).map((r) => r.points)) : 1,
  }
}

/** What a candidate may see of an item: never the correct flags or rubric. */
export function toPaperItem(item: TestItem) {
  return {
    id: item.id,
    type: item.type,
    scenario: item.scenario ?? null,
    stem: item.stem,
    options: item.type === 'performance_task' ? [] : (item.options ?? []).map((o) => o.text),
  }
}

export async function assembleTestForm(payload: Payload, formId: number) {
  const form = await payload.findByID({ collection: 'test-forms', id: formId, overrideAccess: true, depth: 0 })
  const states = (form.itemStates?.length ? form.itemStates : ['live']) as string[]
  const pool = await payload.find({
    collection: 'test-items',
    overrideAccess: true,
    limit: 2000,
    depth: 0,
    where: { and: [{ level: { equals: form.level } }, { state: { in: states } }] },
  })
  const seed = form.seed ?? Math.floor(Math.random() * 1e9)
  const result = assembleForm(pool.docs.map(toEngineItem), form.blueprint as { itemsPerDomain: number; performanceTasks: number }, seed)
  await payload.update({
    collection: 'test-forms',
    id: formId,
    overrideAccess: true,
    data: { items: result.itemIds.map(Number), seed, shortfall: result.shortfall },
  })
  return result
}

/** Score choice items; performance tasks wait for raters. Returns the updated attempt fields. */
export function scoreAttempt(items: TestItem[], attempt: Pick<TestAttempt, 'responses' | 'points'>) {
  const responses = (attempt.responses ?? {}) as Record<string, { selected?: number[]; text?: string }>
  const points = { ...((attempt.points ?? {}) as Record<string, number>) }
  let pendingRatings = 0
  for (const item of items) {
    if (item.type === 'performance_task') {
      if (points[String(item.id)] === undefined) pendingRatings++
      continue
    }
    points[String(item.id)] = scoreChoice(toEngineItem(item), responses[String(item.id)]?.selected ?? [])
  }
  const report = pendingRatings === 0 ? (buildReport(items.map(toEngineItem), points) as unknown as Record<string, unknown>) : null
  return { points, pendingRatings, report }
}
