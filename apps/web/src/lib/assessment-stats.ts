/**
 * Assessment analytics for the admin dashboard (spec: Analytics > Assessment, P1).
 * Classical test theory on scored attempts: item difficulty (p-value) and discrimination
 * (corrected item-total correlation). Pure functions so they can be tested and reused.
 */
import { SCORE_DOMAINS, type ScoreDomain } from '@ailit/shared'

export interface ScoredAttempt {
  points: Record<string, number>
  report: { band: number; overall: number; subScores: Record<ScoreDomain, number> } | null
}

export interface ItemInfo {
  id: number
  code: string
  maxPoints: number
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, c) => a + c, 0) / xs.length : 0)

function correlation(xs: number[], ys: number[]): number | null {
  if (xs.length < 3) return null
  const mx = mean(xs)
  const my = mean(ys)
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i]! - mx) * (ys[i]! - my)
    dx += (xs[i]! - mx) ** 2
    dy += (ys[i]! - my) ** 2
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : null
}

/** How many attempts landed in each band (0–9). */
export function bandDistribution(attempts: ScoredAttempt[]): number[] {
  const bands = Array.from({ length: 10 }, () => 0)
  for (const a of attempts) if (a.report) bands[Math.max(0, Math.min(9, Math.round(a.report.band)))]!++
  return bands
}

/** Average sub-score (percentage) per score domain. */
export function domainProfile(attempts: ScoredAttempt[]): Record<ScoreDomain, number> {
  const withReport = attempts.filter((a) => a.report)
  return Object.fromEntries(SCORE_DOMAINS.map((d) => [d, mean(withReport.map((a) => a.report!.subScores[d] ?? 0))])) as Record<ScoreDomain, number>
}

export interface ItemStat {
  id: number
  code: string
  n: number
  /** Mean proportion of the maximum score (0 = nobody, 1 = everybody). */
  difficulty: number
  /** Corrected item-total correlation; null when there is too little data. */
  discrimination: number | null
  flags: ('too_hard' | 'too_easy' | 'weak_discrimination' | 'negative_discrimination')[]
}

/** Per-item statistics across attempts that included the item. Flags follow common CTT rules of thumb. */
export function itemStats(attempts: ScoredAttempt[], items: ItemInfo[], minN = 10): ItemStat[] {
  const byId = new Map(items.map((i) => [String(i.id), i]))
  const totals = attempts.map((a) => Object.entries(a.points).reduce((s, [id, p]) => s + p / (byId.get(id)?.maxPoints || 1), 0))
  return items.map((item) => {
    const key = String(item.id)
    const rows = attempts.map((a, i) => ({ p: a.points[key], total: totals[i]! })).filter((r) => typeof r.p === 'number') as { p: number; total: number }[]
    const scores = rows.map((r) => r.p / (item.maxPoints || 1))
    const rest = rows.map((r, i) => r.total - scores[i]!)
    const difficulty = mean(scores)
    const discrimination = rows.length >= minN ? correlation(scores, rest) : null
    const flags: ItemStat['flags'] = []
    if (rows.length >= minN) {
      if (difficulty < 0.2) flags.push('too_hard')
      if (difficulty > 0.9) flags.push('too_easy')
      if (discrimination !== null && discrimination < 0) flags.push('negative_discrimination')
      else if (discrimination !== null && discrimination < 0.2) flags.push('weak_discrimination')
    }
    return { id: item.id, code: item.code, n: rows.length, difficulty, discrimination, flags }
  })
}
