import { describe, expect, it } from 'vitest'
import { bandDistribution, domainProfile, itemStats, type ScoredAttempt } from '../src/lib/assessment-stats'

const sub = (v: number) => ({ understand: v, use_create: v, evaluate: v, protect: v, apply: v })

describe('assessment statistics', () => {
  // 20 candidates of rising ability. Items: 1 discriminates, 2 everyone gets right, 3 only weak candidates get right.
  const attempts: ScoredAttempt[] = Array.from({ length: 20 }, (_, k) => {
    const ability = k / 19
    const points: Record<string, number> = {
      '1': ability > 0.5 ? 1 : 0,
      '2': 1,
      '3': ability < 0.3 ? 1 : 0,
      '4': ability > 0.2 ? 1 : 0,
      '5': ability > 0.4 ? 1 : 0,
    }
    return { points, report: { band: Math.round(ability * 9), overall: ability * 100, subScores: sub(ability * 100) } }
  })
  const items = [1, 2, 3, 4, 5].map((id) => ({ id, code: `I${id}`, maxPoints: 1 }))

  it('flags easy, negative and discriminating items correctly', () => {
    const s = new Map(itemStats(attempts, items).map((x) => [x.id, x]))
    expect(s.get(1)!.discrimination!).toBeGreaterThan(0.5)
    expect(s.get(1)!.flags).toEqual([])
    expect(s.get(2)!.flags).toContain('too_easy')
    expect(s.get(3)!.flags).toContain('negative_discrimination')
    expect(s.get(1)!.difficulty).toBeCloseTo(0.45, 1)
  })

  it('needs enough candidates before flagging', () => {
    const few = itemStats(attempts.slice(0, 5), items)
    expect(few.every((x) => x.discrimination === null && x.flags.length === 0)).toBe(true)
  })

  it('builds the band distribution and domain profile', () => {
    const bands = bandDistribution(attempts)
    expect(bands.reduce((a, c) => a + c, 0)).toBe(20)
    expect(bands).toHaveLength(10)
    expect(domainProfile(attempts).protect).toBeCloseTo(50, 0)
  })
})
