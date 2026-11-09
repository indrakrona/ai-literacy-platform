/**
 * Admin dashboard metrics computed from first-party analytics events (spec: Analytics dashboards).
 * Pure functions over plain event rows so they are easy to test; the loader at the bottom reads the DB.
 * At pilot scale this reads the last 90 days into memory; move to SQL views when volume grows.
 */
import type { Payload } from 'payload'

export interface EventRow {
  name: string
  aid: string
  role?: string | null
  school?: number | null
  track?: string | null
  ageBand?: string | null
  device?: string | null
  props?: Record<string, unknown> | null
  createdAt: string
}

const DAY = 24 * 3600 * 1000
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

/** Rough AI cost per 1M tokens in USD, blended input/output. Placeholder until real billing data is wired in. */
export const AI_COST_PER_MTOK_USD = Number(process.env.AI_COST_PER_MTOK_USD || 5)

export function overview(events: EventRow[], now = Date.now()) {
  const activeIn = (days: number) => new Set(events.filter((e) => now - Date.parse(e.createdAt) < days * DAY).map((e) => e.aid)).size
  const signups = (days: number) => events.filter((e) => e.name === 'signed_up' && now - Date.parse(e.createdAt) < days * DAY).length
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const tokensToday = events.filter((e) => e.name === 'ai_message_sent' && Date.parse(e.createdAt) >= startOfToday.getTime()).reduce((a, e) => a + num(e.props?.tokens), 0)
  const daily: { day: string; active: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d0 = startOfToday.getTime() - i * DAY
    const ids = new Set(events.filter((e) => { const t = Date.parse(e.createdAt); return t >= d0 && t < d0 + DAY }).map((e) => e.aid))
    daily.push({ day: new Date(d0).toISOString().slice(0, 10), active: ids.size })
  }
  return {
    dau: activeIn(1),
    wau: activeIn(7),
    mau: activeIn(30),
    signups7: signups(7),
    signups30: signups(30),
    tokensToday,
    aiCostTodayUsd: (tokensToday / 1_000_000) * AI_COST_PER_MTOK_USD,
    daily,
  }
}

export const FUNNEL_STEPS = [
  { key: 'signed_up', id: 'Mendaftar', en: 'Signed up' },
  { key: 'ready', id: 'Siap belajar (izin orang tua / dewasa)', en: 'Ready to learn (consent or adult)' },
  { key: 'lesson_started', id: 'Membuka pelajaran pertama', en: 'Opened a first lesson' },
  { key: 'lesson_completed', id: 'Menyelesaikan pelajaran', en: 'Completed a lesson' },
  { key: 'lessons_6', id: 'Menyelesaikan 6+ pelajaran', en: 'Completed 6+ lessons' },
  { key: 'test_started', id: 'Mengikuti tes AILIS', en: 'Took the AILIS test' },
  { key: 'score_released', id: 'Menerima skor', en: 'Received a score' },
  { key: 'certificate_shared', id: 'Membagikan sertifikat', en: 'Shared a certificate' },
] as const

/** Journey funnel over people who signed up in the window; each step counts distinct people. */
export function funnel(events: EventRow[]) {
  const by = new Map<string, EventRow[]>()
  for (const e of events) by.set(e.aid, [...(by.get(e.aid) ?? []), e])
  const cohort = [...by.entries()].filter(([, es]) => es.some((e) => e.name === 'signed_up'))
  const has = (es: EventRow[], n: string) => es.some((e) => e.name === n)
  const counts = FUNNEL_STEPS.map((s) =>
    cohort.filter(([, es]) => {
      if (s.key === 'ready') return has(es, 'consent_given') || es.some((e) => e.name === 'signed_up' && e.ageBand === '18_plus')
      if (s.key === 'lessons_6') return new Set(es.filter((e) => e.name === 'lesson_completed').map((e) => e.props?.lessonId)).size >= 6
      return has(es, s.key)
    }).length,
  )
  return FUNNEL_STEPS.map((s, i) => ({ ...s, count: counts[i]!, ofFirst: counts[0] ? counts[i]! / counts[0] : 0, ofPrev: i && counts[i - 1] ? counts[i]! / counts[i - 1]! : 1 }))
}

/** Weekly cohorts by sign-up week: share of the cohort active in each following week. */
export function retention(events: EventRow[], now = Date.now(), weeks = 6) {
  const firstSeen = new Map<string, number>()
  for (const e of events) if (e.name === 'signed_up') firstSeen.set(e.aid, Date.parse(e.createdAt))
  const activeWeeks = new Map<string, Set<number>>()
  for (const e of events) {
    const s = firstSeen.get(e.aid)
    if (s === undefined) continue
    const w = Math.floor((Date.parse(e.createdAt) - s) / (7 * DAY))
    if (!activeWeeks.has(e.aid)) activeWeeks.set(e.aid, new Set())
    activeWeeks.get(e.aid)!.add(w)
  }
  const rows: { week: string; size: number; rates: (number | null)[] }[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = now - (i + 1) * 7 * DAY
    const members = [...firstSeen.entries()].filter(([, t]) => t >= start && t < start + 7 * DAY).map(([a]) => a)
    const rates: (number | null)[] = []
    for (let w = 1; w < weeks; w++) {
      if (start + w * 7 * DAY > now) rates.push(null)
      else rates.push(members.length ? members.filter((a) => activeWeeks.get(a)?.has(w)).length / members.length : 0)
    }
    rows.push({ week: new Date(start).toISOString().slice(0, 10), size: members.length, rates })
  }
  return rows
}

