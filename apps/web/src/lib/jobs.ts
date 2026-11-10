/**
 * Scheduled jobs. The self-host stack calls POST /api/jobs/run every hour (see docker-compose.selfhost.yml);
 * each job decides for itself whether there is anything to do, so running it twice is harmless.
 *   - Test reminders: once, for bookings whose session starts within the next 24 hours.
 *   - Weekly parent summary: Sundays from 17:00 Jakarta time, at most once per parent per 6 days.
 */
import type { Payload } from 'payload'
import { escapeHtml } from './emails'
import { notify } from './notify'
import { sendWhatsApp } from './whatsapp'
import { childrenOf, weekLine, weekStats } from './parents'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
const base = () => process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export function jakartaParts(now: Date): { weekday: number; hour: number } {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', weekday: 'short', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const wd = p.find((x) => x.type === 'weekday')?.value ?? 'Mon'
  return { weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd), hour: Number(p.find((x) => x.type === 'hour')?.value ?? 0) }
}

/** Sunday from 17:00 in Jakarta. */
export function isWeeklySummaryTime(now: Date): boolean {
  const { weekday, hour } = jakartaParts(now)
  return weekday === 0 && hour >= 17
}

export async function runTestReminders(payload: Payload, now = new Date()): Promise<number> {
  const soon = new Date(now.getTime() + 24 * 3_600_000).toISOString()
  const sessions = (
    await payload.find({ collection: 'test-sessions', overrideAccess: true, depth: 0, limit: 200, where: { and: [{ startsAt: { greater_than: now.toISOString() } }, { startsAt: { less_than_equal: soon } }] } })
  ).docs
  let sent = 0
  for (const s of sessions) {
    const bookings = (
      await payload.find({ collection: 'bookings', overrideAccess: true, depth: 0, limit: 1000, where: { and: [{ session: { equals: s.id } }, { status: { equals: 'booked' } }, { remindedAt: { exists: false } }] } })
    ).docs
    for (const b of bookings) {
      // Mark first so a second run cannot send it again even if sending is slow.
      await payload.update({ collection: 'bookings', id: b.id, overrideAccess: true, data: { remindedAt: now.toISOString() } })
      const when = (locale: 'id' | 'en') =>
        new Date(s.startsAt).toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', timeZoneName: 'short' })
      const place = s.location || '—'
      // Message text depends on each recipient's language, so the "when" variable is filled per locale below.
      const candidate = await payload.findByID({ collection: 'users', id: idOf(b.candidate)!, depth: 0, overrideAccess: true }).catch(() => null)
      if (!candidate) continue
      const locale = candidate.preferredLocale === 'en' ? 'en' : 'id'
      await notify(payload, {
        userIds: [candidate.id],
        kind: 'test_reminder',
        vars: { session: s.title, when: when(locale), place },
        link: '/tes/jadwal',
        whatsapp: { template: 'test_reminder', params: (u, l) => [u.name.split(' ')[0] ?? u.name, s.title, when(l), place] },
      })
      sent++
    }
  }
  return sent
}

function summaryEmail(parentName: string, lines: string[], locale: 'id' | 'en') {
  const id = locale === 'id'
  const link = `${base()}/orang-tua`
  const subject = id ? 'Ringkasan mingguan AI Literacy' : 'AI Literacy weekly summary'
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#16130F;max-width:560px"><p>${id ? 'Halo' : 'Hello'} ${escapeHtml(parentName)},</p><p>${id ? 'Ini yang dicapai anak Anda minggu ini:' : 'Here is what your child did this week:'}</p><ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul><p><a href="${link}" style="display:inline-block;background:#16130F;color:#FAF7F2;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">${id ? 'Lihat kemajuan lengkap' : 'See full progress'}</a></p><p style="color:#6B655D;font-size:13px">${id ? 'Isi percakapan AI Lab tidak pernah dibagikan. Matikan email ini di halaman Akun.' : 'AI Lab conversations are never shared. Turn these emails off on your Account page.'}<br>Impact Thinklab · AI Literacy</p></div>`
  return { subject, html }
}

/** Send the weekly summary to every parent linked to at least one child. Returns how many parents got it. */
export async function runWeeklySummaries(payload: Payload, now = new Date(), opts: { force?: boolean } = {}): Promise<number> {
  if (!opts.force && !isWeeklySummaryTime(now)) return 0
  const cutoff = new Date(now.getTime() - 6 * 86_400_000).toISOString()
  const children = (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { guardians: { exists: true } } })).docs
  const parentIds = [...new Set(children.flatMap((c) => (c.guardians ?? []).map(idOf)).filter((x): x is number => Boolean(x)))]
  let sent = 0
  for (const pid of parentIds) {
    const parent = await payload.findByID({ collection: 'users', id: pid, depth: 0, overrideAccess: true }).catch(() => null)
    if (!parent || parent.suspended) continue
    const last = (parent as { lastWeeklySummaryAt?: string | null }).lastWeeklySummaryAt
    if (last && last > cutoff) continue
    await payload.update({ collection: 'users', id: pid, overrideAccess: true, data: { lastWeeklySummaryAt: now.toISOString() } as never })
    const locale = parent.preferredLocale === 'en' ? 'en' : 'id'
    const kids = await childrenOf(payload, pid)
    const lines = await Promise.all(kids.map(async (k) => weekLine(k.name, await weekStats(payload, k.id, now), locale)))
    if (!lines.length) continue
    const summary = lines.join(' ')
    // In-app notice (email off here: the summary email below is richer than the generic one).
    await notify(payload, { userIds: [pid], kind: 'weekly_summary', vars: { summary: summary.slice(0, 400) }, link: '/orang-tua', email: false })
    if ((parent.notifyEmail ?? true) && parent.email) {
      const mail = summaryEmail(parent.name.split(' ')[0] ?? parent.name, lines, locale)
      await payload.sendEmail({ to: parent.email, subject: mail.subject, html: mail.html }).catch((e: Error) => payload.logger.warn(`weekly summary email failed: ${e.message}`))
    }
    if (parent.notifyWhatsApp && parent.phone) {
      await sendWhatsApp(payload, { to: parent.phone, template: 'weekly_summary', locale, params: [parent.name.split(' ')[0] ?? parent.name, summary, `${base()}/orang-tua`] })
    }
    sent++
  }
  return sent
}

export async function runScheduledJobs(payload: Payload, now = new Date(), opts: { forceWeekly?: boolean } = {}) {
  const reminders = await runTestReminders(payload, now)
  const summaries = await runWeeklySummaries(payload, now, { force: opts.forceWeekly })
  const announcements = await (await import('../collections/Announcements')).notifyDueAnnouncements(payload, now)
  return { reminders, summaries, announcements }
}
