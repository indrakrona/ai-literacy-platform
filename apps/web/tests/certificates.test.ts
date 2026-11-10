import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { certificateCode, certificatePdf, issueCertificate, publicName, statusOf } from '../src/lib/certificates'
import { priceAfter, sessionProblem, voucherCode, voucherProblem } from '../src/lib/booking'
import { Certificates, verifyCertificate } from '../src/collections/Certificates'
import { Bookings, TestSessions, Vouchers } from '../src/collections/TestSessions'
import { TestAttempts } from '../src/collections/TestAttempts'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`
const mk = (roles: string[], extra: Record<string, unknown> = {}) =>
  payload.create({ collection: 'users', overrideAccess: true, data: { name: `Citra Dewi ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required', ...extra } })
type Ep = { path: string; handler: (r: PayloadRequest) => Promise<Response> }
const call = async (c: { endpoints?: unknown }, path: string, user: unknown, body: unknown = {}, routeParams: Record<string, unknown> = {}, url = 'http://x/') => {
  const ep = ((c.endpoints as Ep[]) ?? []).find((e) => e.path === path)!
  const res = await ep.handler({ payload, user, url, json: async () => body, routeParams, headers: new Headers() } as unknown as PayloadRequest)
  const type = res.headers.get('content-type') ?? ''
  return { status: res.status, data: (type.includes('json') ? await res.json() : null) as Record<string, unknown> | null, res }
}
const school = () => payload.create({ collection: 'schools', overrideAccess: true, data: { name: `S ${uniq()}`, npsn: uniq(), level: 'sma' } as never })
const item = () =>
  payload.create({ collection: 'test-items', overrideAccess: true, data: { code: `C-${uniq()}`, type: 'single_choice', competency: 'DIS-1', level: 'sma_smk', difficulty: '2', state: 'draft', stem: 'Q', options: [{ text: 'a', correct: true }, { text: 'b' }] } as never })
const form = async (extra: Record<string, unknown> = {}) =>
  payload.create({ collection: 'test-forms', overrideAccess: true, data: { name: `F ${uniq()}`, level: 'sma_smk', status: 'active', timeLimitMinutes: 30, items: [(await item()).id], ...extra } as never })
const future = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString()

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('certificate helpers', () => {
  it('makes readable codes, shortens minors’ names and works out status', () => {
    expect(certificateCode()).toMatch(/^AILIS-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/)
    expect(voucherCode()).toMatch(/^VCR-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/)
    const teen = new Date(Date.now() - 15 * 365.25 * 86_400_000).toISOString().slice(0, 10)
    expect(publicName('Citra Ayu Dewi', teen)).toBe('Citra D.')
    expect(publicName('Citra Ayu Dewi', '1990-01-01')).toBe('Citra Ayu Dewi')
    expect(publicName('Citra', teen)).toBe('Citra')
    expect(publicName('Ayu Lestari', null)).toBe('Ayu L.') // age unknown: shortened to be safe
    expect(statusOf({ status: 'valid', expiresAt: future(10) })).toBe('valid')
    expect(statusOf({ status: 'valid', expiresAt: future(-1) })).toBe('expired')
    expect(statusOf({ status: 'revoked', expiresAt: future(10) })).toBe('revoked')
  })

  it('prices seats after vouchers and checks session and voucher rules', () => {
    expect(priceAfter(50_000, 100)).toBe(0)
    expect(priceAfter(50_000, 50)).toBe(25_000)
    expect(priceAfter(50_000, 0)).toBe(50_000)
    const s = { id: 1, school: 7, startsAt: future(2), status: 'open', seats: 10 }
    expect(sessionProblem(s, 7)).toBeNull()
    expect(sessionProblem(s, 8)).toBe('other_school')
    expect(sessionProblem({ ...s, status: 'closed' }, 7)).toBe('closed')
    expect(sessionProblem({ ...s, startsAt: future(-1) }, 7)).toBe('started')
    expect(voucherProblem({ discountPercent: 100, school: 7 }, s)).toBeNull()
    expect(voucherProblem({ discountPercent: 100, school: 9 }, s)).toBe('other_school')
    expect(voucherProblem({ discountPercent: 100, expiresAt: future(-1) }, s)).toBe('expired')
    expect(voucherProblem({ discountPercent: 100, active: false }, s)).toBe('inactive')
  })
})

