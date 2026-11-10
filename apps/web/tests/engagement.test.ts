import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { portfolioPublic, schoolBoard, splitTeams, teamScores } from '../src/lib/engagement'
import { Events, PeerReviews, eventResults, makeTeams, nominate, parentApprove, portfolioSettings, showcaseConsent, vote } from '../src/collections/Engagement'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`
const teen = new Date(Date.now() - 15 * 365.25 * 86_400_000).toISOString().slice(0, 10)
const mk = (roles: string[], extra: Record<string, unknown> = {}) =>
  payload.create({ collection: 'users', overrideAccess: true, data: { name: `Bima Sakti ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required', ...extra } })
type Ep = { path: string; handler: (r: PayloadRequest) => Promise<Response> }
const run = async (ep: Ep, user: unknown, body: unknown = {}, routeParams: Record<string, unknown> = {}) => {
  const res = await ep.handler({ payload, user, json: async () => body, routeParams, headers: new Headers() } as unknown as PayloadRequest)
  return { status: res.status, data: (await res.json()) as Record<string, unknown> }
}
const ep = (c: { endpoints?: unknown }, path: string) => (c.endpoints as Ep[]).find((e) => e.path === path)!

async function classWith(n: number, extra: Record<string, unknown> = {}) {
  const school = await payload.create({ collection: 'schools', overrideAccess: true, data: { name: `S ${uniq()}`, npsn: uniq(), level: 'smp' } as never })
  const teacher = await mk(['teacher'], { school: school.id })
  const students = await Promise.all(Array.from({ length: n }, () => mk(['student'], { school: school.id, ...extra })))
  const klass = await payload.create({ collection: 'classes', overrideAccess: true, data: { name: `8${uniq().slice(-3)}`, school: school.id, academicYear: '2026/2027', teachers: [teacher.id], students: students.map((s) => s.id) } as never })
  return { school, teacher, students, klass }
}
async function brief() {
  return (await payload.find({ collection: 'project-briefs', overrideAccess: true, limit: 1 })).docs[0] ?? payload.create({ collection: 'project-briefs', overrideAccess: true, data: { title: 'B', slug: `b-${uniq()}`, level: 'smp', competency: 'CRE-1', problem: 'p', deliverables: 'd', rubric: [{ criterion: 'c1' }, { criterion: 'c2' }], _status: 'published' } as never })
}

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('team challenges and boards', () => {
  it('splits classes into balanced teams and ranks teams by average progress, never individuals', async () => {
    const teams = splitTeams([1, 2, 3, 4, 5, 6, 7], 3)
    expect(teams.map((t) => t.members.length).sort()).toEqual([2, 2, 3])
    expect(new Set(teams.flatMap((t) => t.members)).size).toBe(7)

    const { teacher, students, klass, school } = await classWith(4)
    const ch = await payload.create({ collection: 'challenges', overrideAccess: true, data: { title: 'Pekan', class: klass.id, target: 2, startsAt: new Date(Date.now() - 86_400_000).toISOString(), endsAt: new Date(Date.now() + 86_400_000).toISOString() } as never })
    expect((await run(makeTeams as Ep, students[0], { count: 2 }, { id: ch.id })).status).toBe(403)
    expect((await run(makeTeams as Ep, teacher, { count: 2 }, { id: ch.id })).status).toBe(200)
    const withTeams = await payload.findByID({ collection: 'challenges', id: ch.id, overrideAccess: true, depth: 0 })
    expect(withTeams.mode).toBe('team')
    expect(withTeams.teams).toHaveLength(2)
    const firstTeam = (withTeams.teams![0]!.members as number[])
    for (const m of firstTeam) await payload.create({ collection: 'xp-events', overrideAccess: true, data: { user: m, source: 'lesson_complete', sourceId: uniq(), bigIdea: 'discover', xp: 10, key: `k${uniq()}` } as never })
    const standings = await teamScores(payload, withTeams as never)
    expect(standings[0]).toMatchObject({ name: withTeams.teams![0]!.name, average: 1, reachedTarget: false })
    expect(standings[1]!.average).toBe(0)
    expect(JSON.stringify(standings)).not.toContain('Bima')

    // School board lists only classes that opted in.
    expect(await schoolBoard(payload, school.id)).toHaveLength(0)
    await payload.update({ collection: 'classes', id: klass.id, overrideAccess: false, user: teacher, data: { leaderboardOptIn: true } })
    const board = await schoolBoard(payload, school.id)
    expect(board[0]).toMatchObject({ classId: klass.id, students: 4, xpPerStudent: 5 })
  })
})

