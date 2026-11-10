import type { Endpoint, PayloadRequest } from 'payload'
import { hasRole, normalizeIdPhone } from '@ailit/shared'
import { linkGuardian, parentCode, PARENT_CODE_DAYS, resolveChildLink } from '../lib/parents'
import { notify } from '../lib/notify'
import { audit, ipOf } from '../lib/audit'
import { runScheduledJobs } from '../lib/jobs'

const bad = (error: string, status = 400, problem?: string) => Response.json({ error, problem }, { status })
type U = { id: number; name?: string; roles?: string[] } | null

async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    return ((req.json ? await req.json() : {}) ?? {}) as Record<string, unknown>
  } catch {
    return {}
  }
}

async function linkAndTell(req: PayloadRequest, childId: number, parent: { id: number; name?: string }, via: string) {
  await linkGuardian(req.payload, childId, parent.id)
  await notify(req.payload, { userIds: [childId], kind: 'child_linked', vars: { parent: parent.name ?? '' }, link: '/akun', email: false })
  await audit(req.payload, { actor: parent.id, action: 'link_child', collection: 'users', docId: childId, summary: `via ${via}`, ip: ipOf(req) })
}

/**
 * POST /api/users/parent-signup {name, email, password, phone?, locale?, token? | code?}
 * Creates a parent account and links it to the child named by a granted consent link or a child's code.
 */
export const parentSignup: Endpoint = {
  path: '/parent-signup',
  method: 'post',
  handler: async (req) => {
    const b = await body(req)
    const name = String(b.name ?? '').trim()
    const email = String(b.email ?? '').trim().toLowerCase()
    const password = String(b.password ?? '')
    if (name.length < 2) return bad('name: at least 2 characters')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad('email: not a valid address')
    if (password.length < 8) return bad('password: at least 8 characters')
    const phone = b.phone ? normalizeIdPhone(String(b.phone)) : null
    if (b.phone && !phone) return bad('phone: use an Indonesian mobile number, e.g. 0812…')
    const link = await resolveChildLink(req.payload, { token: b.token ? String(b.token) : null, code: b.code ? String(b.code) : null })
    if ('problem' in link) return bad(link.problem, 400, link.problem)
    const exists = await req.payload.find({ collection: 'users', overrideAccess: true, limit: 1, depth: 0, where: { email: { equals: email } } })
    if (exists.docs.length) return bad('email: an account with this email already exists — sign in and link your child from the parent page', 409, 'email_exists')
    const parent = await req.payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { name, email, password, roles: ['parent'], consentStatus: 'not_required', preferredLocale: b.locale === 'en' ? 'en' : 'id', phone: phone ?? undefined, notifyWhatsApp: Boolean(phone) },
    })
    await linkAndTell(req, link.childId, parent, link.via)
    return Response.json({ id: parent.id }, { status: 201 })
  },
}

/** POST /api/users/link-child {token? | code?} — a signed-in parent links another child. */
export const linkChild: Endpoint = {
  path: '/link-child',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    if (!hasRole(u, 'parent')) return bad('not_parent', 403, 'not_parent')
    const b = await body(req)
    const link = await resolveChildLink(req.payload, { token: b.token ? String(b.token) : null, code: b.code ? String(b.code) : null })
    if ('problem' in link) return bad(link.problem, 400, link.problem)
    if (link.childId === u.id) return bad('link_invalid', 400, 'link_invalid')
    await linkAndTell(req, link.childId, u, link.via)
    return Response.json({ childId: link.childId })
  },
}

/** POST /api/users/parent-code — a student makes a one-week code their parent can use to connect. */
export const makeParentCode: Endpoint = {
  path: '/parent-code',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    if (!hasRole(u, 'student', 'candidate')) return bad('Only students can create a parent code', 403)
    const expiresAt = new Date(Date.now() + PARENT_CODE_DAYS * 86_400_000).toISOString()
    for (let i = 0; i < 5; i++) {
      const code = parentCode()
      const clash = await req.payload.count({ collection: 'users', overrideAccess: true, where: { parentLinkCode: { equals: code } } })
      if (clash.totalDocs) continue
      await req.payload.update({ collection: 'users', id: u.id, overrideAccess: true, data: { parentLinkCode: code, parentLinkExpiresAt: expiresAt } as never })
      return Response.json({ code, expiresAt })
    }
    return bad('Try again', 503)
  },
}

/** POST /api/users/unlink-guardian {childId?, parentId?} — a parent removes a child, or a child (18+) removes a parent. */
export const unlinkGuardian: Endpoint = {
  path: '/unlink-guardian',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as (U & { consentStatus?: string }) | null
    if (!u) return bad('Sign in first', 401)
    const b = await body(req)
    const childId = hasRole(u, 'parent') ? Number(b.childId) : u.id
    const parentId = hasRole(u, 'parent') ? u.id : Number(b.parentId)
    // Minors cannot remove a parent's view themselves; the school or the AI Literacy team can.
    if (!hasRole(u, 'parent') && u.consentStatus !== 'not_required') return bad('Ask your school to change this', 403)
    const child = await req.payload.findByID({ collection: 'users', id: childId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!child) return bad('Not found', 404)
    const ids = (child.guardians ?? []).map((g) => (typeof g === 'object' ? g.id : g))
    if (!ids.includes(parentId)) return bad('Not linked', 404)
    await req.payload.update({ collection: 'users', id: childId, overrideAccess: true, data: { guardians: ids.filter((x) => x !== parentId) } })
    await audit(req.payload, { actor: u.id, action: 'unlink_guardian', collection: 'users', docId: childId, summary: `parent ${parentId}`, ip: ipOf(req) })
    return Response.json({ ok: true })
  },
}

/**
 * POST /api/jobs/run — hourly scheduled jobs (reminders, weekly summaries, due announcements).
 * Called by the scheduler with the header x-cron-secret: $CRON_SECRET, or by a super admin
 * (who may add {"forceWeekly": true} to send the weekly summary now).
 */
export const runJobs: Endpoint = {
  path: '/jobs/run',
  method: 'post',
  handler: async (req) => {
    const secret = process.env.CRON_SECRET
    const byCron = Boolean(secret && secret.length >= 16 && req.headers.get('x-cron-secret') === secret)
    const byAdmin = hasRole(req.user as U, 'super_admin')
    if (!byCron && !byAdmin) return bad('Not allowed', 403)
    const b = byAdmin ? await body(req) : {}
    const result = await runScheduledJobs(req.payload, new Date(), { forceWeekly: byAdmin && b.forceWeekly === true })
    if (byAdmin) await audit(req.payload, { actor: (req.user as unknown as U)!.id, action: 'run_jobs', summary: JSON.stringify(result), ip: ipOf(req) })
    return Response.json(result)
  },
}
