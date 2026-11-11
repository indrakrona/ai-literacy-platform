import type { CollectionConfig, Endpoint, Payload, PayloadRequest } from 'payload'
import { hasRole } from '@ailit/shared'

/**
 * Live class (spec H4, multi-device): the teacher presents a session; students join with a 6-character code
 * on their phones, follow along, and answer the teacher's quick questions. The teacher sees answer counts
 * only (no names), so nobody is singled out. Sessions end on their own after 3 hours.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const HOURS = 3
const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
const bad = (error: string, status = 400) => Response.json({ error }, { status })
type U = { id: number; roles?: string[] } | null

export const liveCode = (rand: () => number = Math.random) => Array.from({ length: 6 }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)]).join('')

async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    return ((req.json ? await req.json() : {}) ?? {}) as Record<string, unknown>
  } catch {
    return {}
  }
}

const isLive = (s: { active?: boolean | null; expiresAt: string }) => Boolean(s.active) && new Date(s.expiresAt) > new Date()

async function lessonAt(payload: Payload, trackSlug: string, order: number, locale: 'id' | 'en') {
  const track = (await payload.find({ collection: 'tracks', overrideAccess: true, locale, limit: 1, where: { slug: { equals: trackSlug } } })).docs[0]
  if (!track) return null
  const units = (await payload.find({ collection: 'units', overrideAccess: true, depth: 0, limit: 20, where: { track: { equals: track.id } } })).docs.map((u) => u.id)
  const lesson = (await payload.find({ collection: 'lessons', overrideAccess: true, depth: 0, locale, limit: 1, where: { and: [{ unit: { in: units } }, { order: { equals: order } }, { _status: { equals: 'published' } }] } })).docs[0]
  return lesson ? { track, lesson } : null
}

/** Counts per option for the current question (never who answered what). */
export function tally(responses: Record<string, number> | null | undefined, options: number): number[] {
  const counts = Array.from({ length: options }, () => 0)
  for (const v of Object.values(responses ?? {})) if (v >= 0 && v < options) counts[v]!++
  return counts
}

/** POST /api/live-sessions/start {track, order, class?} — a teacher starts (or restarts) a live class. */
const start: Endpoint = {
  path: '/start',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!hasRole(u, 'teacher', 'school_admin', 'super_admin')) return bad('Teachers only', 403)
    const b = await body(req)
    const track = String(b.track ?? '')
    const order = Math.max(1, Math.floor(Number(b.order) || 1))
    if (!(await lessonAt(req.payload, track, order, 'id'))) return bad('Session not found', 404)
    // One live class per teacher at a time.
    const mine = await req.payload.find({ collection: 'live-sessions', overrideAccess: true, depth: 0, limit: 10, where: { and: [{ teacher: { equals: u!.id } }, { active: { equals: true } }] } })
    for (const s of mine.docs) await req.payload.update({ collection: 'live-sessions', id: s.id, overrideAccess: true, data: { active: false } })
    for (let i = 0; i < 5; i++) {
      try {
        const s = await req.payload.create({ collection: 'live-sessions', overrideAccess: true, data: { code: liveCode(), teacher: u!.id, class: Number(b.class) || undefined, track, order, question: null, responses: {}, active: true, expiresAt: new Date(Date.now() + HOURS * 3_600_000).toISOString() } })
        return Response.json({ id: s.id, code: s.code }, { status: 201 })
      } catch (e) {
        if (!/unique|duplicate/i.test((e as Error).message)) throw e
      }
    }
    return bad('Try again', 503)
  },
}

