/**
 * Gamification basics (spec E1–E2): XP per big idea, levels, badges and class challenges.
 * Teen-appropriate by design: progress is personal; there are no individual public rankings.
 * XP is a ledger: each action awards once (unique key), so repeating it earns nothing more.
 */
import type { Payload, Where } from 'payload'
import { BIG_IDEAS, bigIdeaOf, type BigIdea, type Competency } from '@ailit/shared'
import { notify } from './notify'
import { track } from './analytics'

export type XpSource = 'lesson_complete' | 'quiz_perfect' | 'ai_lab_session' | 'project_submitted' | 'project_graded' | 'challenge_complete'

export interface XpRules {
  lessonComplete: number
  quizPerfect: number
  aiLabSession: number
  projectSubmitted: number
  projectGradedPerPoint: number
  challengeComplete: number
  /** XP needed to reach level 1, 2, 3 … within one big idea (first entry should be 0). */
  levelThresholds: number[]
}

export const DEFAULT_RULES: XpRules = {
  lessonComplete: 10,
  quizPerfect: 5,
  aiLabSession: 5,
  projectSubmitted: 15,
  projectGradedPerPoint: 2,
  challengeComplete: 20,
  levelThresholds: [0, 20, 50, 90, 140],
}

export async function getRules(payload: Payload): Promise<XpRules> {
  const g = await payload.findGlobal({ slug: 'gamification', overrideAccess: true }).catch(() => null)
  const thresholds = (g?.levelThresholds ?? []).map((t) => Number(t.xp)).filter((n) => Number.isFinite(n) && n >= 0).sort((a, b) => a - b)
  const n = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d)
  return {
    lessonComplete: n(g?.lessonComplete, DEFAULT_RULES.lessonComplete),
    quizPerfect: n(g?.quizPerfect, DEFAULT_RULES.quizPerfect),
    aiLabSession: n(g?.aiLabSession, DEFAULT_RULES.aiLabSession),
    projectSubmitted: n(g?.projectSubmitted, DEFAULT_RULES.projectSubmitted),
    projectGradedPerPoint: n(g?.projectGradedPerPoint, DEFAULT_RULES.projectGradedPerPoint),
    challengeComplete: n(g?.challengeComplete, DEFAULT_RULES.challengeComplete),
    levelThresholds: thresholds.length ? thresholds : DEFAULT_RULES.levelThresholds,
  }
}

/** Level (1-based) for an XP amount, plus progress towards the next level. */
export function levelFor(xp: number, thresholds: number[]) {
  let level = 1
  thresholds.forEach((t, i) => {
    if (xp >= t) level = i + 1
  })
  const next = thresholds[level]
  const current = thresholds[level - 1] ?? 0
  return { level, max: thresholds.length, next: next ?? null, progress: next === undefined ? 1 : (xp - current) / (next - current) }
}

export const bigIdeaFromCompetency = (c: unknown): BigIdea | null => (typeof c === 'string' && /^[A-Z]{3}-\d$/.test(c) ? bigIdeaOf(c as Competency) : null)

export interface Stats {
  lessonsTotal: number
  lessonsByBigIdea: Record<BigIdea, number>
  levelsByBigIdea: Record<BigIdea, number>
  projectsGraded: number
  aiLabSessions: number
  challengesCompleted: number
}

export type BadgeCriterion = 'lessons_total' | 'lessons_in_big_idea' | 'level_in_big_idea' | 'all_big_ideas_level' | 'projects_graded' | 'ai_lab_sessions' | 'challenges_completed'

/** Whether a badge's criterion is met by these stats. */
export function meets(stats: Stats, criterion: BadgeCriterion, target: number, bigIdea?: BigIdea | null): boolean {
  switch (criterion) {
    case 'lessons_total': return stats.lessonsTotal >= target
    case 'lessons_in_big_idea': return !!bigIdea && stats.lessonsByBigIdea[bigIdea] >= target
    case 'level_in_big_idea': return !!bigIdea && stats.levelsByBigIdea[bigIdea] >= target
    case 'all_big_ideas_level': return BIG_IDEAS.every((b) => stats.levelsByBigIdea[b] >= target)
    case 'projects_graded': return stats.projectsGraded >= target
    case 'ai_lab_sessions': return stats.aiLabSessions >= target
    case 'challenges_completed': return stats.challengesCompleted >= target
    default: return false
  }
}

const zero = () => Object.fromEntries(BIG_IDEAS.map((b) => [b, 0])) as Record<BigIdea, number>

