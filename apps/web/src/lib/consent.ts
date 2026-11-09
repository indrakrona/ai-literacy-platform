import type { Payload } from 'payload'
import { CONSENT_VERSION, normalizeIdPhone } from '@ailit/shared'
import { randomToken } from './tokens'
import { consentEmail } from './emails'

const CONSENT_LINK_DAYS = 14

export interface GuardianContact {
  guardianEmail?: string | null
  guardianPhone?: string | null
  guardianName?: string | null
}

/**
 * Create a consent request for a minor and notify the guardian.
 * Email is sent now; WhatsApp delivery is added with the WhatsApp provider (task L2).
 */
export async function requestGuardianConsent(
  payload: Payload,
  student: { id: number | string; name: string },
  contact: GuardianContact,
  locale: 'id' | 'en' = 'id',
) {
  const token = randomToken()
  const expiresAt = new Date(Date.now() + CONSENT_LINK_DAYS * 864e5).toISOString()
  const request = await payload.create({
    collection: 'consent-requests',
    overrideAccess: true,
    data: {
      student: Number(student.id),
      guardianEmail: contact.guardianEmail?.toLowerCase() || undefined,
      guardianPhone: normalizeIdPhone(contact.guardianPhone) || undefined,
      guardianName: contact.guardianName || undefined,
      token,
      status: 'pending',
      expiresAt,
      consentVersion: CONSENT_VERSION,
    },
  })

  if (request.guardianEmail) {
    const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const link = `${base}/persetujuan/${token}`
    const mail = consentEmail({ studentName: student.name, link, locale })
    await payload.sendEmail({ to: request.guardianEmail, subject: mail.subject, html: mail.html })
  }
  return request
}

export type ConsentDecision = 'granted' | 'declined'

export async function decideConsent(
  payload: Payload,
  token: string,
  decision: ConsentDecision,
  meta: { guardianName?: string; ip?: string | null; userAgent?: string | null },
) {
  const found = await payload.find({
    collection: 'consent-requests',
    overrideAccess: true,
    where: { token: { equals: token } },
    limit: 1,
  })
  const request = found.docs[0]
  if (!request) return { ok: false as const, reason: 'not_found' as const }
  if (request.status !== 'pending') return { ok: false as const, reason: 'already_decided' as const }
  if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
    await payload.update({ collection: 'consent-requests', id: request.id, overrideAccess: true, data: { status: 'expired' } })
    return { ok: false as const, reason: 'expired' as const }
  }

  await payload.update({
    collection: 'consent-requests',
    id: request.id,
    overrideAccess: true,
    data: {
      status: decision,
      decidedAt: new Date().toISOString(),
      guardianName: meta.guardianName || request.guardianName,
      decisionIp: meta.ip || undefined,
      decisionUserAgent: meta.userAgent?.slice(0, 300) || undefined,
    },
  })
  const studentId = typeof request.student === 'object' ? request.student.id : request.student
  await payload.update({
    collection: 'users',
    id: studentId,
    overrideAccess: true,
    data: { consentStatus: decision },
  })
  return { ok: true as const, decision }
}
