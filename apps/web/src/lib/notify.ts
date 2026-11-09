/**
 * In-app notifications plus transactional email (spec L1, L3). Every message exists in Bahasa and
 * English; each recipient gets their own language. Email respects the user's "notify by email"
 * preference. WhatsApp is a placeholder until a provider is chosen.
 * Notifying never breaks the action that triggered it.
 */
import type { Payload } from 'payload'
import { escapeHtml } from './emails'

type Locale = 'id' | 'en'
type Text = { title: string; body: string }

export const NOTIFICATION_KINDS = ['assignment_new', 'submission_received', 'project_graded', 'score_ready', 'consent_granted', 'consent_declined', 'report_received', 'pilot_request'] as const
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number]

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))

const MESSAGES: Record<NotificationKind, Record<Locale, Text>> = {
  assignment_new: {
    id: { title: 'Tugas baru: {lesson}', body: 'Gurumu memberi tugas di kelas {class}. Tenggat: {due}.' },
    en: { title: 'New assignment: {lesson}', body: 'Your teacher set work in class {class}. Due: {due}.' },
  },
  submission_received: {
    id: { title: 'Proyek baru untuk dinilai', body: '{students} mengirim proyek "{brief}" di kelas {class}.' },
    en: { title: 'New project to mark', body: '{students} sent the project "{brief}" in class {class}.' },
  },
  project_graded: {
    id: { title: 'Proyekmu sudah dinilai', body: 'Proyek "{brief}" mendapat nilai {total}/{max}. Baca umpan balik dari gurumu.' },
    en: { title: 'Your project has been marked', body: 'Your project "{brief}" scored {total}/{max}. Read your teacher’s feedback.' },
  },
  score_ready: {
    id: { title: 'Skor AILIS-mu sudah keluar', body: 'Hasil tes AI Literacy-mu sudah dapat dilihat.' },
    en: { title: 'Your AILIS score is ready', body: 'Your AI Literacy test result is now available.' },
  },
  consent_granted: {
    id: { title: 'Izin orang tua sudah diberikan', body: 'Sekarang kamu dapat memakai AI Lab, mengirim proyek, dan mengikuti tes.' },
    en: { title: 'Parent permission granted', body: 'You can now use the AI Lab, send projects and take tests.' },
  },
  consent_declined: {
    id: { title: 'Orang tua belum memberi izin', body: 'Kamu tetap dapat membaca materi. Bicarakan dengan orang tuamu jika ingin memakai AI Lab.' },
    en: { title: 'Parent permission not given', body: 'You can still read the lessons. Talk to your parents if you would like to use the AI Lab.' },
  },
  pilot_request: {
    id: { title: 'Permintaan pilot baru', body: '{school} ({city}) ingin bergabung dengan program pilot.' },
    en: { title: 'New pilot request', body: '{school} ({city}) would like to join the pilot.' },
  },
  report_received: {
    id: { title: 'Laporan masalah baru', body: 'Ada laporan "{reason}" tentang {target}.' },
    en: { title: 'New problem report', body: 'A "{reason}" report was made about {target}.' },
  },
}

export function renderNotification(kind: NotificationKind, locale: Locale, vars: Record<string, string | number> = {}): Text {
  const m = MESSAGES[kind][locale]
  return { title: fill(m.title, vars), body: fill(m.body, vars) }
}

export function notificationEmail(text: Text, link: string | undefined, locale: Locale) {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const href = link ? `${base}${link}` : base
  const label = locale === 'id' ? 'Buka AI Literacy' : 'Open AI Literacy'
  const footer = locale === 'id' ? 'Anda dapat mematikan email pemberitahuan di halaman Akun.' : 'You can turn off notification emails on your Account page.'
  return {
    subject: text.title,
    html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#16130F;max-width:560px"><p><b>${escapeHtml(text.title)}</b></p><p>${escapeHtml(text.body)}</p><p><a href="${href}" style="display:inline-block;background:#16130F;color:#FAF7F2;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">${label}</a></p><p style="color:#6B655D;font-size:13px">${footer}<br>Impact Thinklab · AI Literacy</p></div>`,
  }
}

export interface NotifyInput {
  userIds: (number | null | undefined)[]
  kind: NotificationKind
  vars?: Record<string, string | number>
  link?: string
  /** Defaults to true; set false for low-value notices that should stay in-app only. */
  email?: boolean
}

export async function notify(payload: Payload, input: NotifyInput): Promise<number> {
  const ids = [...new Set(input.userIds.filter((x): x is number => typeof x === 'number' && x > 0))]
  if (!ids.length) return 0
  let sent = 0
  try {
    const users = (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: ids.length, where: { id: { in: ids } } })).docs
    for (const u of users) {
      const locale: Locale = u.preferredLocale === 'en' ? 'en' : 'id'
      const text = renderNotification(input.kind, locale, input.vars)
      await payload.create({ collection: 'notifications', overrideAccess: true, data: { user: u.id, kind: input.kind, title: text.title, body: text.body, link: input.link } })
      sent++
      const wantsEmail = input.email !== false && (u.notifyEmail ?? true)
      if (wantsEmail && u.email) {
        const mail = notificationEmail(text, input.link, locale)
        await payload.sendEmail({ to: u.email, subject: mail.subject, html: mail.html }).catch((e: Error) => payload.logger.warn(`notify: email failed: ${e.message}`))
      }
      // WhatsApp: placeholder until a provider is selected (the notifyWhatsApp preference is stored already).
    }
  } catch (e) {
    payload.logger.warn(`notify: ${input.kind} failed: ${(e as Error).message}`)
  }
  return sent
}
