import type { Access, CollectionConfig, Endpoint, PayloadRequest, Where } from 'payload'
import { hasRole } from '@ailit/shared'
import { roles } from '../access'
import { notify } from '../lib/notify'
import { audit, ipOf } from '../lib/audit'
import { escapeHtml } from '../lib/emails'

/**
 * Help centre (spec M1) and support tickets (M2). Articles are written in the CMS in both languages; tickets
 * can be opened by anyone (guests leave an email), answered by the AI Literacy team, and closed by either side.
 */
export const HELP_CATEGORIES = [
  { value: 'getting_started', id: 'Memulai', en: 'Getting started' },
  { value: 'students', id: 'Siswa', en: 'Students' },
  { value: 'teachers', id: 'Guru', en: 'Teachers' },
  { value: 'parents', id: 'Orang tua', en: 'Parents' },
  { value: 'schools', id: 'Sekolah', en: 'Schools' },
  { value: 'tests', id: 'Tes AILIS', en: 'AILIS tests' },
  { value: 'privacy', id: 'Privasi dan data', en: 'Privacy and data' },
] as const

export const TICKET_CATEGORIES = [
  { value: 'account', id: 'Akun dan masuk', en: 'Account and sign-in' },
  { value: 'learning', id: 'Pelajaran dan AI Lab', en: 'Lessons and AI Lab' },
  { value: 'test', id: 'Tes AILIS dan sertifikat', en: 'AILIS tests and certificates' },
  { value: 'school', id: 'Sekolah dan lisensi', en: 'School and licence' },
  { value: 'privacy', id: 'Privasi dan data', en: 'Privacy and data' },
  { value: 'other', id: 'Lainnya', en: 'Something else' },
] as const

export const TICKET_STATUS: Record<string, { id: string; en: string }> = {
  open: { id: 'Menunggu tim', en: 'With our team' },
  waiting: { id: 'Menunggu balasan Anda', en: 'Waiting for you' },
  resolved: { id: 'Selesai', en: 'Resolved' },
}

export const HelpArticles: CollectionConfig = {
  slug: 'help-articles',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'category', 'order', 'published'], group: 'Communication' },
  access: {
    read: ({ req }) => (hasRole(req.user as { roles?: string[] } | null, 'content_editor', 'content_reviewer', 'super_admin') ? true : { published: { equals: true } }),
    create: roles('content_editor', 'content_reviewer', 'super_admin'),
    update: roles('content_editor', 'content_reviewer', 'super_admin'),
    delete: roles('super_admin'),
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'category', type: 'select', required: true, options: HELP_CATEGORIES.map((c) => ({ value: c.value, label: c.id })) },
        { name: 'order', type: 'number', defaultValue: 10 },
        { name: 'published', type: 'checkbox', defaultValue: true },
      ],
    },
    { name: 'summary', type: 'textarea', localized: true, admin: { description: 'One sentence shown in lists and search results' } },
    { name: 'body', type: 'textarea', required: true, localized: true, admin: { description: 'Plain text. Blank lines start new paragraphs; lines starting with "- " become a list.' } },
  ],
}

// ---------- Tickets ----------

type U = { id: number; name?: string; email?: string; roles?: string[] } | null
const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
const bad = (error: string, status = 400) => Response.json({ error }, { status })
const isStaff = (u: U) => hasRole(u, 'super_admin')

async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    return ((req.json ? await req.json() : {}) ?? {}) as Record<string, unknown>
  } catch {
    return {}
  }
}

const staffIds = async (req: PayloadRequest) => (await req.payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 20, where: { roles: { contains: 'super_admin' } } })).docs.map((u) => u.id)

/** POST /api/support-tickets/open {subject, message, category, email?, name?, website?} */
const openTicket: Endpoint = {
  path: '/open',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    const b = await body(req)
    if (b.website) return Response.json({ id: 0 }, { status: 201 }) // honeypot: pretend it worked
    const subject = String(b.subject ?? '').trim().slice(0, 140)
    const message = String(b.message ?? '').trim().slice(0, 5000)
    const category = TICKET_CATEGORIES.some((c) => c.value === b.category) ? String(b.category) : 'other'
    const email = u ? u.email : String(b.email ?? '').trim().toLowerCase()
    if (subject.length < 4) return bad('subject: at least 4 characters')
    if (message.length < 10) return bad('message: at least 10 characters')
    if (!u && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? '')) return bad('email: needed so we can reply')
    if (!u) {
      const since = new Date(Date.now() - 86_400_000).toISOString()
      const recent = await req.payload.count({ collection: 'support-tickets', overrideAccess: true, where: { and: [{ guestEmail: { equals: email } }, { createdAt: { greater_than: since } }] } })
      if (recent.totalDocs >= 3) return bad('Too many tickets today; we will reply to the ones you sent', 429)
    }
    const t = await req.payload.create({
      collection: 'support-tickets',
      overrideAccess: true,
      data: { subject, category: category as never, status: 'open', requester: u?.id, guestEmail: u ? undefined : email, guestName: u ? undefined : String(b.name ?? '').slice(0, 80) || undefined, messages: [{ body: message, by: u?.id, fromStaff: false, at: new Date().toISOString() }], lastActivityAt: new Date().toISOString() },
    })
    await notify(req.payload, { userIds: await staffIds(req), kind: 'ticket_new', vars: { subject, who: u?.name ?? email ?? '', category }, link: `/bantuan/tiket/${t.id}`, email: false })
    return Response.json({ id: t.id }, { status: 201 })
  },
}

