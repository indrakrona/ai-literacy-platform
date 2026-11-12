import type { Payload } from 'payload'
import { needsGuardianConsent, normalizeIdPhone } from '@ailit/shared'
import { z } from 'zod'
import type { Class } from '../payload-types'
import { parseCsv } from './csv'
import { requestGuardianConsent } from './consent'
import { inviteEmail } from './emails'
import { randomToken } from './tokens'
import { siteUrl } from './site-url'

const MAX_ROWS = 2000

const rowSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(['student', 'teacher']).default('student'),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  guardian_email: z.string().trim().toLowerCase().email().optional().or(z.literal('').transform(() => undefined)),
  guardian_phone: z.string().optional(),
  guardian_name: z.string().optional(),
})

export interface RosterReport {
  created: number
  addedExisting: number
  invited: number
  consentRequested: number
  errors: { row: number; email?: string; reason: string }[]
}

/** Accepted headers (lower case): name, email, role, date_of_birth, guardian_email, guardian_phone, guardian_name. */
export async function importRoster(payload: Payload, klass: Class, csv: string): Promise<RosterReport> {
  const rows = parseCsv(csv)
  const report: RosterReport = { created: 0, addedExisting: 0, invited: 0, consentRequested: 0, errors: [] }
  if (rows.length > MAX_ROWS) {
    report.errors.push({ row: 0, reason: `Too many rows (max ${MAX_ROWS})` })
    return report
  }

  const schoolId = typeof klass.school === 'object' ? klass.school.id : klass.school
  const studentIds = new Set((klass.students ?? []).map((s) => (typeof s === 'object' ? s.id : s)))
  const teacherIds = new Set((klass.teachers ?? []).map((s) => (typeof s === 'object' ? s.id : s)))
  const base = siteUrl()

  for (const [i, raw] of rows.entries()) {
    const rowNo = i + 2 // header is row 1
    const parsed = rowSchema.safeParse({ ...raw, role: raw.role || undefined })
    if (!parsed.success) {
      report.errors.push({ row: rowNo, email: raw.email, reason: parsed.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ') })
      continue
    }
    const r = parsed.data
    const minor = r.role === 'student' && r.date_of_birth ? needsGuardianConsent(r.date_of_birth) : false
    if (r.role === 'student' && !r.date_of_birth) {
      report.errors.push({ row: rowNo, email: r.email, reason: 'date_of_birth is required for students' })
      continue
    }
    if (minor && !r.guardian_email && !normalizeIdPhone(r.guardian_phone)) {
      report.errors.push({ row: rowNo, email: r.email, reason: 'guardian_email or guardian_phone is required for students under 18' })
      continue
    }

    const existing = await payload.find({ collection: 'users', overrideAccess: true, where: { email: { equals: r.email } }, limit: 1, depth: 0 })
    let userId: number
    if (existing.docs[0]) {
      const u = existing.docs[0]
      const uSchool = typeof u.school === 'object' ? u.school?.id : u.school
      if (uSchool && uSchool !== schoolId) {
        report.errors.push({ row: rowNo, email: r.email, reason: 'already registered at another school' })
        continue
      }
      userId = u.id
      report.addedExisting++
    } else {
      const created = await payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          name: r.name,
          email: r.email,
          password: randomToken(18),
          roles: [r.role],
          school: schoolId,
          dateOfBirth: r.date_of_birth,
          consentStatus: minor ? 'pending' : 'not_required',
        },
      })
      userId = created.id
      report.created++

      const token = await payload.forgotPassword({ collection: 'users', data: { email: r.email }, disableEmail: true })
      const mail = inviteEmail({ name: r.name, link: `${base}/atur-sandi?token=${token}`, locale: 'id' })
      await payload.sendEmail({ to: r.email, subject: mail.subject, html: mail.html })
      report.invited++

      if (minor) {
        await requestGuardianConsent(payload, created, {
          guardianEmail: r.guardian_email,
          guardianPhone: r.guardian_phone,
          guardianName: r.guardian_name,
        })
        report.consentRequested++
      }
    }
    if (r.role === 'teacher') teacherIds.add(userId)
    else studentIds.add(userId)
  }

  await payload.update({
    collection: 'classes',
    id: klass.id,
    overrideAccess: true,
    data: { students: [...studentIds], teachers: [...teacherIds] },
  })
  return report
}
