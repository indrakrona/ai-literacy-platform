import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { Users } from '../src/collections/Users'
import { childProgress, weekLine } from '../src/lib/parents'
import { isWeeklySummaryTime, runTestReminders, runWeeklySummaries } from '../src/lib/jobs'
import { cleanParam, renderWa, sendWhatsApp } from '../src/lib/whatsapp'
import { announcementsFor, audienceOf } from '../src/collections/Announcements'
import { runJobs } from '../src/endpoints/parents'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`
const teen = new Date(Date.now() - 14 * 365.25 * 86_400_000).toISOString().slice(0, 10)
const mk = (roles: string[], extra: Record<string, unknown> = {}) =>
  payload.create({ collection: 'users', overrideAccess: true, data: { name: `Dimas Pratama ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required', ...extra } })
type Ep = { path: string; handler: (r: PayloadRequest) => Promise<Response> }
const call = async (ep: Ep, user: unknown, body: unknown = {}, headers: Record<string, string> = {}) => {
  const res = await ep.handler({ payload, user, json: async () => body, routeParams: {}, headers: new Headers(headers) } as unknown as PayloadRequest)
  return { status: res.status, data: (await res.json()) as Record<string, unknown> }
}
const usersEp = (path: string) => ((Users.endpoints as Ep[]) ?? []).find((e) => e.path === path)!
const school = () => payload.create({ collection: 'schools', overrideAccess: true, data: { name: `S ${uniq()}`, npsn: uniq(), level: 'smp' } as never })

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('WhatsApp templates', () => {
  it('fills parameters, cleans them and only logs while no provider is connected', async () => {
    expect(renderWa('score_ready', 'en', ['Dimas', 'https://x/y'])).toBe('Hi Dimas, your AILIS test result is ready. See it here: https://x/y')
    expect(cleanParam('a\n\nb     c')).toBe('a b   c')
    expect(await sendWhatsApp(payload, { to: '0812-3456-7890', template: 'score_ready', locale: 'id', params: ['A', 'B'] })).toMatchObject({ sent: true, provider: 'console' })
    expect((await sendWhatsApp(payload, { to: '123', template: 'score_ready', locale: 'id', params: ['A', 'B'] })).sent).toBe(false)
    expect((await sendWhatsApp(payload, { to: '081234567890', template: 'score_ready', locale: 'id', params: ['A'] })).reason).toBe('wrong parameter count')
  })
})

