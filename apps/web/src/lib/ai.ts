import type { Payload } from 'payload'
import { AIGateway, AnthropicProvider, DEFAULT_LIMITS, MockProvider, type UsageStore } from '@ailit/ai-gateway'

/** Today's usage, counted from stored conversations (UTC day). */
function usageStore(payload: Payload): UsageStore {
  const since = () => {
    const d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    return d.toISOString()
  }
  return {
    async studentMessagesToday(userId) {
      const res = await payload.find({
        collection: 'ai-conversations',
        overrideAccess: true,
        depth: 0,
        limit: 200,
        where: { and: [{ user: { equals: Number(userId) } }, { updatedAt: { greater_than_equal: since() } }] },
      })
      const start = since()
      return res.docs.reduce(
        (n, c) => n + ((c.messages as { role: string; at: string }[]) ?? []).filter((m) => m.role === 'user' && m.at >= start).length,
        0,
      )
    },
    async schoolTokensToday(schoolId) {
      const res = await payload.find({
        collection: 'ai-conversations',
        overrideAccess: true,
        depth: 0,
        limit: 5000,
        where: { and: [{ school: { equals: Number(schoolId) } }, { updatedAt: { greater_than_equal: since() } }] },
      })
      return res.docs.reduce((n, c) => n + (c.tokens ?? 0), 0)
    },
  }
}

/** Real Claude when ANTHROPIC_API_KEY is set; otherwise the free mock provider. */
export function getGateway(payload: Payload, conversationMessages = DEFAULT_LIMITS.conversationMessages, limits: { studentDailyMessages?: number; schoolDailyTokens?: number } = {}) {
  const provider = process.env.ANTHROPIC_API_KEY ? new AnthropicProvider(process.env.ANTHROPIC_API_KEY) : new MockProvider()
  return new AIGateway(provider, usageStore(payload), { ...DEFAULT_LIMITS, ...limits, conversationMessages })
}
