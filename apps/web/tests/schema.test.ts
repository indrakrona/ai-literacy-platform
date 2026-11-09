import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  await payload.db.destroy?.()
})

describe('core schema (Sprint 0)', () => {
  it('creates a school, a class with a join code, and links a student', async () => {
    const school = await payload.create({
      collection: 'schools',
      data: { name: 'SMP Uji Coba', level: 'smp', npsn: `T${Date.now()}`, city: 'Jakarta' },
    })
    const student = await payload.create({
      collection: 'users',
      data: { name: 'Siswa Uji', email: `siswa${Date.now()}@example.test`, password: 'Passw0rd!', roles: ['student'], school: school.id },
    })
    const klass = await payload.create({
      collection: 'classes',
      data: { name: '8B', school: school.id, academicYear: '2026/2027', students: [student.id] },
    })
    expect(klass.joinCode).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)

    const fetched = await payload.findByID({ collection: 'schools', id: school.id, depth: 0 })
    expect(fetched.classes?.docs?.length).toBe(1)
  })

  it('rejects a badly formatted academic year', async () => {
    const school = await payload.create({ collection: 'schools', data: { name: 'SMA Uji', level: 'sma' } })
    await expect(
      payload.create({ collection: 'classes', data: { name: 'X1', school: school.id, academicYear: '2026' } }),
    ).rejects.toThrow()
  })

  it('builds the track → unit → lesson tree in both languages', async () => {
    const track = await payload.create({
      collection: 'tracks',
      locale: 'id',
      data: { title: 'AI untuk Belajar & Integritas', slug: `smp-${Date.now()}`, level: 'smp', _status: 'published' },
    })
    await payload.update({ collection: 'tracks', id: track.id, locale: 'en', data: { title: 'AI for Learning & Integrity' } })
    const unit = await payload.create({
      collection: 'units',
      data: { title: 'Mengenal AI', track: track.id, bigIdea: 'discover', order: 1, _status: 'published' },
    })
    await payload.create({
      collection: 'lessons',
      data: { title: 'Robot atau Bukan?', unit: unit.id, type: 'interactive', order: 1, _status: 'published' },
    })

    const en = await payload.findByID({ collection: 'tracks', id: track.id, locale: 'en', depth: 2 })
    expect(en.title).toBe('AI for Learning & Integrity')
    const units = en.units?.docs ?? []
    expect(units).toHaveLength(1)
  })

  it('hides draft lessons from anonymous readers but not from content editors', async () => {
    const track = await payload.create({ collection: 'tracks', data: { title: 'T', slug: `t-${Date.now()}`, level: 'sma_smk', _status: 'published' } })
    const unit = await payload.create({ collection: 'units', data: { title: 'U', track: track.id, bigIdea: 'protect', order: 1, _status: 'published' } })
    const draft = await payload.create({ collection: 'lessons', draft: true, data: { title: 'Draft only', unit: unit.id, type: 'reading', order: 1 } })

    const anon = await payload.find({ collection: 'lessons', overrideAccess: false, where: { id: { equals: draft.id } } })
    expect(anon.docs).toHaveLength(0)

    const editor = await payload.create({
      collection: 'users',
      data: { name: 'Editor', email: `editor${Date.now()}@example.test`, password: 'Passw0rd!', roles: ['content_editor'] },
    })
    const asEditor = await payload.find({
      collection: 'lessons',
      overrideAccess: false,
      user: editor,
      draft: true,
      where: { id: { equals: draft.id } },
    })
    expect(asEditor.docs).toHaveLength(1)
  })

  it('stops a student from reading other users or changing their own roles', async () => {
    const a = await payload.create({ collection: 'users', data: { name: 'A', email: `a${Date.now()}@example.test`, password: 'Passw0rd!', roles: ['student'] } })
    const b = await payload.create({ collection: 'users', data: { name: 'B', email: `b${Date.now()}@example.test`, password: 'Passw0rd!', roles: ['student'] } })

    const seen = await payload.find({ collection: 'users', overrideAccess: false, user: a })
    expect(seen.docs.map((d) => d.id)).toEqual([a.id])

    const updated = await payload.update({
      collection: 'users',
      id: a.id,
      overrideAccess: false,
      user: a,
      data: { roles: ['super_admin'] },
    })
    expect(updated.roles).toEqual(['student'])
    expect(b.id).not.toBe(a.id)
  })
})
