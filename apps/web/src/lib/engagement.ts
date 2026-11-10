/**
 * Engagement (spec E3–E5, F4–F6): team challenges, team-based opt-in leaderboards, showcase consent and
 * portfolio visibility. Children are never ranked individually; names on public pages are shortened for
 * under-18s, and anything public about a minor needs a linked parent's approval.
 */
import type { Payload } from 'payload'
import { needsGuardianConsent } from '@ailit/shared'
import { challengeProgress } from './gamification'
import { publicName } from './certificates'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

export type Team = { id?: string | null; name: string; members: (number | { id: number })[] }

export const TEAM_NAMES = ['Garuda', 'Komodo', 'Rajawali', 'Cendrawasih', 'Anoa', 'Pesut', 'Merak', 'Elang', 'Badak', 'Kancil', 'Jalak', 'Maleo']

/** Split students into `count` teams of near-equal size, in a shuffled order. */
export function splitTeams(studentIds: number[], count: number, rand: () => number = Math.random): Team[] {
  const n = Math.max(2, Math.min(count, TEAM_NAMES.length, Math.max(2, studentIds.length)))
  const ids = [...studentIds]
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
  }
  const teams: Team[] = Array.from({ length: n }, (_, i) => ({ name: `Tim ${TEAM_NAMES[i]}`, members: [] }))
  ids.forEach((id, i) => (teams[i % n]!.members as number[]).push(id))
  return teams
}

/**
 * Team standings for a team challenge. The score is the average lessons completed per member within the
 * challenge window, so small and large teams compete fairly. Individual numbers are not returned.
 */
export async function teamScores(payload: Payload, ch: { teams?: Team[] | null; bigIdea?: string | null; startsAt?: string | null; endsAt?: string | null; target?: number | null }) {
  const rows = await Promise.all(
    (ch.teams ?? []).map(async (t) => {
      const members = (t.members ?? []).map(idOf).filter((x): x is number => Boolean(x))
      const done = await Promise.all(members.map((m) => challengeProgress(payload, m, ch)))
      const total = done.reduce((a, c) => a + c, 0)
      const avg = members.length ? total / members.length : 0
      return { name: t.name, members: members.length, average: Math.round(avg * 10) / 10, reachedTarget: members.length > 0 && avg >= (ch.target ?? 1) }
    }),
  )
  return rows.sort((a, b) => b.average - a.average)
}

export function teamOf(teams: Team[] | null | undefined, userId: number): Team | null {
  return (teams ?? []).find((t) => (t.members ?? []).map(idOf).includes(userId)) ?? null
}

/**
 * School board: classes that opted in, ranked by the average XP per student over the last 30 days.
 * The class is the team; no student names.
 */
export async function schoolBoard(payload: Payload, schoolId: number, now = new Date()) {
  const classes = (await payload.find({ collection: 'classes', overrideAccess: true, depth: 0, limit: 200, where: { and: [{ school: { equals: schoolId } }, { leaderboardOptIn: { equals: true } }] } })).docs
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString()
  const rows = await Promise.all(
    classes.map(async (c) => {
      const students = (c.students ?? []).map(idOf).filter((x): x is number => Boolean(x))
      const xp = students.length
        ? (await payload.find({ collection: 'xp-events', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { and: [{ user: { in: students } }, { createdAt: { greater_than: since } }] } })).docs.reduce((a, e) => a + (e.xp ?? 0), 0)
        : 0
      return { classId: c.id, name: c.name, students: students.length, xpPerStudent: students.length ? Math.round(xp / students.length) : 0 }
    }),
  )
  return rows.sort((a, b) => b.xpPerStudent - a.xpPerStudent)
}

type Person = { id: number; name: string; dateOfBirth?: string | null; consentStatus?: string | null; guardians?: unknown[] | null; showInShowcase?: boolean | null; galleryParentApproved?: boolean | null; portfolio?: { enabled?: boolean | null; parentApproved?: boolean | null } | null }

