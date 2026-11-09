import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { assembleTestForm, scoreAttempt } from '../src/lib/ailis'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

const choice = (competency: string, correctIndex: number, state = 'live') =>
  payload.create({
    collection: 'test-items',
    data: {
      code: `T-${uniq()}`,
      type: 'single_choice',
      competency: competency as never,
      level: 'smp',
      difficulty: '2',
      state: 'draft',
      stem: `Q ${competency}`,
      options: [0, 1, 2].map((i) => ({ text: `opt ${i}`, correct: i === correctIndex })),
    },
  }).then(async (item) => {
    let cur = item
    for (const s of ['review', 'approved', state === 'live' ? 'live' : null].filter(Boolean) as string[]) {
      cur = await payload.update({ collection: 'test-items', id: item.id, data: { state: s as never } })
    }
    return cur
  })

describe('AILIS item bank', () => {
  it('rejects invalid items and illegal state jumps', async () => {
    await expect(
      payload.create({ collection: 'test-items', data: { code: `X-${uniq()}`, type: 'single_choice', competency: 'DIS-1', level: 'smp', difficulty: '1', state: 'draft', stem: 'x', options: [{ text: 'a', correct: true }, { text: 'b', correct: true }] } }),
    ).rejects.toThrow(/exactly one correct/)
    const item = await payload.create({ collection: 'test-items', data: { code: `Y-${uniq()}`, type: 'single_choice', competency: 'DIS-1', level: 'smp', difficulty: '1', state: 'draft', stem: 'x', options: [{ text: 'a', correct: true }, { text: 'b' }] } })
    await expect(payload.update({ collection: 'test-items', id: item.id, data: { state: 'live' } })).rejects.toThrow(/cannot move/)
  })

  it('hides items from students and shows raters only performance tasks', async () => {
    await choice('DIS-1', 0)
    const student = await payload.create({ collection: 'users', data: { name: 'S', email: `s${uniq()}@example.test`, password: 'Passw0rd!', roles: ['student'] } })
    const rater = await payload.create({ collection: 'users', data: { name: 'R', email: `r${uniq()}@example.test`, password: 'Passw0rd!', roles: ['rater'] } })
    await expect(payload.find({ collection: 'test-items', overrideAccess: false, user: student })).rejects.toThrow(/not allowed/i)
    const seen = await payload.find({ collection: 'test-items', overrideAccess: false, user: rater, limit: 100 })
    expect(seen.docs.every((d) => d.type === 'performance_task')).toBe(true)
  })
})

describe('AILIS form and scoring', () => {
  it('assembles a form from live items and scores an attempt into five domains', async () => {
    const comps = ['DIS-1', 'UND-1', 'CRE-1', 'PRO-1', 'THR-1']
    for (const c of comps) await choice(c, 1)
    const task = await payload.create({
      collection: 'test-items',
      data: { code: `PT-${uniq()}`, type: 'performance_task', competency: 'UND-3', level: 'smp', difficulty: '2', state: 'draft', stem: 'Verify this AI answer', rubric: [0, 1, 2, 3, 4].map((p) => ({ points: p, descriptor: `level ${p}` })) },
    })
    for (const s of ['review', 'approved', 'live']) await payload.update({ collection: 'test-items', id: task.id, data: { state: s as never } })

    const form = await payload.create({ collection: 'test-forms', data: { name: `Form ${uniq()}`, level: 'smp', status: 'active', timeLimitMinutes: 30, blueprint: { itemsPerDomain: 1, performanceTasks: 1 } } })
    expect(form.accessCode).toMatch(/^[A-Z2-9]{6}$/)
    const result = await assembleTestForm(payload, form.id)
    expect(result.itemIds).toHaveLength(6)

    const filled = await payload.findByID({ collection: 'test-forms', id: form.id, depth: 1 })
    const items = (filled.items ?? []).filter((i) => typeof i === 'object')
    // Answer every choice item correctly (the bank may also hold items from other tests)
    const responses = Object.fromEntries(items.filter((i) => i.type !== 'performance_task').map((i) => [String(i.id), { selected: [(i.options ?? []).findIndex((o) => o.correct)] }]))

    const first = scoreAttempt(items, { responses, points: {} })
    expect(first.pendingRatings).toBe(1)
    expect(first.report).toBeNull()

    const ptId = String(items.find((i) => i.type === 'performance_task')!.id)
    const final = scoreAttempt(items, { responses, points: { ...first.points, [ptId]: 2 } })
    expect(final.pendingRatings).toBe(0)
    const report = final.report as { band: number; subScores: Record<string, number>; provisional: boolean }
    expect(report.subScores.understand).toBe(100)
    expect(report.subScores.evaluate).toBe(60) // UND-1 choice 1/1 + UND-3 task 2/4 = 3/5
    expect(report.provisional).toBe(true)
  })
})
