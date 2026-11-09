import type { Payload } from 'payload'
import { SMA_PILOT_ITEMS, type ItemSeed } from './items/sma-pilot'
import { SMA_EXTRA_ITEMS } from './items/sma-extra'
import { SMP_PILOT_ITEMS } from './items/smp-pilot'

const SETS: { level: 'smp' | 'sma_smk'; items: ItemSeed[] }[] = [
  { level: 'sma_smk', items: [...SMA_PILOT_ITEMS, ...SMA_EXTRA_ITEMS] },
  { level: 'smp', items: SMP_PILOT_ITEMS },
]
export const ITEM_COUNT = SETS.reduce((n, s) => n + s.items.length, 0)

/** Load the pilot item bank as "approved" items (not live until piloted). Safe to re-run. */
export async function seedItems(payload: Payload) {
  let created = 0
  for (const { level, items } of SETS) for (const it of items) {
    const exists = await payload.find({ collection: 'test-items', where: { code: { equals: it.code } }, limit: 1, depth: 0 })
    if (exists.docs[0]) continue
    const doc = await payload.create({
      collection: 'test-items',
      locale: 'id',
      data: {
        code: it.code,
        type: it.type,
        competency: it.competency as never,
        level,
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
  return { created, total: ITEM_COUNT }
}