describe('parent accounts', () => {
  it('links a parent through a granted consent link or the child’s code, and never through a pending one', async () => {
    const child = await mk(['student'], { dateOfBirth: teen, consentStatus: 'pending' })
    const token = `tok${uniq()}`
    const request = await payload.create({ collection: 'consent-requests', overrideAccess: true, data: { student: child.id, guardianEmail: 'ibu@example.test', token, status: 'pending', consentVersion: '1', expiresAt: new Date(Date.now() + 86_400_000).toISOString() } })
    const signup = usersEp('/parent-signup')
    const form = { name: 'Ibu Sari', email: `ibu${uniq()}@example.test`, password: 'Passw0rd!', phone: '0812 3456 7890', token }
    expect((await call(signup, null, form)).data.problem).toBe('consent_not_granted')
    await payload.update({ collection: 'consent-requests', id: request.id, overrideAccess: true, data: { status: 'granted', decidedAt: new Date().toISOString() } })
    const ok = await call(signup, null, form)
    expect(ok.status).toBe(201)
    const parent = await payload.findByID({ collection: 'users', id: ok.data.id as number, overrideAccess: true })
    expect(parent.roles).toEqual(['parent'])
    expect(parent.phone).toBe('6281234567890')
    const linked = await payload.findByID({ collection: 'users', id: child.id, overrideAccess: true, depth: 0 })
    expect(linked.guardians).toEqual([parent.id])
    expect((await call(signup, null, form)).data.problem).toBe('email_exists')
    const notice = await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: child.id } }, { kind: { equals: 'child_linked' } }] } })
    expect(notice.totalDocs).toBe(1)

    // A second child links with a code the child made; codes are one-off and private.
    const sibling = await mk(['student'], { dateOfBirth: teen, consentStatus: 'granted' })
    const code = await call(usersEp('/parent-code'), sibling)
    expect(code.data.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/)
    const other = await mk(['teacher'])
    const seen = await payload.findByID({ collection: 'users', id: sibling.id, overrideAccess: false, user: other }).catch(() => null)
    expect((seen as { parentLinkCode?: string } | null)?.parentLinkCode).toBeUndefined()
    expect((await call(usersEp('/link-child'), other, { code: code.data.code })).data.problem).toBe('not_parent')
    expect((await call(usersEp('/link-child'), parent, { code: 'ZZZZZZZZ' })).data.problem).toBe('link_invalid')
    expect((await call(usersEp('/link-child'), parent, { code: code.data.code })).status).toBe(200)
    expect((await call(usersEp('/link-child'), parent, { code: code.data.code })).data.problem).toBe('link_invalid') // used up

    // A minor cannot remove the parent themselves; the parent can stop following.
    expect((await call(usersEp('/unlink-guardian'), { ...sibling, consentStatus: 'granted' }, { parentId: parent.id })).status).toBe(403)
    expect((await call(usersEp('/unlink-guardian'), parent, { childId: sibling.id })).status).toBe(200)
    expect((await payload.findByID({ collection: 'users', id: sibling.id, overrideAccess: true, depth: 0 })).guardians).toEqual([])
    // Guardians cannot be set by ordinary users.
    await payload.update({ collection: 'users', id: child.id, overrideAccess: false, user: child, data: { guardians: [] } }).catch(() => null)
    expect((await payload.findByID({ collection: 'users', id: child.id, overrideAccess: true, depth: 0 })).guardians).toEqual([parent.id])
    // …but a linked student can still edit their own profile.
    expect((await payload.update({ collection: 'users', id: child.id, overrideAccess: false, user: child, data: { name: 'Dimas P' } })).name).toBe('Dimas P')
  })

  it('shows progress and the week to parents without any AI chat content', async () => {
    const child = await mk(['student'])
    let activity = (await payload.find({ collection: 'ai-activities', overrideAccess: true, limit: 1 })).docs[0]
    if (!activity) {
      await (await import('../src/seed/ai-activities')).seedAiActivities(payload)
      activity = (await payload.find({ collection: 'ai-activities', overrideAccess: true, limit: 1 })).docs[0]
    }
    await payload.create({ collection: 'ai-conversations', overrideAccess: true, data: { user: child.id, activity: activity!.id, messages: [{ role: 'user', content: 'SECRET-DIARY' }] } as never })
    const p = await childProgress(payload, child.id, 'id')
    expect(p.week.aiSessions).toBe(1)
    expect(JSON.stringify(p)).not.toContain('SECRET-DIARY')
    expect(weekLine('Dimas Pratama', p.week, 'id')).toBe('Dimas: 1 sesi AI Lab.')
    expect(weekLine('Dimas', { lessons: 0, xp: 0, badges: 0, aiSessions: 0, projectsSent: 0, projectsGraded: 0, testsScored: 0 }, 'en')).toBe('Dimas: no activity this week.')
  })
})

