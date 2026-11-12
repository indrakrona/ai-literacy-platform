import type { CollectionConfig, Endpoint, PayloadRequest } from 'payload'
import { hasRole } from '@ailit/shared'
import { canProctor, optionOrdersFor, scoreAttempt, toDisplayed, toOriginal, toPaperItem } from '../lib/ailis'
import type { TestAttempt, TestItem } from '../payload-types'
import { track, type Actor } from '../lib/analytics'
import { notify } from '../lib/notify'
import { addMark, normalizeRating, resolve } from '../lib/marking'
import { getGateway } from '../lib/ai'
import { getSwitches } from '../lib/settings'
import { audit, ipOf } from '../lib/audit'
import { issueCertificate } from '../lib/certificates'
import { bookingForStart } from '../lib/booking'
import { accommodationsFor, effectiveMinutes } from './Accommodations'
import { itemsCsv, loadAnalysis, ratingsCsv, responsesCsv } from '../lib/psychometrics'
import { siteUrl } from '../lib/site-url'

const GRACE_MS = 30_000
/** Answers made before the deadline while offline may arrive this long after it (and are logged). */
const OFFLINE_GRACE_MS = 10 * 60_000

const bad = (error: string, status = 400) => Response.json({ error }, { status })

async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    return ((req.json ? await req.json() : {}) ?? {}) as Record<string, unknown>
  } catch {
    return {}
  }
}

async function ownAttempt(req: PayloadRequest): Promise<TestAttempt | Response> {
  if (!req.user) return bad('Sign in first', 401)
  const id = Number(req.routeParams?.id)
  const attempt = await req.payload.findByID({ collection: 'test-attempts', id, overrideAccess: true, depth: 0 }).catch(() => null)
  if (!attempt) return bad('Not found', 404)
  const candidate = typeof attempt.candidate === 'object' ? attempt.candidate.id : attempt.candidate
  if (candidate !== req.user.id) return bad('Not your attempt', 403)
  return attempt
}

/** Language the candidate reads the test in: the site language cookie, then the profile setting. */
function candidateLocale(req: PayloadRequest): 'id' | 'en' {
  const cookie = req.headers.get('cookie') ?? ''
  const m = cookie.match(/(?:^|;\s*)lang=(id|en)/)
  if (m) return m[1] as 'id' | 'en'
  return (req.user as { preferredLocale?: string } | null)?.preferredLocale === 'en' ? 'en' : 'id'
}

async function formItems(req: PayloadRequest, attempt: TestAttempt, locale: 'id' | 'en' = 'id'): Promise<TestItem[]> {
  const ids = (attempt.itemOrder ?? []) as number[]
  const res = await req.payload.find({ collection: 'test-items', overrideAccess: true, limit: ids.length || 1, depth: 0, locale, fallbackLocale: 'id', where: { id: { in: ids } } })
  const byId = new Map(res.docs.map((d) => [d.id, d]))
  return ids.map((i) => byId.get(i)).filter((x): x is TestItem => Boolean(x))
}

const open = (a: TestAttempt) => a.status === 'in_progress' && new Date(a.deadline).getTime() + GRACE_MS > Date.now()

