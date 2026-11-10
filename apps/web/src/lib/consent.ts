import type { Payload } from 'payload'
import { CONSENT_VERSION, normalizeIdPhone } from '@ailit/shared'
import { randomToken } from './tokens'
import { consentEmail } from './emails'
import { sendWhatsApp } from './whatsapp'

const CONSENT_LINK_DAYS = 14

export interface GuardianContact {
  guardianEmail?: string | null
  guardianPhone?: string | null
  guardianName?: string | null
}

/**
 * Create a consent request for a minor and notify the guardian.
 * Sent by email and, when a number is given, as a WhatsApp template message.
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
  if (request.guardianPhone) {
    const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    await sendWhatsApp(payload, { to: request.guardianPhone, template: 'consent_request', locale, params: [student.name.split(' ')[0] ?? student.name, `${base}/persetujuan/${token}`] })
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
  return { ok: true as const, decision, studentId }
}

/**
 * A consent link a teacher or school admin can pass to the parent themselves (WhatsApp, in person),
 * so consent works even before an email provider is configured. Reuses the student's open request
 * when it is still valid; otherwise issues a new one with the same guardian contact (no email sent).
 */
export async function shareableConsentLink(payload: Payload, studentId: number) {
  const student = await payload.findByID({ collection: 'users', id: studentId, depth: 0, overrideAccess: true })
  const now = new Date()
  const requests = await payload.find({ collection: 'consent-requests', overrideAccess: true, depth: 0, limit: 10, sort: '-createdAt', where: { student: { equals: studentId } } })
  const open = requests.docs.find((r) => r.status === 'pending' && r.expiresAt && new Date(r.expiresAt) > now)
  const last = requests.docs[0]
  const request = open ?? (await payload.create({
    collection: 'consent-requests',
    overrideAccess: true,
    data: {
      student: studentId,
      guardianEmail: last?.guardianEmail || undefined,
      guardianPhone: last?.guardianPhone || undefined,
      guardianName: last?.guardianName || undefined,
      token: randomToken(),
      status: 'pending',
      expiresAt: new Date(now.getTime() + CONSENT_LINK_DAYS * 864e5).toISOString(),
      consentVersion: CONSENT_VERSION,
    },
  }))
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const link = `${base}/persetujuan/${request.token}`
  return { link, studentName: student.name, guardianName: request.guardianName ?? null, guardianPhone: request.guardianPhone ?? null, expiresAt: request.expiresAt }
}

/** Prefilled WhatsApp message (click-to-chat; free, no API account needed). */
export function whatsappConsentUrl(opts: { link: string; studentName: string; guardianName?: string | null; guardianPhone?: string | null }) {
  const greeting = opts.guardianName ? `Yth. ${opts.guardianName},` : 'Yth. Bapak/Ibu,'
  const text = `${greeting}\n\n${opts.studentName} akan mengikuti program AI Literacy di sekolah. Karena ${opts.studentName} berusia di bawah 18 tahun, kami memerlukan izin Bapak/Ibu. Silakan baca penjelasan dan berikan keputusan melalui tautan berikut (berlaku 14 hari):\n${opts.link}\n\nTerima kasih.`
  const phone = (opts.guardianPhone ?? '').replace(/\D/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
