import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { enqueue, flush, readQueue, type KeyValueStore } from '../src/lib/offline-queue'
import { TestAttempts } from '../src/collections/TestAttempts'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`
const memory = (): KeyValueStore => {
  const m = new Map<string, string>()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }
}

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('offline answer queue', () => {
  it('keeps the latest answer per item until the server accepts it', async () => {
    const store = memory()
    enqueue(store, 7, { itemId: 1, selected: [0], queuedAt: 't1' })
    enqueue(store, 7, { itemId: 1, selected: [2], queuedAt: 't2' })
    enqueue(store, 7, { itemId: 2, text: 'x', queuedAt: 't3' })
    expect(readQueue(store, 7)['1']!.selected).toEqual([2])
    expect(await flush(store, 7, async () => false)).toBe(2) // still offline
    let calls = 0
    expect(await flush(store, 7, async () => (++calls, true))).toBe(0)
    expect(calls).toBe(2)
    expect(readQueue(store, 7)).toEqual({})
    expect(readQueue(undefined, 7)).toEqual({})
  })
})

describe('late sync after the deadline', () => {
  it('accepts answers given before the deadline for 10 minutes, logs them, and refuses answers given after it', async () => {
    const item = await payload.create({ collection: 'test-items', overrideAccess: true, data: { code: `OFF-${uniq()}`, type: 'single_choice', competency: 'DIS-1', level: 'smp', difficulty: '1', state: 'draft', stem: 'Q', options: [{ text: 'a', correct: true }, { text: 'b' }] } })
    const form = await payload.create({ collection: 'test-forms', overrideAccess: true, data: { name: `OFF ${uniq()}`, level: 'smp', status: 'active', timeLimitMinutes: 30, items: [item.id], blueprint: { itemsPerDomain: 1, performanceTasks: 0 } } as never })
    const cand = await payload.create({ collection: 'users', overrideAccess: true, data: { name: 'C', email: `c${uniq()}@example.test`, password: 'Passw0rd!', roles: ['student'], consentStatus: 'not_required' } })
    const deadline = new Date(Date.now() - 2 * 60_000) // ended two minutes ago
    const attempt = await payload.create({ collection: 'test-attempts', overrideAccess: true, data: { candidate: cand.id, form: form.id, status: 'in_progress', startedAt: new Date(Date.now() - 32 * 60_000).toISOString(), deadline: deadline.toISOString(), itemOrder: [item.id], responses: {} } })
    const answer = TestAttempts.endpoints ? TestAttempts.endpoints.find((e) => e.path === '/:id/answer')! : null!
    const call = async (body: unknown) => (await answer.handler({ payload, user: cand, json: async () => body, routeParams: { id: attempt.id }, headers: new Headers() } as unknown as PayloadRequest)).status

    expect(await call({ itemId: item.id, selected: [0] })).toBe(409) // no queue time: closed
    expect(await call({ itemId: item.id, selected: [0], queuedAt: new Date().toISOString() })).toBe(409) // answered after the deadline
    expect(await call({ itemId: item.id, selected: [0], queuedAt: new Date(deadline.getTime() - 60_000).toISOString() })).toBe(200)
    const saved = await payload.findByID({ collection: 'test-attempts', id: attempt.id, overrideAccess: true })
    expect((saved.responses as Record<string, { selected: number[] }>)[String(item.id)]!.selected).toEqual([0])
    expect((saved.integrity as { lateSyncs: number }).lateSyncs).toBe(1)
  })
})
