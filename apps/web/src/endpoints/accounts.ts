import type { Endpoint, PayloadRequest } from 'payload'
import { ageOn, hasRole, needsGuardianConsent, normalizeIdPhone } from '@ailit/shared'
import { decideConsent, requestGuardianConsent } from '../lib/consent'
import { importRoster } from '../lib/roster'
import { consentDecisionSchema, importSchema, joinClassSchema, signupSchema, zodMessage } from './validation'
import { track, type Actor } from '../lib/analytics'
import { notify } from '../lib/notify'
import { getSwitches } from '../lib/settings'
import { audit, ipOf } from '../lib/audit'

const MIN_STUDENT_AGE = 10
const MIN_CANDIDATE_AGE = 15

async function readJson(req: PayloadRequest): Promise<unknown> {
  try {
    return req.json ? await req.json() : {}
  } catch {
    return null
  }
}

const bad = (message: string, status = 400) => Response.json({ error: message }, { status })

async function findClassByCode(req: PayloadRequest, code: string) {
  const res = await req.payload.find({
    collection: 'classes',
    overrideAccess: true,
    where: { joinCode: { equals: code } },
    limit: 1,
    depth: 0,
  })
  return res.docs[0] ?? null
}

async function addStudentToClass(req: PayloadRequest, classId: number, studentId: number) {
  const klass = await req.payload.findByID({ collection: 'classes', id: classId, overrideAccess: true, depth: 0 })
  const ids = new Set((klass.students ?? []).map((s) => (typeof s === 'object' ? s.id : s)))
  ids.add(studentId)
  await req.payload.update({
    collection: 'classes',
    id: classId,
    overrideAccess: true,
    data: { students: [...ids] },
  })
  const schoolId = typeof klass.school === 'object' ? klass.school.id : klass.school
  await req.payload.update({ collection: 'users', id: studentId, overrideAccess: true, data: { school: schoolId } })
  return klass
}

/** POST /api/users/signup — self-registration for students (any age) and test candidates (15+). */
export const signupEndpoint: Endpoint = {
  path: '/signup',
  method: 'post',
  handler: async (req) => {
    if (!(await getSwitches(req.payload)).signupsOpen) return bad('Pendaftaran mandiri sedang ditutup. Minta akun melalui sekolah Anda. / Self sign-up is closed; ask your school for an account.', 403)
    const parsed = signupSchema.safeParse(await readJson(req))
    if (!parsed.success) return bad(zodMessage(parsed.error))
    const input = parsed.data

    const age = ageOn(input.dateOfBirth)
    if (age < 0 || age > 100) return bad('dateOfBirth: not a valid birth date')
    if (input.accountType === 'student' && age < MIN_STUDENT_AGE) return bad('Too young for this program')
    if (input.accountType === 'candidate' && age < MIN_CANDIDATE_AGE) return bad('Test candidates must be 15 or older')

    const minor = needsGuardianConsent(input.dateOfBirth)
    if (minor && !input.guardianEmail && !normalizeIdPhone(input.guardianPhone)) {
      return bad('guardian: an email or a valid WhatsApp number is required for users under 18')
    }

    const klass = input.classCode ? await findClassByCode(req, input.classCode) : null
    if (input.classCode && !klass) return bad('classCode: no class with this code', 404)

    const existing = await req.payload.find({
      collection: 'users',
      overrideAccess: true,
      where: { email: { equals: input.email } },
      limit: 1,
    })
    if (existing.docs.length) return bad('email: an account with this email already exists', 409)

    const user = await req.payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: input.name,
        email: input.email,
        password: input.password,
        roles: [input.accountType],
        dateOfBirth: input.dateOfBirth,
        preferredLocale: input.locale,
        consentStatus: minor ? 'pending' : 'not_required',
      },
    })

    if (klass) await addStudentToClass(req, klass.id, user.id)
    await track(req.payload, { name: 'signed_up', user, headers: req.headers })
    if (klass) await track(req.payload, { name: 'class_joined', user, headers: req.headers, props: { classId: klass.id } })
    if (minor) {
      await track(req.payload, { name: 'consent_requested', user, headers: req.headers })
      await requestGuardianConsent(
        req.payload,
        user,
        { guardianEmail: input.guardianEmail, guardianPhone: input.guardianPhone, guardianName: input.guardianName },
        input.locale,
      )
    }

    return Response.json(
      { id: user.id, consentStatus: minor ? 'pending' : 'not_required', joinedClass: klass?.name ?? null },
      { status: 201 },
    )
  },
}