/** POST /api/test-attempts/start {accessCode} — start (or resume) a test with the proctor's code. */
const start: Endpoint = {
  path: '/start',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return bad('Sign in first', 401)
    if (!(await getSwitches(req.payload)).testsEnabled) return bad('Tes AILIS sedang ditutup sementara. / AILIS tests are temporarily closed.', 503)
    const { accessCode } = await body(req)
    const code = String(accessCode ?? '').trim().toUpperCase()
    const form = (
      await req.payload.find({
        collection: 'test-forms',
        overrideAccess: true,
        depth: 0,
        limit: 1,
        where: { and: [{ accessCode: { equals: code } }, { status: { equals: 'active' } }] },
      })
    ).docs[0]
    if (!form || !form.items?.length) return bad('No active test with this code', 404)

    const existing = await req.payload.find({
      collection: 'test-attempts',
      overrideAccess: true,
      limit: 1,
      depth: 0,
      where: { and: [{ candidate: { equals: req.user.id } }, { form: { equals: form.id } }] },
    })
    if (existing.docs[0]) return Response.json({ attemptId: existing.docs[0].id, resumed: true })

    // Scheduled forms need a confirmed booking (spec A4); the booking is then marked as attended.
    const seat = await bookingForStart(req.payload, form.id, Number(req.user.id))
    if (seat.required && !seat.bookingId) return Response.json({ error: 'booking_required', problem: 'booking_required' }, { status: 403 })

    const order = [...(form.items as (number | { id: number })[])].map((i) => (typeof i === 'object' ? i.id : i))
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j]!, order[i]!]
    }
    const now = Date.now()
    const acc = await accommodationsFor(req.payload, Number(req.user.id))
    const formItemDocs = (await req.payload.find({ collection: 'test-items', overrideAccess: true, depth: 0, limit: order.length || 1, where: { id: { in: order } } })).docs
    const attempt = await req.payload.create({
      collection: 'test-attempts',
      overrideAccess: true,
      data: {
        candidate: Number(req.user.id),
        form: form.id,
        status: 'in_progress',
        startedAt: new Date(now).toISOString(),
        deadline: new Date(now + effectiveMinutes(form.timeLimitMinutes, acc.extraTimePercent) * 60_000).toISOString(),
        accommodations: { ...acc },
        itemOrder: order,
        optionOrder: optionOrdersFor(formItemDocs),
        responses: {},
        integrity: { tabHidden: 0, pastes: 0, fullscreenExits: 0, log: [] },
      },
    })
    if (seat.bookingId) await req.payload.update({ collection: 'bookings', id: seat.bookingId, overrideAccess: true, data: { status: 'attended' } })
    await track(req.payload, { name: 'test_started', user: req.user as unknown as Actor, headers: req.headers, props: { attemptId: attempt.id } })
    return Response.json({ attemptId: attempt.id, resumed: false }, { status: 201 })
  },
}

/** GET /api/test-attempts/:id/paper — questions without answers, plus saved responses. */
const paper: Endpoint = {
  path: '/:id/paper',
  method: 'get',
  handler: async (req) => {
    const attempt = await ownAttempt(req)
    if (attempt instanceof Response) return attempt
    const items = await formItems(req, attempt, candidateLocale(req))
    const orders = (attempt.optionOrder ?? {}) as Record<string, number[]>
    const saved = (attempt.responses ?? {}) as Record<string, { selected?: number[]; text?: string }>
    const responses = Object.fromEntries(Object.entries(saved).map(([k, v]) => [k, v.selected ? { ...v, selected: toDisplayed(v.selected, orders[k]) } : v]))
    return Response.json({
      status: attempt.status,
      deadline: attempt.deadline,
      accommodations: attempt.accommodations ?? null,
      items: items.map((it) => {
        const pi = toPaperItem(it)
        const o = orders[String(it.id)]
        return o ? { ...pi, options: o.map((i) => pi.options[i]!) } : pi
      }),
      responses,
    })
  },
}

