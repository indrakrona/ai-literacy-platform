import { describe, expect, it } from 'vitest'
import { inactive, type StudentRow } from '../src/lib/teacher'

const row = (id: number, lastActive: string | null): StudentRow => ({
  id, name: String(id), consentStatus: 'granted', completed: 0, lastActive, flaggedChats: 0,
  byBigIdea: { discover: 0, understand: 0, create: 0, protect: 0, thrive: 0 },
})

describe('inactive students', () => {
  it('flags students never active or idle for more than 7 days', () => {
    const now = Date.parse('2026-11-20T00:00:00Z')
    const rows = [row(1, null), row(2, '2026-11-19T10:00:00Z'), row(3, '2026-11-01T10:00:00Z')]
    expect(inactive(rows, 7, now).map((r) => r.id)).toEqual([1, 3])
  })
})
