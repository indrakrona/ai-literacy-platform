import type { Access, CollectionConfig, Endpoint, PayloadRequest, Where } from 'payload'
import { hasRole } from '@ailit/shared'
import { dueDate, eraseUser, exportUserData } from '../lib/data-rights'
import { isGuardianOf } from '../lib/parents'
import { notify } from '../lib/notify'
import { audit, ipOf } from '../lib/audit'

const bad = (error: string, status = 400) => Response.json({ error }, { status })
const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
type U = { id: number; name?: string; roles?: string[]; consentStatus?: string } | null

async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    return ((req.json ? await req.json() : {}) ?? {}) as Record<string, unknown>
  } catch {
    return {}
  }
}

async function requestDays(req: PayloadRequest): Promise<number> {
  const s = (await req.payload.findGlobal({ slug: 'platform-settings', overrideAccess: true }).catch(() => null)) as { dataRequestDays?: number | null } | null
  return s?.dataRequestDays ?? 3
}

const superAdmins = async (req: PayloadRequest) =>
  (await req.payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 20, where: { roles: { contains: 'super_admin' } } })).docs.map((u) => u.id)

/** GET /api/data-requests/export — download everything held about me as JSON (logged). */
const exportMine: Endpoint = {
  path: '/export',
  method: 'get',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    const data = await exportUserData(req.payload, u.id)
    const now = new Date()
    await req.payload.create({ collection: 'data-requests', overrideAccess: true, data: { user: u.id, requestedBy: u.id, type: 'access', status: 'done', dueAt: now.toISOString(), resolvedAt: now.toISOString(), note: 'Downloaded by the account holder' } })
    await audit(req.payload, { actor: u.id, action: 'data_export', collection: 'users', docId: u.id, ip: ipOf(req) })
    return new Response(JSON.stringify(data, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="ai-literacy-data-${u.id}.json"`, 'Cache-Control': 'private, no-store' },
    })
  },
}

/** POST /api/data-requests/delete {reason?, childId?} — ask for my (or my child's) account to be deleted. */
const requestDeletion: Endpoint = {
  path: '/delete',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    const b = await body(req)
    let target = u.id
    if (b.childId) {
      if (!hasRole(u, 'parent') || !(await isGuardianOf(req.payload, u.id, Number(b.childId)))) return bad('Not your child', 403)
      target = Number(b.childId)
    }
    const open = await req.payload.count({ collection: 'data-requests', overrideAccess: true, where: { and: [{ user: { equals: target } }, { type: { equals: 'deletion' } }, { status: { equals: 'open' } }] } })
    if (open.totalDocs) return bad('A deletion request is already open', 409)
    const now = new Date()
    const doc = await req.payload.create({
      collection: 'data-requests',
      overrideAccess: true,
      data: { user: target, requestedBy: u.id, type: 'deletion', status: 'open', reason: String(b.reason ?? '').slice(0, 1000) || undefined, dueAt: dueDate(now, await requestDays(req)).toISOString() },
    })
    await audit(req.payload, { actor: u.id, action: 'data_deletion_requested', collection: 'users', docId: target, ip: ipOf(req) })
    await notify(req.payload, { userIds: await superAdmins(req), kind: 'data_request', vars: { due: new Date(doc.dueAt).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) }, link: '/operasi?tab=data' })
    return Response.json({ id: doc.id, dueAt: doc.dueAt }, { status: 201 })
  },
}

/** POST /api/data-requests/:id/cancel — the person who asked changes their mind. */
const cancel: Endpoint = {
  path: '/:id/cancel',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    const r = await req.payload.findByID({ collection: 'data-requests', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!r || (idOf(r.requestedBy) !== u.id && idOf(r.user) !== u.id)) return bad('Not found', 404)
    if (r.status !== 'open') return bad('This request is already closed', 409)
    await req.payload.update({ collection: 'data-requests', id: r.id, overrideAccess: true, data: { status: 'cancelled', resolvedAt: new Date().toISOString() } })
    return Response.json({ ok: true })
  },
}

/** POST /api/data-requests/:id/process {action: 'erase' | 'reject', note} — super admin carries out or refuses a deletion. */
const processRequest: Endpoint = {
  path: '/:id/process',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!hasRole(u, 'super_admin')) return bad('Not allowed', 403)
    const b = await body(req)
    const r = await req.payload.findByID({ collection: 'data-requests', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!r) return bad('Not found', 404)
    if (r.status !== 'open' || r.type !== 'deletion') return bad('Only open deletion requests can be processed', 409)
    const note = String(b.note ?? '').trim().slice(0, 1000)
    const target = idOf(r.user)!
    if (target === u!.id) return bad('You cannot erase your own account here', 409)
    if (b.action === 'reject') {
      if (note.length < 5) return bad('Explain why (at least 5 characters)')
      await req.payload.update({ collection: 'data-requests', id: r.id, overrideAccess: true, data: { status: 'rejected', note, resolvedAt: new Date().toISOString(), resolvedBy: u!.id } })
      await audit(req.payload, { actor: u!.id, action: 'data_deletion_rejected', collection: 'users', docId: target, summary: note, ip: ipOf(req) })
      return Response.json({ ok: true })
    }
    if (b.action !== 'erase') return bad('action must be erase or reject')
    const counts = await eraseUser(req.payload, target)
    await req.payload.update({ collection: 'data-requests', id: r.id, overrideAccess: true, data: { status: 'done', note: note || undefined, resolvedAt: new Date().toISOString(), resolvedBy: u!.id } })
    await audit(req.payload, { actor: u!.id, action: 'data_erased', collection: 'users', docId: target, summary: Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', '), ip: ipOf(req) })
    return Response.json({ ok: true, counts })
  },
}

/**
 * POST /api/data-requests/withdraw-consent {childId? | token?} — a parent withdraws permission (signed-in parent
 * account, or the original consent link). The child keeps reading lessons; AI Lab, projects and tests stop.
 */
const withdrawConsent: Endpoint = {
  path: '/withdraw-consent',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    const b = await body(req)
    let childId: number | null = null
    let request: { id: number } | null = null
    if (b.token) {
      const r = (await req.payload.find({ collection: 'consent-requests', overrideAccess: true, depth: 0, limit: 1, where: { token: { equals: String(b.token) } } })).docs[0]
      if (!r || r.status !== 'granted') return bad('This permission is not active', 409)
      childId = idOf(r.student)
      request = r
    } else if (b.childId && u && hasRole(u, 'parent') && (await isGuardianOf(req.payload, u.id, Number(b.childId)))) {
      childId = Number(b.childId)
      request = (await req.payload.find({ collection: 'consent-requests', overrideAccess: true, depth: 0, limit: 1, sort: '-decidedAt', where: { and: [{ student: { equals: childId } }, { status: { equals: 'granted' } }] } })).docs[0] ?? null
    } else return bad('Not allowed', 403)
    const child = await req.payload.findByID({ collection: 'users', id: childId!, depth: 0, overrideAccess: true }).catch(() => null)
    if (!child || child.consentStatus !== 'granted') return bad('This permission is not active', 409)
    const now = new Date().toISOString()
    if (request) await req.payload.update({ collection: 'consent-requests', id: request.id, overrideAccess: true, data: { status: 'withdrawn', withdrawnAt: now } as never })
    await req.payload.update({ collection: 'users', id: child.id, overrideAccess: true, data: { consentStatus: 'declined' } })
    await notify(req.payload, { userIds: [child.id], kind: 'consent_withdrawn', link: '/beranda', email: false })
    await audit(req.payload, { actor: u?.id ?? null, action: 'consent_withdrawn', collection: 'users', docId: child.id, summary: u ? 'by parent account' : 'via consent link', ip: ipOf(req) })
    return Response.json({ ok: true })
  },
}

const readRequests: Access = ({ req }) => {
  const u = req.user as U
  if (!u) return false
  if (hasRole(u, 'super_admin')) return true
  const w: Where = { or: [{ user: { equals: u.id } }, { requestedBy: { equals: u.id } }] }
  return w
}

export const DataRequests: CollectionConfig = {
  slug: 'data-requests',
  admin: { defaultColumns: ['user', 'type', 'status', 'dueAt', 'createdAt'], group: 'Operations', hidden: ({ user }) => !hasRole(user as { roles?: string[] }, 'super_admin') },
  access: { read: readRequests, create: () => false, update: () => false, delete: () => false },
  endpoints: [exportMine, requestDeletion, cancel, processRequest, withdrawConsent],
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'requestedBy', type: 'relationship', relationTo: 'users' },
    { name: 'type', type: 'select', required: true, options: [{ value: 'access', label: 'Access (download)' }, { value: 'deletion', label: 'Deletion' }] },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      index: true,
      options: ['open', 'done', 'rejected', 'cancelled'].map((v) => ({ value: v, label: v })),
    },
    { name: 'reason', type: 'textarea' },
    { name: 'dueAt', type: 'date', required: true, index: true },
    { name: 'resolvedAt', type: 'date' },
    { name: 'resolvedBy', type: 'relationship', relationTo: 'users' },
    { name: 'note', type: 'textarea' },
  ],
}
