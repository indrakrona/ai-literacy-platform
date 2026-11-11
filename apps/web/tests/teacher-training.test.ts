import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { COURSE_MODULES, EXAM, examForClient, passCount, scoreExam } from '../src/lib/teacher-course'
import { TeacherCertifications, verifyTeacherCertificate } from '../src/collections/TeacherCertifications'
import { isTeacherCode, teacherCertificateCode, teacherCertificatePdf } from '../src/lib/teacher-certificate'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`
const mk = (roles: string[]) =>
  payload.create({ collection: 'users', overrideAccess: true, data: { name: `Guru ${uniq()}`, email: `g${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required', dateOfBirth: '1985-03-01' } as never })
const ep = (path: string) => (TeacherCertifications.endpoints as { path: string; handler: (r: PayloadRequest) => Promise<Response> }[]).find((e) => e.path === path)!
const call = async (path: string, user: unknown, body: unknown = {}, routeParams: Record<string, unknown> = {}) => {
  const res = await ep(path).handler({ payload, user, json: async () => body, routeParams, headers: new Headers(), url: 'http://x/api' } as unknown as PayloadRequest)
  const type = res.headers.get('content-type') ?? ''
  return { status: res.status, data: (type.includes('json') ? await res.json() : null) as Record<string, any> }
}
const allRight = () => Object.fromEntries(EXAM.map((q) => [q.id, q.answer]))
const filled = (s: string) => s.trim().length > 3

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('teacher course content', () => {
  it('is complete and bilingual, with exactly one valid answer per question', () => {
    expect(COURSE_MODULES.length).toBeGreaterThanOrEqual(5)
    expect(new Set(COURSE_MODULES.map((m) => m.key)).size).toBe(COURSE_MODULES.length)
    for (const m of COURSE_MODULES) {
      expect(filled(m.title.id) && filled(m.title.en) && m.title.id !== m.title.en).toBe(true)
      expect(m.sections.length).toBeGreaterThan(0)
      for (const s of m.sections) for (const p of [s.heading, ...s.paras, ...(s.bullets ?? [])]) expect(filled(p.id) && filled(p.en), m.key).toBe(true)
      for (const q of [...m.practice]) expect(q.answer >= 0 && q.answer < q.options.length && filled(q.why.id) && filled(q.why.en)).toBe(true)
    }
    expect(new Set(EXAM.map((q) => q.id)).size).toBe(EXAM.length)
    for (const q of EXAM) {
      expect(COURSE_MODULES.some((m) => m.key === q.module), q.id).toBe(true)
      expect(q.answer >= 0 && q.answer < q.options.length, q.id).toBe(true)
      expect(q.options.every((o) => o.id.trim() && o.en.trim())).toBe(true)
    }
    // Every module is examined.
    for (const m of COURSE_MODULES) expect(EXAM.some((q) => q.module === m.key), m.key).toBe(true)
  })

  it('never sends answers to the browser', () => {
    const sent = JSON.stringify(examForClient('id'))
    expect(sent).not.toMatch(/"answer"|"why"/)
    expect(examForClient('en')[0]!.options.length).toBe(EXAM[0]!.options.length)
  })

  it('scores against the pass mark and names the modules to review', () => {
    expect(scoreExam(allRight())).toMatchObject({ correct: EXAM.length, passed: true, weakModules: [] })
    expect(passCount(15)).toBe(12)
    const atMark = allRight()
    for (const q of EXAM.slice(0, EXAM.length - passCount(EXAM.length))) atMark[q.id] = (q.answer + 1) % q.options.length
    expect(scoreExam(atMark).passed).toBe(true) // exactly at the pass mark passes
    const wrongCount = EXAM.length - passCount(EXAM.length) + 1
    const answers = allRight()
    for (const q of EXAM.slice(0, wrongCount)) answers[q.id] = (q.answer + 1) % q.options.length
    const r = scoreExam(answers)
    expect(r.passed).toBe(false)
    expect(r.weakModules).toContain(EXAM[0]!.module)
    expect(scoreExam({}).correct).toBe(0)
    expect(scoreExam({ [EXAM[0]!.id]: null }).correct).toBe(0) // null must not count as option 0
  })

  it('makes readable, distinct certificate codes', () => {
    const c = teacherCertificateCode()
    expect(c).toMatch(/^GURU-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/)
    expect(isTeacherCode(c) && !isTeacherCode('AILIS-AAAA-BBBB')).toBe(true)
  })
})

describe('teacher certification flow', () => {
  it('requires every module, scores on the server, enforces the retry wait and issues a verifiable certificate', async () => {
    const student = await mk(['student'])
    expect((await call('/module', student, { module: COURSE_MODULES[0]!.key })).status).toBe(403)

    const teacher = await mk(['teacher'])
    expect((await call('/module', teacher, { module: 'nope' })).status).toBe(400)
    expect((await call('/exam', teacher, { answers: allRight() })).status).toBe(409) // modules not done
    for (const m of COURSE_MODULES) expect((await call('/module', teacher, { module: m.key })).status).toBe(200)

    const fail = await call('/exam', teacher, { answers: {} })
    expect(fail.status).toBe(200)
    expect(fail.data).toMatchObject({ passed: false, correct: 0, code: null })
    expect(fail.data.results.every((r: Record<string, unknown>) => !('answer' in r))).toBe(true)
    expect((await call('/exam', teacher, { answers: allRight() })).status).toBe(429) // must wait

    // Move the failed attempt back in time, as if the wait had passed.
    const rec = (await payload.find({ collection: 'teacher-certifications', overrideAccess: true, where: { user: { equals: teacher.id } } })).docs[0]!
    await payload.update({ collection: 'teacher-certifications', id: rec.id, overrideAccess: true, data: { attempts: [{ ...rec.attempts![0]!, id: undefined, at: new Date(Date.now() - 2 * 3600_000).toISOString() }] } as never })

    const pass = await call('/exam', teacher, { answers: allRight() })
    expect(pass.data).toMatchObject({ passed: true, correct: EXAM.length })
    expect(pass.data.code).toMatch(/^GURU-/)
    expect((await call('/exam', teacher, { answers: allRight() })).status).toBe(409) // already certified

    const v = await verifyTeacherCertificate(payload, pass.data.code.toLowerCase())
    expect(v).toMatchObject({ code: pass.data.code, name: teacher.name, status: 'valid' })
    expect(await verifyTeacherCertificate(payload, 'GURU-ZZZZ-ZZZZ')).toBeNull()

    // Only the owner (or a super admin) downloads the PDF.
    const other = await mk(['teacher'])
    expect((await call('/code/:code/pdf', other, {}, { code: pass.data.code })).status).toBe(403)
    const own = await ep('/code/:code/pdf').handler({ payload, user: teacher, routeParams: { code: pass.data.code }, headers: new Headers(), url: 'http://x/api?lang=en' } as unknown as PayloadRequest)
    expect(own.status).toBe(200)
    expect(own.headers.get('content-type')).toBe('application/pdf')

    // Teachers cannot read other teachers' records.
    const seen = await payload.find({ collection: 'teacher-certifications', user: other, overrideAccess: false })
    expect(seen.docs.every((d) => (typeof d.user === 'object' ? d.user.id : d.user) === other.id)).toBe(true)
  })

  it('renders a PDF with non-Latin-1 names', async () => {
    const bytes = await teacherCertificatePdf({ code: 'GURU-TEST-0001', issuedAt: new Date().toISOString(), expiresAt: new Date().toISOString() }, 'Ñoño Đặng', 'id')
    expect(bytes.byteLength).toBeGreaterThan(1000)
  })
})