/** Most common "what people did next" steps, and where journeys stop. */
export function paths(events: EventRow[], top = 12) {
  const by = new Map<string, EventRow[]>()
  for (const e of [...events].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))) by.set(e.aid, [...(by.get(e.aid) ?? []), e])
  const pairs = new Map<string, number>()
  const exits = new Map<string, number>()
  for (const es of by.values()) {
    const names = es.map((e) => e.name).filter((n, i, arr) => n !== arr[i - 1])
    for (let i = 0; i + 1 < names.length; i++) pairs.set(`${names[i]} → ${names[i + 1]}`, (pairs.get(`${names[i]} → ${names[i + 1]}`) ?? 0) + 1)
    const last = names.at(-1)
    if (last) exits.set(last, (exits.get(last) ?? 0) + 1)
  }
  const sorted = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, top).map(([k, n]) => ({ step: k, count: n }))
  return { transitions: sorted(pairs), lastSteps: sorted(exits) }
}

/** Per-lesson start/completion and quiz results; hardest = lowest quiz average. */
export function learning(events: EventRow[]) {
  const m = new Map<number, { started: Set<string>; completed: Set<string>; quizRight: number; quizMax: number; quizzes: number }>()
  const get = (id: number) => {
    if (!m.has(id)) m.set(id, { started: new Set(), completed: new Set(), quizRight: 0, quizMax: 0, quizzes: 0 })
    return m.get(id)!
  }
  for (const e of events) {
    const id = num(e.props?.lessonId)
    if (!id) continue
    if (e.name === 'lesson_started') get(id).started.add(e.aid)
    if (e.name === 'lesson_completed') get(id).completed.add(e.aid)
    if (e.name === 'quiz_submitted') {
      const r = get(id)
      r.quizRight += num(e.props?.score)
      r.quizMax += num(e.props?.max)
      r.quizzes++
    }
  }
  return [...m.entries()].map(([lessonId, r]) => ({
    lessonId,
    started: r.started.size,
    completed: r.completed.size,
    completionRate: r.started.size ? Math.min(1, r.completed.size / r.started.size) : null,
    quizzes: r.quizzes,
    quizAverage: r.quizMax ? r.quizRight / r.quizMax : null,
  }))
}

export function aiLab(events: EventRow[]) {
  const sent = events.filter((e) => e.name === 'ai_message_sent')
  const people = new Set(sent.map((e) => e.aid)).size
  const categories = new Map<string, number>()
  for (const e of events.filter((x) => x.name === 'ai_message_flagged')) {
    const c = String(e.props?.category ?? 'other')
    categories.set(c, (categories.get(c) ?? 0) + 1)
  }
  const bySchool = new Map<number, { messages: number; tokens: number }>()
  for (const e of sent) {
    const s = e.school ?? 0
    const r = bySchool.get(s) ?? { messages: 0, tokens: 0 }
    r.messages++
    r.tokens += num(e.props?.tokens)
    bySchool.set(s, r)
  }
  return {
    messages: sent.length,
    people,
    perPerson: people ? sent.length / people : 0,
    shieldBlocks: events.filter((e) => e.name === 'shield_blocked').length,
    flagged: [...categories.entries()].sort((a, b) => b[1] - a[1]).map(([category, count]) => ({ category, count })),
    bySchool: [...bySchool.entries()].map(([school, r]) => ({ school, ...r, costUsd: (r.tokens / 1_000_000) * AI_COST_PER_MTOK_USD })).sort((a, b) => b.tokens - a.tokens),
  }
}

export async function loadEvents(payload: Payload, days = 90): Promise<EventRow[]> {
  const res = await payload.find({
    collection: 'analytics-events',
    overrideAccess: true,
    depth: 0,
    pagination: false,
    limit: 0,
    where: { createdAt: { greater_than: new Date(Date.now() - days * DAY).toISOString() } },
    sort: 'createdAt',
  })
  return res.docs.map((d) => ({ name: d.name, aid: d.aid, role: d.role, school: d.school, track: d.track, ageBand: d.ageBand, device: d.device, props: d.props as Record<string, unknown> | null, createdAt: d.createdAt }))
}

/** Consent completion from the users table (more reliable than events for people who signed up before tracking). */
export async function consentStats(payload: Payload) {
  const count = async (s: string) => (await payload.count({ collection: 'users', overrideAccess: true, where: { consentStatus: { equals: s } } })).totalDocs
  const [granted, pending, declined] = await Promise.all([count('granted'), count('pending'), count('declined')])
  const asked = granted + pending + declined
  return { granted, pending, declined, rate: asked ? granted / asked : null }
}