export const isMinor = (p: { dateOfBirth?: string | null }) => !p.dateOfBirth || needsGuardianConsent(p.dateOfBirth)

/** Whether this person allows their work in the gallery: their own yes, plus a parent's yes for under-18s. */
export function galleryConsent(p: Person, agreed: boolean): 'ok' | 'needs_member' | 'needs_parent' {
  if (!agreed) return 'needs_member'
  if (isMinor(p) && !p.galleryParentApproved) return 'needs_parent'
  return 'ok'
}

/** A submission can be published only when every member (and each minor's parent) agreed. */
export async function showcaseStatus(payload: Payload, sub: { members?: unknown[] | null; showcaseAgreed?: unknown[] | null }) {
  const memberIds = (sub.members ?? []).map(idOf).filter((x): x is number => Boolean(x))
  const agreed = new Set((sub.showcaseAgreed ?? []).map(idOf))
  const people = (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 20, where: { id: { in: memberIds } } })).docs as unknown as Person[]
  const each = people.map((p) => ({ id: p.id, name: p.name, state: galleryConsent(p, agreed.has(p.id)) }))
  return { ready: each.length > 0 && each.every((e) => e.state === 'ok'), members: each }
}

/** Portfolio is public only when switched on, and for under-18s also approved by a linked parent. */
export function portfolioPublic(p: Person): boolean {
  if (!p.portfolio?.enabled) return false
  return !isMinor(p) || Boolean(p.portfolio.parentApproved)
}

/** Name as shown on public pages (first name + initial for under-18s or unknown age). */
export const shownName = (p: { name: string; dateOfBirth?: string | null }) => publicName(p.name, p.dateOfBirth)

export const PEER_RUBRIC = [
  { key: 'clear', id: 'Jelas dan mudah dipahami', en: 'Clear and easy to follow' },
  { key: 'thoughtful', id: 'Ide yang dipikirkan sendiri', en: 'Own, thoughtful ideas' },
  { key: 'responsible', id: 'Memakai AI dengan bertanggung jawab', en: 'Uses AI responsibly' },
] as const

/** The next classmate's submission for this student to review: same class, not their own, fewest reviews first. */
export async function nextToReview(payload: Payload, userId: number) {
  const classes = (await payload.find({ collection: 'classes', overrideAccess: true, depth: 0, limit: 20, where: { students: { contains: userId } } })).docs.map((c) => c.id)
  if (!classes.length) return null
  const subs = (await payload.find({ collection: 'submissions', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { class: { in: classes } } })).docs.filter((s) => !(s.members ?? []).map(idOf).includes(userId))
  if (!subs.length) return null
  const reviews = (await payload.find({ collection: 'peer-reviews', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { submission: { in: subs.map((s) => s.id) } } })).docs
  const mine = new Set(reviews.filter((r) => idOf(r.reviewer) === userId).map((r) => idOf(r.submission)))
  const count = new Map<number, number>()
  for (const r of reviews) count.set(idOf(r.submission)!, (count.get(idOf(r.submission)!) ?? 0) + 1)
  const open = subs.filter((s) => !mine.has(s.id)).sort((a, b) => (count.get(a.id) ?? 0) - (count.get(b.id) ?? 0) || a.id - b.id)
  return open[0] ?? null
}

export const EVENT_TYPE: Record<string, { id: string; en: string }> = {
  hackathon: { id: 'Hackathon', en: 'Hackathon' },
  challenge_week: { id: 'Pekan tantangan', en: 'Challenge week' },
  demo_day: { id: 'Demo day', en: 'Demo day' },
}
export const EVENT_STATUS: Record<string, { id: string; en: string }> = {
  upcoming: { id: 'Segera', en: 'Coming soon' },
  open: { id: 'Menerima peserta', en: 'Taking entries' },
  judging: { id: 'Penjurian', en: 'Judging' },
  closed: { id: 'Hasil diumumkan', en: 'Results out' },
}

