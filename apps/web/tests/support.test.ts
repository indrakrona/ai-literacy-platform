import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { SupportTickets, visibleMessages } from '../src/collections/Support'
import { seedHelpArticles } from '../src/seed/help-articles'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`
const mk = (roles: string[]) => payload.create({ collection: 'users', overrideAccess: true, data: { name: `U ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required' } })
type Ep = { path: string; handler: (r: PayloadRequest) => Promise<Response> }
const call = async (path: string, user: unknown, body: unknown = {}, routeParams: Record<string, unknown> = {}) => {
  const ep = (SupportTickets.endpoints as Ep[]).find((e) => e.path === path)!
  const res = await ep.handler({ payload, user, json: async () => body, routeParams, headers: new Headers() } as unknown as PayloadRequest)
  return { status: res.status, data: (await res.json()) as Record<string, unknown> }
}

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('help centre', () => {
  it('seeds bilingual articles once and hides unpublished ones from the public', async () => {
    const first = await seedHelpArticles(payload)
    expect(first.total).toBeGreaterThanOrEqual(10)
    expect((await seedHelpArticles(payload)).created).toBe(0)
    const en = await payload.find({ collection: 'help-articles', locale: 'en', where: { slug: { equals: 'tes-ailis' } } })
    expect(en.docs[0]?.title).toBe('About the AILIS test')
    const hidden = await payload.create({ collection: 'help-articles', overrideAccess: true, data: { slug: `h-${uniq()}`, title: 'Draf', category: 'students', body: 'x', published: false } as never })
    expect((await payload.find({ collection: 'help-articles', overrideAccess: false, where: { id: { equals: hidden.id } } })).totalDocs).toBe(0)
  })
})

describe('support tickets', () => {
  it('lets guests and users ask, the team answer (with private notes), and keeps tickets private', async () => {
    const [admin, student, other] = await Promise.all([mk(['super_admin']), mk(['student']), mk(['student'])])
    // Guests need an email; bots filling the honeypot get a fake success and no ticket.
    expect((await call('/open', null, { subject: 'Lupa sandi', message: 'Saya tidak bisa masuk sejak kemarin.' })).status).toBe(400)
    const before = (await payload.count({ collection: 'support-tickets', overrideAccess: true })).totalDocs
    expect((await call('/open', null, { subject: 'Spam', message: 'Buy cheap things now!!', email: 'b@x.test', website: 'http://spam' })).status).toBe(201)
    expect((await payload.count({ collection: 'support-tickets', overrideAccess: true })).totalDocs).toBe(before)
    const guestEmail = `g${uniq()}@example.test`
    for (let i = 0; i < 3; i++) expect((await call('/open', null, { subject: `Tanya ${i}`, message: 'Bagaimana cara mendaftar sekolah?', email: guestEmail })).status).toBe(201)
    expect((await call('/open', null, { subject: 'Tanya 4', message: 'Bagaimana cara mendaftar sekolah?', email: guestEmail })).status).toBe(429)

    const opened = await call('/open', student, { subject: 'AI Lab tidak terbuka', message: 'Tombol AI Lab abu-abu terus.', category: 'learning' })
    expect(opened.status).toBe(201)
    const tid = opened.data.id as number
    expect((await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: admin.id } }, { kind: { equals: 'ticket_new' } }] } })).totalDocs).toBeGreaterThanOrEqual(1)

    // Private to the requester and the team.
    expect((await payload.find({ collection: 'support-tickets', overrideAccess: false, user: other, where: { id: { equals: tid } } })).totalDocs).toBe(0)
    expect((await call('/:id/reply', other, { message: 'halo' }, { id: tid })).status).toBe(404)

    // Team: an internal note, then a reply that reaches the student.
    expect((await call('/:id/reply', admin, { message: 'Cek izin orang tua', internal: true }, { id: tid })).status).toBe(200)
    expect((await call('/:id/reply', admin, { message: 'Izin orang tuamu masih menunggu. Kirim ulang tautannya dari halaman Akun.' }, { id: tid })).status).toBe(200)
    const t = await payload.findByID({ collection: 'support-tickets', id: tid, overrideAccess: true })
    expect(t.status).toBe('waiting')
    expect(visibleMessages(t.messages, false).map((m) => m.body)).not.toContain('Cek izin orang tua')
    expect(visibleMessages(t.messages, true)).toHaveLength(3)
    expect((await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: student.id } }, { kind: { equals: 'ticket_reply' } }] } })).totalDocs).toBe(1)

    // The student replies (back to the team), then closes it; only the team may set "waiting".
    expect((await call('/:id/reply', student, { message: 'Terima kasih, sudah bisa.' }, { id: tid })).status).toBe(200)
    expect((await payload.findByID({ collection: 'support-tickets', id: tid, overrideAccess: true })).status).toBe('open')
    expect((await call('/:id/status', student, { status: 'waiting' }, { id: tid })).status).toBe(403)
    expect((await call('/:id/status', student, { status: 'resolved' }, { id: tid })).status).toBe(200)
    expect((await payload.findByID({ collection: 'support-tickets', id: tid, overrideAccess: true })).resolvedAt).toBeTruthy()
  })
})