/** POST /api/test-attempts/:id/answer {itemId, selected?, text?, log?} — autosave one answer. */
const answer: Endpoint = {
  path: '/:id/answer',
  method: 'post',
  handler: async (req) => {
    const attempt = await ownAttempt(req)
    if (attempt instanceof Response) return attempt
    const b = await body(req)
    const deadline = new Date(attempt.deadline).getTime()
    const queuedAt = typeof b.queuedAt === 'string' ? Date.parse(b.queuedAt) : NaN
    const lateSync = !open(attempt) && attempt.status === 'in_progress' && Number.isFinite(queuedAt) && queuedAt <= deadline && Date.now() <= deadline + OFFLINE_GRACE_MS
    if (!open(attempt) && !lateSync) return bad('Test is closed', 409)
    const itemId = String(b.itemId ?? '')
    if (!(attempt.itemOrder as number[]).map(String).includes(itemId)) return bad('Item not in this test')
    const shown = Array.isArray(b.selected) ? b.selected.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < 10) : undefined
    // The candidate answers in the shuffled order they see; store original option indices.
    const selected = shown ? toOriginal(shown, ((attempt.optionOrder ?? {}) as Record<string, number[]>)[itemId]) : undefined
    const text = typeof b.text === 'string' ? b.text.slice(0, 20_000) : undefined
    const responses = { ...((attempt.responses ?? {}) as Record<string, unknown>) }
    responses[itemId] = { ...(responses[itemId] as object), ...(selected ? { selected } : {}), ...(text !== undefined ? { text } : {}), savedAt: new Date().toISOString() }
    const data: Record<string, unknown> = { responses }
    if (lateSync) {
      const ig = (attempt.integrity ?? {}) as { log?: { at: string; event: string }[] } & Record<string, unknown>
      data.integrity = { ...ig, lateSyncs: Number(ig.lateSyncs ?? 0) + 1, log: [...(ig.log ?? []), { at: new Date().toISOString(), event: 'late_sync' }].slice(-200) }
    }
    await req.payload.update({ collection: 'test-attempts', id: attempt.id, overrideAccess: true, data })
    return Response.json({ saved: true, late: lateSync })
  },
}

/** POST /api/test-attempts/:id/integrity {event} — count tab switches and pastes (spec G10). */
const integrity: Endpoint = {
  path: '/:id/integrity',
  method: 'post',
  handler: async (req) => {
    const attempt = await ownAttempt(req)
    if (attempt instanceof Response) return attempt
    const { event } = await body(req)
    const prev = (attempt.integrity ?? {}) as { tabHidden?: number; pastes?: number; fullscreenExits?: number; log?: { at: string; event: string }[] }
    const counts = { tabHidden: prev.tabHidden ?? 0, pastes: prev.pastes ?? 0, fullscreenExits: prev.fullscreenExits ?? 0 }
    if (event === 'tab_hidden') counts.tabHidden++
    else if (event === 'paste') counts.pastes++
    else if (event === 'fullscreen_exit') {
      // Screen-reader users are not asked to stay in full screen.
      if ((attempt.accommodations as { screenReader?: boolean } | null)?.screenReader) return Response.json({ ok: true, ignored: true })
      counts.fullscreenExits++
    }
    else return bad('Unknown event')
    const log = [...(prev.log ?? []), { at: new Date().toISOString(), event: String(event) }].slice(-200)
    await req.payload.update({ collection: 'test-attempts', id: attempt.id, overrideAccess: true, data: { integrity: { ...counts, log } } })
    return Response.json({ ok: true })
  },
}

/**
 * GET /api/test-attempts/export?kind=responses|items|ratings&form=ID — CSV for the assessment lead (spec G14).
 * Pseudonymous IDs only. Super admins and assessment authors; every export is audited.
 */
