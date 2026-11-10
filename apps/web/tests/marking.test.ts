import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { addMark, agreement, normalizeRating, resolve, type Mark } from '../src/lib/marking'
import { ratingQueue } from '../src/lib/projects'
import { TestAttempts } from '../src/collections/TestAttempts'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

const m = (rater: number, points: number, role: Mark['role']): Mark => ({ rater, points, role, at: '' })

describe('double marking rules', () => {
  it('needs two raters, averages close marks and sends wide gaps to adjudication', () => {
    expect(resolve([], true).status).toBe('needs_first')
    expect(resolve([m(1, 3, 'first')], true).status).toBe('needs_second')
    expect(resolve([m(1, 3, 'first'), m(2, 2, 'second')], true)).toMatchObject({ status: 'final', final: 2.5 })
    expect(resolve([m(1, 4, 'first'), m(2, 1, 'second')], true).status).toBe('needs_adjudication')
    expect(resolve([m(1, 4, 'first'), m(2, 1, 'second'), m(3, 2, 'adjudication')], true)).toMatchObject({ status: 'final', final: 2 })
    expect(resolve([m(1, 3, 'single')], false)).toMatchObject({ status: 'final', final: 3 })
  })

  it('refuses a second mark from the same rater and labels roles', () => {
    const a = addMark([], 1, 3, true)
    expect(a.ok && a.marks[0]!.role).toBe('first')
    const dup = addMark(a.ok ? a.marks : [], 1, 2, true)
    expect(dup.ok).toBe(false)
    const b = addMark(a.ok ? a.marks : [], 2, 0, true)
    const c = addMark(b.ok ? b.marks : [], 3, 1, true)
    expect(c.ok && c.marks[2]!.role).toBe('adjudication')
  })

  it('reads the old single-rating shape and computes agreement', () => {
    expect(normalizeRating({ points: 2, rater: 9, at: 'x' })).toEqual([{ rater: 9, points: 2, at: 'x', role: 'single' }])
    const a = agreement([[m(1, 3, 'first'), m(2, 3, 'second')], [m(1, 4, 'first'), m(3, 3, 'second')], [m(2, 4, 'first'), m(3, 1, 'second'), m(4, 2, 'adjudication')]])
    expect(a).toMatchObject({ pairs: 3, adjudicated: 1 })
    expect(a.exact).toBeCloseTo(1 / 3)
    expect(a.adjacent).toBeCloseTo(2 / 3)
    expect(agreement([[m(1, 3, 'first'), m(2, 3, 'second')]], 5).pairs).toBe(0)
  })
})

describe('blind double marking in the rate endpoint', () => {
  it('keeps the attempt open until two raters agree, hides it from the first rater, and scores the average', async () => {
    const task = await payload.create({
      collection: 'test-items',
      overrideAccess: true,
      data: { code: `PTX-${uniq()}`, type: 'performance_task', competency: 'UND-3', level: 'smp', difficulty: '2', state: 'draft', stem: 'Check this answer', rubric: [0, 1, 2, 3, 4].map((p) => ({ points: p, descriptor: `L${p}` })) },
    })
    for (const s of ['review', 'approved', 'live'] as const) await payload.update({ collection: 'test-items', id: task.id, overrideAccess: true, data: { state: s } })
    const form = await payload.create({ collection: 'test-forms', overrideAccess: true, data: { name: `DM ${uniq()}`, level: 'smp', status: 'active', timeLimitMinutes: 30, items: [task.id], blueprint: { itemsPerDomain: 1, performanceTasks: 1 } } as never })
    const cand = await payload.create({ collection: 'users', overrideAccess: true, data: { name: 'K', email: `k${uniq()}@example.test`, password: 'Passw0rd!', roles: ['student'], consentStatus: 'not_required' } })
    const attempt = await payload.create({ collection: 'test-attempts', overrideAccess: true, data: { candidate: cand.id, form: form.id, status: 'awaiting_rating', startedAt: new Date().toISOString(), deadline: new Date().toISOString(), itemOrder: [task.id], responses: { [task.id]: { text: 'jawaban' } } } })
    const [r1, r2, r3] = await Promise.all([1, 2, 3].map((n) => payload.create({ collection: 'users', overrideAccess: true, data: { name: `R${n}`, email: `r${n}${uniq()}@example.test`, password: 'Passw0rd!', roles: ['rater'] } })))
    const rate = TestAttempts.endpoints ? TestAttempts.endpoints.find((e) => e.path === '/:id/rate')! : null!
    const call = async (u: unknown, points: number) => {
      const res = await rate.handler({ payload, user: u, json: async () => ({ itemId: task.id, points }), routeParams: { id: attempt.id }, headers: new Headers() } as unknown as PayloadRequest)
      return { status: res.status, data: (await res.json()) as Record<string, unknown> }
    }

    expect((await call(r1, 4)).data).toMatchObject({ status: 'awaiting_rating', itemStatus: 'needs_second' })
    expect((await call(r1, 3)).status).toBe(409)
    expect((await ratingQueue(payload, r1!.id)).some((t) => t.attemptId === attempt.id)).toBe(false)
    expect((await ratingQueue(payload, r2!.id)).find((t) => t.attemptId === attempt.id)?.stage).toBe('second')
    expect((await call(r2, 1)).data).toMatchObject({ status: 'awaiting_rating', itemStatus: 'needs_adjudication' })
    expect((await ratingQueue(payload, r3!.id)).find((t) => t.attemptId === attempt.id)?.stage).toBe('adjudication')
    expect((await call(r3, 2)).data).toMatchObject({ status: 'scored', itemStatus: 'final' })
    const done = await payload.findByID({ collection: 'test-attempts', id: attempt.id, overrideAccess: true })
    expect((done.points as Record<string, number>)[String(task.id)]).toBe(2)
  })
})
