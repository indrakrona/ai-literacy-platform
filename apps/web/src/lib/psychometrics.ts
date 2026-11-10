/**
 * Psychometric analysis and exports for the assessment lead (spec G14). Candidates and raters appear only
 * under pseudonymous IDs (the same as in usage analytics), so files can be analysed outside the platform
 * (jMetrik, R, Excel) without names or emails.
 */
import type { Payload, Where } from 'payload'
import { domainOf, type Competency } from '@ailit/shared'
import { analyticsId, ageBand } from './analytics'
import { agreement, normalizeRating, type Mark } from './marking'
import { bandDistribution, distractors, domainProfile, itemStats, reliability, scoreHistogram, weightedKappa, type ItemInfo, type ScoredAttempt } from './assessment-stats'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
export const pseudo = (prefix: 'C' | 'R', id: number) => `${prefix}-${analyticsId(id).slice(0, 10)}`

type Attempt = { id: number; candidate: unknown; form: unknown; status: string; startedAt: string; points?: unknown; responses?: unknown; ratings?: unknown; report?: unknown; accommodations?: unknown }

export async function loadAnalysis(payload: Payload, formId?: number) {
  const where: Where = formId ? { form: { equals: formId } } : {}
  const all = (await payload.find({ collection: 'test-attempts', overrideAccess: true, depth: 0, pagination: false, limit: 0, where })).docs as unknown as Attempt[]
  const scored = all.filter((a) => a.status === 'scored' && a.report)
  const asScored: ScoredAttempt[] = scored.map((a) => ({ points: (a.points ?? {}) as Record<string, number>, report: a.report as ScoredAttempt['report'] }))
  const itemIds = [...new Set(scored.flatMap((a) => Object.keys((a.points ?? {}) as object).map(Number)))]
  const items = itemIds.length ? (await payload.find({ collection: 'test-items', overrideAccess: true, depth: 0, locale: 'id', limit: itemIds.length, where: { id: { in: itemIds } } })).docs : []
  const info: (ItemInfo & { type: string; competency: string; options: number })[] = items
    .map((it) => ({ id: it.id, code: it.code, type: it.type, competency: it.competency as string, maxPoints: it.type === 'performance_task' ? Math.max(0, ...(it.rubric ?? []).map((r) => r.points)) : 1, options: (it.options ?? []).length }))
    .sort((a, b) => a.code.localeCompare(b.code))
  const stats = itemStats(asScored, info)
  const dist = new Map(
    info.filter((i) => i.type !== 'performance_task').map((i) => [i.id, distractors(scored.filter((a) => typeof ((a.points ?? {}) as Record<string, number>)[String(i.id)] === 'number').map((a) => ((a.responses ?? {}) as Record<string, { selected?: number[] }>)[String(i.id)] ?? {}), i.options)]),
  )
  const keys = new Map(items.map((it) => [it.id, (it.options ?? []).map((o) => Boolean(o.correct))]))

  // Rater agreement on performance tasks, across every attempt that has two marks.
  const marked: { item: number; max: number; marks: Mark[] }[] = []
  const maxOf = new Map(info.map((i) => [i.id, i.maxPoints]))
  for (const a of all) for (const [k, v] of Object.entries((a.ratings ?? {}) as Record<string, unknown>)) marked.push({ item: Number(k), max: maxOf.get(Number(k)) ?? 4, marks: normalizeRating(v) })
  const overall = agreement(marked.map((m) => m.marks))
  const raters = [...new Set(marked.flatMap((m) => m.marks.filter((x) => x.role !== 'adjudication').map((x) => x.rater)))]
  const perRater = raters.map((r) => ({ rater: r, pseudo: pseudo('R', r), ...agreement(marked.map((m) => m.marks), r) })).filter((r) => r.pairs > 0)
  const byMax = new Map<number, [number, number][]>()
  for (const m of marked) {
    const f = m.marks.find((x) => x.role === 'first')
    const s = m.marks.find((x) => x.role === 'second')
    if (f && s) byMax.set(m.max, [...(byMax.get(m.max) ?? []), [f.points, s.points]])
  }
  const kappa = [...byMax.entries()].map(([max, pairs]) => ({ max, pairs: pairs.length, qwk: weightedKappa(pairs, max) }))

  return {
    attempts: all.length,
    scored: scored.length,
    accommodated: scored.filter((a) => a.accommodations && Object.values(a.accommodations as object).some(Boolean)).length,
    bands: bandDistribution(asScored),
    histogram: scoreHistogram(asScored),
    domains: domainProfile(asScored),
    reliability: formId ? reliability(asScored, info) : null,
    items: stats.map((s) => {
      const i = info.find((x) => x.id === s.id)!
      return { ...s, type: i.type, competency: i.competency, domain: domainOf(i.competency as Competency), distractors: dist.get(s.id) ?? null, key: keys.get(s.id) ?? [] }
    }),
    raters: { overall, perRater, kappa },
    raw: { all, scored, info },
  }
}

