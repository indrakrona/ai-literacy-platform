import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { distractors, reliability, scoreHistogram, weightedKappa, type ScoredAttempt } from '../src/lib/assessment-stats'
import { effectiveMinutes } from '../src/collections/Accommodations'
import { TestAttempts } from '../src/collections/TestAttempts'
import { pseudo } from '../src/lib/psychometrics'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`
const mk = (roles: string[], extra: Record<string, unknown> = {}) =>
  payload.create({ collection: 'users', overrideAccess: true, data: { name: `Sari Indah ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required', ...extra } })
type Ep = { path: string; handler: (r: PayloadRequest) => Promise<Response> }
const call = async (path: string, user: unknown, body: unknown = {}, routeParams: Record<string, unknown> = {}, url = 'http://x/') => {
  const ep = (TestAttempts.endpoints as Ep[]).find((e) => e.path === path)!
  const res = await ep.handler({ payload, user, url, json: async () => body, routeParams, headers: new Headers() } as unknown as PayloadRequest)
  return { status: res.status, res }
}
const report = (overall: number) => ({ band: Math.floor(overall / 10), overall, subScores: { understand: overall, evaluate: overall, use_create: overall, protect: overall, apply: overall } })

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('psychometric statistics', () => {
  const items = [1, 2, 3, 4].map((id) => ({ id, code: `I${id}`, maxPoints: 1 }))
  it('gives alpha 1 for perfectly consistent items and lower when items disagree', () => {
    const consistent: ScoredAttempt[] = Array.from({ length: 12 }, (_, n) => {
      const v = n % 2
      return { points: { '1': v, '2': v, '3': v, '4': v }, report: report(v * 100) }
    })
    expect(reliability(consistent, items)!.alpha).toBeCloseTo(1, 5)
    const noisy: ScoredAttempt[] = Array.from({ length: 12 }, (_, n) => ({ points: { '1': n % 2, '2': (n >> 1) % 2, '3': (n >> 2) % 2, '4': (n * 7) % 2 }, report: report(50) }))
    expect(reliability(noisy, items)!.alpha).toBeLessThan(0.5)
    expect(reliability(consistent.slice(0, 5), items)).toBeNull() // too few
  })

  it('measures rater agreement with quadratic weighted kappa', () => {
    expect(weightedKappa([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], 4)).toBeCloseTo(1)
    const close = weightedKappa([[0, 1], [1, 1], [2, 3], [3, 3], [4, 4], [2, 2]], 4)!
    const far = weightedKappa([[0, 4], [1, 3], [2, 0], [3, 1], [4, 0], [2, 4]], 4)!
    expect(close).toBeGreaterThan(0.8)
    expect(far).toBeLessThan(0)
  })

  it('counts option choices and score bins', () => {
    const d = distractors([{ selected: [0] }, { selected: [0] }, { selected: [2] }, {}], 3)
    expect(d.shares).toEqual([0.5, 0, 0.25])
    expect(d.skipped).toBe(0.25)
    expect(scoreHistogram([{ points: {}, report: report(5) }, { points: {}, report: report(100) }, { points: {}, report: report(95) }])).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0, 2])
  })
})

