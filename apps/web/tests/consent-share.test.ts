import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { requestGuardianConsent, whatsappConsentUrl } from '../src/lib/consent'
import { emailToText } from '../src/lib/email-adapter'
import { ConsentRequests } from '../src/collections/ConsentRequests'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('sharing consent links without email', () => {
  it('builds a WhatsApp message with the link and turns email HTML into readable text', () => {
    const url = whatsappConsentUrl({ link: 'https://x.test/persetujuan/abc', studentName: 'Citra', guardianName: 'Ibu Wati', guardianPhone: '6281234567890' })
    expect(url.startsWith('https://wa.me/6281234567890?text=')).toBe(true)
    expect(decodeURIComponent(url)).toContain('https://x.test/persetujuan/abc')
    expect(decodeURIComponent(url)).toContain('Yth. Ibu Wati')
    expect(emailToText('<p>Halo</p><p><a href="https://x.test/a">Tinjau</a></p>')).toBe('Halo\nTinjau (https://x.test/a)')
  })

  it('lets the class teacher and school admin get the same open link, and nobody else', async () => {
    const school = await payload.create({ collection: 'schools', overrideAccess: true, data: { name: `S ${uniq()}`, npsn: uniq(), level: 'smp' } as never })
    const mk = (roles: string[], extra: Record<string, unknown> = {}) =>
      payload.create({ collection: 'users', overrideAccess: true, data: { name: `U ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, ...extra } })
    const student = await mk(['student'], { school: school.id, consentStatus: 'pending', dateOfBirth: '2012-01-01' })
    const [teacher, other, admin, otherAdmin] = await Promise.all([mk(['teacher']), mk(['teacher']), mk(['school_admin'], { school: school.id }), mk(['school_admin'])])
    await payload.create({ collection: 'classes', overrideAccess: true, data: { name: 'VIII A', school: school.id, academicYear: '2026/2027', teachers: [teacher.id], students: [student.id] } })
    await requestGuardianConsent(payload, student, { guardianPhone: '081234567890', guardianName: 'Ibu Wati' })

    const ep = ConsentRequests.endpoints ? ConsentRequests.endpoints.find((e) => e.path === '/link')! : null!
    const call = async (u: unknown) => {
      const res = await ep.handler({ payload, user: u, json: async () => ({ studentId: student.id }), headers: new Headers() } as unknown as PayloadRequest)
      return { status: res.status, data: (await res.json()) as Record<string, string> }
    }
    const t = await call(teacher)
    expect(t.status).toBe(200)
    expect(t.data.link).toMatch(/\/persetujuan\/[A-Za-z0-9_-]+$/)
    expect(t.data.whatsapp).toContain('wa.me/6281234567890')
    expect((await call(admin)).data.link).toBe(t.data.link) // same open request is reused
    expect((await call(other)).status).toBe(403)
    expect((await call(otherAdmin)).status).toBe(403)
  })
})