const exportData: Endpoint = {
  path: '/export',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req.user as { roles?: string[] }, 'super_admin', 'assessment_author')) return bad('Not allowed', 403)
    const url = new URL(req.url ?? 'http://x')
    const kind = url.searchParams.get('kind') ?? 'responses'
    const form = Number(url.searchParams.get('form')) || undefined
    if (!['responses', 'items', 'ratings'].includes(kind)) return bad('kind must be responses, items or ratings')
    const a = await loadAnalysis(req.payload, form)
    const body = kind === 'responses' ? await responsesCsv(req.payload, a) : kind === 'items' ? itemsCsv(a) : ratingsCsv(a)
    await audit(req.payload, { actor: Number(req.user!.id), action: 'psychometric_export', collection: 'test-attempts', summary: `${kind}${form ? ` form ${form}` : ''}`, ip: ipOf(req) })
    return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="ailis-${kind}${form ? `-form${form}` : ''}.csv"`, 'Cache-Control': 'private, no-store' } })
  },
}

/** POST /api/test-attempts/:id/submit — score choice items; performance tasks go to raters. */
const submit: Endpoint = {
  path: '/:id/submit',
  method: 'post',
  handler: async (req) => {
    const attempt = await ownAttempt(req)
    if (attempt instanceof Response) return attempt
    if (attempt.status !== 'in_progress') return bad('Already submitted', 409)
    const items = await formItems(req, attempt)
    const { points, pendingRatings, report } = scoreAttempt(items, attempt)
    await req.payload.update({
      collection: 'test-attempts',
      id: attempt.id,
      overrideAccess: true,
      data: { status: pendingRatings ? 'awaiting_rating' : 'scored', submittedAt: new Date().toISOString(), points, report },
    })
    const actor = req.user as unknown as Actor
    await track(req.payload, { name: 'test_submitted', user: actor, headers: req.headers, props: { attemptId: attempt.id } })
    if (!pendingRatings) await issueCertificate(req.payload, attempt.id)
    if (!pendingRatings) await notify(req.payload, { userIds: [Number(req.user!.id)], kind: 'score_ready', link: `/tes/${attempt.id}/hasil`, email: false })
    if (!pendingRatings) await track(req.payload, { name: 'score_released', user: actor, headers: req.headers, props: { attemptId: attempt.id, score: (report as { band?: number } | null)?.band ?? 0 } })
    return Response.json({ status: pendingRatings ? 'awaiting_rating' : 'scored' })
  },
}

/** POST /api/test-attempts/:id/rate {itemId, points} — a rater scores a performance task (spec G7). */
const rate: Endpoint = {
  path: '/:id/rate',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user as { roles?: string[] }, 'rater', 'super_admin')) return bad('Not allowed', 403)
    const attempt = await req.payload.findByID({ collection: 'test-attempts', id: Number(req.routeParams?.id), overrideAccess: true, depth: 0 }).catch(() => null)
    if (!attempt) return bad('Not found', 404)
    if (attempt.status !== 'awaiting_rating') return bad('Attempt is not waiting for rating', 409)
    const b = await body(req)
    const items = await formItems(req, attempt)
    const item = items.find((i) => String(i.id) === String(b.itemId))
    if (!item || item.type !== 'performance_task') return bad('Not a performance task in this attempt')
    const max = Math.max(0, ...(item.rubric ?? []).map((r) => r.points))
    const pts = Number(b.points)
    if (!Number.isFinite(pts) || pts < 0 || pts > max) return bad(`points must be between 0 and ${max}`)
    // Double marking: two blind marks; a third rater adjudicates when they differ by 2 or more points.
    const form = await req.payload.findByID({ collection: 'test-forms', id: typeof attempt.form === 'object' ? attempt.form.id : attempt.form, depth: 0, overrideAccess: true }).catch(() => null)
    const double = form?.doubleMarking !== false
    const key = String(item.id)
    const allRatings = { ...((attempt.ratings ?? {}) as Record<string, unknown>) }
    const added = addMark(normalizeRating(allRatings[key]), req.user!.id as number, pts, double)
    if (!added.ok) return bad(added.reason, 409)
    const state = resolve(added.marks, double)
    allRatings[key] = { marks: added.marks, status: state.status, final: state.final }
    const ratings = allRatings
    await audit(req.payload, { actor: Number(req.user!.id), action: 'rate', collection: 'test-attempts', docId: attempt.id, summary: `item ${key}: ${pts} points (${state.status})`, ip: ipOf(req) })
    const pointsNow = { ...((attempt.points ?? {}) as Record<string, number>) }
    if (state.final !== undefined) pointsNow[key] = state.final
    else delete pointsNow[key]
    const merged = { ...attempt, points: pointsNow }
    const { points, pendingRatings, report } = scoreAttempt(items, merged)
    await req.payload.update({
      collection: 'test-attempts',
      id: attempt.id,
      overrideAccess: true,
      data: { points, ratings, report, status: pendingRatings ? 'awaiting_rating' : 'scored' },
    })
    if (!pendingRatings) {
      await issueCertificate(req.payload, attempt.id)
      const candidate = await req.payload.findByID({ collection: 'users', id: typeof attempt.candidate === 'object' ? attempt.candidate.id : attempt.candidate, depth: 0, overrideAccess: true }).catch(() => null)
      const base = siteUrl()
      await notify(req.payload, {
        userIds: [candidate?.id],
        kind: 'score_ready',
        link: `/tes/${attempt.id}/hasil`,
        whatsapp: { template: 'score_ready', params: (u) => [u.name.split(' ')[0] ?? u.name, `${base}/tes/${attempt.id}/hasil`] },
      })
      await track(req.payload, { name: 'score_released', user: candidate, props: { attemptId: attempt.id, score: (report as { band?: number } | null)?.band ?? 0 } })
    }
    return Response.json({ status: pendingRatings ? 'awaiting_rating' : 'scored', itemStatus: state.status })
  },
}

/**
 * POST /api/test-attempts/:id/suggest {itemId} — AI-suggested rubric level for a rater (spec G7).
 * Offered only for single marking and adjudication, so the two blind marks stay independent of the AI.
 * Cached on the attempt so each answer is sent to the model at most once.
 */
const suggest: Endpoint = {
  path: '/:id/suggest',
  method: 'post',
  handler: async (req) => {
    const u = req.user as { id: number; roles?: string[]; preferredLocale?: string } | null
    if (!hasRole(u as { roles?: string[] }, 'rater', 'super_admin')) return bad('Not allowed', 403)
    const attempt = await req.payload.findByID({ collection: 'test-attempts', id: Number(req.routeParams?.id), overrideAccess: true, depth: 0 }).catch(() => null)
    if (!attempt || attempt.status !== 'awaiting_rating') return bad('Not waiting for rating', 409)
    const b = await body(req)
    const items = await formItems(req, attempt)
    const item = items.find((i) => String(i.id) === String(b.itemId))
    if (!item || item.type !== 'performance_task') return bad('Not a performance task in this attempt')
    const form = await req.payload.findByID({ collection: 'test-forms', id: typeof attempt.form === 'object' ? attempt.form.id : attempt.form, depth: 0, overrideAccess: true }).catch(() => null)
    const double = form?.doubleMarking !== false
    const state = resolve(normalizeRating(((attempt.ratings ?? {}) as Record<string, unknown>)[String(item.id)]), double)
    if (double && state.status !== 'needs_adjudication') return bad('AI suggestions are only shown for adjudication, so blind marks stay independent', 409)
    const cache = { ...((attempt.aiSuggestions ?? {}) as Record<string, unknown>) }
    if (cache[String(item.id)]) return Response.json(cache[String(item.id)])
    const answer = (((attempt.responses ?? {}) as Record<string, { text?: string }>)[String(item.id)]?.text) ?? ''
    const gateway = getGateway(req.payload)
    const s = await gateway
      .suggestRubricScore({ stem: item.stem, scenario: item.scenario, answer, rubric: (item.rubric ?? []).map((r) => ({ points: r.points, descriptor: r.descriptor })), locale: u?.preferredLocale === 'en' ? 'en' : 'id' })
      .catch((e: Error) => {
        req.payload.logger.warn(`rubric suggestion failed: ${e.message}`)
        return null
      })
    if (!s) return bad('No suggestion available right now', 503)
    if (s.refused) return bad('The AI declined to suggest a score for this answer', 422)
    const saved = { points: s.points, rationale: s.rationale, model: s.model, mock: gateway.providerName === 'mock', at: new Date().toISOString() }
    cache[String(item.id)] = saved
    await req.payload.update({ collection: 'test-attempts', id: attempt.id, overrideAccess: true, data: { aiSuggestions: cache } })
    return Response.json(saved)
  },
}

export const INCIDENT_TYPES = ['device_issue', 'connection', 'left_room', 'suspected_cheating', 'identity_check', 'other'] as const

/** POST /api/test-attempts/:id/incident {type, note} — a proctor records something that happened during the test. */
const incident: Endpoint = {
  path: '/:id/incident',
  method: 'post',
  handler: async (req) => {
    const u = req.user as { id: number; roles?: string[] } | null
    if (!hasRole(u as { roles?: string[] }, 'proctor', 'super_admin')) return bad('Proctors only', 403)
    const attempt = await req.payload.findByID({ collection: 'test-attempts', id: Number(req.routeParams?.id), overrideAccess: true, depth: 0 }).catch(() => null)
    if (!attempt) return bad('Not found', 404)
    const sessionForm = await req.payload.findByID({ collection: 'test-forms', id: typeof attempt.form === 'object' ? attempt.form.id : attempt.form, depth: 0, overrideAccess: true }).catch(() => null)
    if (!canProctor(sessionForm, u)) return bad('You are not assigned to this session', 403)
    const b = await body(req)
    const type = INCIDENT_TYPES.find((t) => t === b.type)
    if (!type) return bad('Unknown incident type')
    const note = typeof b.note === 'string' ? b.note.trim().slice(0, 1000) : ''
    const incidents = [...((attempt.incidents ?? []) as unknown[]), { at: new Date().toISOString(), by: u!.id, type, note }]
    await req.payload.update({ collection: 'test-attempts', id: attempt.id, overrideAccess: true, data: { incidents } })
    await audit(req.payload, { actor: u!.id, action: 'incident', collection: 'test-attempts', docId: attempt.id, summary: type, ip: ipOf(req) })
    return Response.json({ ok: true, count: incidents.length })
  },
}

export const TestAttempts: CollectionConfig = {
  slug: 'test-attempts',
  admin: {
    defaultColumns: ['candidate', 'form', 'status', 'submittedAt'],
    group: 'AILIS',
    hidden: ({ user }) => !hasRole(user as { roles?: string[] }, 'assessment_author', 'rater', 'proctor', 'super_admin'),
  },
  access: {
    read: ({ req }) => {
      const u = req.user as { id: number; roles?: string[] } | null
      if (!u) return false
      if (hasRole(u, 'assessment_author', 'rater', 'proctor', 'super_admin')) return true
      return { candidate: { equals: u.id } }
    },
    create: () => false,
    update: () => false,
    delete: ({ req }) => hasRole(req.user as { roles?: string[] }, 'super_admin'),
  },
  endpoints: [start, paper, answer, integrity, submit, rate, incident, suggest, exportData],
  fields: [
    { name: 'candidate', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'form', type: 'relationship', relationTo: 'test-forms', required: true, index: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'in_progress',
      options: ['in_progress', 'awaiting_rating', 'scored'].map((v) => ({ value: v, label: v.replace('_', ' ') })),
    },
    { name: 'startedAt', type: 'date', required: true },
    { name: 'deadline', type: 'date', required: true },
    { name: 'submittedAt', type: 'date' },
    { name: 'itemOrder', type: 'json', required: true },
    { name: 'responses', type: 'json' },
    { name: 'points', type: 'json' },
    { name: 'ratings', type: 'json' },
    { name: 'optionOrder', type: 'json', admin: { description: 'Shuffled answer order per item for this candidate' } },
    { name: 'integrity', type: 'json' },
    { name: 'incidents', type: 'json', admin: { description: 'Logged by the proctor' } },
    { name: 'aiSuggestions', type: 'json', admin: { description: 'AI-suggested rubric levels shown to adjudicating raters (advice only)' } },
    { name: 'report', type: 'json' },
    { name: 'accommodations', type: 'json', admin: { description: 'Accommodations applied when the attempt started' } },
  ],
}
