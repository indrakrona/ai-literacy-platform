/**
 * AILIS test engine — pure functions, no database or framework code, so the independent test body
 * can run it separately from Impact Thinklab (spec: Code organisation).
 */
import { SCORE_DOMAINS, domainOf, type Competency, type ScoreDomain } from '@ailit/shared'

export const ITEM_TYPES = ['single_choice', 'multiple_choice', 'scenario_judgment', 'performance_task'] as const
export type ItemType = (typeof ITEM_TYPES)[number]

export const ITEM_STATES = ['draft', 'review', 'approved', 'piloted', 'live', 'retired'] as const
export type ItemState = (typeof ITEM_STATES)[number]

/** Allowed review-workflow moves (spec G2). */
export const ITEM_TRANSITIONS: Record<ItemState, ItemState[]> = {
  draft: ['review'],
  review: ['draft', 'approved'],
  approved: ['review', 'piloted', 'live'],
  piloted: ['live', 'review', 'retired'],
  live: ['retired'],
  retired: [],
}

export function canTransition(from: ItemState, to: ItemState): boolean {
  return from === to || ITEM_TRANSITIONS[from].includes(to)
}

export interface EngineItem {
  id: string | number
  type: ItemType
  competency: Competency
  difficulty: 1 | 2 | 3
  /** For choice items: indices of correct options. Performance tasks are scored by raters. */
  correct?: number[]
  /** Maximum points: 1 for choice items, rubric maximum for performance tasks. */
  maxPoints: number
}

export interface Blueprint {
  /** Number of choice/scenario items per domain. */
  itemsPerDomain: number
  /** Number of performance tasks in the form. */
  performanceTasks: number
}

/** Small deterministic PRNG so a form can be rebuilt from its seed (audit trail). */
export function seededRandom(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 1_000_000) / 1_000_000
  }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export interface AssembleResult {
  itemIds: (string | number)[]
  shortfall: Partial<Record<ScoreDomain | 'performance', number>>
}

/**
 * Build a form from live items following the blueprint: N choice items per domain, spread across
 * difficulties where possible, plus performance tasks. Reports any shortfall instead of failing.
 */
export function assembleForm(items: EngineItem[], blueprint: Blueprint, seed: number): AssembleResult {
  const rand = seededRandom(seed)
  const chosen: (string | number)[] = []
  const shortfall: AssembleResult['shortfall'] = {}

  for (const domain of SCORE_DOMAINS) {
    const pool = items.filter((i) => i.type !== 'performance_task' && domainOf(i.competency) === domain)
    const byDifficulty = [1, 2, 3].map((d) => shuffle(pool.filter((i) => i.difficulty === d), rand))
    const picked: EngineItem[] = []
    let d = 0
    while (picked.length < blueprint.itemsPerDomain && byDifficulty.some((b) => b.length)) {
      const bucket = byDifficulty[d % 3]!
      const next = bucket.shift()
      if (next) picked.push(next)
      d++
    }
    if (picked.length < blueprint.itemsPerDomain) shortfall[domain] = blueprint.itemsPerDomain - picked.length
    chosen.push(...shuffle(picked, rand).map((i) => i.id))
  }

  const tasks = shuffle(items.filter((i) => i.type === 'performance_task'), rand).slice(0, blueprint.performanceTasks)
  if (tasks.length < blueprint.performanceTasks) shortfall.performance = blueprint.performanceTasks - tasks.length
  chosen.push(...tasks.map((i) => i.id))
  return { itemIds: chosen, shortfall }
}

/** Single choice: exact match. Multiple choice: all-or-nothing (no partial credit in v1). */
export function scoreChoice(item: EngineItem, selected: number[]): number {
  const correct = [...(item.correct ?? [])].sort()
  const given = [...new Set(selected)].sort()
  return correct.length > 0 && correct.length === given.length && correct.every((c, i) => c === given[i]) ? item.maxPoints : 0
}

export type DomainScores = Record<ScoreDomain, number>

/** Percentage (0–100) per domain from points earned on each item. */
export function domainScores(items: EngineItem[], points: Record<string, number>): DomainScores {
  const acc = Object.fromEntries(SCORE_DOMAINS.map((d) => [d, { got: 0, max: 0 }])) as Record<ScoreDomain, { got: number; max: number }>
  for (const item of items) {
    const a = acc[domainOf(item.competency)]
    a.max += item.maxPoints
    a.got += Math.min(item.maxPoints, Math.max(0, points[String(item.id)] ?? 0))
  }
  return Object.fromEntries(SCORE_DOMAINS.map((d) => [d, acc[d].max ? Math.round((acc[d].got / acc[d].max) * 100) : 0])) as DomainScores
}

/**
 * PROVISIONAL cut-scores: overall percentage needed for each band 1–9 (band 0 below the first).
 * Replaced by the expert standard-setting panel after pilot data (ClickUp: "Set band cut-scores").
 */
export const PROVISIONAL_CUT_SCORES = [10, 20, 30, 40, 50, 60, 70, 80, 90] as const

export function toBand(percent: number, cutScores: readonly number[] = PROVISIONAL_CUT_SCORES): number {
  let band = 0
  for (const [i, cut] of cutScores.entries()) if (percent >= cut) band = i + 1
  return band
}

/** Overall = mean of the five domain percentages, so every domain weighs the same. */
export function overallPercent(scores: DomainScores): number {
  return Math.round(SCORE_DOMAINS.reduce((sum, d) => sum + scores[d], 0) / SCORE_DOMAINS.length)
}

export interface ScoreReport {
  band: number
  overall: number
  subScores: DomainScores
  subBands: Record<ScoreDomain, number>
  provisional: boolean
}

export function buildReport(items: EngineItem[], points: Record<string, number>, cutScores?: readonly number[]): ScoreReport {
  const subScores = domainScores(items, points)
  const overall = overallPercent(subScores)
  return {
    band: toBand(overall, cutScores),
    overall,
    subScores,
    subBands: Object.fromEntries(SCORE_DOMAINS.map((d) => [d, toBand(subScores[d], cutScores)])) as Record<ScoreDomain, number>,
    provisional: !cutScores,
  }
}
