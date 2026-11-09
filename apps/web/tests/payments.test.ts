import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { Orders } from '../src/collections/Orders'
import { mockSign, quote } from '../src/lib/payments'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

async function call(path: string, user: unknown, body: unknown, opts: { routeParams?: Record<string, unknown>; headers?: Record<string, string> } = {}) {
  const e = (Orders.endpoints || []).find((x) => x.path === path)!
  const raw = typeof body === 'string' ? body : JSON.stringify(body)
  const req = { payload, user, json: async () => JSON.parse(raw), text: async () => raw, routeParams: opts.routeParams ?? {}, headers: new Headers(opts.headers) } as unknown as PayloadRequest
  const res = await e.handler(req)
  return { status: res.status, data: (await res.json()) as Record<string, unknown> }
}

async function setup() {
  const school = await payload.create({ collection: 'schools', overrideAccess: true, data: { name: `S ${uniq()}`, npsn: uniq(), level: 'sma' } as never })
  const admin = await payload.create({ collection: 'users', overrideAccess: true, data: { name: 'Admin', email: `a${uniq()}@example.test`, password: 'Passw0rd!', roles: ['school_admin'], school: school.id } })
  return { school, admin }
}

describe('payments placeholder (mock provider)', () => {
  it('checks seat limits, then a signed payment extends the licence exactly once', async () => {
    const { school, admin } = await setup()
    expect((await call('/checkout', admin, { seats: 5 })).status).toBe(400)
    const teacher = await payload.create({ collection: 'users', overrideAccess: true, data: { name: 'T', email: `t${uniq()}@example.test`, password: 'Passw0rd!', roles: ['teacher'] } })
    expect((await call('/checkout', teacher, { seats: 40 })).status).toBe(403)

    const co = await call('/checkout', admin, { seats: 40 })
    expect(co.status).toBe(200)
    const orderId = co.data.orderId as number
    const order = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })
    expect(order).toMatchObject({ status: 'pending', seats: 40, amountIdr: quote('sekolah_tahunan', 40), provider: 'mock' })

    const body = JSON.stringify({ orderId, providerRef: order.providerRef, status: 'paid', amountIdr: order.amountIdr })
    expect((await call('/webhook', null, body, { headers: { 'x-mock-signature': 'bad'.padEnd(64, '0') } })).status).toBe(401)
    const ok = await call('/webhook', null, body, { headers: { 'x-mock-signature': mockSign(body) } })
    expect(ok.data).toEqual({ applied: true })
    const again = await call('/webhook', null, body, { headers: { 'x-mock-signature': mockSign(body) } })
    expect(again.data.applied).toBe(false)

    const s = await payload.findByID({ collection: 'schools', id: school.id, overrideAccess: true })
    expect(s.licence?.seats).toBe(40)
    const months = (new Date(s.licence!.endsAt!).getTime() - Date.now()) / (30 * 24 * 3600 * 1000)
    expect(months).toBeGreaterThan(11.5)
  })

  it('fails an order whose paid amount does not match', async () => {
    const { admin } = await setup()
    const co = await call('/checkout', admin, { seats: 30 })
    const order = await payload.findByID({ collection: 'orders', id: co.data.orderId as number, overrideAccess: true })
    const body = JSON.stringify({ orderId: order.id, providerRef: order.providerRef, status: 'paid', amountIdr: 1000 })
    const res = await call('/webhook', null, body, { headers: { 'x-mock-signature': mockSign(body) } })
    expect(res.data).toMatchObject({ applied: false, reason: 'amount mismatch' })
    expect((await payload.findByID({ collection: 'orders', id: order.id, overrideAccess: true })).status).toBe('failed')
  })

  it('lets a school admin simulate payment only for their own school', async () => {
    const a = await setup()
    const b = await setup()
    const co = await call('/checkout', a.admin, { seats: 30 })
    expect((await call('/:id/mock-pay', b.admin, {}, { routeParams: { id: co.data.orderId } })).status).toBe(404)
    expect((await call('/:id/mock-pay', a.admin, {}, { routeParams: { id: co.data.orderId } })).data).toEqual({ applied: true })
    const seen = await payload.find({ collection: 'orders', overrideAccess: false, user: b.admin, where: { id: { equals: co.data.orderId } } })
    expect(seen.docs).toHaveLength(0)
  })
})
