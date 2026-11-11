import type { Access, CollectionConfig, Endpoint, PayloadRequest } from 'payload'
import { hasRole } from '@ailit/shared'
import { COURSE_MODULES, CERT_VALIDITY_YEARS, RETRY_AFTER_MINUTES, scoreExam } from '../lib/teacher-course'
import { teacherCertificateCode, teacherCertificatePdf } from '../lib/teacher-certificate'
import { statusOf } from '../lib/certificates'
import { audit, ipOf } from '../lib/audit'

const bad = (error: string, status = 400, extra: Record<string, unknown> = {}) => Response.json({ error, ...extra }, { status })
type U = { id: number; roles?: string[]; name?: string } | null
const MAY_TRAIN = ['teacher', 'school_admin', 'super_admin'] as const
const mayTrain = (u: U) => Boolean(u && hasRole(u, ...MAY_TRAIN))

/** A teacher reads their own record; super admins read all. */
const readOwn: Access = ({ req }) => {
  const u = req.user as U
  if (!u) return false
  if (hasRole(u, 'super_admin')) return true
  return { user: { equals: u.id } }
}

async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    return ((await req.json?.()) as Record<string, unknown>) ?? {}
  } catch {
    return {}
  }
}

/** The caller's record, created on first use. */
export async function recordFor(req: PayloadRequest, userId: number) {
  const found = (await req.payload.find({ collection: 'teacher-certifications', overrideAccess: true, depth: 0, limit: 1, where: { user: { equals: userId } } })).docs[0]
  return found ?? req.payload.create({ collection: 'teacher-certifications', overrideAccess: true, data: { user: userId, modulesDone: [], attempts: [] } })
}

/** POST /api/teacher-certifications/module {module} — mark a module as studied. */
const completeModule: Endpoint = {
  path: '/module',
  method: 'post',
  handler: async (req) => {
    const u = req.user as U
    if (!mayTrain(u)) return bad('For teachers only', 403)
    const key = String((await body(req)).module ?? '')
    if (!COURSE_MODULES.some((m) => m.key === key)) return bad('Unknown module')
    const rec = await recordFor(req, u!.id)
    const done = new Set((rec.modulesDone as string[] | null) ?? [])
    done.add(key)
    const modulesDone = COURSE_MODULES.map((m) => m.key).filter((k) => done.has(k))
    await req.payload.update({ collection: 'teacher-certifications', id: rec.id, overrideAccess: true, data: { modulesDone } })
    return Response.json({ ok: true, modulesDone })
  },
}

/** POST /api/teacher-certifications/exam {answers} — scored here; the browser never receives the key. */
const takeExam: Endpoint = {
  path: '/exam',
  method: 'post',
  handler: async (req) => {
    const u = req.user as U
    if (!mayTrain(u)) return bad('For teachers only', 403)
    const rec = await recordFor(req, u!.id)
    if (rec.code && rec.status !== 'revoked') return bad('Already certified', 409)
    const done = new Set((rec.modulesDone as string[] | null) ?? [])
    if (!COURSE_MODULES.every((m) => done.has(m.key))) return bad('Finish all modules first', 409)
    const attempts = (rec.attempts ?? []) as { at: string; correct: number; total: number; passed?: boolean | null }[]
    const last = attempts.at(-1)
    if (last && !last.passed) {
      const wait = new Date(last.at).getTime() + RETRY_AFTER_MINUTES * 60_000 - Date.now()
      if (wait > 0) return bad('Try again later', 429, { retryAt: new Date(Date.now() + wait).toISOString() })
    }
    const answers = (await body(req)).answers
    if (!answers || typeof answers !== 'object') return bad('Send your answers')
    const result = scoreExam(answers as Record<string, unknown>)
    const now = new Date()
    const data: Record<string, unknown> = { attempts: [...attempts.map(({ at, correct, total, passed }) => ({ at, correct, total, passed })), { at: now.toISOString(), correct: result.correct, total: result.total, passed: result.passed }] }
    if (result.passed) {
      const expires = new Date(now)
      expires.setFullYear(expires.getFullYear() + CERT_VALIDITY_YEARS)
      Object.assign(data, { passedAt: now.toISOString(), issuedAt: now.toISOString(), expiresAt: expires.toISOString(), status: 'valid', revokedReason: null, revokedAt: null })
    }
    // Retry on the (very unlikely) chance of a duplicate certificate code.
    for (let tries = 0; ; tries++) {
      try {
        await req.payload.update({ collection: 'teacher-certifications', id: rec.id, overrideAccess: true, data: { ...data, ...(result.passed ? { code: teacherCertificateCode() } : {}) } })
        break
      } catch (e) {
        if (tries >= 4 || !/unique|duplicate/i.test((e as Error).message)) throw e
      }
    }
    const saved = await req.payload.findByID({ collection: 'teacher-certifications', id: rec.id, depth: 0, overrideAccess: true })
    if (result.passed) await audit(req.payload, { actor: u!.id, action: 'certify_teacher', collection: 'teacher-certifications', docId: rec.id, summary: `${saved.code} ${result.correct}/${result.total}`, ip: ipOf(req) })
    return Response.json({
      passed: result.passed,
      correct: result.correct,
      total: result.total,
      results: result.results.map(({ id, correct }) => ({ id, correct })),
      weakModules: result.weakModules,
      code: result.passed ? saved.code : null,
      retryAt: result.passed ? null : new Date(now.getTime() + RETRY_AFTER_MINUTES * 60_000).toISOString(),
    })
  },
}

