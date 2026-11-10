/**
 * Parents and guardians (spec J2–J3): link a parent account to a child, show the child's progress and
 * send a weekly summary. Parents see what their child achieved, never the content of AI Lab chats.
 */
import type { Payload } from 'payload'
import { progressOf } from './gamification'
import { BAND_NAMES } from './certificates'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
export const PARENT_CODE_DAYS = 7
/** A consent link may be used to create or link a parent account for this long after the decision. */
export const CONSENT_LINK_DAYS = 30

export function parentCode(rand: () => number = Math.random): string {
  return Array.from({ length: 8 }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)]).join('')
}

/** Children (student accounts) this parent is linked to. */
export async function childrenOf(payload: Payload, parentId: number) {
  return (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 20, sort: 'name', where: { guardians: { contains: parentId } } })).docs
}

export async function isGuardianOf(payload: Payload, parentId: number, childId: number): Promise<boolean> {
  const child = await payload.findByID({ collection: 'users', id: childId, depth: 0, overrideAccess: true }).catch(() => null)
  return Boolean(child && (child.guardians ?? []).map(idOf).includes(parentId))
}

export async function linkGuardian(payload: Payload, childId: number, parentId: number) {
  const child = await payload.findByID({ collection: 'users', id: childId, depth: 0, overrideAccess: true })
  const ids = new Set((child.guardians ?? []).map(idOf).filter((x): x is number => Boolean(x)))
  ids.add(parentId)
  await payload.update({ collection: 'users', id: childId, overrideAccess: true, data: { guardians: [...ids], parentLinkCode: null, parentLinkExpiresAt: null } as never })
  return child
}

/**
 * Which child a token or code points to. A consent token works once consent was granted (recently); a code
 * is one the child made on their Account page and works for PARENT_CODE_DAYS.
 */
export async function resolveChildLink(payload: Payload, input: { token?: string | null; code?: string | null }, now = new Date()): Promise<{ childId: number; via: 'consent' | 'code' } | { problem: string }> {
  if (input.token) {
    const r = (await payload.find({ collection: 'consent-requests', overrideAccess: true, depth: 0, limit: 1, where: { token: { equals: input.token } } })).docs[0]
    if (!r) return { problem: 'link_invalid' }
    if (r.status !== 'granted') return { problem: 'consent_not_granted' }
    if (r.decidedAt && now.getTime() - new Date(r.decidedAt).getTime() > CONSENT_LINK_DAYS * 86_400_000) return { problem: 'link_expired' }
    return { childId: idOf(r.student)!, via: 'consent' }
  }
  const code = (input.code ?? '').trim().toUpperCase()
  if (code.length === 8) {
    const child = (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 1, where: { parentLinkCode: { equals: code } } })).docs[0] as
      | { id: number; parentLinkExpiresAt?: string | null }
      | undefined
    if (!child) return { problem: 'link_invalid' }
    if (!child.parentLinkExpiresAt || new Date(child.parentLinkExpiresAt) < now) return { problem: 'link_expired' }
    return { childId: child.id, via: 'code' }
  }
  return { problem: 'link_invalid' }
}

export const LINK_PROBLEMS: Record<string, { id: string; en: string }> = {
  link_invalid: { id: 'Kode atau tautan tidak dikenali.', en: 'This code or link was not recognised.' },
  link_expired: { id: 'Kode atau tautan sudah kedaluwarsa. Minta anak membuat kode baru di halaman Akun.', en: 'This code or link has expired. Ask your child to make a new code on their Account page.' },
  consent_not_granted: { id: 'Izin belum diberikan untuk akun ini.', en: 'Permission has not been given for this account.' },
  not_parent: { id: 'Akun ini bukan akun orang tua.', en: 'This is not a parent account.' },
}

export interface ChildProgress {
  id: number
  name: string
  consentStatus: string
  classes: string[]
  lessonsCompleted: number
  recentLessons: { title: string; completedAt: string }[]
  xpTotal: number
  badges: { icon: string; name: string }[]
  tests: { band: number; bandName: string; scoredAt: string; certificateCode?: string; provisional: boolean }[]
  projects: { brief: string; status: string; total?: number; max?: number }[]
  week: WeekStats
}

export interface WeekStats {
  lessons: number
  xp: number
  badges: number
  aiSessions: number
  projectsSent: number
  projectsGraded: number
  testsScored: number
}

/** What the child did in the 7 days up to `now`. */
export async function weekStats(payload: Payload, childId: number, now = new Date()): Promise<WeekStats> {
  const since = new Date(now.getTime() - 7 * 86_400_000).toISOString()
  const count = (collection: 'lesson-progress' | 'user-badges' | 'ai-conversations' | 'test-attempts', where: Record<string, unknown>) =>
    payload.count({ collection, overrideAccess: true, where: where as never }).then((r) => r.totalDocs)
  const [lessons, badges, aiSessions, testsScored, xpRows, subs] = await Promise.all([
    count('lesson-progress', { and: [{ user: { equals: childId } }, { status: { equals: 'completed' } }, { completedAt: { greater_than: since } }] }),
    count('user-badges', { and: [{ user: { equals: childId } }, { createdAt: { greater_than: since } }] }),
    count('ai-conversations', { and: [{ user: { equals: childId } }, { updatedAt: { greater_than: since } }] }),
    count('test-attempts', { and: [{ candidate: { equals: childId } }, { status: { equals: 'scored' } }, { updatedAt: { greater_than: since } }] }),
    payload.find({ collection: 'xp-events', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { and: [{ user: { equals: childId } }, { createdAt: { greater_than: since } }] } }),
    payload.find({ collection: 'submissions', overrideAccess: true, depth: 0, limit: 100, where: { members: { contains: childId } } }),
  ])
  return {
    lessons,
    xp: xpRows.docs.reduce((a, e) => a + (e.xp ?? 0), 0),
    badges,
    aiSessions,
    projectsSent: subs.docs.filter((s) => s.submittedAt && s.submittedAt > since).length,
    projectsGraded: subs.docs.filter((s) => s.status === 'graded' && s.gradedAt && s.gradedAt > since).length,
    testsScored,
  }
}

