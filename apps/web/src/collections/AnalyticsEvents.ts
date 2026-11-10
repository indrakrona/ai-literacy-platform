import type { CollectionConfig, Endpoint } from 'payload'
import { hasRole } from '@ailit/shared'
import { CLIENT_EVENTS, EVENT_NAMES, track, type Actor, type EventName } from '../lib/analytics'
import { award, bigIdeaFromCompetency, getRules } from '../lib/gamification'

/** POST /api/analytics-events/track {name, track?, props?} — the few events only the browser knows about. */
const trackEndpoint: Endpoint = {
  path: '/track',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ ok: false }, { status: 401 })
    let b: { name?: unknown; track?: unknown; props?: unknown } = {}
    try {
      b = ((req.json ? await req.json() : {}) ?? {}) as typeof b
    } catch {
      /* empty */
    }
    const name = String(b.name) as EventName
    if (!CLIENT_EVENTS.includes(name)) return Response.json({ ok: false, error: 'Unknown event' }, { status: 400 })
    await track(req.payload, {
      name,
      user: req.user as unknown as Actor,
      headers: req.headers,
      track: typeof b.track === 'string' ? b.track.slice(0, 80) : null,
      props: b.props && typeof b.props === 'object' ? (b.props as Record<string, unknown>) : undefined,
    })
    // A quiz answered all correctly earns XP once per lesson (low stakes; the quiz runs in the browser).
    const p = (b.props ?? {}) as { lessonId?: unknown; score?: unknown; max?: unknown }
    if (name === 'quiz_submitted' && Number(p.max) > 0 && Number(p.score) === Number(p.max)) {
      const lesson = await req.payload.findByID({ collection: 'lessons', id: Number(p.lessonId), depth: 0, overrideAccess: true }).catch(() => null)
      if (lesson && (lesson.quiz?.length ?? 0) === Number(p.max)) {
        const rules = await getRules(req.payload)
        await award(req.payload, { userId: Number(req.user.id), source: 'quiz_perfect', sourceId: lesson.id, bigIdea: bigIdeaFromCompetency(lesson.competency), xp: rules.quizPerfect })
      }
    }
    return Response.json({ ok: true })
  },
}

export const AnalyticsEvents: CollectionConfig = {
  slug: 'analytics-events',
  admin: {
    group: 'Business',
    defaultColumns: ['name', 'role', 'ageBand', 'device', 'createdAt'],
    description: 'Pseudonymous product events. No names, emails or exact ages.',
    hidden: ({ user }) => !hasRole(user as { roles?: string[] }, 'super_admin'),
  },
  access: {
    read: ({ req }) => hasRole(req.user as { roles?: string[] }, 'super_admin'),
    create: () => false,
    update: () => false,
    delete: ({ req }) => hasRole(req.user as { roles?: string[] }, 'super_admin'),
  },
  endpoints: [trackEndpoint],
  fields: [
    { name: 'name', type: 'select', required: true, index: true, options: EVENT_NAMES.map((v) => ({ value: v, label: v })) },
    { name: 'aid', label: 'Analytics ID', type: 'text', required: true, index: true },
    { name: 'role', type: 'text' },
    { name: 'school', type: 'number', index: true },
    { name: 'track', type: 'text' },
    { name: 'ageBand', type: 'text' },
    { name: 'device', type: 'text' },
    { name: 'props', type: 'json' },
  ],
}
