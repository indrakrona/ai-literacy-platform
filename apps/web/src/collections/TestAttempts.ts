import type { CollectionConfig, Endpoint, PayloadRequest } from 'payload'
import { hasRole } from '@ailit/shared'
import { scoreAttempt, toPaperItem } from '../lib/ailis'
import type { TestAttempt, TestItem } from '../payload-types'

const GRACE_MS = 30_000

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

async function formItems(req: PayloadRequest, attempt: TestAttempt): Promise<TestItem[]> {
  const ids = (attempt.itemOrder ?? []) as number[]
  const res = await req.payload.find({ collection: 'test-items', overrideAccess: true, limit: ids.length || 1, depth: 0, where: { id: { in: ids } } })
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

    const order = [...(form.items as (number | { id: number })[])].map((i) => (typeof i === 'object' ? i.id : i))
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j]!, order[i]!]
    }
    const now = Date.now()
    const attempt = await req.payload.create({
      collection: 'test-attempts',
      overrideAccess: true,
      data: {
        candidate: Number(req.user.id),
        form: form.id,
        status: 'in_progress',
        startedAt: new Date(now).toISOString(),
        deadline: new Date(now + form.timeLimitMinutes * 60_000).toISOString(),
        itemOrder: order,
        responses: {},
        integrity: { tabHidden: 0, pastes: 0 },
      },
    })
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
    const items = await formItems(req, attempt)
    return Response.json({
      status: attempt.status,
      deadline: attempt.deadline,
      items: items.map(toPaperItem),
      responses: attempt.responses ?? {},
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
    if (!open(attempt)) return bad('Test is closed', 409)
    const b = await body(req)
    const itemId = String(b.itemId ?? '')
    if (!(attempt.itemOrder as number[]).map(String).includes(itemId)) return bad('Item not in this test')
    const selected = Array.isArray(b.selected) ? b.selected.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < 10) : undefined
    const text = typeof b.text === 'string' ? b.text.slice(0, 20_000) : undefined
    const responses = { ...((attempt.responses ?? {}) as Record<string, unknown>) }
    responses[itemId] = { ...(responses[itemId] as object), ...(selected ? { selected } : {}), ...(text !== undefined ? { text } : {}), savedAt: new Date().toISOString() }
    await req.payload.update({ collection: 'test-attempts', id: attempt.id, overrideAccess: true, data: { responses } })
    return Response.json({ saved: true })
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
    const counts = { tabHidden: 0, pastes: 0, ...((attempt.integrity ?? {}) as Record<string, number>) }
    if (event === 'tab_hidden') counts.tabHidden++
    else if (event === 'paste') counts.pastes++
    else return bad('Unknown event')
    await req.payload.update({ collection: 'test-attempts', id: attempt.id, overrideAccess: true, data: { integrity: counts } })
    return Response.json({ ok: true })
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
    const ratings = { ...((attempt.ratings ?? {}) as Record<string, unknown>), [String(item.id)]: { points: pts, rater: req.user!.id, at: new Date().toISOString() } }
    const merged = { ...attempt, points: { ...((attempt.points ?? {}) as Record<string, number>), [String(item.id)]: pts } }
    const { points, pendingRatings, report } = scoreAttempt(items, merged)
    await req.payload.update({
      collection: 'test-attempts',
      id: attempt.id,
      overrideAccess: true,
      data: { points, ratings, report, status: pendingRatings ? 'awaiting_rating' : 'scored' },
    })
    return Response.json({ status: pendingRatings ? 'awaiting_rating' : 'scored' })
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
  endpoints: [start, paper, answer, integrity, submit, rate],
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
    { name: 'integrity', type: 'json' },
    { name: 'report', type: 'json' },
  ],
}
