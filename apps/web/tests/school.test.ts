import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { schoolOverview } from '../src/lib/school'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

const school = () => payload.create({ collection: 'schools', overrideAccess: true, data: { name: `S ${uniq()}`, npsn: uniq(), level: 'sma' } as never })

describe('school admin', () => {
  it('creates classes only in the admin’s own school', async () => {
    const [mine, other] = await Promise.all([school(), school()])
    const admin = await payload.create({ collection: 'users', overrideAccess: true, data: { name: 'Admin', email: `a${uniq()}@example.test`, password: 'Passw0rd!', roles: ['school_admin'], school: mine.id } })
    const klass = await payload.create({ collection: 'classes', overrideAccess: false, user: admin, data: { name: 'X IPA 1', school: other.id, academicYear: '2026/2027' } })
    expect(typeof klass.school === 'object' ? klass.school.id : klass.school).toBe(mine.id)
    const teacher = await payload.create({ collection: 'users', overrideAccess: true, data: { name: 'T', email: `t${uniq()}@example.test`, password: 'Passw0rd!', roles: ['teacher'] } })
    await expect(payload.create({ collection: 'classes', overrideAccess: false, user: teacher, data: { name: 'Y', school: mine.id, academicYear: '2026/2027' } })).rejects.toThrow()
  })

  it('summarises classes, students and pending consent', async () => {
    const s = await school()
    const mk = (roles: string[], consentStatus: string) =>
      payload.create({ collection: 'users', overrideAccess: true, data: { name: `U ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, school: s.id, consentStatus: consentStatus as never } })
    const [a, b, t] = await Promise.all([mk(['student'], 'granted'), mk(['student'], 'pending'), mk(['teacher'], 'not_required')])
    await payload.create({ collection: 'classes', overrideAccess: true, data: { name: 'XI A', school: s.id, academicYear: '2026/2027', teachers: [t.id], students: [a.id, b.id] } })
    const o = await schoolOverview(payload, s.id)
    expect(o.totals).toMatchObject({ classes: 1, students: 2, teachers: 1, pendingConsent: 1, lessonsCompleted: 0 })
    expect(o.classes[0]).toMatchObject({ name: 'XI A', students: 2, pendingConsent: 1, teachers: [t.name] })
    expect(o.classes[0].joinCode).toMatch(/^[A-Z2-9]{6}$/)
    expect(o.pending.map((p) => p.id)).toEqual([b.id])
  })
})
