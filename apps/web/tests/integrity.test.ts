import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { shuffledOrder, toDisplayed, toOriginal } from '../src/lib/ailis'
import { TestAttempts } from '../src/collections/TestAttempts'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

const ep = (path: string) => (TestAttempts.endpoints ? TestAttempts.endpoints.find((e) => e.path === path)! : null!)
async function call(path: string, user: unknown, body: unknown = {}, id?: number) {
  const res = await ep(path).handler({ payload, user, json: async () => body, routeParams: id ? { id } : {}, headers: new Headers() } as unknown as PayloadRequest)
  return { status: res.status, data: (await res.json()) as Record<string, any> }
}

describe('option shuffling helpers', () => {
  it('maps between displayed and original indices', () => {
    const order = [2, 0, 3, 1] // displayed 0 shows original 2, …
    expect(toOriginal([0], order)).toEqual([2])
    expect(toOriginal([1, 3], order)).toEqual([0, 1])
    expect(toDisplayed([2], order)).toEqual([0])
    expect(toDisplayed(toOriginal([3, 1], order), order)).toEqual([3, 1])
    expect(toOriginal([1], undefined)).toEqual([1])
    const o = shuffledOrder(5)
    expect([...o].sort()).toEqual([0, 1, 2, 3, 4])
  })
})

describe('AILIS attempt integrity', () => {
  it('shuffles options per attempt, scores the shown answer correctly, logs events and lets proctors record incidents', async () => {
    const items = []
    for (let k = 0; k < 4; k++) {
      const it = await payload.create({
        collection: 'test-items',
        overrideAccess: true,
        data: { code: `INT-${uniq()}`, type: 'single_choice', competency: 'PRO-1', level: 'smp', difficulty: '1', state: 'draft', stem: `Q${k}`, options: ['A', 'B', 'C', 'D'].map((t, i) => ({ text: `${t}${k}`, correct: i === 2 })) },
      })
      for (const s of ['review', 'approved', 'live'] as const) await payload.update({ collection: 'test-items', id: it.id, overrideAccess: true, data: { state: s } })
      items.push(it)
    }
    const form = await payload.create({ collection: 'test-forms', overrideAccess: true, data: { name: `F ${uniq()}`, level: 'smp', status: 'active', timeLimitMinutes: 30, items: items.map((i) => i.id), blueprint: { itemsPerDomain: 1, performanceTasks: 0 } } as never })
    const candidate = await payload.create({ collection: 'users', overrideAccess: true, data: { name: 'C', email: `c${uniq()}@example.test`, password: 'Passw0rd!', roles: ['student'], consentStatus: 'not_required' } })

    const started = await call('/start', candidate, { accessCode: form.accessCode })
    expect(started.status).toBe(201)
    const attemptId = started.data.attemptId as number
    const attempt = await payload.findByID({ collection: 'test-attempts', id: attemptId, overrideAccess: true })
    const orders = attempt.optionOrder as Record<string, number[]>
    expect(Object.keys(orders)).toHaveLength(4)

    const paper = await call('/:id/paper', candidate, {}, attemptId)
    for (const pi of paper.data.items) {
      // Answer the option that displays the correct text ("C…"), wherever it was shuffled to.
      const shown = (pi.options as string[]).findIndex((t) => t.startsWith('C'))
      expect(shown).toBeGreaterThanOrEqual(0)
      await call('/:id/answer', candidate, { itemId: pi.id, selected: [shown] }, attemptId)
    }
    // Resuming shows the same answers in the candidate's own order.
    const again = await call('/:id/paper', candidate, {}, attemptId)
    for (const pi of again.data.items) expect(pi.options[again.data.responses[String(pi.id)].selected[0]]).toMatch(/^C/)

    await call('/:id/integrity', candidate, { event: 'fullscreen_exit' }, attemptId)
    await call('/:id/integrity', candidate, { event: 'tab_hidden' }, attemptId)
    expect((await call('/:id/integrity', candidate, { event: 'nonsense' }, attemptId)).status).toBe(400)

    const submitted = await call('/:id/submit', candidate, {}, attemptId)
    expect(submitted.data.status).toBe('scored')
    const done = await payload.findByID({ collection: 'test-attempts', id: attemptId, overrideAccess: true })
    expect(Object.values(done.points as Record<string, number>).every((p) => p === 1)).toBe(true)
    const ig = done.integrity as { fullscreenExits: number; tabHidden: number; log: unknown[] }
    expect(ig).toMatchObject({ fullscreenExits: 1, tabHidden: 1 })
    expect(ig.log).toHaveLength(2)

    const proctor = await payload.create({ collection: 'users', overrideAccess: true, data: { name: 'P', email: `p${uniq()}@example.test`, password: 'Passw0rd!', roles: ['proctor'] } })
    expect((await call('/:id/incident', proctor, { type: 'connection' }, attemptId)).status).toBe(403) // not assigned yet
    expect((await payload.find({ collection: 'test-forms', overrideAccess: false, user: proctor, where: { id: { equals: form.id } } })).docs).toHaveLength(0)
    await payload.update({ collection: 'test-forms', id: form.id, overrideAccess: true, data: { proctors: [proctor.id] } })
    expect((await payload.find({ collection: 'test-forms', overrideAccess: false, user: proctor, where: { id: { equals: form.id } } })).docs).toHaveLength(1)
    expect((await call('/:id/incident', candidate, { type: 'other' }, attemptId)).status).toBe(403)
    expect((await call('/:id/incident', proctor, { type: 'bogus' }, attemptId)).status).toBe(400)
    expect((await call('/:id/incident', proctor, { type: 'connection', note: 'Wi-Fi putus 2 menit' }, attemptId)).data.count).toBe(1)
  })
})