describe('certificates', () => {
  it('issues one certificate per scored attempt, verifies publicly, downloads as PDF and can be revoked', async () => {
    const teen = new Date(Date.now() - 16 * 365.25 * 86_400_000).toISOString().slice(0, 10)
    const [candidate, other, admin] = await Promise.all([mk(['student'], { name: 'Citra Ayu Dewi', dateOfBirth: teen, consentStatus: 'granted' }), mk(['student']), mk(['super_admin'])])
    const f = await form()
    const report = { band: 6, overall: 64, subScores: { understand: 80, evaluate: 60, use_create: 70, protect: 50, apply: 60 }, provisional: true }
    const attempt = await payload.create({
      collection: 'test-attempts',
      overrideAccess: true,
      data: { candidate: candidate.id, form: f.id, status: 'scored', startedAt: new Date().toISOString(), deadline: new Date().toISOString(), itemOrder: [], report },
    })
    const unscored = await payload.create({
      collection: 'test-attempts',
      overrideAccess: true,
      data: { candidate: candidate.id, form: (await form()).id, status: 'awaiting_rating', startedAt: new Date().toISOString(), deadline: new Date().toISOString(), itemOrder: [] },
    })
    expect(await issueCertificate(payload, unscored.id)).toBeNull()

    const cert = (await issueCertificate(payload, attempt.id))!
    expect(cert.code).toMatch(/^AILIS-/)
    expect(cert.band).toBe(6)
    expect(new Date(cert.expiresAt).getFullYear() - new Date(cert.issuedAt).getFullYear()).toBe(2)
    expect((await issueCertificate(payload, attempt.id))!.id).toBe(cert.id) // idempotent

    // Candidates read only their own certificates.
    expect((await payload.find({ collection: 'certificates', overrideAccess: false, user: other, where: { id: { equals: cert.id } } })).totalDocs).toBe(0)
    expect((await payload.find({ collection: 'certificates', overrideAccess: false, user: candidate, where: { id: { equals: cert.id } } })).totalDocs).toBe(1)
    await expect(payload.create({ collection: 'certificates', overrideAccess: false, user: admin, data: { ...cert, id: undefined, code: 'AILIS-FAKE-FAKE' } as never })).rejects.toThrow()

    const pub = (await verifyCertificate(payload, cert.code.toLowerCase()))!
    expect(pub.name).toBe('Citra D.')
    expect(pub.status).toBe('valid')
    expect(pub).not.toHaveProperty('email')
    expect(await verifyCertificate(payload, 'AILIS-NOPE-NOPE')).toBeNull()

    const pdf = await certificatePdf(cert as never, 'Citra Ayu Dewi', 'en')
    expect(Buffer.from(pdf.slice(0, 4)).toString()).toBe('%PDF')
    // Names outside the standard font's characters must not break the PDF.
    expect((await certificatePdf(cert as never, 'Đặng Thị Hồng 李华 😀', 'id')).length).toBeGreaterThan(1000)
    expect((await call(Certificates, '/code/:code/pdf', other, {}, { code: cert.code })).status).toBe(403)
    const own = await call(Certificates, '/code/:code/pdf', candidate, {}, { code: cert.code }, 'http://x/?lang=id')
    expect(own.status).toBe(200)
    expect(own.res.headers.get('content-type')).toBe('application/pdf')

    expect((await call(Certificates, '/code/:code/shared', candidate, { channel: 'whatsapp' }, { code: cert.code })).status).toBe(200)
    const shared = await payload.find({ collection: 'analytics-events', overrideAccess: true, where: { name: { equals: 'certificate_shared' } }, sort: '-createdAt', limit: 1 })
    expect((shared.docs[0]?.props as { channel?: string })?.channel).toBe('whatsapp')

    expect((await call(Certificates, '/:id/revoke', other, { reason: 'copied answers' }, { id: cert.id })).status).toBe(403)
    expect((await call(Certificates, '/:id/revoke', admin, { reason: 'x' }, { id: cert.id })).status).toBe(400)
    expect((await call(Certificates, '/:id/revoke', admin, { reason: 'Malpractice confirmed by proctor' }, { id: cert.id })).status).toBe(200)
    expect((await verifyCertificate(payload, cert.code))!.status).toBe('revoked')
    expect((await call(Certificates, '/code/:code/pdf', candidate, {}, { code: cert.code })).status).toBe(410)
    const log = await payload.find({ collection: 'audit-logs', overrideAccess: true, where: { and: [{ action: { equals: 'revoke' } }, { docId: { equals: String(cert.id) } }] } })
    expect(log.totalDocs).toBe(1)
  })
})