describe('showcase gallery', () => {
  it('publishes only when every member agrees and a parent approves for minors; one vote each', async () => {
    const { teacher, klass } = await classWith(0)
    const parent = await mk(['parent'])
    const [adult, minor, voter] = await Promise.all([mk(['student'], { dateOfBirth: '2006-01-01' }), mk(['student'], { dateOfBirth: teen, consentStatus: 'granted', guardians: [parent.id] }), mk(['student'])])
    const b = await brief()
    const sub = await payload.create({ collection: 'submissions', overrideAccess: true, data: { brief: b.id, class: klass.id, members: [adult.id, minor.id], text: 'Poster kantin', status: 'submitted' } as never })
    expect((await run(nominate as Ep, teacher, {}, { id: sub.id })).status).toBe(409) // not marked yet
    await payload.update({ collection: 'submissions', id: sub.id, overrideAccess: true, data: { status: 'graded', scores: [4] } })
    expect((await run(nominate as Ep, adult, {}, { id: sub.id })).status).toBe(403)
    expect((await run(nominate as Ep, teacher, {}, { id: sub.id })).status).toBe(200)
    expect((await run(showcaseConsent as Ep, adult, { agree: true }, { id: sub.id })).data.showcase).toBe('nominated')
    expect((await run(showcaseConsent as Ep, minor, { agree: true }, { id: sub.id })).data.showcase).toBe('nominated') // parent still needed
    expect((await run(vote as Ep, voter, {}, { id: sub.id })).status).toBe(404)
    expect((await run(parentApprove as Ep, voter, { childId: minor.id, what: 'gallery', value: true })).status).toBe(403)
    expect((await run(parentApprove as Ep, parent, { childId: minor.id, what: 'gallery', value: true })).status).toBe(200)
    expect((await payload.findByID({ collection: 'submissions', id: sub.id, overrideAccess: true })).showcase).toBe('published')

    expect((await run(vote as Ep, adult, {}, { id: sub.id })).status).toBe(409) // own project
    expect((await run(vote as Ep, voter, {}, { id: sub.id })).data.votes).toBe(1)
    expect((await run(vote as Ep, voter, {}, { id: sub.id })).status).toBe(409)
    // Any member (or the parent) can take it down.
    await run(parentApprove as Ep, parent, { childId: minor.id, what: 'gallery', value: false })
    expect((await payload.findByID({ collection: 'submissions', id: sub.id, overrideAccess: true })).showcase).toBe('none')
  })
})

describe('portfolio', () => {
  it('stays private until switched on, and for minors until a parent approves', async () => {
    const parent = await mk(['parent'])
    const minor = await mk(['student'], { dateOfBirth: teen, guardians: [parent.id] })
    const handle = `bima-${uniq().slice(-6)}`
    expect((await run(portfolioSettings as Ep, minor, { enabled: true, handle: 'x!' })).status).toBe(400)
    expect((await run(portfolioSettings as Ep, minor, { enabled: true, handle })).status).toBe(200)
    const other = await mk(['student'])
    expect((await run(portfolioSettings as Ep, other, { enabled: true, handle })).status).toBe(409)
    expect(portfolioPublic((await payload.findByID({ collection: 'users', id: minor.id, overrideAccess: true })) as never)).toBe(false)
    await run(parentApprove as Ep, parent, { childId: minor.id, what: 'portfolio', value: true })
    const after = await payload.findByID({ collection: 'users', id: minor.id, overrideAccess: true })
    expect(portfolioPublic(after as never)).toBe(true)
    expect(after.portfolio?.handle).toBe(handle)
    // Users cannot flip the parent approval themselves.
    await payload.update({ collection: 'users', id: minor.id, overrideAccess: false, user: minor, data: { portfolio: { enabled: true, parentApproved: false } } as never }).catch(() => null)
    expect((await payload.findByID({ collection: 'users', id: minor.id, overrideAccess: true })).portfolio?.parentApproved).toBe(true)
  })
})

