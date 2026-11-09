import { describe, expect, it } from 'vitest'
import { assembleForm, buildReport, canTransition, scoreChoice, toBand, type EngineItem } from './index'

const choice = (id: string, competency: EngineItem['competency'], difficulty: 1 | 2 | 3, correct = [0]): EngineItem => ({
  id, type: 'single_choice', competency, difficulty, correct, maxPoints: 1,
})

const bank: EngineItem[] = [
  ...['DIS-1', 'UND-1', 'CRE-1', 'PRO-1', 'THR-1'].flatMap((c) =>
    [1, 2, 3, 1, 2, 3].map((d, i) => choice(`${c}-${i}`, c as EngineItem['competency'], d as 1 | 2 | 3)),
  ),
  { id: 'pt-1', type: 'performance_task', competency: 'UND-3', difficulty: 2, maxPoints: 4 },
  { id: 'pt-2', type: 'performance_task', competency: 'CRE-3', difficulty: 3, maxPoints: 4 },
]

describe('workflow', () => {
  it('allows only defined moves', () => {
    expect(canTransition('draft', 'review')).toBe(true)
    expect(canTransition('draft', 'live')).toBe(false)
    expect(canTransition('live', 'retired')).toBe(true)
    expect(canTransition('retired', 'live')).toBe(false)
  })
})

describe('assembleForm', () => {
  it('picks N items per domain plus performance tasks, deterministically from the seed', () => {
    const a = assembleForm(bank, { itemsPerDomain: 3, performanceTasks: 1 }, 42)
    const b = assembleForm(bank, { itemsPerDomain: 3, performanceTasks: 1 }, 42)
    expect(a.itemIds).toHaveLength(16)
    expect(a.itemIds).toEqual(b.itemIds)
    expect(a.shortfall).toEqual({})
    expect(new Set(a.itemIds).size).toBe(16)
  })
  it('reports a shortfall when the bank is too small', () => {
    const r = assembleForm(bank, { itemsPerDomain: 10, performanceTasks: 3 }, 1)
    expect(r.shortfall.understand).toBe(4)
    expect(r.shortfall.performance).toBe(1)
  })
})

describe('scoring', () => {
  it('scores single and multiple choice all-or-nothing', () => {
    expect(scoreChoice(choice('x', 'DIS-1', 1, [2]), [2])).toBe(1)
    expect(scoreChoice(choice('x', 'DIS-1', 1, [2]), [1])).toBe(0)
    const multi: EngineItem = { ...choice('m', 'DIS-1', 1, [0, 2]), type: 'multiple_choice' }
    expect(scoreChoice(multi, [2, 0])).toBe(1)
    expect(scoreChoice(multi, [0])).toBe(0)
  })
  it('bands follow the cut-scores', () => {
    expect(toBand(0)).toBe(0)
    expect(toBand(55)).toBe(5)
    expect(toBand(100)).toBe(9)
    expect(toBand(55, [50, 60])).toBe(1)
  })
  it('builds a report with five domain sub-scores, marked provisional by default', () => {
    const items = [choice('a', 'DIS-1', 1), choice('b', 'UND-1', 1), choice('c', 'CRE-1', 1), choice('d', 'PRO-1', 1), choice('e', 'THR-1', 1)]
    const r = buildReport(items, { a: 1, b: 1, c: 1, d: 0, e: 0 })
    expect(r.subScores).toEqual({ understand: 100, evaluate: 100, use_create: 100, protect: 0, apply: 0 })
    expect(r.overall).toBe(60)
    expect(r.band).toBe(6)
    expect(r.provisional).toBe(true)
    expect(buildReport(items, {}, [10]).provisional).toBe(false)
  })
})
