import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { priceOrder, promoProblem, uniqueCode } from '../src/lib/commerce'
import { Orders } from '../src/collections/Orders'
import { TestSessions } from '../src/collections/TestSessions'
import { seedProducts } from '../src/seed/products'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`
const mk = (roles: string[], extra: Record<string, unknown> = {}) =>
  payload.create({ collection: 'users', overrideAccess: true, data: { name: `U ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required', ...extra } })
type Ep = { path: string; handler: (r: PayloadRequest) => Promise<Response> }
const call = async (c: { endpoints?: unknown }, path: string, user: unknown, body: unknown = {}, routeParams: Record<string, unknown> = {}) => {
  const ep = (c.endpoints as Ep[]).find((e) => e.path === path)!
  const res = await ep.handler({ payload, user, url: 'http://x/', json: async () => body, routeParams, headers: new Headers() } as unknown as PayloadRequest)
  const type = res.headers.get('content-type') ?? ''
  return { status: res.status, data: (type.includes('json') ? await res.json() : null) as Record<string, unknown> }
}
const product = async (slug: string) => (await payload.find({ collection: 'products', overrideAccess: true, where: { slug: { equals: slug } } })).docs[0]!

beforeAll(async () => {
  payload = await getPayload({ config })
  await seedProducts(payload)
})
afterAll(async () => {
  await payload.updateGlobal({ slug: 'platform-settings', data: { ppnEnabled: false } as never })
  await payload.db.destroy?.()
})

describe('pricing', () => {
  it('applies promos before PPN and gives each order a small unique code', () => {
    expect(priceOrder(150_000, 2, null, { ppnEnabled: false, ppnRate: 11 })).toMatchObject({ subtotalIdr: 300_000, discountIdr: 0, ppnIdr: 0, totalIdr: 300_000 })
    expect(priceOrder(150_000, 2, { id: 1, code: 'X', percentOff: 10 }, { ppnEnabled: true, ppnRate: 11 })).toMatchObject({ discountIdr: 30_000, dppIdr: 270_000, ppnIdr: 29_700, totalIdr: 299_700 })
    expect(priceOrder(100_000, 1, { id: 1, code: 'X', amountOffIdr: 250_000 }, { ppnEnabled: false, ppnRate: 11 }).totalIdr).toBe(0)
    const codes = [1, 2, 3, 4, 5].map(uniqueCode)
    expect(new Set(codes).size).toBe(5)
    expect(codes.every((c) => c >= 1 && c <= 499)).toBe(true)
    expect(promoProblem({ id: 1, code: 'X', kinds: ['school_licence'] }, 'test_voucher', 1)).toBe('promo_not_for_product')
    expect(promoProblem({ id: 1, code: 'X', validUntil: '2020-01-01' }, 'test_voucher', 1)).toBe('promo_expired')
  })
})

