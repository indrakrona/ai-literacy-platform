import { describe, expect, it } from 'vitest'
import { promptQuality, scoreSort, trainerConfidence } from '../src/simulators/logic'

describe('simulator logic', () => {
  it('scores a card sort', () => {
    const cards = [
      { id: '1', text: { id: '', en: '' }, bin: 'a' as const, why: { id: '', en: '' } },
      { id: '2', text: { id: '', en: '' }, bin: 'b' as const, why: { id: '', en: '' } },
    ]
    expect(scoreSort(cards, { '1': 'a', '2': 'a' })).toEqual({ answered: 2, correct: 1, total: 2 })
  })

  it('trainer confidence is low with no examples of a kind and rises with more varied data', () => {
    expect(trainerConfidence(0, 12)).toBeLessThanOrEqual(15)
    const few = trainerConfidence(2, 4)
    const many = trainerConfidence(12, 24)
    expect(many).toBeGreaterThan(few)
    expect(trainerConfidence(12, 24, 6)).toBeLessThan(many)
    expect(trainerConfidence(0, 0)).toBe(0)
  })

  it('prompt quality needs a goal and grows with context and format', () => {
    expect(promptQuality(['context', 'format'])).toBe(0)
    expect(promptQuality(['goal'])).toBe(1)
    expect(promptQuality(['goal', 'context', 'format'])).toBe(3)
  })
})
