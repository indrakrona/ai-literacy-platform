import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { award, levelFor, meets, progressOf, type Stats } from '../src/lib/gamification'
import { Challenges } from '../src/collections/gamification'
import { seedGamification } from '../src/seed/gamification'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`

beforeAll(async () => {
  payload = await getPayload({ config })
  await seedGamification(payload)
})
afterAll(async () => {
  await payload.db.destroy?.()
})

const person = (roles: string[]) =>
  payload.create({ collection: 'users', overrideAccess: true, data: { name: `U ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required' } })
const badgesOf = async (userId: number) =>
  (await payload.find({ collection: 'user-badges', overrideAccess: true, depth: 1, where: { user: { equals: userId } } })).docs.map((ub) => (typeof ub.badge === 'object' ? ub.badge.slug : ''))

describe('levels and badge rules', () => {
  it('computes levels from thresholds', () => {
    const t = [0, 20, 50, 90, 140]
    expect(levelFor(0, t)).toMatchObject({ level: 1, next: 20, progress: 0 })
    expect(levelFor(35, t)).toMatchObject({ level: 2, next: 50 })
    expect(levelFor(500, t)).toMatchObject({ level: 5, next: null, progress: 1 })
  })

  it('checks badge criteria', () => {
    const zero = { discover: 0, understand: 0, create: 0, protect: 0, thrive: 0 }
    const s: Stats = { lessonsTotal: 4, lessonsByBigIdea: { ...zero, protect: 3 }, levelsByBigIdea: { discover: 2, understand: 2, create: 2, protect: 3, thrive: 1 }, projectsGraded: 0, aiLabSessions: 5, challengesCompleted: 0 }
    expect(meets(s, 'lessons_in_big_idea', 3, 'protect')).toBe(true)
    expect(meets(s, 'lessons_in_big_idea', 3, 'create')).toBe(false)
    expect(meets(s, 'all_big_ideas_level', 2)).toBe(false)
    expect(meets(s, 'ai_lab_sessions', 5)).toBe(true)
  })
})

describe('XP ledger and badges', () => {
  it('awards XP once per action, levels up and earns badges with a notification', async () => {
    const s = await person(['student'])
    expect(await award(payload, { userId: s.id, source: 'lesson_complete', sourceId: 1, bigIdea: 'protect', xp: 10 })).toBe(true)
    expect(await award(payload, { userId: s.id, source: 'lesson_complete', sourceId: 1, bigIdea: 'protect', xp: 10 })).toBe(false)
    expect(await badgesOf(s.id)).toContain('langkah-pertama')
    await award(payload, { userId: s.id, source: 'lesson_complete', sourceId: 2, bigIdea: 'protect', xp: 10 })
    await award(payload, { userId: s.id, source: 'lesson_complete', sourceId: 3, bigIdea: 'protect', xp: 10 })
    const p = await progressOf(payload, s.id)
    expect(p.xp.protect).toBe(30)
    expect(p.levels.protect.level).toBe(2)
    expect(await badgesOf(s.id)).toEqual(expect.arrayContaining(['langkah-pertama', 'perisai']))
    const notes = await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: s.id } }, { kind: { equals: 'badge_earned' } }] } })
    expect(notes.docs.length).toBeGreaterThanOrEqual(2)
    // XP and badges are private to the student
    const other = await person(['student'])
    expect((await payload.find({ collection: 'xp-events', overrideAccess: false, user: other, where: { user: { equals: s.id } } })).docs).toHaveLength(0)
    expect((await payload.find({ collection: 'user-badges', overrideAccess: false, user: other, where: { user: { equals: s.id } } })).docs).toHaveLength(0)
  })
})

describe('class challenges', () => {
  it('lets only the class teacher create one, and a joined student completes it', async () => {
    const [teacher, otherTeacher, student, outsider] = await Promise.all([person(['teacher']), person(['teacher']), person(['student']), person(['student'])])
    const school = await payload.create({ collection: 'schools', overrideAccess: true, data: { name: `S ${uniq()}`, npsn: uniq(), level: 'sma' } as never })
    const klass = await payload.create({ collection: 'classes', overrideAccess: true, data: { name: 'XI G', school: school.id, academicYear: '2026/2027', teachers: [teacher.id], students: [student.id] } })
    const data = { title: 'Pekan Data', class: klass.id, bigIdea: 'protect' as const, target: 2, startsAt: new Date(Date.now() - 60_000).toISOString(), endsAt: new Date(Date.now() + 7 * 86400_000).toISOString() }
    await expect(payload.create({ collection: 'challenges', overrideAccess: false, user: otherTeacher, data })).rejects.toThrow()
    const ch = await payload.create({ collection: 'challenges', overrideAccess: false, user: teacher, data })

    const join = Challenges.endpoints ? Challenges.endpoints.find((e) => e.path === '/:id/join')! : null!
    const call = async (u: unknown) => (await join.handler({ payload, user: u, routeParams: { id: ch.id }, headers: new Headers() } as unknown as PayloadRequest)).status
    expect(await call(outsider)).toBe(403)
    expect(await call(student)).toBe(200)

    await award(payload, { userId: student.id, source: 'lesson_complete', sourceId: 101, bigIdea: 'protect', xp: 10 })
    await award(payload, { userId: student.id, source: 'lesson_complete', sourceId: 102, bigIdea: 'discover', xp: 10 })
    expect((await progressOf(payload, student.id)).stats.challengesCompleted).toBe(0)
    await award(payload, { userId: student.id, source: 'lesson_complete', sourceId: 103, bigIdea: 'protect', xp: 10 })
    expect((await progressOf(payload, student.id)).stats.challengesCompleted).toBe(1)
    expect(await badgesOf(student.id)).toContain('juara-tantangan')
  })
})
