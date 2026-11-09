import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { ageBand, analyticsId, deviceOf, sanitizeProps, track } from '../src/lib/analytics'
import { aiLab, funnel, learning, overview, paths, retention, type EventRow } from '../src/lib/metrics'
import { AnalyticsEvents } from '../src/collections/AnalyticsEvents'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('analytics privacy rules', () => {
  it('uses a stable pseudonymous id, age bands and an allow-list of properties', () => {
    expect(analyticsId(7)).toBe(analyticsId(7))
    expect(analyticsId(7)).not.toContain('7')
    expect(analyticsId(7)).not.toBe(analyticsId(8))
    const now = new Date('2026-11-09')
    expect(ageBand('2012-01-01', now)).toBe('13_15')
    expect(ageBand('2009-12-01', now)).toBe('16_17')
    expect(ageBand('2000-01-01', now)).toBe('18_plus')
    expect(ageBand(null, now)).toBe('unknown')
    expect(deviceOf('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile')).toBe('mobile')
    expect(deviceOf('Mozilla/5.0 (Windows NT 10.0)')).toBe('desktop')
    const p = sanitizeProps({ lessonId: 3, email: 'a@b.c', name: 'Ayu', status: 'answered', category: 'x'.repeat(80), message: 'hello' })
    expect(p).toEqual({ lessonId: 3, status: 'answered' })
  })

  it('stores events without names or emails, and only super admins can read them', async () => {
    const student = await payload.create({ collection: 'users', overrideAccess: true, data: { name: 'Siti Rahma', email: `siti${uniq()}@example.test`, password: 'Passw0rd!', roles: ['student'], dateOfBirth: '2011-04-02', consentStatus: 'granted' } })
    await track(payload, { name: 'lesson_completed', user: student, headers: new Headers({ 'user-agent': 'iPhone Mobile' }), props: { lessonId: 1, note: 'Siti Rahma' } })
    const row = (await payload.find({ collection: 'analytics-events', overrideAccess: true, where: { aid: { equals: analyticsId(student.id) } } })).docs[0]!
    expect(row).toMatchObject({ name: 'lesson_completed', role: 'student', ageBand: '13_15', device: 'mobile', props: { lessonId: 1 } })
    expect(JSON.stringify(row)).not.toMatch(/Siti|example\.test|2011-04-02/)
    await expect(payload.find({ collection: 'analytics-events', overrideAccess: false, user: student })).rejects.toThrow()
  })

  it('accepts only browser-allowed events from the client endpoint', async () => {
    const user = await payload.create({ collection: 'users', overrideAccess: true, data: { name: 'U', email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: ['student'], consentStatus: 'not_required' } })
    const ep = AnalyticsEvents.endpoints ? AnalyticsEvents.endpoints.find((e) => e.path === '/track')! : null
    const call = async (body: unknown) => (await ep!.handler({ payload, user, headers: new Headers(), json: async () => body } as unknown as PayloadRequest)).status
    expect(await call({ name: 'payment_completed' })).toBe(400)
    expect(await call({ name: 'quiz_submitted', props: { lessonId: 2, score: 3, max: 4 } })).toBe(200)
  })
})

describe('dashboard metrics', () => {
  const now = Date.parse('2026-11-09T12:00:00Z')
  const at = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString()
  const ev = (aid: string, name: string, daysAgo: number, extra: Partial<EventRow> = {}): EventRow => ({ aid, name, createdAt: at(daysAgo), ...extra })
  const events: EventRow[] = [
    ev('a', 'signed_up', 20, { ageBand: '13_15' }), ev('a', 'consent_given', 19), ev('a', 'lesson_started', 19, { props: { lessonId: 1 } }), ev('a', 'lesson_completed', 19, { props: { lessonId: 1 } }), ev('a', 'quiz_submitted', 19, { props: { lessonId: 1, score: 1, max: 4 } }), ev('a', 'lesson_started', 10, { props: { lessonId: 2 } }),
    ev('b', 'signed_up', 20, { ageBand: '18_plus' }), ev('b', 'lesson_started', 0.1, { props: { lessonId: 1 } }), ev('b', 'ai_message_sent', 0.1, { school: 5, props: { tokens: 2000 } }), ev('b', 'shield_blocked', 0.1),
    ev('c', 'signed_up', 3, { ageBand: '13_15' }),
  ]

  it('computes overview, funnel, retention, paths, learning and AI Lab figures', () => {
    const o = overview(events, now)
    expect(o).toMatchObject({ dau: 1, wau: 2, mau: 3, signups7: 1, signups30: 3 })
    const f = funnel(events)
    expect(f.map((s) => s.count).slice(0, 4)).toEqual([3, 2, 2, 1])
    const r = retention(events, now)
    const cohort = r.find((x) => x.size === 2)!
    expect(cohort.rates[0]).toBe(0.5)
    expect(paths(events).transitions[0]!.count).toBeGreaterThanOrEqual(1)
    const l = learning(events).find((x) => x.lessonId === 1)!
    expect(l).toMatchObject({ started: 2, completed: 1, completionRate: 0.5, quizAverage: 0.25 })
    const a = aiLab(events)
    expect(a).toMatchObject({ messages: 1, people: 1, shieldBlocks: 1 })
    expect(a.bySchool[0]).toMatchObject({ school: 5, tokens: 2000 })
  })
})
