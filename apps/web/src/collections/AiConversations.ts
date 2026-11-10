import type { Access, CollectionConfig, Endpoint, Where } from 'payload'
import { hasFullAccess, hasRole } from '@ailit/shared'
import { getGateway } from '../lib/ai'
import { track, type Actor } from '../lib/analytics'
import { award, bigIdeaFromCompetency, getRules } from '../lib/gamification'

/** Students read their own; teachers read their classes' students; staff read all (spec D5). */
const readConversations: Access = async ({ req }) => {
  const u = req.user as { id: number; roles?: string[] } | null
  if (!u) return false
  if (hasRole(u, 'super_admin')) return true
  if (hasRole(u, 'teacher')) {
    const classes = await req.payload.find({ collection: 'classes', overrideAccess: true, depth: 0, limit: 200, where: { teachers: { contains: u.id } } })
    const ids = classes.docs.flatMap((c) => (c.students ?? []).map((s) => (typeof s === 'object' ? s.id : s)))
    const or: Where[] = [{ user: { equals: u.id } }]
    if (ids.length) or.push({ user: { in: ids } })
    const result: Where = { or }
    return result
  }
  const own: Where = { user: { equals: u.id } }
  return own
}

interface StoredMessage {
  role: 'user' | 'assistant'
  content: string
  at: string
  status?: string
}

/** POST /api/ai-conversations/send {activity, conversation?, message, locale?} */
const send: Endpoint = {
  path: '/send',
  method: 'post',
  handler: async (req) => {
    const user = req.user as { id: number; roles?: string[]; school?: number | { id: number } | null; consentStatus?: string } | null
    if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 })
    if (hasRole(user, 'student') && !hasFullAccess(user)) {
      return Response.json({ error: 'Parent or guardian permission is needed to use the AI Lab' }, { status: 403 })
    }
    let b: { activity?: unknown; conversation?: unknown; message?: unknown; locale?: unknown } = {}
    try {
      b = (req.json ? await req.json() : {}) as typeof b
    } catch {
      /* ignore */
    }
    const message = typeof b.message === 'string' ? b.message.trim().slice(0, 2000) : ''
    if (!message) return Response.json({ error: 'message is required' }, { status: 400 })
    const locale = b.locale === 'en' ? 'en' : 'id'

    const activity = await req.payload.findByID({ collection: 'ai-activities', id: Number(b.activity), depth: 0, overrideAccess: true }).catch(() => null)
    if (!activity) return Response.json({ error: 'Activity not found' }, { status: 404 })

    let convo = b.conversation
      ? await req.payload.findByID({ collection: 'ai-conversations', id: Number(b.conversation), depth: 0, overrideAccess: true }).catch(() => null)
      : null
    if (convo && (typeof convo.user === 'object' ? convo.user.id : convo.user) !== user.id) convo = null

    const history = ((convo?.messages ?? []) as StoredMessage[])
      .filter((m) => m.status === undefined || m.status === 'answered')
      .map(({ role, content }) => ({ role, content }))
    const schoolId = typeof user.school === 'object' ? user.school?.id : user.school

    const gateway = getGateway(req.payload, activity.messageLimit)
    const outcome = await gateway.chat({
      userId: String(user.id),
      schoolId: schoolId ? String(schoolId) : undefined,
      locale,
      tier: activity.tier,
      activityInstructions: activity.instructions,
      history,
      message,
    })

    const now = new Date().toISOString()
    // Messages the Shield held are stored redacted, never verbatim.
    const userMsg: StoredMessage = { role: 'user', content: outcome.status === 'shield' ? '[ditahan Perisai Data]' : message, at: now, status: outcome.status }
    const reply: StoredMessage = { role: 'assistant', content: outcome.text, at: now, status: outcome.status }
    const flags = new Set<string>((convo?.flags as string[] | undefined) ?? [])
    if (outcome.status === 'blocked' || outcome.status === 'answered') for (const f of outcome.flags) flags.add(f)
    if (outcome.status === 'shield') flags.add('shield')
    const tokens = (convo?.tokens ?? 0) + (outcome.status === 'answered' ? outcome.inputTokens + outcome.outputTokens : 0)
    const data = {
      user: user.id,
      activity: activity.id,
      school: schoolId ?? undefined,
      messages: [...((convo?.messages ?? []) as StoredMessage[]), userMsg, reply],
      flags: [...flags],
      flagged: flags.size > 0,
      tokens,
      provider: gateway.providerName,
    }
    const saved = convo
      ? await req.payload.update({ collection: 'ai-conversations', id: convo.id, overrideAccess: true, data })
      : await req.payload.create({ collection: 'ai-conversations', overrideAccess: true, data })
    const actor = user as unknown as Actor
    if (outcome.status === 'answered') {
      const rules = await getRules(req.payload)
      await award(req.payload, { userId: user.id, source: 'ai_lab_session', sourceId: saved.id, bigIdea: bigIdeaFromCompetency(activity.competency), xp: rules.aiLabSession })
    }
    const ev = { activityId: activity.id, status: outcome.status, tokens: outcome.status === 'answered' ? outcome.inputTokens + outcome.outputTokens : 0 }
    await track(req.payload, { name: 'ai_message_sent', user: actor, headers: req.headers, props: ev })
    if (outcome.status === 'shield') await track(req.payload, { name: 'shield_blocked', user: actor, headers: req.headers, props: { activityId: activity.id } })
    if ((outcome.status === 'blocked' || outcome.status === 'answered') && outcome.flags.length) {
      await track(req.payload, { name: 'ai_message_flagged', user: actor, headers: req.headers, props: { activityId: activity.id, category: outcome.flags[0] } })
    }
    return Response.json({ conversation: saved.id, status: outcome.status, reply: outcome.text, mock: gateway.providerName === 'mock' })
  },
}

export const AiConversations: CollectionConfig = {
  slug: 'ai-conversations',
  admin: { defaultColumns: ['user', 'activity', 'flagged', 'tokens', 'updatedAt'], group: 'Learning' },
  access: { read: readConversations, create: () => false, update: () => false, delete: ({ req }) => hasRole(req.user as { roles?: string[] }, 'super_admin') },
  endpoints: [send],
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'activity', type: 'relationship', relationTo: 'ai-activities', required: true },
    { name: 'school', type: 'relationship', relationTo: 'schools', index: true },
    { name: 'messages', type: 'json', required: true },
    { name: 'flags', type: 'json' },
    { name: 'flagged', type: 'checkbox', defaultValue: false, index: true },
    { name: 'tokens', type: 'number', defaultValue: 0 },
    { name: 'provider', type: 'text' },
  ],
}