describe('bank transfer orders', () => {
  it('lets a parent buy vouchers for their child, pay by transfer, and the child book a test with a code', async () => {
    const parent = await mk(['parent'])
    const child = await mk(['student'], { guardians: [parent.id] })
    const stranger = await mk(['student'])
    const admin = await mk(['super_admin'])
    const voucher = await product('voucher-tes-ailis')
    const promo = await payload.create({ collection: 'promo-codes', overrideAccess: true, data: { code: `hemat${uniq().slice(-5)}`, percentOff: 20, maxUses: 1 } as never })

    expect((await call(Orders, '/buy', parent, { product: voucher.id, quantity: 2, beneficiary: stranger.id })).data.problem).toBe('not_your_child')
    expect((await call(Orders, '/buy', parent, { product: voucher.id, quantity: 0 })).data.problem).toBe('quantity')
    expect((await call(Orders, '/buy', parent, { product: voucher.id, quantity: 1, promo: 'NOPE' })).data.problem).toBe('promo_unknown')
    const bought = await call(Orders, '/buy', parent, { product: voucher.id, quantity: 2, beneficiary: child.id, promo: promo.code })
    expect(bought.status).toBe(201)
    const orderId = bought.data.id as number
    expect(bought.data.amountIdr).toBe(240_000 + uniqueCode(orderId))
    expect((await call(Orders, '/buy', stranger, { product: voucher.id, quantity: 1, promo: promo.code })).data.problem).toBe('promo_used_up')

    // Only the buyer reports the transfer; only a super admin confirms.
    expect((await call(Orders, '/:id/transferred', stranger, { note: 'Budi, BCA' }, { id: orderId })).status).toBe(404)
    expect((await call(Orders, '/:id/transferred', parent, { note: 'Ibu Sari, BCA, 10 Nov' }, { id: orderId })).status).toBe(200)
    expect((await call(Orders, '/:id/confirm', parent, {}, { id: orderId })).status).toBe(403)
    expect((await call(Orders, '/:id/confirm', admin, {}, { id: orderId })).status).toBe(200)
    const paid = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true, depth: 0 })
    expect(paid.status).toBe('paid')
    expect(paid.vouchers).toHaveLength(2)
    expect((await call(Orders, '/:id/confirm', admin, {}, { id: orderId })).status).toBe(409) // not twice
    const told = await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { in: [parent.id, child.id] } }, { kind: { equals: 'order_paid' } }] } })
    expect(told.totalDocs).toBe(2)
    // Buyer and child can see the order; others cannot.
    expect((await payload.find({ collection: 'orders', overrideAccess: false, user: child, where: { id: { equals: orderId } } })).totalDocs).toBe(1)
    expect((await payload.find({ collection: 'orders', overrideAccess: false, user: stranger, where: { id: { equals: orderId } } })).totalDocs).toBe(0)
    expect((await call(Orders, '/:id/invoice', parent, {}, { id: orderId })).status).toBe(200)
    expect((await call(Orders, '/:id/invoice', stranger, {}, { id: orderId })).status).toBe(403)

    // The child books a paid session for free with one code.
    const code = (await payload.findByID({ collection: 'vouchers', id: paid.vouchers![0] as number, overrideAccess: true })).code
    const item = await payload.create({ collection: 'test-items', overrideAccess: true, data: { code: `V-${uniq()}`, type: 'single_choice', competency: 'DIS-1', level: 'smp', difficulty: '2', state: 'draft', stem: 'Q', options: [{ text: 'a', correct: true }, { text: 'b' }] } as never })
    const form = await payload.create({ collection: 'test-forms', overrideAccess: true, data: { name: `F ${uniq()}`, level: 'smp', status: 'active', timeLimitMinutes: 30, items: [item.id] } as never })
    const session = await payload.create({ collection: 'test-sessions', overrideAccess: true, data: { title: 'Umum', form: form.id, startsAt: new Date(Date.now() + 86_400_000).toISOString(), seats: 10, priceIdr: 150_000, status: 'open' } })
    const booked = await call(TestSessions, '/:id/book', child, { voucher: code }, { id: session.id })
    expect(booked.data).toMatchObject({ status: 'booked', priceIdr: 0 })

    // Refund: the unused voucher is switched off, the used one stays.
    expect((await call(Orders, '/:id/refund', admin, { amountIdr: 120_000, reason: 'x' }, { id: orderId })).status).toBe(400)
    const r = await call(Orders, '/:id/refund', admin, { amountIdr: 120_000, reason: 'Satu voucher tidak jadi dipakai' }, { id: orderId })
    expect(r.data.vouchersSwitchedOff).toBe(1)
    expect((await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })).status).toBe('refunded')
  })

  it('handles a rejected transfer, free orders, PPN and school licences', async () => {
    const [buyer, admin, candidate] = await Promise.all([mk(['candidate']), mk(['super_admin']), mk(['candidate'])])
    const voucher = await product('voucher-tes-ailis')
    const o = await call(Orders, '/buy', buyer, { product: voucher.id, quantity: 1 })
    await call(Orders, '/:id/transferred', buyer, { note: 'Rina, Mandiri' }, { id: o.data.id })
    expect((await call(Orders, '/:id/reject', admin, { reason: 'Belum ada dana masuk' }, { id: o.data.id })).status).toBe(200)
    const back = await payload.findByID({ collection: 'orders', id: o.data.id as number, overrideAccess: true })
    expect(back.status).toBe('pending')
    expect(back.note).toBe('Belum ada dana masuk')

    const free = await payload.create({ collection: 'promo-codes', overrideAccess: true, data: { code: `gratis${uniq().slice(-5)}`, percentOff: 100 } as never })
    const f = await call(Orders, '/buy', buyer, { product: voucher.id, quantity: 1, promo: free.code })
    expect(f.data.amountIdr).toBe(0)
    expect((await payload.findByID({ collection: 'orders', id: f.data.id as number, overrideAccess: true, depth: 0 })).vouchers).toHaveLength(1)

    await payload.updateGlobal({ slug: 'platform-settings', data: { ppnEnabled: true, ppnRate: 11 } as never })
    const t = await call(Orders, '/buy', buyer, { product: voucher.id, quantity: 1 })
    expect((await payload.findByID({ collection: 'orders', id: t.data.id as number, overrideAccess: true })).ppnIdr).toBe(16_500)
    await payload.updateGlobal({ slug: 'platform-settings', data: { ppnEnabled: false } as never })

    const licence = await product('lisensi-sekolah-tahunan')
    expect((await call(Orders, '/buy', candidate, { product: licence.id, quantity: 40 })).data.problem).toBe('not_for_you')
    const school = await payload.create({ collection: 'schools', overrideAccess: true, data: { name: `S ${uniq()}`, npsn: uniq(), level: 'sma' } as never })
    const sa = await mk(['school_admin'], { school: school.id })
    expect((await call(Orders, '/buy', sa, { product: licence.id, quantity: 10 })).data.problem).toBe('quantity') // minimum 30
    const lo = await call(Orders, '/buy', sa, { product: licence.id, quantity: 40 })
    expect(lo.data.amountIdr).toBe(2_000_000 + uniqueCode(lo.data.id as number))
    await call(Orders, '/:id/confirm', admin, {}, { id: lo.data.id })
    const s = await payload.findByID({ collection: 'schools', id: school.id, overrideAccess: true })
    expect(s.licence?.seats).toBe(40)
    expect(new Date(s.licence!.endsAt!).getTime()).toBeGreaterThan(Date.now() + 360 * 86_400_000)
  })
})