/** GET /api/teacher-certifications/code/:code/pdf?lang=id|en — the owner or a super admin downloads it. */
const pdf: Endpoint = {
  path: '/code/:code/pdf',
  method: 'get',
  handler: async (req) => {
    const u = req.user as U
    if (!u) return bad('Sign in first', 401)
    const code = String(req.routeParams?.code ?? '').toUpperCase()
    const c = (await req.payload.find({ collection: 'teacher-certifications', overrideAccess: true, depth: 0, limit: 1, where: { code: { equals: code } } })).docs[0]
    if (!c || !c.expiresAt) return bad('Not found', 404)
    const ownerId = typeof c.user === 'object' ? c.user.id : c.user
    if (ownerId !== u.id && !hasRole(u, 'super_admin')) return bad('Not your certificate', 403)
    if (statusOf({ status: c.status, expiresAt: c.expiresAt }) === 'revoked') return bad('This certificate has been revoked', 410)
    const owner = await req.payload.findByID({ collection: 'users', id: ownerId, depth: 0, overrideAccess: true })
    const lang = new URL(req.url ?? 'http://x').searchParams.get('lang') === 'en' ? 'en' : 'id'
    const bytes = await teacherCertificatePdf({ code: c.code!, issuedAt: c.issuedAt!, expiresAt: c.expiresAt }, owner.name ?? '', lang)
    return new Response(Buffer.from(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${c.code}.pdf"`, 'Cache-Control': 'private, no-store' } })
  },
}

/** Public, minimal view for the verification page. Teachers are adults, so the full name is shown. */
export async function verifyTeacherCertificate(payload: import('payload').Payload, code: string) {
  const c = (await payload.find({ collection: 'teacher-certifications', overrideAccess: true, depth: 0, limit: 1, where: { code: { equals: code.trim().toUpperCase() } } })).docs[0]
  if (!c?.code || !c.expiresAt || !c.issuedAt) return null
  const owner = await payload.findByID({ collection: 'users', id: typeof c.user === 'object' ? c.user.id : c.user, depth: 1, overrideAccess: true }).catch(() => null)
  const school = owner && typeof owner.school === 'object' && owner.school ? (owner.school as { name?: string }).name ?? null : null
  return { code: c.code, name: owner?.name ?? '—', school, issuedAt: c.issuedAt, expiresAt: c.expiresAt, status: statusOf({ status: c.status, expiresAt: c.expiresAt }) }
}

export const TeacherCertifications: CollectionConfig = {
  slug: 'teacher-certifications',
  admin: { useAsTitle: 'code', defaultColumns: ['user', 'code', 'status', 'passedAt'], group: 'Assessment', description: 'Teacher training progress and the AI Literacy Teacher certificate (spec H7).' },
  access: {
    read: readOwn,
    create: () => false, // created by the training endpoints
    update: ({ req }) => hasRole(req.user as U as { roles?: string[] }, 'super_admin'), // e.g. revoke
    delete: () => false,
  },
  endpoints: [completeModule, takeExam, pdf],
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'modulesDone', type: 'json', admin: { readOnly: true } },
    {
      name: 'attempts',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        { name: 'at', type: 'date', required: true },
        { name: 'correct', type: 'number', required: true },
        { name: 'total', type: 'number', required: true },
        { name: 'passed', type: 'checkbox' },
      ],
    },
    { name: 'passedAt', type: 'date', admin: { readOnly: true } },
    { name: 'code', type: 'text', unique: true, index: true, admin: { readOnly: true } },
    { name: 'issuedAt', type: 'date', admin: { readOnly: true } },
    { name: 'expiresAt', type: 'date', admin: { readOnly: true } },
    { name: 'status', type: 'select', defaultValue: 'valid', options: [{ value: 'valid', label: 'Valid' }, { value: 'revoked', label: 'Revoked' }] },
    { name: 'revokedReason', type: 'textarea', admin: { condition: (d) => d?.status === 'revoked' } },
    { name: 'revokedAt', type: 'date', admin: { readOnly: true, condition: (d) => d?.status === 'revoked' } },
  ],
}
