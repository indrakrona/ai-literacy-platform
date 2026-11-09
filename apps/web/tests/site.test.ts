import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { PilotRequests } from '../src/collections/PilotRequests'
import { seedSitePages, SITE_PAGE_SLUGS } from '../src/seed/site-pages'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

const submit = async (body: unknown, ip = `10.0.0.${Math.floor(Math.random() * 250)}`) => {
  const ep = PilotRequests.endpoints ? PilotRequests.endpoints.find((e) => e.path === '/submit')! : null!
  const res = await ep.handler({ payload, user: null, json: async () => body, headers: new Headers({ 'x-forwarded-for': ip }) } as unknown as PayloadRequest)
  return { status: res.status, data: (await res.json()) as Record<string, unknown> }
}
const valid = () => ({ schoolName: `SMA Uji ${uniq()}`, level: 'sma', city: 'Bandung', province: 'Jawa Barat', contactName: 'Ibu Sari', contactRole: 'Wakasek', email: `sari${uniq()}@example.test` })

describe('public website', () => {
  it('seeds the required pages in both languages, published', async () => {
    await seedSitePages(payload)
    for (const slug of ['home', 'program', 'untuk-sekolah', 'faq', 'kontak', 'kebijakan-privasi', 'syarat-ketentuan']) expect(SITE_PAGE_SLUGS).toContain(slug)
    const id = (await payload.find({ collection: 'pages', locale: 'id', where: { slug: { equals: 'faq' } }, overrideAccess: false })).docs[0]!
    const en = (await payload.find({ collection: 'pages', locale: 'en', where: { slug: { equals: 'faq' } }, overrideAccess: false })).docs[0]!
    expect(id.title).toBe('Pertanyaan Umum')
    expect(en.title).toBe('FAQ')
    expect(en.layout?.[0]?.blockType).toBe('faq')
  })

  it('hides draft pages from visitors', async () => {
    const slug = `draf-${uniq()}`
    await payload.create({ collection: 'pages', data: { title: 'Draf', slug, _status: 'draft', layout: [] }, draft: true })
    const seen = await payload.find({ collection: 'pages', overrideAccess: false, where: { slug: { equals: slug } } })
    expect(seen.docs).toHaveLength(0)
  })

  it('accepts a valid pilot request, rejects bad input and bots, and alerts super admins', async () => {
    const admin = await payload.create({ collection: 'users', overrideAccess: true, data: { name: 'SA', email: `sa${uniq()}@example.test`, password: 'Passw0rd!', roles: ['super_admin'], consentStatus: 'not_required' } })
    expect((await submit({ ...valid(), email: 'not-an-email' })).status).toBe(400)
    expect((await submit({ ...valid(), npsn: '123' })).status).toBe(400)
    expect((await submit({ ...valid(), website: 'http://spam.example' })).status).toBe(400)
    const body = valid()
    expect((await submit(body)).status).toBe(201)
    const saved = (await payload.find({ collection: 'pilot-requests', where: { schoolName: { equals: body.schoolName } } })).docs[0]!
    expect(saved).toMatchObject({ status: 'new', city: 'Bandung' })
    const notes = await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: admin.id } }, { kind: { equals: 'pilot_request' } }] } })
    expect(notes.docs.length).toBeGreaterThan(0)
    // visitors and other roles cannot read requests
    const teacher = await payload.create({ collection: 'users', overrideAccess: true, data: { name: 'T', email: `t${uniq()}@example.test`, password: 'Passw0rd!', roles: ['teacher'] } })
    await expect(payload.find({ collection: 'pilot-requests', overrideAccess: false, user: teacher })).rejects.toThrow()
  })

  it('limits repeated requests from one address', async () => {
    const ip = `10.9.9.${Math.floor(Math.random() * 250)}`
    for (let i = 0; i < 5; i++) expect((await submit(valid(), ip)).status).toBe(201)
    expect((await submit(valid(), ip)).status).toBe(429)
  })
})
