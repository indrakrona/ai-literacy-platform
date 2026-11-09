import { describe, expect, it } from 'vitest'
import { COMPETENCIES } from '@ailit/shared'
import { WRITTEN } from '../src/seed/lesson-content'
import { SMA_PILOT_ITEMS } from '../src/seed/items/sma-pilot'
import { SMA_EXTRA_ITEMS } from '../src/seed/items/sma-extra'
import { SMP_PILOT_ITEMS } from '../src/seed/items/smp-pilot'

describe('curriculum content', () => {
  it('has all 18 sessions written for both tracks', () => {
    for (const track of ['smp-ai-untuk-belajar-dan-integritas', 'sma-smk-membangun-dengan-ai']) {
      const orders = WRITTEN.filter((l) => l.track === track).map((l) => l.order).sort((a, b) => a - b)
      expect(orders).toEqual(Array.from({ length: 18 }, (_, i) => i + 1))
    }
  })

  it('gives every lesson an objective and a quiz with exactly one correct answer per question', () => {
    for (const l of WRITTEN) {
      expect(l.objective.length, `${l.track}:${l.order}`).toBeGreaterThan(40)
      expect(l.quiz.length, `${l.track}:${l.order}`).toBeGreaterThanOrEqual(3)
      for (const q of l.quiz) {
        expect(q.options.filter((o) => o.correct), `${l.track}:${l.order} "${q.prompt}"`).toHaveLength(1)
        expect(q.explanation.length).toBeGreaterThan(20)
      }
    }
  })
})

describe('AILIS item bank', () => {
  const sets = { sma_smk: [...SMA_PILOT_ITEMS, ...SMA_EXTRA_ITEMS], smp: SMP_PILOT_ITEMS }

  it('uses unique codes and well-formed items', () => {
    const all = [...sets.sma_smk, ...sets.smp]
    expect(new Set(all.map((i) => i.code)).size).toBe(all.length)
    for (const it of all) {
      if (it.type === 'performance_task') {
        expect(it.rubric?.length, it.code).toBeGreaterThanOrEqual(3)
        continue
      }
      const correct = it.options!.filter(([, c]) => c).length
      if (it.type === 'multiple_choice') expect(correct, it.code).toBeGreaterThanOrEqual(2)
      else expect(correct, it.code).toBe(1)
    }
  })

  it('covers all 15 competencies at each level, with two performance tasks', () => {
    for (const [level, items] of Object.entries(sets)) {
      const covered = new Set(items.map((i) => i.competency))
      for (const c of COMPETENCIES) expect(covered.has(c), `${level} ${c}`).toBe(true)
      expect(items.filter((i) => i.type === 'performance_task'), level).toHaveLength(2)
      expect(items.length, level).toBeGreaterThanOrEqual(30)
    }
  })
})