async function loadTicket(req: PayloadRequest) {
  return req.payload.findByID({ collection: 'support-tickets', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
}

/** POST /api/support-tickets/:id/reply {message, internal?} — the requester or the team. */
const reply: Endpoint = {
  path: '/:id/reply',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    const t = await loadTicket(req)
    if (!t) return bad('Not found', 404)
    const staff = isStaff(u)
    if (!staff && idOf(t.requester) !== u.id) return bad('Not found', 404)
    const b = await body(req)
    const message = String(b.message ?? '').trim().slice(0, 5000)
    if (message.length < 2) return bad('message: write something')
    const internal = staff && b.internal === true
    const messages = [...(t.messages ?? []), { body: message, by: u.id, fromStaff: staff, internal, at: new Date().toISOString() }]
    const status = internal ? t.status : staff ? 'waiting' : 'open'
    await req.payload.update({ collection: 'support-tickets', id: t.id, overrideAccess: true, data: { messages, status, lastActivityAt: new Date().toISOString() } })
    if (staff && !internal) {
      const excerpt = message.replace(/\s+/g, ' ').slice(0, 160)
      if (t.requester) await notify(req.payload, { userIds: [idOf(t.requester)], kind: 'ticket_reply', vars: { subject: t.subject, excerpt }, link: `/bantuan/tiket/${t.id}` })
      else if (t.guestEmail) {
        await req.payload
          .sendEmail({ to: t.guestEmail, subject: `Re: ${t.subject}`, html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#16130F;max-width:560px"><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p><p style="color:#6B655D;font-size:13px">Tim AI Literacy · Impact Thinklab<br>Balas email ini untuk melanjutkan. / Reply to this email to continue.</p></div>` })
          .catch((e: Error) => req.payload.logger.warn(`ticket reply email failed: ${e.message}`))
      }
    } else if (!staff) {
      await notify(req.payload, { userIds: await staffIds(req), kind: 'ticket_new', vars: { subject: `Re: ${t.subject}`, who: u.name ?? '', category: t.category }, link: `/bantuan/tiket/${t.id}`, email: false })
    }
    return Response.json({ ok: true })
  },
}

/** POST /api/support-tickets/:id/status {status} — the team sets any status; the requester can close or reopen. */
const setStatus: Endpoint = {
  path: '/:id/status',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    const t = await loadTicket(req)
    if (!t) return bad('Not found', 404)
    const staff = isStaff(u)
    if (!staff && idOf(t.requester) !== u.id) return bad('Not found', 404)
    const { status } = await body(req)
    const allowed = staff ? ['open', 'waiting', 'resolved'] : ['resolved', 'open']
    if (!allowed.includes(String(status))) return bad('Not allowed', 403)
    await req.payload.update({ collection: 'support-tickets', id: t.id, overrideAccess: true, data: { status: status as 'open', resolvedAt: status === 'resolved' ? new Date().toISOString() : null, lastActivityAt: new Date().toISOString() } })
    if (staff) await audit(req.payload, { actor: u.id, action: 'ticket_status', collection: 'support-tickets', docId: t.id, summary: String(status), ip: ipOf(req) })
    return Response.json({ ok: true })
  },
}

const readTickets: Access = ({ req }) => {
  const u = req.user as U
  if (!u) return false
  if (isStaff(u)) return true
  const w: Where = { requester: { equals: u.id } }
  return w
}

export const SupportTickets: CollectionConfig = {
  slug: 'support-tickets',
  admin: { useAsTitle: 'subject', defaultColumns: ['subject', 'category', 'status', 'lastActivityAt'], group: 'Communication', hidden: ({ user }) => !hasRole(user as { roles?: string[] }, 'super_admin') },
  access: { read: readTickets, create: () => false, update: () => false, delete: roles('super_admin') },
  endpoints: [openTicket, reply, setStatus],
  fields: [
    { name: 'subject', type: 'text', required: true },
    { name: 'category', type: 'select', required: true, options: TICKET_CATEGORIES.map((c) => ({ value: c.value, label: c.en })) },
    { name: 'status', type: 'select', required: true, defaultValue: 'open', index: true, options: [{ value: 'open', label: 'Open (needs the team)' }, { value: 'waiting', label: 'Waiting for the requester' }, { value: 'resolved', label: 'Resolved' }] },
    { name: 'requester', type: 'relationship', relationTo: 'users', index: true },
    { name: 'guestEmail', type: 'email', index: true },
    { name: 'guestName', type: 'text' },
    {
      name: 'messages',
      type: 'array',
      fields: [
        { name: 'body', type: 'textarea', required: true },
        { name: 'by', type: 'relationship', relationTo: 'users' },
        { name: 'fromStaff', type: 'checkbox' },
        { name: 'internal', type: 'checkbox', admin: { description: 'Team-only note, never shown to the requester' } },
        { name: 'at', type: 'date', required: true },
      ],
    },
    { name: 'lastActivityAt', type: 'date', index: true },
    { name: 'resolvedAt', type: 'date' },
  ],
}

/** What the requester may see of a ticket (team-only notes removed). */
export function visibleMessages<T extends { internal?: boolean | null }>(messages: T[] | null | undefined, staff: boolean): T[] {
  return (messages ?? []).filter((m) => staff || !m.internal)
}
