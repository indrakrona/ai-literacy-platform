import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { decideConsent, requestGuardianConsent } from '../src/lib/consent'
import { importRoster } from '../src/lib/roster'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

async function makeSchoolAndClass() {
  const school = await payload.create({ collection: 'schools', data: { name: `SMP ${uniq()}`, level: 'smp' } })
  const klass = await payload.create({ collection: 'classes', data: { name: '7A', school: school.id, academicYear: '2026/2027' } })
  return { school, klass }
}

describe('guardian consent', () => {
  it('records the decision and updates the student', async () => {
    const student = await payload.create({
      collection: 'users',
      data: { name: 'Rani Putri', email: `rani${uniq()}@example.test`, password: 'Passw0rd!', roles: ['student'], dateOfBirth: '2012-03-01', consentStatus: 'pending' },
    })
    const req = await requestGuardianConsent(payload, student, { guardianEmail: 'Ibu@Example.test', guardianPhone: '0812-1111-2222' })
    expect(req.guardianEmail).toBe('ibu@example.test')
    expect(req.guardianPhone).toBe('6281211112222')
    expect(req.token.length).toBeGreaterThan(20)

    const res = await decideConsent(payload, req.token, 'granted', { guardianName: 'Ibu Sari', ip: '10.0.0.1', userAgent: 'test' })
    expect(res).toEqual({ ok: true, decision: 'granted' })

    const after = await payload.findByID({ collection: 'users', id: student.id })
    expect(after.consentStatus).toBe('granted')
    const stored = await payload.findByID({ collection: 'consent-requests', id: req.id })
    expect(stored.status).toBe('granted')
    expect(stored.decidedAt).toBeTruthy()
    expect(stored.decisionIp).toBe('10.0.0.1')

    const again = await decideConsent(payload, req.token, 'declined', {})
    expect(again).toEqual({ ok: false, reason: 'already_decided' })
  })

  it('refuses expired and unknown tokens', async () => {
    const student = await payload.create({
      collection: 'users',
      data: { name: 'Dimas', email: `dimas${uniq()}@example.test`, password: 'Passw0rd!', roles: ['student'], consentStatus: 'pending' },
    })
    const req = await requestGuardianConsent(payload, student, { guardianEmail: 'ayah@example.test' })
    await payload.update({ collection: 'consent-requests', id: req.id, data: { expiresAt: '2020-01-01T00:00:00.000Z' } })
    expect(await decideConsent(payload, req.token, 'granted', {})).toEqual({ ok: false, reason: 'expired' })
    expect(await decideConsent(payload, 'x'.repeat(30), 'granted', {})).toEqual({ ok: false, reason: 'not_found' })
  })
})

describe('roster import', () => {
  it('creates students and teachers, requests consent for minors and reports bad rows', async () => {
    const { klass } = await makeSchoolAndClass()
    const id = uniq()
    const csv = [
      'name,email,role,date_of_birth,guardian_email,guardian_phone',
      `Siti Aminah,siti${id}@example.test,student,2012-04-01,ibu.siti@example.test,`,
      `Pak Joko,joko${id}@example.test,teacher,,,`,
      `Tanpa Wali,tanpa${id}@example.test,student,2012-04-01,,`,
      `Bad Email,not-an-email,student,2012-04-01,x@example.test,`,
    ].join('\n')

    const report = await importRoster(payload, klass, csv)
    expect(report.created).toBe(2)
    expect(report.invited).toBe(2)
    expect(report.consentRequested).toBe(1)
    expect(report.errors.map((e) => e.row)).toEqual([4, 5])

    const updated = await payload.findByID({ collection: 'classes', id: klass.id, depth: 1 })
    const studentNames = (updated.students ?? []).map((s) => (typeof s === 'object' ? s.name : s))
    const teacherNames = (updated.teachers ?? []).map((s) => (typeof s === 'object' ? s.name : s))
    expect(studentNames).toEqual(['Siti Aminah'])
    expect(teacherNames).toEqual(['Pak Joko'])

    const siti = (await payload.find({ collection: 'users', where: { email: { equals: `siti${id}@example.test` } } })).docs[0]!
    expect(siti.consentStatus).toBe('pending')
    expect(typeof siti.school === 'object' ? siti.school?.id : siti.school).toBe(
      typeof klass.school === 'object' ? klass.school.id : klass.school,
    )
  })

  it('will not move a user who belongs to another school', async () => {
    const a = await makeSchoolAndClass()
    const b = await makeSchoolAndClass()
    const email = `pindah${uniq()}@example.test`
    await importRoster(payload, a.klass, `name,email,role\nGuru A,${email},teacher`)
    const report = await importRoster(payload, b.klass, `name,email,role\nGuru A,${email},teacher`)
    expect(report.errors[0]?.reason).toMatch(/another school/)
  })
})

describe('who can see whom', () => {
  it('teachers see only students in their classes; school admins see their school', async () => {
    const { school, klass } = await makeSchoolAndClass()
    const other = await makeSchoolAndClass()
    const mk = (name: string, roles: ('student' | 'teacher' | 'school_admin')[], schoolId: number) =>
      payload.create({ collection: 'users', data: { name, email: `${name.toLowerCase()}${uniq()}@example.test`, password: 'Passw0rd!', roles, school: schoolId } })

    const teacher = await mk('Guru', ['teacher'], school.id)
    const admin = await mk('Kepsek', ['school_admin'], school.id)
    const mine = await mk('Murid', ['student'], school.id)
    const notMine = await mk('Lain', ['student'], school.id)
    const elsewhere = await mk('Jauh', ['student'], other.school.id)
    await payload.update({ collection: 'classes', id: klass.id, data: { teachers: [teacher.id], students: [mine.id] } })

    const asTeacher = await payload.find({ collection: 'users', overrideAccess: false, user: teacher, limit: 100 })
    const tIds = asTeacher.docs.map((d) => d.id).sort()
    expect(tIds).toEqual([teacher.id, mine.id].sort())

    const asAdmin = await payload.find({ collection: 'users', overrideAccess: false, user: admin, limit: 100 })
    const aIds = asAdmin.docs.map((d) => d.id)
    expect(aIds).toEqual(expect.arrayContaining([teacher.id, admin.id, mine.id, notMine.id]))
    expect(aIds).not.toContain(elsewhere.id)

    const classesForTeacher = await payload.find({ collection: 'classes', overrideAccess: false, user: teacher })
    expect(classesForTeacher.docs.map((c) => c.id)).toEqual([klass.id])

    const schoolsForTeacher = await payload.find({ collection: 'schools', overrideAccess: false, user: teacher })
    expect(schoolsForTeacher.docs.map((s) => s.id)).toEqual([school.id])
  })
})

describe('self-service limits', () => {
  it('a student cannot change their own date of birth or consent status', async () => {
    const s = await payload.create({
      collection: 'users',
      data: { name: 'Adi', email: `adi${uniq()}@example.test`, password: 'Passw0rd!', roles: ['student'], dateOfBirth: '2012-01-01', consentStatus: 'pending' },
    })
    const after = await payload.update({
      collection: 'users',
      id: s.id,
      overrideAccess: false,
      user: s,
      data: { dateOfBirth: '2000-01-01', consentStatus: 'granted', showInShowcase: true, phone: '0812 3333 4444' },
    })
    expect(after.dateOfBirth?.slice(0, 10)).toBe('2012-01-01')
    expect(after.consentStatus).toBe('pending')
    expect(after.showInShowcase).toBe(false)
    expect(after.phone).toBe('6281233334444')
  })
})