export async function childProgress(payload: Payload, childId: number, locale: 'id' | 'en', now = new Date()): Promise<ChildProgress> {
  const child = await payload.findByID({ collection: 'users', id: childId, depth: 0, overrideAccess: true })
  const [classes, done, prog, userBadges, attempts, certs, subs, week] = await Promise.all([
    payload.find({ collection: 'classes', overrideAccess: true, depth: 0, limit: 10, where: { students: { contains: childId } } }),
    payload.find({ collection: 'lesson-progress', overrideAccess: true, depth: 1, locale, limit: 5, sort: '-completedAt', where: { and: [{ user: { equals: childId } }, { status: { equals: 'completed' } }] } }),
    progressOf(payload, childId),
    payload.find({ collection: 'user-badges', overrideAccess: true, depth: 1, locale, limit: 50, sort: '-createdAt', where: { user: { equals: childId } } }),
    payload.find({ collection: 'test-attempts', overrideAccess: true, depth: 0, limit: 10, sort: '-updatedAt', where: { and: [{ candidate: { equals: childId } }, { status: { equals: 'scored' } }] } }),
    payload.find({ collection: 'certificates', overrideAccess: true, depth: 0, limit: 10, where: { and: [{ candidate: { equals: childId } }, { status: { equals: 'valid' } }] } }),
    payload.find({ collection: 'submissions', overrideAccess: true, depth: 1, locale, limit: 10, sort: '-submittedAt', where: { members: { contains: childId } } }),
    weekStats(payload, childId, now),
  ])
  const certByAttempt = new Map(certs.docs.map((c) => [idOf(c.attempt), c.code]))
  return {
    id: child.id,
    name: child.name,
    consentStatus: child.consentStatus ?? 'not_required',
    classes: classes.docs.map((c) => c.name),
    lessonsCompleted: done.totalDocs,
    recentLessons: done.docs.map((p) => ({ title: typeof p.lesson === 'object' ? (p.lesson.title ?? '') : '', completedAt: p.completedAt ?? p.updatedAt })),
    xpTotal: prog.total,
    badges: userBadges.docs.map((ub) => (typeof ub.badge === 'object' ? { icon: ub.badge.icon, name: ub.badge.name ?? '' } : null)).filter((b): b is { icon: string; name: string } => Boolean(b)),
    tests: attempts.docs.map((a) => {
      const r = a.report as { band: number; provisional?: boolean } | null
      return { band: r?.band ?? 0, bandName: BAND_NAMES[locale][r?.band ?? 0] ?? '', scoredAt: a.updatedAt, certificateCode: certByAttempt.get(a.id), provisional: Boolean(r?.provisional) }
    }),
    projects: subs.docs.map((s) => {
      const scores = (s.scores ?? []) as number[]
      return {
        brief: typeof s.brief === 'object' ? (s.brief.title ?? '') : '',
        status: s.status,
        total: s.status === 'graded' ? scores.reduce((a, c) => a + c, 0) : undefined,
        max: s.status === 'graded' ? scores.length * 4 : undefined,
      }
    }),
    week,
  }
}

/** One short line per child for the weekly summary (also used for the WhatsApp template). */
export function weekLine(name: string, w: WeekStats, locale: 'id' | 'en'): string {
  const first = name.split(' ')[0] ?? name
  const parts =
    locale === 'id'
      ? [w.lessons && `${w.lessons} pelajaran selesai`, w.xp && `${w.xp} XP`, w.badges && `${w.badges} lencana baru`, w.aiSessions && `${w.aiSessions} sesi AI Lab`, w.projectsSent && `${w.projectsSent} proyek dikirim`, w.projectsGraded && `${w.projectsGraded} proyek dinilai`, w.testsScored && `hasil tes AILIS keluar`]
      : [w.lessons && `${w.lessons} lessons completed`, w.xp && `${w.xp} XP`, w.badges && `${w.badges} new badges`, w.aiSessions && `${w.aiSessions} AI Lab sessions`, w.projectsSent && `${w.projectsSent} projects sent`, w.projectsGraded && `${w.projectsGraded} projects marked`, w.testsScored && `AILIS test result released`]
  const done = parts.filter(Boolean) as string[]
  if (!done.length) return locale === 'id' ? `${first}: belum ada kegiatan minggu ini.` : `${first}: no activity this week.`
  return `${first}: ${done.join(', ')}.`
}