/** POST /api/classes/join — a logged-in student joins a class by its 6-character code. */
export const joinClassEndpoint: Endpoint = {
  path: '/join',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return bad('Sign in first', 401)
    if (!hasRole(req.user as { roles?: string[] }, 'student')) return bad('Only students can join a class', 403)
    const parsed = joinClassSchema.safeParse(await readJson(req))
    if (!parsed.success) return bad(zodMessage(parsed.error))
    const klass = await findClassByCode(req, parsed.data.code)
    if (!klass) return bad('No class with this code', 404)
    await addStudentToClass(req, klass.id, Number(req.user.id))
    await track(req.payload, { name: 'class_joined', user: req.user as unknown as Actor, headers: req.headers, props: { classId: klass.id } })
    return Response.json({ classId: klass.id, className: klass.name })
  },
}

/** GET /api/consent-requests/lookup/:token — what the guardian sees before deciding (no personal data beyond first name). */
export const consentLookupEndpoint: Endpoint = {
  path: '/lookup/:token',
  method: 'get',
  handler: async (req) => {
    const token = String(req.routeParams?.token ?? '')
    const res = await req.payload.find({
      collection: 'consent-requests',
      overrideAccess: true,
      where: { token: { equals: token } },
      depth: 1,
      limit: 1,
    })
    const r = res.docs[0]
    if (!r) return bad('Not found', 404)
    const student = typeof r.student === 'object' ? r.student : null
    const expired = r.status === 'pending' && r.expiresAt && new Date(r.expiresAt) < new Date()
    return Response.json({
      studentFirstName: student?.name?.split(' ')[0] ?? '',
      status: expired ? 'expired' : r.status,
      consentVersion: r.consentVersion,
      expiresAt: r.expiresAt,
    })
  },
}

/** POST /api/consent-requests/decide — the guardian grants or declines. */
export const consentDecideEndpoint: Endpoint = {
  path: '/decide',
  method: 'post',
  handler: async (req) => {
    const parsed = consentDecisionSchema.safeParse(await readJson(req))
    if (!parsed.success) return bad(zodMessage(parsed.error))
    const result = await decideConsent(req.payload, parsed.data.token, parsed.data.decision, {
      guardianName: parsed.data.guardianName,
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: req.headers.get('user-agent'),
    })
    if (!result.ok) {
      const status = result.reason === 'not_found' ? 404 : 409
      return bad(result.reason, status)
    }
    await notify(req.payload, { userIds: [Number(result.studentId)], kind: result.decision === 'granted' ? 'consent_granted' : 'consent_declined', link: '/beranda' })
    await audit(req.payload, { action: `consent_${result.decision}`, collection: 'users', docId: result.studentId, summary: 'decided by guardian via consent link', ip: ipOf(req) })
    if (result.decision === 'granted') {
      const student = await req.payload.findByID({ collection: 'users', id: result.studentId, depth: 0, overrideAccess: true }).catch(() => null)
      await track(req.payload, { name: 'consent_given', user: student, headers: req.headers })
    }
    return Response.json({ decision: result.decision })
  },
}

/** POST /api/classes/import — school admins (or super admins) upload a CSV roster for one class. */
export const importRosterEndpoint: Endpoint = {
  path: '/import',
  method: 'post',
  handler: async (req) => {
    const user = req.user as { id: number; roles?: string[]; school?: number | { id: number } | null } | null
    if (!user || !hasRole(user, 'school_admin', 'super_admin')) return bad('Not allowed', 403)
    const parsed = importSchema.safeParse(await readJson(req))
    if (!parsed.success) return bad(zodMessage(parsed.error))

    const klass = await req.payload.findByID({ collection: 'classes', id: parsed.data.classId, overrideAccess: true, depth: 0 })
    const classSchool = typeof klass.school === 'object' ? klass.school.id : klass.school
    const userSchool = typeof user.school === 'object' ? user.school?.id : user.school
    if (!hasRole(user, 'super_admin') && classSchool !== userSchool) return bad('This class belongs to another school', 403)

    const report = await importRoster(req.payload, klass, parsed.data.csv)
    return Response.json(report)
  },
}
