import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { gradeOf, phaseOf, reportCsv, schoolReport } from '../src/lib/school-report'
import { daysLeft, invoiceNumber, invoicePdf, runLicenceReminders } from '../src/lib/invoices'
import { exportUserData } from '../src/lib/data-rights'
import { DataRequests } from '../src/collections/DataRequests'
import { Orders } from '../src/collections/Orders'
import { seedKkaOutcomes } from '../src/seed/kka-outcomes'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`
const teen = new Date(Date.now() - 14 * 365.25 * 86_400_000).toISOString().slice(0, 10)
const mk = (roles: string[], extra: Record<string, unknown> = {}) =>
  payload.create({ collection: 'users', overrideAccess: true, data: { name: `Rina Wulandari ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required', ...extra } })
type Ep = { path: string; handler: (r: PayloadRequest) => Promise<Response> }
const call = async (c: { endpoints?: unknown }, path: string, user: unknown, body: unknown = {}, routeParams: Record<string, unknown> = {}, url = 'http://x/') => {
  const ep = ((c.endpoints as Ep[]) ?? []).find((e) => e.path === path)!
  const res = await ep.handler({ payload, user, url, json: async () => body, routeParams, headers: new Headers() } as unknown as PayloadRequest)
  const type = res.headers.get('content-type') ?? ''
  return { status: res.status, res, data: (type.includes('application/json') && !res.headers.get('content-disposition') ? await res.json() : null) as Record<string, unknown> | null }
}
const school = () => payload.create({ collection: 'schools', overrideAccess: true, data: { name: `SMP ${uniq()}`, npsn: uniq(), level: 'smp', city: 'Bandung' } as never })

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('school report', () => {
  it('reads grades from the field or the class name and maps them to KKA phases', () => {
    expect(gradeOf({ name: '8B' })).toBe(8)
    expect(gradeOf({ name: 'Kelas 9A' })).toBe(9)
    expect(gradeOf({ name: 'XI IPA 2' })).toBe(11)
    expect(gradeOf({ name: 'X-1' })).toBe(10)
    expect(gradeOf({ name: 'Robotik' })).toBeNull()
    expect(gradeOf({ name: 'Robotik', grade: '7' })).toBe(7)
    expect(phaseOf(8, null)).toBe('D')
    expect(phaseOf(10, null)).toBe('E')
    expect(phaseOf(12, null)).toBe('F')
    expect(phaseOf(null, 'smp')).toBe('D')
  })

  it('aggregates completion by grade, class and big idea, and KKA coverage, without naming students', async () => {
    await seedKkaOutcomes(payload)
    const s = await school()
    const track = await payload.create({ collection: 'tracks', overrideAccess: true, data: { title: 'T', slug: `t-${uniq()}`, level: 'smp' } as never })
    const unitD = await payload.create({ collection: 'units', overrideAccess: true, data: { title: 'U1', track: track.id, bigIdea: 'discover', order: 1 } as never })
    const unitP = await payload.create({ collection: 'units', overrideAccess: true, data: { title: 'U2', track: track.id, bigIdea: 'protect', order: 2 } as never })
    const lesson = (unit: number, competency: string, order: number) =>
      payload.create({ collection: 'lessons', overrideAccess: true, draft: false, data: { title: `L${order}`, unit, competency, order, type: 'interactive', _status: 'published' } as never })
    const [l1, l2, l3] = await Promise.all([lesson(unitD.id, 'DIS-1', 1), lesson(unitD.id, 'DIS-2', 2), lesson(unitP.id, 'PRO-1', 3)])
    const [a, b, c] = await Promise.all([mk(['student'], { school: s.id }), mk(['student'], { school: s.id }), mk(['student'], { school: s.id })])
    await payload.create({ collection: 'classes', overrideAccess: true, data: { name: '8A', school: s.id, academicYear: '2026/2027', track: track.id, students: [a.id, b.id] } as never })
    await payload.create({ collection: 'classes', overrideAccess: true, data: { name: '9B', school: s.id, academicYear: '2026/2027', track: track.id, students: [c.id] } as never })
    const done = (u: number, l: number) => payload.create({ collection: 'lesson-progress', overrideAccess: true, data: { user: u, lesson: l, status: 'completed', completedAt: new Date().toISOString() } as never })
    await Promise.all([done(a.id, l1.id), done(a.id, l2.id), done(a.id, l3.id), done(b.id, l1.id)])

    const r = await schoolReport(payload, s.id, 'id')
    expect(r.school.students).toBe(3)
    // a: 3/3 = 100, b: 1/3 = 33, c: 0 → 44
    expect(r.school.completion).toBe(44)
    expect(r.school.byBigIdea.discover).toBe(50) // a 100, b 50, c 0
    expect(r.school.byBigIdea.protect).toBe(33) // a 100, b 0, c 0
    expect(r.byGrade.map((g) => g.label)).toEqual(['Kelas 8', 'Kelas 9'])
    expect(r.byClass.find((g) => g.label === '8A')!.completion).toBe(67)
    expect(r.school.active30).toBe(2)
    const ld = r.kka.find((k) => k.code === 'D-LD-1')! // protect data → PRO-1
    expect(ld.lessons).toBe(1)
    expect(ld.reached).toBe(33)
    expect(r.kka.find((k) => k.code === 'D-AP-1')!.competencies).toEqual([]) // coding: a gap
    expect(r.kka.every((k) => k.phase === 'D')).toBe(true)
    expect(r.kkaDraft).toBe(true)
    const csv = reportCsv([r.school, ...r.byClass], 'id')
    expect(csv).toContain('"8A"')
    expect(csv).not.toContain('Rina')
  })
})

