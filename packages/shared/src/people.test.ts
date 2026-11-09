import { describe, expect, it } from 'vitest'
import { ageOn, hasFullAccess, needsGuardianConsent, normalizeIdPhone } from './people'

describe('ageOn', () => {
  const on = new Date('2026-11-09T00:00:00Z')
  it('counts whole years', () => {
    expect(ageOn('2010-01-01', on)).toBe(16)
  })
  it('handles the day before and on the birthday', () => {
    expect(ageOn('2008-11-10', on)).toBe(17)
    expect(ageOn('2008-11-09', on)).toBe(18)
  })
  it('rejects invalid dates', () => {
    expect(() => ageOn('not-a-date', on)).toThrow()
  })
})

describe('needsGuardianConsent', () => {
  const on = new Date('2026-11-09T00:00:00Z')
  it('is true under 18 and false from 18', () => {
    expect(needsGuardianConsent('2012-05-05', on)).toBe(true)
    expect(needsGuardianConsent('2008-11-09', on)).toBe(false)
  })
})

describe('hasFullAccess', () => {
  it('allows granted and not_required only', () => {
    expect(hasFullAccess({ consentStatus: 'granted' })).toBe(true)
    expect(hasFullAccess({ consentStatus: 'not_required' })).toBe(true)
    expect(hasFullAccess({ consentStatus: 'pending' })).toBe(false)
    expect(hasFullAccess({ consentStatus: 'declined' })).toBe(false)
    expect(hasFullAccess(null)).toBe(false)
  })
})

describe('normalizeIdPhone', () => {
  it.each([
    ['0812-3456-7890', '6281234567890'],
    ['+62 812 3456 7890', '6281234567890'],
    ['81234567890', '6281234567890'],
    ['6281234567890', '6281234567890'],
  ])('%s → %s', (input, out) => {
    expect(normalizeIdPhone(input)).toBe(out)
  })
  it('rejects non-mobile or garbage numbers', () => {
    expect(normalizeIdPhone('021-555-1234')).toBeNull()
    expect(normalizeIdPhone('abc')).toBeNull()
    expect(normalizeIdPhone('')).toBeNull()
  })
})
