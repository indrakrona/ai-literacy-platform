import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { notify, renderNotification, NOTIFICATION_KINDS } from '../src/lib/notify'
import { Notifications } from '../src/collections/Notifications'
import { Reports } from '../src/collections/Reports'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

const person = (roles: string[], extra: Record<string, unknown> = {}) =>
  payload.create({ collection: 'users', overrideAccess: true, data: { name: `U ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required', ...extra } })

const endpoint = (c: typeof Notifications, path: string) => c.endpoints ? c.endpoints.find((e) => e.path === path)! : null!
async function call(c: typeof Notifications, path: string, user: unknown, body: unknown) {
  const res = await endpoint(c, path).handler({ payload, user, json: async () => body, headers: new Headers() } as unknown as PayloadRequest)
  return { status: res.status, data: (await res.json()) as Record<string, unknown> }
}
const mine = async (userId: number) => (await payload.find({ collection: 'notifications', overrideAccess: true, where: { user: { equals: userId } }, sort: '-createdAt' })).docs

describe('notifications', () => {
  it('has every message in Bahasa and English with placeholders filled', () => {
    for (const k of NOTIFICATION_KINDS) {
      for (const l of ['id', 'en'] as const) {
        const t = renderNotification(k, l, { lesson: 'L', class: 'C', due: 'D', students: 'S', brief: 'B', total: 1, max: 2, reason: 'R', target: 'T' })
        expect(t.title.length).toBeGreaterThan(3)
        expect(`${t.title} ${t.body}`).not.toMatch(/\{\w+\}/)
      }
    }
    expect(renderNotification('project_graded', 'id', { brief: 'Poster', total: 14, max: 16 }).body).toContain('14/16')
  })

  it('writes each user in their own language, and only they can read and clear it', async () => {
    const [a, b] = await Promise.all([person(['student'], { preferredLocale: 'en' }), person(['student'])])
    expect(await notify(payload, { userIds: [a.id, b.id, null], kind: 'consent_granted', link: '/beranda' })).toBe(2)
    expect((await mine(a.id))[0]!.title).toBe('Parent permission granted')
    expect((await mine(b.id))[0]!.title).toBe('Izin orang tua sudah diberikan')
    const seenByB = await payload.find({ collection: 'notifications', overrideAccess: false, user: b, where: { user: { equals: a.id } } })
    expect(seenByB.docs).toHaveLength(0)
    expect((await call(Notifications, '/read', b, {})).data.updated).toBe(1)
    expect((await mine(a.id))[0]!.readAt).toBeFalsy()
    expect((await mine(b.id))[0]!.readAt).toBeTruthy()
  })

  it('notifies students when their teacher assigns a lesson', async () => {
    const [teacher, student] = await Promise.all([person(['teacher']), person(['student'])])
    const school = await payload.create({ collection: 'schools', overrideAccess: true, data: { name: `S ${uniq()}`, npsn: uniq(), level: 'sma' } as never })
    const klass = await payload.create({ collection: 'classes', overrideAccess: true, data: { name: 'XI N', school: school.id, academicYear: '2026/2027', teachers: [teacher.id], students: [student.id] } })
    const lesson = (await payload.find({ collection: 'lessons', overrideAccess: true, limit: 1, depth: 0, draft: true })).docs[0]!
    await payload.create({ collection: 'assignments', overrideAccess: false, user: teacher, data: { class: klass.id, lesson: lesson.id, dueDate: '2026-12-01' } })
    const n = (await mine(student.id))[0]!
    expect(n.kind).toBe('assignment_new')
    expect(n.title).toContain(lesson.title)
    expect(n.link).toMatch(/^\/belajar\//)
  })
})

describe('report a problem', () => {
  it('redacts personal data, notifies the content team and limits abuse', async () => {
    const [student, editor] = await Promise.all([person(['student']), person(['content_editor'])])
    const bad = await call(Reports as never, '/submit', student, { targetType: 'lesson', reason: 'nope' })
    expect(bad.status).toBe(400)
    const ok = await call(Reports as never, '/submit', student, { targetType: 'ai_reply', targetId: '12:3', url: '/lab/x', reason: 'wrong', details: 'Jawabannya salah. Hubungi saya di 081234567890' })
    expect(ok.status).toBe(201)
    const doc = await payload.findByID({ collection: 'reports', id: ok.data.id as number, overrideAccess: true })
    expect(doc.details).not.toContain('081234567890')
    expect(doc.details).toContain('[phone]')
    expect((await mine(editor.id)).some((n) => n.kind === 'report_received')).toBe(true)
    // the student sees their own report, not others'
    const other = await person(['student'])
    expect((await payload.find({ collection: 'reports', overrideAccess: false, user: other, where: { id: { equals: doc.id } } })).docs).toHaveLength(0)
    for (let i = 0; i < 9; i++) await call(Reports as never, '/submit', student, { targetType: 'page', reason: 'broken' })
    expect((await call(Reports as never, '/submit', student, { targetType: 'page', reason: 'broken' })).status).toBe(429)
  })
})