describe('peer review', () => {
  it('serves classmates’ work, validates the mini rubric, refuses duplicates and lets the teacher hide reviews', async () => {
    const { teacher, students, klass } = await classWith(3)
    const [author, reviewer, other] = students
    const b = await brief()
    const sub = await payload.create({ collection: 'submissions', overrideAccess: true, data: { brief: b.id, class: klass.id, members: [author!.id], text: 'Karya kami', status: 'submitted' } as never })
    const nextAuthor = await run(ep(PeerReviews, '/next'), author, {})
    expect((nextAuthor.data.submission as { id: number } | null)?.id).not.toBe(sub.id)
    const next = await run(ep(PeerReviews, '/next'), reviewer, {})
    expect((next.data.submission as { id: number }).id).toBe(sub.id)
    expect(JSON.stringify(next.data)).not.toContain(author!.name)
    const submit = ep(PeerReviews, '/submit')
    expect((await run(submit, author, { submission: sub.id, ratings: { clear: 3, thoughtful: 3, responsible: 3 }, praise: 'Bagus sekali', suggestion: 'Tambah data' })).status).toBe(409)
    expect((await run(submit, reviewer, { submission: sub.id, ratings: { clear: 3 }, praise: 'Bagus sekali', suggestion: 'Tambah data' })).status).toBe(400)
    const ok = await run(submit, reviewer, { submission: sub.id, ratings: { clear: 3, thoughtful: 2, responsible: 9 }, praise: 'Posternya jelas', suggestion: 'Tambahkan sumber' })
    expect(ok.status).toBe(201)
    expect((await payload.findByID({ collection: 'peer-reviews', id: ok.data.id as number, overrideAccess: true })).ratings).toEqual({ clear: 3, thoughtful: 2, responsible: 3 })
    expect((await run(submit, reviewer, { submission: sub.id, ratings: { clear: 1, thoughtful: 1, responsible: 1 }, praise: 'Lagi lagi', suggestion: 'Lagi lagi' })).status).toBe(409)
    expect((await run(ep(PeerReviews, '/:id/hide'), other, {}, { id: ok.data.id })).status).toBe(403)
    expect((await run(ep(PeerReviews, '/:id/hide'), teacher, {}, { id: ok.data.id })).status).toBe(200)
    expect((await payload.findByID({ collection: 'peer-reviews', id: ok.data.id as number, overrideAccess: true })).hidden).toBe(true)
    // Students only see reviews they wrote through the API.
    expect((await payload.find({ collection: 'peer-reviews', overrideAccess: false, user: other, where: { submission: { equals: sub.id } } })).totalDocs).toBe(0)
  })
})

describe('events', () => {
  it('takes entries while open, lets only judges score while judging, and ranks by average judge total', async () => {
    const { students, klass } = await classWith(2)
    const [judge, stranger] = await Promise.all([mk(['teacher']), mk(['teacher'])])
    const b = await brief()
    const ev = await payload.create({ collection: 'events', overrideAccess: true, data: { title: 'Hackathon AI', slug: `ev-${uniq()}`, type: 'hackathon', status: 'open', startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 86_400_000).toISOString(), judges: [judge.id], criteria: [{ name: 'Impact', max: 5 }, { name: 'Ethics', max: 5 }] } as never })
    const s1 = await payload.create({ collection: 'submissions', overrideAccess: true, data: { brief: b.id, class: klass.id, members: [students[0]!.id], text: 'A', status: 'submitted' } as never })
    const s2 = await payload.create({ collection: 'submissions', overrideAccess: true, data: { brief: b.id, class: klass.id, members: [students[1]!.id], text: 'B', status: 'submitted' } as never })
    expect((await run(ep(Events, '/:id/enter'), students[1], { submission: s1.id }, { id: ev.id })).status).toBe(403)
    expect((await run(ep(Events, '/:id/enter'), students[0], { submission: s1.id }, { id: ev.id })).status).toBe(200)
    expect((await run(ep(Events, '/:id/enter'), students[1], { submission: s2.id }, { id: ev.id })).status).toBe(200)
    expect((await run(ep(Events, '/:id/score'), judge, { submission: s1.id, scores: [5, 5] }, { id: ev.id })).status).toBe(409) // not judging yet
    await payload.update({ collection: 'events', id: ev.id, overrideAccess: true, data: { status: 'judging' } })
    expect((await run(ep(Events, '/:id/enter'), students[0], { submission: s1.id }, { id: ev.id })).status).toBe(409)
    expect((await run(ep(Events, '/:id/score'), stranger, { submission: s1.id, scores: [5, 5] }, { id: ev.id })).status).toBe(403)
    expect((await run(ep(Events, '/:id/score'), judge, { submission: s1.id, scores: [3] }, { id: ev.id })).status).toBe(400)
    await run(ep(Events, '/:id/score'), judge, { submission: s1.id, scores: [3, 9] }, { id: ev.id }) // 9 capped to 5
    await run(ep(Events, '/:id/score'), judge, { submission: s2.id, scores: [5, 5] }, { id: ev.id })
    const entries = (await payload.find({ collection: 'submissions', overrideAccess: true, where: { event: { equals: ev.id } } })).docs
    const results = eventResults(entries, [5, 5])
    expect(results.map((r) => [r.id, r.average])).toEqual([[s2.id, 10], [s1.id, 8]])
  })
})