async function ownLive(req: PayloadRequest) {
  const u = req.user as unknown as U
  const s = await req.payload.findByID({ collection: 'live-sessions', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
  if (!s || !u || (idOf(s.teacher) !== u.id && !hasRole(u, 'super_admin'))) return null
  return s
}

/** POST /api/live-sessions/:id/control {order?, question?: number | null, end?: boolean} — the teacher moves on, asks, or ends. */
const control: Endpoint = {
  path: '/:id/control',
  method: 'post',
  handler: async (req) => {
    const s = await ownLive(req)
    if (!s) return bad('Not found', 404)
    const b = await body(req)
    if (b.end) {
      await req.payload.update({ collection: 'live-sessions', id: s.id, overrideAccess: true, data: { active: false } })
      return Response.json({ ok: true })
    }
    const data: Record<string, unknown> = {}
    if (b.order !== undefined) {
      const order = Math.max(1, Math.floor(Number(b.order)))
      if (!(await lessonAt(req.payload, s.track, order, 'id'))) return bad('Session not found', 404)
      Object.assign(data, { order, question: null, responses: {} })
    }
    if (b.question !== undefined) Object.assign(data, { question: b.question === null ? null : Math.max(0, Math.floor(Number(b.question))), responses: {} })
    await req.payload.update({ collection: 'live-sessions', id: s.id, overrideAccess: true, data })
    return Response.json({ ok: true })
  },
}

/** POST /api/live-sessions/join {code} — a signed-in student joins with the code on the board. */
const join: Endpoint = {
  path: '/join',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return bad('Sign in first', 401)
    const code = String((await body(req)).code ?? '').trim().toUpperCase()
    const s = (await req.payload.find({ collection: 'live-sessions', overrideAccess: true, depth: 0, limit: 1, where: { code: { equals: code } } })).docs[0]
    if (!s || !isLive(s)) return bad('No live class with this code', 404)
    return Response.json({ id: s.id })
  },
}

/** GET /api/live-sessions/:id/state?lang= — what students see (and, for the teacher, the answer counts). Polled every few seconds. */
const state: Endpoint = {
  path: '/:id/state',
  method: 'get',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    const s = await req.payload.findByID({ collection: 'live-sessions', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!s) return bad('Not found', 404)
    const locale = new URL(req.url ?? 'http://x').searchParams.get('lang') === 'en' ? 'en' : 'id'
    const at = await lessonAt(req.payload, s.track, s.order, locale)
    const quiz = (at?.lesson.quiz ?? []) as { prompt: string; options?: { text: string }[] | null }[]
    const q = s.question !== null && s.question !== undefined ? quiz[s.question] : undefined
    const teacher = idOf(s.teacher) === u.id || hasRole(u, 'super_admin')
    const responses = (s.responses ?? {}) as Record<string, number>
    return Response.json({
      live: isLive(s),
      order: s.order,
      title: at?.lesson.title ?? '',
      objective: at?.lesson.objective ?? '',
      questions: teacher ? quiz.map((x) => x.prompt) : undefined,
      question: q ? { index: s.question, prompt: q.prompt, options: (q.options ?? []).map((o) => o.text) } : null,
      myAnswer: responses[String(u.id)] ?? null,
      counts: teacher && q ? tally(responses, (q.options ?? []).length) : undefined,
      answered: teacher ? Object.keys(responses).length : undefined,
    })
  },
}

/** POST /api/live-sessions/:id/answer {option} — a student answers the current question (can change their mind). */
const answer: Endpoint = {
  path: '/:id/answer',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    const s = await req.payload.findByID({ collection: 'live-sessions', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!s || !isLive(s) || s.question === null || s.question === undefined) return bad('No open question', 409)
    const option = Math.floor(Number((await body(req)).option))
    if (!(option >= 0 && option < 8)) return bad('Choose an option')
    const responses = { ...((s.responses ?? {}) as Record<string, number>), [String(u.id)]: option }
    await req.payload.update({ collection: 'live-sessions', id: s.id, overrideAccess: true, data: { responses } })
    return Response.json({ ok: true })
  },
}

export const LiveSessions: CollectionConfig = {
  slug: 'live-sessions',
  admin: { hidden: true },
  access: { read: () => false, create: () => false, update: () => false, delete: ({ req }) => hasRole(req.user as U, 'super_admin') },
  endpoints: [start, control, join, state, answer],
  fields: [
    { name: 'code', type: 'text', required: true, unique: true, index: true },
    { name: 'teacher', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'class', type: 'relationship', relationTo: 'classes' },
    { name: 'track', type: 'text', required: true },
    { name: 'order', type: 'number', required: true },
    { name: 'question', type: 'number' },
    { name: 'responses', type: 'json' },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true },
    { name: 'expiresAt', type: 'date', required: true },
  ],
}