describe('accommodations', () => {
  it('are granted by the school admin, extend the time and are recorded on the attempt', async () => {
    expect(effectiveMinutes(45, 50)).toBe(68)
    const s1 = await payload.create({ collection: 'schools', overrideAccess: true, data: { name: `S ${uniq()}`, npsn: uniq(), level: 'sma' } as never })
    const s2 = await payload.create({ collection: 'schools', overrideAccess: true, data: { name: `S ${uniq()}`, npsn: uniq(), level: 'sma' } as never })
    const [admin, student, outsider] = await Promise.all([mk(['school_admin'], { school: s1.id }), mk(['student'], { school: s1.id }), mk(['student'], { school: s2.id })])
    await expect(payload.create({ collection: 'accommodations', overrideAccess: false, user: admin, data: { candidate: outsider.id, extraTimePercent: '50' } as never })).rejects.toThrow(/not at your school/)
    await expect(payload.create({ collection: 'accommodations', overrideAccess: false, user: student, data: { candidate: student.id, extraTimePercent: '100' } as never })).rejects.toThrow()
    const acc = await payload.create({ collection: 'accommodations', overrideAccess: false, user: admin, data: { candidate: student.id, extraTimePercent: '50', screenReader: true, largeText: true, reason: 'Surat guru BK' } as never })
    expect(typeof acc.grantedBy === 'object' ? acc.grantedBy?.id : acc.grantedBy).toBe(admin.id)

    const item = await payload.create({ collection: 'test-items', overrideAccess: true, data: { code: `A-${uniq()}`, type: 'single_choice', competency: 'DIS-1', level: 'sma_smk', difficulty: '2', state: 'draft', stem: 'Q', options: [{ text: 'a', correct: true }, { text: 'b' }] } as never })
    const form = await payload.create({ collection: 'test-forms', overrideAccess: true, data: { name: `F ${uniq()}`, level: 'sma_smk', status: 'active', timeLimitMinutes: 40, items: [item.id] } as never })
    const before = Date.now()
    const started = await (TestAttempts.endpoints as Ep[]).find((e) => e.path === '/start')!.handler({ payload, user: student, json: async () => ({ accessCode: form.accessCode }), routeParams: {}, headers: new Headers() } as unknown as PayloadRequest)
    const { attemptId } = (await started.json()) as { attemptId: number }
    const attempt = await payload.findByID({ collection: 'test-attempts', id: attemptId, overrideAccess: true })
    const minutes = (new Date(attempt.deadline).getTime() - before) / 60000
    expect(minutes).toBeGreaterThan(59.5) // 40 × 1.5 = 60
    expect(minutes).toBeLessThan(60.5)
    expect(attempt.accommodations).toMatchObject({ extraTimePercent: 50, screenReader: true, largeText: true })
    // Screen-reader users are not penalised for leaving full screen.
    await call('/:id/integrity', student, { event: 'fullscreen_exit' }, { id: attemptId })
    expect(((await payload.findByID({ collection: 'test-attempts', id: attemptId, overrideAccess: true })).integrity as { fullscreenExits: number }).fullscreenExits).toBe(0)
    const paper = await (TestAttempts.endpoints as Ep[]).find((e) => e.path === '/:id/paper')!.handler({ payload, user: student, routeParams: { id: attemptId }, headers: new Headers() } as unknown as PayloadRequest)
    expect(((await paper.json()) as { accommodations: { largeText: boolean } }).accommodations.largeText).toBe(true)
  })
})

describe('psychometric exports', () => {
  it('give the assessment lead pseudonymous CSVs and log every download', async () => {
    const [lead, student] = await Promise.all([mk(['assessment_author']), mk(['student'], { dateOfBirth: '2009-05-01' })])
    const item = await payload.create({ collection: 'test-items', overrideAccess: true, data: { code: `X-${uniq()}`, type: 'single_choice', competency: 'PRO-1', level: 'sma_smk', difficulty: '2', state: 'draft', stem: 'Q', options: [{ text: 'a', correct: true }, { text: 'b' }] } as never })
    const form = await payload.create({ collection: 'test-forms', overrideAccess: true, data: { name: `Export ${uniq()}`, level: 'sma_smk', status: 'active', timeLimitMinutes: 30, items: [item.id] } as never })
    await payload.create({ collection: 'test-attempts', overrideAccess: true, data: { candidate: student.id, form: form.id, status: 'scored', startedAt: new Date().toISOString(), deadline: new Date().toISOString(), itemOrder: [item.id], responses: { [String(item.id)]: { selected: [0] } }, points: { [String(item.id)]: 1 }, report: { ...report(80), provisional: true } } })

    expect((await call('/export', student, {}, {}, `http://x/?kind=responses&form=${form.id}`)).status).toBe(403)
    const res = await call('/export', lead, {}, {}, `http://x/?kind=responses&form=${form.id}`)
    expect(res.status).toBe(200)
    const text = await res.res.text()
    expect(text).toContain(pseudo('C', student.id))
    expect(text).toContain(item.code)
    expect(text).toContain('16_17')
    expect(text).not.toContain(student.email)
    expect(text).not.toContain('Sari Indah')
    const items = await (await call('/export', lead, {}, {}, `http://x/?kind=items&form=${form.id}`)).res.text()
    expect(items).toContain('"100.0*"') // everyone chose the key
    expect((await call('/export', lead, {}, {}, 'http://x/?kind=secrets')).status).toBe(400)
    const logs = await payload.find({ collection: 'audit-logs', overrideAccess: true, where: { and: [{ action: { equals: 'psychometric_export' } }, { actor: { equals: lead.id } }] } })
    expect(logs.totalDocs).toBe(2)
  })
})