const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
const csv = (rows: unknown[][]) => '﻿' + rows.map((r) => r.map(q).join(',')).join('\n')

/** One row per scored attempt: pseudonymous candidate, context, total, band and each item's score (0–1). */
export async function responsesCsv(payload: Payload, a: Awaited<ReturnType<typeof loadAnalysis>>) {
  const users = new Map(
    (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { id: { in: [...new Set(a.raw.scored.map((x) => idOf(x.candidate)!))] } } })).docs.map((u) => [u.id, u]),
  )
  const forms = new Map((await payload.find({ collection: 'test-forms', overrideAccess: true, depth: 0, pagination: false, limit: 0 })).docs.map((f) => [f.id, f]))
  const head = ['candidate', 'form', 'level', 'age_band', 'accommodated', 'date', 'overall_pct', 'band', 'provisional', ...a.raw.info.map((i) => i.code)]
  const rows = a.raw.scored.map((x) => {
    const u = users.get(idOf(x.candidate)!)
    const f = forms.get(idOf(x.form)!)
    const r = x.report as { overall: number; band: number; provisional?: boolean }
    const pts = (x.points ?? {}) as Record<string, number>
    const acc = x.accommodations && Object.values(x.accommodations as object).some(Boolean)
    return [pseudo('C', idOf(x.candidate)!), f?.name ?? idOf(x.form), f?.level ?? '', ageBand(u?.dateOfBirth, new Date(x.startedAt)), acc ? 1 : 0, x.startedAt.slice(0, 10), r.overall, r.band, r.provisional ? 1 : 0, ...a.raw.info.map((i) => (typeof pts[String(i.id)] === 'number' ? Math.round((pts[String(i.id)]! / (i.maxPoints || 1)) * 1000) / 1000 : ''))]
  })
  return csv([head, ...rows])
}

/** One row per item: classical statistics and option choice shares (key marked with *). */
export function itemsCsv(a: Awaited<ReturnType<typeof loadAnalysis>>) {
  const maxOpt = Math.max(0, ...a.items.map((i) => i.distractors?.shares.length ?? 0))
  const letters = Array.from({ length: maxOpt }, (_, i) => String.fromCharCode(65 + i))
  const head = ['item', 'type', 'competency', 'domain', 'n', 'difficulty_p', 'discrimination_r', 'flags', ...letters.map((l) => `option_${l}`), 'skipped']
  const rows = a.items.map((i) => [
    i.code, i.type, i.competency, i.domain, i.n, i.difficulty.toFixed(3), i.discrimination === null ? '' : i.discrimination.toFixed(3), i.flags.join(' '),
    ...letters.map((_, j) => (i.distractors && j < i.distractors.shares.length ? `${(i.distractors.shares[j]! * 100).toFixed(1)}${i.key[j] ? '*' : ''}` : '')),
    i.distractors ? (i.distractors.skipped * 100).toFixed(1) : '',
  ])
  return csv([head, ...rows])
}

/** One row per mark on a performance task: attempt, item, pseudonymous rater, role and points. */
export function ratingsCsv(a: Awaited<ReturnType<typeof loadAnalysis>>) {
  const codes = new Map(a.raw.info.map((i) => [String(i.id), i.code]))
  const rows: unknown[][] = []
  for (const x of a.raw.all) {
    for (const [k, v] of Object.entries((x.ratings ?? {}) as Record<string, { status?: string; final?: number }>)) {
      for (const m of normalizeRating(v)) rows.push([pseudo('C', idOf(x.candidate)!), codes.get(k) ?? k, pseudo('R', m.rater), m.role, m.points, v?.final ?? '', v?.status ?? '', m.at?.slice(0, 10) ?? ''])
    }
  }
  return csv([['candidate', 'item', 'rater', 'role', 'points', 'final', 'status', 'date'], ...rows])
}