describe('test booking and vouchers', () => {
  it('books seats in order, applies vouchers once, holds paid seats until confirmed and frees seats on cancel', async () => {
    const s1 = await school()
    const s2 = await school()
    const [a, b, c, outsider, schoolAdmin] = await Promise.all([
      mk(['student'], { school: s1.id }),
      mk(['student'], { school: s1.id }),
      mk(['student'], { school: s1.id }),
      mk(['student'], { school: s2.id }),
      mk(['school_admin'], { school: s1.id }),
    ])
    const f = await form({ school: s1.id })
    // A school admin creates the session; the school is pinned to theirs.
    const session = await payload.create({ collection: 'test-sessions', overrideAccess: false, user: schoolAdmin, data: { title: 'Gelombang 1', form: f.id, school: s2.id, startsAt: future(3), seats: 2, priceIdr: 50_000, status: 'open' } })
    expect((session.school as { id: number } | number) && (typeof session.school === 'object' ? session.school!.id : session.school)).toBe(s1.id)
    const otherForm = await form({ school: s2.id })
    await expect(payload.create({ collection: 'test-sessions', overrideAccess: false, user: schoolAdmin, data: { title: 'x', form: otherForm.id, startsAt: future(3), seats: 2, status: 'open' } })).rejects.toThrow(/another school/)

    const batch = await call(Vouchers, '/batch', schoolAdmin, { batch: 'Kelas XI', count: 2, discountPercent: 100 })
    expect(batch.status).toBe(201)
    const [v1] = batch.data!.codes as string[]
    const vDoc = (await payload.find({ collection: 'vouchers', overrideAccess: true, where: { code: { equals: v1 } } })).docs[0]!
    expect(typeof vDoc.school === 'object' ? vDoc.school!.id : vDoc.school).toBe(s1.id)
    expect((await call(Vouchers, '/batch', a, { batch: 'x', count: 1 })).status).toBe(403)

    const book = (u: unknown, voucher?: string) => call(TestSessions, '/:id/book', u, { voucher }, { id: session.id })
    expect((await book(outsider)).data!.problem).toBe('other_school')
    expect((await book(a, 'VCR-NOPE-NOPE')).data!.problem).toBe('voucher_unknown')
    const ra = await book(a, v1)
    expect(ra.status).toBe(201)
    expect(ra.data).toMatchObject({ status: 'booked', priceIdr: 0 })
    expect((await book(a)).data!.problem).toBe('already')
    expect((await book(b, v1)).data!.problem).toBe('used_up')
    const rb = await book(b)
    expect(rb.data).toMatchObject({ status: 'awaiting_payment', priceIdr: 50_000 })
    expect((await book(c)).data!.problem).toBe('full')

    // Only the school admin (or a super admin) can confirm payment; the student cannot.
    expect((await call(Bookings, '/:id/confirm', b, {}, { id: rb.data!.id })).status).toBe(403)
    expect((await call(Bookings, '/:id/confirm', schoolAdmin, {}, { id: rb.data!.id })).status).toBe(200)
    // School admins see bookings for their school's sessions; students see only their own.
    expect((await payload.find({ collection: 'bookings', overrideAccess: false, user: schoolAdmin, where: { session: { equals: session.id } } })).totalDocs).toBe(2)
    expect((await payload.find({ collection: 'bookings', overrideAccess: false, user: a, where: { session: { equals: session.id } } })).totalDocs).toBe(1)

    expect((await call(Bookings, '/:id/cancel', c, {}, { id: rb.data!.id })).status).toBe(403)
    expect((await call(Bookings, '/:id/cancel', b, {}, { id: rb.data!.id })).status).toBe(200)
    expect((await book(c)).status).toBe(201)

    // A scheduled form needs a confirmed booking to start; starting marks it attended.
    const start = (u: unknown) => call(TestAttempts, '/start', u, { accessCode: f.accessCode })
    expect((await start(b)).data!.problem).toBe('booking_required')
    expect((await start(a)).status).toBe(201)
    const booked = await payload.findByID({ collection: 'bookings', id: ra.data!.id as number, overrideAccess: true })
    expect(booked.status).toBe('attended')
  })

  it('never sells more seats than a session has, even when people book at the same moment', async () => {
    const s = await school()
    const users = await Promise.all(Array.from({ length: 6 }, () => mk(['student'], { school: s.id })))
    const session = await payload.create({ collection: 'test-sessions', overrideAccess: true, data: { title: 'Rush', form: (await form()).id, school: s.id, startsAt: future(1), seats: 3, priceIdr: 0, status: 'open' } })
    const results = await Promise.all(users.map((u) => call(TestSessions, '/:id/book', u, {}, { id: session.id })))
    const ok = results.filter((r) => r.status === 201).length
    expect(ok).toBeLessThanOrEqual(3)
    const held = await payload.count({ collection: 'bookings', overrideAccess: true, where: { and: [{ session: { equals: session.id } }, { status: { in: ['booked', 'awaiting_payment', 'attended'] } }] } })
    expect(held.totalDocs).toBe(ok)
  })
})
