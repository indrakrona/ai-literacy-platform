import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { Submissions } from '../src/collections/Submissions'
import { gradingQueue, ratingQueue, rubricTotal } from '../src/lib/projects'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

const endpoint = (path: string) => {
  const e = (Submissions.endpoints || []).find((x) => x.path === path)
  if (!e) throw new Error(`no endpoint ${path}`)
  return e
}
/** Call a custom endpoint the way Payload does, with a signed-in user and a JSON body. */
async function call(path: string, user: unknown, body: unknown, routeParams: Record<string, unknown> = {}) {
  const req = { payload, user, json: async () => body, routeParams } as unknown as PayloadRequest
  const res = await endpoint(path).handler(req)
  return { status: res.status, data: (await res.json()) as Record<string, unknown> }
}

const person = (roles: string[], extra: Record<string, unknown> = {}) =>
  payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { name: `U ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required', ...extra },
  })

describe('rubric totals', () => {
  it('sums 1–4 scores against a maximum of 4 per criterion', () => {
    expect(rubricTotal([4, 3, 2, 1])).toEqual({ total: 10, max: 16 })
    expect(rubricTotal(null)).toBeNull()
  })
})

describe('project submissions and marking', () => {
  it('lets a student submit with a teammate, keeps work private, and lets only the class teacher mark it', async () => {
    const [a, b, outsider, pending, teacher, otherTeacher] = await Promise.all([
      person(['student']),
      person(['student']),
      person(['student']),
      person(['student'], { consentStatus: 'pending' }),
      person(['teacher']),
      person(['teacher']),
    ])
    const school = await payload.create({ collection: 'schools', overrideAccess: true, data: { name: `School ${uniq()}`, npsn: uniq(), level: 'sma' } as never })
    const klass = await payload.create({
      collection: 'classes',
      overrideAccess: true,
      data: { name: `X-${uniq()}`, school: school.id, teachers: [teacher.id], students: [a.id, b.id, pending.id] } as never,
    })
    const brief = await payload.create({
      collection: 'project-briefs',
      overrideAccess: true,
      data: { title: 'Brief', slug: `b-${uniq()}`, level: 'sma_smk', competency: 'THR-3', problem: 'p', deliverables: 'd', allowTeams: true, rubric: [{ criterion: 'A' }, { criterion: 'B' }, { criterion: 'C' }] },
    })
    const text = 'We built a chatbot and checked every answer against the school handbook.'

    expect((await call('/submit', pending, { brief: brief.id, class: klass.id, text })).status).toBe(403)
    expect((await call('/submit', outsider, { brief: brief.id, class: klass.id, text })).status).toBe(403)
    expect((await call('/submit', a, { brief: brief.id, class: klass.id, text: 'too short' })).status).toBe(400)
    expect((await call('/submit', a, { brief: brief.id, class: klass.id, text, teammates: [outsider.email] })).status).toBe(400)

    const sent = await call('/submit', a, { brief: brief.id, class: klass.id, text, links: ['https://example.com/x', 'javascript:alert(1)'], teammates: [b.email] })
    expect(sent.status).toBe(200)
    const subId = sent.data.id as number

    // Resubmitting updates the same record rather than creating a second one.
    const again = await call('/submit', b, { brief: brief.id, class: klass.id, text: `${text} Revised.` })
    expect(again.data.id).toBe(subId)
    const stored = await payload.findByID({ collection: 'submissions', id: subId, depth: 0 })
    expect((stored.links ?? []).map((l) => l.url)).toEqual([])

    // Visibility: members and the class teacher only.
    const seen = async (u: unknown) => (await payload.find({ collection: 'submissions', overrideAccess: false, user: u as never, where: { id: { equals: subId } } })).docs.length
    expect(await seen(a)).toBe(1)
    expect(await seen(teacher)).toBe(1)
    expect(await seen(outsider)).toBe(0)
    expect(await seen(otherTeacher)).toBe(0)

    expect((await call('/:id/grade', otherTeacher, { scores: [4, 4, 4] }, { id: subId })).status).toBe(403)
    expect((await call('/:id/grade', teacher, { scores: [4, 4] }, { id: subId })).status).toBe(400)
    expect((await call('/:id/grade', teacher, { scores: [4, 5, 1] }, { id: subId })).status).toBe(400)
    const marked = await call('/:id/grade', teacher, { scores: [4, 3, 2], feedback: 'Good testing.' }, { id: subId })
    expect(marked.data).toMatchObject({ status: 'graded', total: 9, max: 12 })

    expect((await call('/submit', a, { brief: brief.id, class: klass.id, text })).status).toBe(409)
    const queue = await gradingQueue(payload, klass.id)
    expect(queue.pending).toHaveLength(0)
    expect(queue.graded.map((s) => s.id)).toEqual([subId])
  })

  it('refuses teammates on an individual brief', async () => {
    const [a, b] = await Promise.all([person(['student']), person(['student'])])
    const school = await payload.create({ collection: 'schools', overrideAccess: true, data: { name: `School ${uniq()}`, npsn: uniq(), level: 'sma' } as never })
    const klass = await payload.create({ collection: 'classes', overrideAccess: true, data: { name: `Y-${uniq()}`, school: school.id, students: [a.id, b.id] } as never })
    const brief = await payload.create({
      collection: 'project-briefs',
      overrideAccess: true,
      data: { title: 'Solo', slug: `s-${uniq()}`, level: 'smp', competency: 'CRE-3', problem: 'p', deliverables: 'd', allowTeams: false, rubric: [{ criterion: 'A' }, { criterion: 'B' }] },
    })
    const res = await call('/submit', a, { brief: brief.id, class: klass.id, text: 'A poster about healthy food, checked with Kemenkes.', teammates: [b.email] })
    expect(res.status).toBe(400)
  })
})

describe('rater queue', () => {
  it('lists performance tasks from attempts awaiting rating under an anonymous code', async () => {
    const tasks = await ratingQueue(payload)
    for (const t of tasks) {
      expect(t.candidateCode).toMatch(/^K-\d{5,}$/)
      expect(t.item.type).toBe('performance_task')
      expect(JSON.stringify(t)).not.toMatch(/@example\.test/)
    }
  })
})
