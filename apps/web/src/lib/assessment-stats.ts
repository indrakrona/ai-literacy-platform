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

const variance = (xs: number[]) => {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1)
}

/**
 * Cronbach's alpha (equals KR-20 for right/wrong items) over attempts that answered every item, with the
 * standard error of measurement in percentage points of the total. null when there is too little data.
 */
export function reliability(attempts: ScoredAttempt[], items: ItemInfo[], minN = 10): { alpha: number; sem: number; n: number; k: number } | null {
  const keys = items.map((i) => String(i.id))
  const rows = attempts.filter((a) => keys.every((k) => typeof a.points[k] === 'number')).map((a) => keys.map((k, j) => a.points[k]! / (items[j]!.maxPoints || 1)))
  const k = keys.length
  if (rows.length < minN || k < 2) return null
  const itemVar = keys.reduce((s, _, j) => s + variance(rows.map((r) => r[j]!)), 0)
  const totals = rows.map((r) => r.reduce((a, c) => a + c, 0))
  const totalVar = variance(totals)
  if (!totalVar) return null
  const alpha = (k / (k - 1)) * (1 - itemVar / totalVar)
  const semPct = (Math.sqrt(totalVar) * Math.sqrt(Math.max(0, 1 - alpha)) / k) * 100
  return { alpha, sem: semPct, n: rows.length, k }
}

/** Share of candidates choosing each original option of a choice item (and the share who skipped). */
export function distractors(responses: { selected?: number[] }[], optionCount: number): { shares: number[]; skipped: number; n: number } {
  const counts = Array.from({ length: optionCount }, () => 0)
  let skipped = 0
  for (const r of responses) {
    if (!r.selected?.length) skipped++
    for (const o of r.selected ?? []) if (o >= 0 && o < optionCount) counts[o]!++
  }
  const n = responses.length
  return { shares: counts.map((c) => (n ? c / n : 0)), skipped: n ? skipped / n : 0, n }
}

/** Quadratic weighted kappa between two raters' scores on a 0..max scale (1 = perfect, 0 = chance). */
export function weightedKappa(pairs: [number, number][], max: number): number | null {
  if (pairs.length < 2 || max < 1) return null
  const k = max + 1
  const obs = Array.from({ length: k }, () => Array.from({ length: k }, () => 0))
  const ra = Array.from({ length: k }, () => 0)
  const rb = Array.from({ length: k }, () => 0)
  for (const [a, b] of pairs) {
    const x = Math.max(0, Math.min(max, Math.round(a)))
    const y = Math.max(0, Math.min(max, Math.round(b)))
    obs[x]![y]!++
    ra[x]!++
    rb[y]!++
  }
  const n = pairs.length
  let num = 0
  let den = 0
  for (let i = 0; i < k; i++)
    for (let j = 0; j < k; j++) {
      const w = ((i - j) ** 2) / ((k - 1) ** 2)
      num += w * obs[i]![j]!
      den += w * ((ra[i]! * rb[j]!) / n)
    }
  return den ? 1 - num / den : 1
}

/** Overall percentage scores in 10-point bins (0–9, 10–19, … 90–100). */
export function scoreHistogram(attempts: ScoredAttempt[]): number[] {
  const bins = Array.from({ length: 10 }, () => 0)
  for (const a of attempts) if (a.report) bins[Math.min(9, Math.floor((a.report.overall ?? 0) / 10))]!++
  return bins
}