describe('scheduled jobs', () => {
  it('sends the weekly summary on Sunday evening Jakarta time, once per parent', async () => {
    expect(isWeeklySummaryTime(new Date('2026-11-15T10:30:00Z'))).toBe(true) // Sun 17:30 WIB
    expect(isWeeklySummaryTime(new Date('2026-11-15T09:30:00Z'))).toBe(false) // Sun 16:30 WIB
    expect(isWeeklySummaryTime(new Date('2026-11-16T10:30:00Z'))).toBe(false) // Monday
    const parent = await mk(['parent'], { notifyWhatsApp: true, phone: '6281234567891' })
    await mk(['student'], { guardians: [parent.id] })
    expect(await runWeeklySummaries(payload, new Date('2026-11-16T10:30:00Z'))).toBe(0)
    const sunday = new Date('2026-11-15T10:30:00Z')
    expect(await runWeeklySummaries(payload, sunday)).toBeGreaterThanOrEqual(1)
    const got = await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: parent.id } }, { kind: { equals: 'weekly_summary' } }] } })
    expect(got.totalDocs).toBe(1)
    await runWeeklySummaries(payload, new Date(sunday.getTime() + 3_600_000))
    expect((await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: parent.id } }, { kind: { equals: 'weekly_summary' } }] } })).totalDocs).toBe(1)
  })

  it('reminds booked candidates once, a day before; the job endpoint needs the secret or a super admin', async () => {
    const s = await school()
    const cand = await mk(['student'], { school: s.id })
    const item = await payload.create({ collection: 'test-items', overrideAccess: true, data: { code: `C-${uniq()}`, type: 'single_choice', competency: 'DIS-1', level: 'smp', difficulty: '2', state: 'draft', stem: 'Q', options: [{ text: 'a', correct: true }, { text: 'b' }] } as never })
    const form = await payload.create({ collection: 'test-forms', overrideAccess: true, data: { name: `F ${uniq()}`, level: 'smp', status: 'active', timeLimitMinutes: 30, items: [item.id] } as never })
    const now = new Date()
    const session = await payload.create({ collection: 'test-sessions', overrideAccess: true, data: { title: 'Besok pagi', form: form.id, school: s.id, startsAt: new Date(now.getTime() + 20 * 3_600_000).toISOString(), location: 'Lab 1', seats: 5, status: 'open' } })
    await payload.create({ collection: 'bookings', overrideAccess: true, data: { session: session.id, candidate: cand.id, status: 'booked', priceIdr: 0 } })
    expect(await runTestReminders(payload, now)).toBeGreaterThanOrEqual(1)
    expect(await runTestReminders(payload, now)).toBe(0)
    const n = await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: cand.id } }, { kind: { equals: 'test_reminder' } }] } })
    expect(n.docs[0]?.body).toContain('Lab 1')

    expect((await call(runJobs as Ep, null)).status).toBe(403)
    expect((await call(runJobs as Ep, null, {}, { 'x-cron-secret': 'wrong-secret-wrong-secret' })).status).toBe(403)
    process.env.CRON_SECRET = 'a-long-test-cron-secret-123'
    expect((await call(runJobs as Ep, null, {}, { 'x-cron-secret': 'a-long-test-cron-secret-123' })).status).toBe(200)
    expect((await call(runJobs as Ep, await mk(['super_admin']))).status).toBe(200)
  })
})

describe('announcements', () => {
  it('reach the right school and roles, including parents through their children; school admins stay in their school', async () => {
    const [s1, s2] = await Promise.all([school(), school()])
    const parent = await mk(['parent'])
    const [admin, student, teacher, outsider] = await Promise.all([
      mk(['school_admin'], { school: s1.id }),
      mk(['student'], { school: s1.id, guardians: [parent.id] }),
      mk(['teacher'], { school: s1.id }),
      mk(['student'], { school: s2.id }),
    ])
    // A school admin tries to post platform-wide to another school: it is pinned to their own school.
    const a = await payload.create({ collection: 'announcements', overrideAccess: false, user: admin, data: { title: 'Libur', body: 'Sekolah libur Jumat.', scope: 'platform', school: s2.id, audience: ['student', 'parent'], notify: true, startsAt: new Date(Date.now() - 1000).toISOString() } })
    expect(a.scope).toBe('school')
    expect(typeof a.school === 'object' ? a.school?.id : a.school).toBe(s1.id)
    const ids = await audienceOf(payload, { scope: 'school', school: s1.id, audience: ['student', 'parent'] })
    expect(ids).toEqual(expect.arrayContaining([student.id, parent.id]))
    expect(ids).not.toContain(teacher.id)
    expect(ids).not.toContain(outsider.id)
    const titles = async (u: typeof student) => (await announcementsFor(payload, u, 'id')).map((x) => x.id)
    expect(await titles(student)).toContain(a.id)
    expect(await titles(parent)).toContain(a.id)
    expect(await titles(teacher)).not.toContain(a.id)
    expect(await titles(outsider)).not.toContain(a.id)
    // Notified straight away (once), in-app only.
    const n = await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: parent.id } }, { kind: { equals: 'announcement' } }] } })
    expect(n.totalDocs).toBe(1)
    // Other users cannot read or edit announcements directly.
    await expect(payload.find({ collection: 'announcements', overrideAccess: false, user: student })).rejects.toThrow()
    const otherAdmin = await mk(['school_admin'], { school: s2.id })
    await expect(payload.update({ collection: 'announcements', id: a.id, overrideAccess: false, user: otherAdmin, data: { title: 'x' } })).rejects.toThrow()
    // Expired announcements disappear.
    await payload.update({ collection: 'announcements', id: a.id, overrideAccess: true, data: { endsAt: new Date(Date.now() + 1000).toISOString() } })
    expect((await announcementsFor(payload, student, 'id', new Date(Date.now() + 5000))).map((x) => x.id)).not.toContain(a.id)
  })
})
