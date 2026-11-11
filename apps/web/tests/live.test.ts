import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { LiveSessions, tally } from '../src/collections/LiveSessions'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`
const mk = (roles: string[]) => payload.create({ collection: 'users', overrideAccess: true, data: { name: `U ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required' } })
type Ep = { path: string; handler: (r: PayloadRequest) => Promise<Response> }
const call = async (path: string, user: unknown, body: unknown = {}, routeParams: Record<string, unknown> = {}) => {
  const ep = (LiveSessions.endpoints as Ep[]).find((e) => e.path === path)!
  const res = await ep.handler({ payload, user, url: 'http://x/?lang=id', json: async () => body, routeParams, headers: new Headers() } as unknown as PayloadRequest)
  return { status: res.status, data: (await res.json()) as Record<string, unknown> }
}

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('live class', () => {
  it('lets students join with a code, follow the session and answer; the teacher sees counts only', async () => {
    expect(tally({ a: 0, b: 1, c: 1, d: 7 }, 3)).toEqual([1, 2, 0])
    const [teacher, s1, s2] = await Promise.all([mk(['teacher']), mk(['student']), mk(['student'])])
    const slug = `live-${uniq()}`
    const track = await payload.create({ collection: 'tracks', overrideAccess: true, data: { title: 'T', slug, level: 'smp', _status: 'published' } as never })
    const unit = await payload.create({ collection: 'units', overrideAccess: true, data: { title: 'U', track: track.id, bigIdea: 'discover', order: 1 } as never })
    for (const order of [1, 2]) {
      await payload.create({ collection: 'lessons', overrideAccess: true, data: { title: `Sesi ${order}`, unit: unit.id, competency: 'DIS-1', order, type: 'quiz', _status: 'published', quiz: [{ prompt: `Apa itu AI? (${order})`, options: [{ text: 'Program yang belajar dari data', correct: true }, { text: 'Robot' }] }] } as never })
    }
    expect((await call('/start', s1, { track: slug, order: 1 })).status).toBe(403)
    expect((await call('/start', teacher, { track: slug, order: 9 })).status).toBe(404)
    const started = await call('/start', teacher, { track: slug, order: 1 })
    expect(started.data.code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    const id = started.data.id as number

    expect((await call('/join', s1, { code: 'ZZZZZZ' })).status).toBe(404)
    expect((await call('/join', s1, { code: String(started.data.code).toLowerCase() })).data.id).toBe(id)
    expect((await call('/:id/answer', s1, { option: 0 }, { id })).status).toBe(409) // no question yet
    expect((await call('/:id/control', s1, { question: 0 }, { id })).status).toBe(404)
    await call('/:id/control', teacher, { question: 0 }, { id })
    await call('/:id/answer', s1, { option: 0 }, { id })
    await call('/:id/answer', s2, { option: 1 }, { id })
    await call('/:id/answer', s2, { option: 0 }, { id }) // changed their mind

    const student = await call('/:id/state', s1, {}, { id })
    expect(student.data).toMatchObject({ live: true, order: 1, title: 'Sesi 1', myAnswer: 0 })
    expect(student.data.counts).toBeUndefined()
    expect(student.data.questions).toBeUndefined()
    const teach = await call('/:id/state', teacher, {}, { id })
    expect(teach.data.counts).toEqual([2, 0])
    expect(teach.data.answered).toBe(2)
    expect(JSON.stringify(teach.data)).not.toContain(String(s1.id) + '"')

    // Moving on clears the question and answers.
    await call('/:id/control', teacher, { order: 2 }, { id })
    const after = await call('/:id/state', s1, {}, { id })
    expect(after.data).toMatchObject({ order: 2, title: 'Sesi 2', question: null, myAnswer: null })

    // A new live class ends the old one; ending stops joining.
    const second = await call('/start', teacher, { track: slug, order: 2 })
    expect((await call('/:id/state', s1, {}, { id })).data.live).toBe(false)
    await call('/:id/control', teacher, { end: true }, { id: second.data.id })
    expect((await call('/join', s2, { code: second.data.code })).status).toBe(404)
  })
})