describe('invoices and renewals', () => {
  it('numbers invoices, makes a PDF for the school’s admins only, and reminds before the licence ends', async () => {
    expect(invoiceNumber({ id: 42, createdAt: '2026-11-30T20:00:00Z' })).toBe('INV/AILIT/2026/12/000042') // 1 Dec in Jakarta
    expect(daysLeft(new Date(Date.now() + 10 * 86_400_000).toISOString())).toBe(10)
    const s = await school()
    const [admin, other, teacher] = await Promise.all([mk(['school_admin'], { school: s.id }), mk(['school_admin']), mk(['teacher'], { school: s.id })])
    const order = await payload.create({ collection: 'orders', overrideAccess: true, data: { school: s.id, plan: 'sekolah_tahunan', seats: 40, amountIdr: 2_000_000, status: 'paid', provider: 'mock', paidAt: new Date().toISOString() } as never })
    const pdf = await invoicePdf(order as never, s as never, 'id')
    expect(Buffer.from(pdf.slice(0, 4)).toString()).toBe('%PDF')
    expect((await call(Orders, '/:id/invoice', other, {}, { id: order.id })).status).toBe(403)
    expect((await call(Orders, '/:id/invoice', teacher, {}, { id: order.id })).status).toBe(403)
    const ok = await call(Orders, '/:id/invoice', admin, {}, { id: order.id })
    expect(ok.status).toBe(200)
    expect(ok.res.headers.get('content-disposition')).toContain('INV-AILIT-')

    await payload.update({ collection: 'schools', id: s.id, overrideAccess: true, data: { licence: { seats: 40, startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 20 * 86_400_000).toISOString() } } as never })
    expect(await runLicenceReminders(payload)).toBeGreaterThanOrEqual(1)
    const count = async () => (await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: admin.id } }, { kind: { equals: 'licence_expiring' } }] } })).totalDocs
    expect(await count()).toBe(1)
    await runLicenceReminders(payload)
    expect(await count()).toBe(1) // once per stage
    await runLicenceReminders(payload, new Date(Date.now() + 15 * 86_400_000)) // 5 days left → 7-day reminder
    expect(await count()).toBe(2)
  })
})