/** XP per big idea, levels and the counts badges are based on. */
export async function progressOf(payload: Payload, userId: number) {
  const rules = await getRules(payload)
  const ledger = (await payload.find({ collection: 'xp-events', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { user: { equals: userId } } })).docs
  const xp = zero()
  for (const e of ledger) if (e.bigIdea && e.bigIdea in xp) xp[e.bigIdea as BigIdea] += e.xp
  const levels = Object.fromEntries(BIG_IDEAS.map((b) => [b, levelFor(xp[b], rules.levelThresholds)])) as Record<BigIdea, ReturnType<typeof levelFor>>
  const lessonsByBigIdea = zero()
  for (const e of ledger) if (e.source === 'lesson_complete' && e.bigIdea) lessonsByBigIdea[e.bigIdea as BigIdea]++
  const stats: Stats = {
    lessonsTotal: ledger.filter((e) => e.source === 'lesson_complete').length,
    lessonsByBigIdea,
    levelsByBigIdea: Object.fromEntries(BIG_IDEAS.map((b) => [b, levels[b].level])) as Record<BigIdea, number>,
    projectsGraded: ledger.filter((e) => e.source === 'project_graded').length,
    aiLabSessions: ledger.filter((e) => e.source === 'ai_lab_session').length,
    challengesCompleted: ledger.filter((e) => e.source === 'challenge_complete').length,
  }
  return { xp, total: Object.values(xp).reduce((a, c) => a + c, 0), levels, stats, rules }
}

/** Award any badges the user now qualifies for. Returns the newly earned badge ids. */
export async function evaluateBadges(payload: Payload, userId: number): Promise<number[]> {
  const { stats } = await progressOf(payload, userId)
  const badges = (await payload.find({ collection: 'badges', overrideAccess: true, depth: 0, limit: 200, where: { active: { equals: true } } })).docs
  const owned = new Set((await payload.find({ collection: 'user-badges', overrideAccess: true, depth: 0, limit: 500, where: { user: { equals: userId } } })).docs.map((ub) => (typeof ub.badge === 'object' ? ub.badge.id : ub.badge)))
  const earned: number[] = []
  for (const b of badges) {
    if (owned.has(b.id)) continue
    if (!meets(stats, b.criterion as BadgeCriterion, b.target ?? 1, (b.bigIdea as BigIdea | null) ?? null)) continue
    try {
      await payload.create({ collection: 'user-badges', overrideAccess: true, data: { user: userId, badge: b.id, key: `${userId}:${b.id}` } })
      earned.push(b.id)
    } catch {
      /* already awarded by a concurrent request */
    }
  }
  if (earned.length) {
    const user = await payload.findByID({ collection: 'users', id: userId, depth: 0, overrideAccess: true }).catch(() => null)
    const names = badges.filter((b) => earned.includes(b.id)).map((b) => b.name).join(', ')
    await notify(payload, { userIds: [userId], kind: 'badge_earned', vars: { badge: names }, link: '/beranda#kemajuan', email: false })
    for (const id of earned) await track(payload, { name: 'badge_earned', user, props: { status: String(id) } })
  }
  return earned
}

export interface AwardInput {
  userId: number
  source: XpSource
  sourceId: string | number
  bigIdea: BigIdea | null
  xp: number
}

/** Add XP once per (user, source, sourceId); then check badges and challenges. Never throws. */
export async function award(payload: Payload, input: AwardInput): Promise<boolean> {
  try {
    if (!input.bigIdea || input.xp <= 0) return false
    const key = `${input.userId}:${input.source}:${input.sourceId}`
    const exists = await payload.count({ collection: 'xp-events', overrideAccess: true, where: { key: { equals: key } } })
    if (exists.totalDocs) return false
    await payload.create({ collection: 'xp-events', overrideAccess: true, data: { user: input.userId, source: input.source, sourceId: String(input.sourceId), bigIdea: input.bigIdea, xp: Math.round(input.xp), key } })
    if (input.source === 'lesson_complete') await checkChallenges(payload, input.userId)
    await evaluateBadges(payload, input.userId)
    return true
  } catch (e) {
    payload.logger.warn(`gamification: award failed: ${(e as Error).message}`)
    return false
  }
}

/** Lessons completed in a big idea within a challenge's window. */
export async function challengeProgress(payload: Payload, userId: number, ch: { bigIdea?: string | null; startsAt?: string | null; endsAt?: string | null }) {
  const where: Where = {
    and: [
      { user: { equals: userId } },
      { source: { equals: 'lesson_complete' } },
      ...(ch.bigIdea ? [{ bigIdea: { equals: ch.bigIdea } }] : []),
      ...(ch.startsAt ? [{ createdAt: { greater_than_equal: ch.startsAt } }] : []),
      ...(ch.endsAt ? [{ createdAt: { less_than_equal: ch.endsAt } }] : []),
    ],
  }
  return (await payload.count({ collection: 'xp-events', overrideAccess: true, where })).totalDocs
}

/** Complete any joined challenges whose target is reached (awards XP once). */
export async function checkChallenges(payload: Payload, userId: number) {
  const rules = await getRules(payload)
  const now = new Date().toISOString()
  const joined = (await payload.find({ collection: 'challenges', overrideAccess: true, depth: 0, limit: 50, where: { and: [{ participants: { contains: userId } }, { endsAt: { greater_than_equal: now } }] } })).docs
  for (const ch of joined) {
    const done = await challengeProgress(payload, userId, ch)
    if (done >= (ch.target ?? 1)) {
      await award(payload, { userId, source: 'challenge_complete', sourceId: ch.id, bigIdea: (ch.bigIdea as BigIdea) ?? 'thrive', xp: rules.challengeComplete })
    }
  }
}
