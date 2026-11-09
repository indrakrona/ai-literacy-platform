import type { Payload } from 'payload'
import { SMA_PILOT_ITEMS } from './items/sma-pilot'

/** Load the pilot item bank as "approved" items (not live until piloted). Safe to re-run. */
export async function seedItems(payload: Payload) {
  let created = 0
  for (const it of SMA_PILOT_ITEMS) {
    const exists = await payload.find({ collection: 'test-items', where: { code: { equals: it.code } }, limit: 1, depth: 0 })
    if (exists.docs[0]) continue
    const doc = await payload.create({
      collection: 'test-items',
      locale: 'id',
      data: {
        code: it.code,
        type: it.type,
        competency: it.competency as never,
        level: 'sma_smk',
        difficulty: it.difficulty,
        state: 'draft',
        scenario: it.scenario,
        stem: it.stem,
        options: it.options?.map(([text, correct]) => ({ text, correct })),
        rubric: it.rubric?.map(([points, descriptor]) => ({ points, descriptor })),
      },
    })
    for (const state of ['review', 'approved'] as const) await payload.update({ collection: 'test-items', id: doc.id, data: { state } })
    created++
  }
  return { created, total: SMA_PILOT_ITEMS.length }
}