describe('data rights', () => {
  it('exports my data without secrets and logs it', async () => {
    const me = await mk(['student'])
    const data = await exportUserData(payload, me.id)
    expect(data.profile).toMatchObject({ id: me.id, email: me.email })
    expect(data.profile).not.toHaveProperty('hash')
    expect(data.profile).not.toHaveProperty('salt')
    const res = await call(DataRequests, '/export', me)
    expect(res.status).toBe(200)
    expect(res.res.headers.get('content-disposition')).toContain('attachment')
    const logged = await payload.find({ collection: 'data-requests', overrideAccess: true, where: { and: [{ user: { equals: me.id } }, { type: { equals: 'access' } }] } })
    expect(logged.totalDocs).toBe(1)
  })

  it('lets a parent withdraw consent (account or link) and ask for deletion; a super admin erases safely', async () => {
    const parent = await mk(['parent'])
    const child = await mk(['student'], { dateOfBirth: teen, consentStatus: 'granted', guardians: [parent.id] })
    const mate = await mk(['student'])
    const stranger = await mk(['parent'])
    const admin = await mk(['super_admin'])
    const token = `t${uniq()}`
    await payload.create({ collection: 'consent-requests', overrideAccess: true, data: { student: child.id, guardianEmail: 'ayah@example.test', guardianPhone: '6281234500000', token, status: 'granted', decidedAt: new Date().toISOString(), consentVersion: '1' } })

    // Withdraw through the consent link.
    expect((await call(DataRequests, '/withdraw-consent', stranger, { childId: child.id })).status).toBe(403)
    expect((await call(DataRequests, '/withdraw-consent', null, { token })).status).toBe(200)
    expect((await payload.findByID({ collection: 'users', id: child.id, overrideAccess: true })).consentStatus).toBe('declined')
    expect((await call(DataRequests, '/withdraw-consent', null, { token })).status).toBe(409)

    // Content that should go, and content that should stay anonymous.
    let activity = (await payload.find({ collection: 'ai-activities', overrideAccess: true, limit: 1 })).docs[0]
    if (!activity) {
      await (await import('../src/seed/ai-activities')).seedAiActivities(payload)
      activity = (await payload.find({ collection: 'ai-activities', overrideAccess: true, limit: 1 })).docs[0]
    }
    await payload.create({ collection: 'ai-conversations', overrideAccess: true, data: { user: child.id, activity: activity!.id, messages: [{ role: 'user', content: 'hi' }] } as never })
    const s = await school()
    const klass = await payload.create({ collection: 'classes', overrideAccess: true, data: { name: '8C', school: s.id, academicYear: '2026/2027', students: [child.id, mate.id] } as never })
    const brief = (await payload.find({ collection: 'project-briefs', overrideAccess: true, limit: 1 })).docs[0]
    const team = brief ? await payload.create({ collection: 'submissions', overrideAccess: true, data: { brief: brief.id, class: klass.id, members: [child.id, mate.id], text: 'Our project', status: 'submitted' } as never }) : null

    // Parent asks; a stranger cannot; a second open request is refused; the team processes it.
    expect((await call(DataRequests, '/delete', stranger, { childId: child.id })).status).toBe(403)
    const req = await call(DataRequests, '/delete', parent, { childId: child.id, reason: 'Pindah sekolah' })
    expect(req.status).toBe(201)
    expect(new Date(req.data!.dueAt as string).getTime()).toBeGreaterThan(Date.now() + 2 * 86_400_000)
    expect((await call(DataRequests, '/delete', parent, { childId: child.id })).status).toBe(409)
    expect((await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: admin.id } }, { kind: { equals: 'data_request' } }] } })).totalDocs).toBe(1)
    expect((await call(DataRequests, '/:id/process', parent, { action: 'erase' }, { id: req.data!.id })).status).toBe(403)
    expect((await call(DataRequests, '/:id/process', admin, { action: 'reject', note: 'x' }, { id: req.data!.id })).status).toBe(400)
    const done = await call(DataRequests, '/:id/process', admin, { action: 'erase' }, { id: req.data!.id })
    expect(done.status).toBe(200)

    const gone = await payload.findByID({ collection: 'users', id: child.id, overrideAccess: true, depth: 0 })
    expect(gone.name).toBe('Pengguna dihapus')
    expect(gone.email).toBe(`deleted-${child.id}@deleted.invalid`)
    expect(gone.suspended).toBe(true)
    expect(gone.dateOfBirth).toBeFalsy()
    expect(gone.guardians ?? []).toEqual([])
    expect((await payload.find({ collection: 'ai-conversations', overrideAccess: true, where: { user: { equals: child.id } } })).totalDocs).toBe(0)
    const cls = await payload.findByID({ collection: 'classes', id: klass.id, overrideAccess: true, depth: 0 })
    expect(cls.students).toEqual([mate.id])
    if (team) expect((await payload.findByID({ collection: 'submissions', id: team.id, overrideAccess: true, depth: 0 })).members).toEqual([mate.id])
    const consent = (await payload.find({ collection: 'consent-requests', overrideAccess: true, where: { token: { equals: token } } })).docs[0]!
    expect(consent.guardianEmail).toBeFalsy()
    expect(consent.status).toBe('withdrawn')
    await expect(payload.login({ collection: 'users', data: { email: gone.email, password: 'Passw0rd!' } })).rejects.toThrow()
    // Other people cannot see someone else's requests.
    expect((await payload.find({ collection: 'data-requests', overrideAccess: false, user: stranger, where: { user: { equals: child.id } } })).totalDocs).toBe(0)
  })
})
