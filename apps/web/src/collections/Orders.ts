import type { Access, CollectionConfig, Endpoint, Payload, PayloadRequest } from 'payload'
import { hasRole } from '@ailit/shared'
import { getPaymentProvider, mockPaymentsAllowed, mockSign, PLANS, quote, type PlanKey, type WebhookEvent } from '../lib/payments'

const idOf = (v: unknown): number => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number))
const bad = (error: string, status = 400) => Response.json({ error }, { status })
type U = { id: number; name?: string; email?: string; roles?: string[]; school?: number | { id: number } | null } | null

/** School admins see their own school's orders; super admins see all. */
const readOrders: Access = ({ req }) => {
  const u = req.user as U
  if (!u) return false
  if (hasRole(u, 'super_admin')) return true
  const school = idOf(u.school)
  if (hasRole(u, 'school_admin') && school) return { school: { equals: school } }
  return false
}

/**
 * Apply a verified payment event. Idempotent: only a pending order can change, and the licence is
 * extended only when the paid amount matches the order exactly.
 */
export async function applyPaymentEvent(payload: Payload, ev: WebhookEvent): Promise<{ applied: boolean; reason?: string }> {
  const order = await payload.findByID({ collection: 'orders', id: ev.orderId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!order) return { applied: false, reason: 'unknown order' }
  if (order.providerRef !== ev.providerRef) return { applied: false, reason: 'reference mismatch' }
  if (order.status !== 'pending') return { applied: false, reason: `order already ${order.status}` }
  if (ev.status === 'paid' && ev.amountIdr !== order.amountIdr) {
    await payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { status: 'failed', note: `Amount mismatch: got ${ev.amountIdr}` } })
    return { applied: false, reason: 'amount mismatch' }
  }
  if (ev.status !== 'paid') {
    await payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { status: ev.status } })
    return { applied: true }
  }
  const now = new Date()
  await payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { status: 'paid', paidAt: now.toISOString() } })

  // Licence: a still-active licence gains seats and is extended from its end date; otherwise it restarts today.
  const school = await payload.findByID({ collection: 'schools', id: idOf(order.school), depth: 0, overrideAccess: true })
  const lic = school.licence ?? {}
  const active = lic.endsAt && new Date(lic.endsAt) > now
  const from = active ? new Date(lic.endsAt as string) : now
  const ends = new Date(from)
  ends.setMonth(ends.getMonth() + (PLANS[order.plan as PlanKey]?.months ?? 12))
  await payload.update({
    collection: 'schools',
    id: school.id,
    overrideAccess: true,
    data: {
      licence: {
        seats: active ? Math.max(lic.seats ?? 0, order.seats) : order.seats,
        startsAt: active ? lic.startsAt : now.toISOString(),
        endsAt: ends.toISOString(),
      },
    },
  })
  return { applied: true }
}

/** POST /api/orders/checkout {plan, seats} — school admin starts paying for a licence. */
const checkout: Endpoint = {
  path: '/checkout',
  method: 'post',
  handler: async (req) => {
    const u = req.user as U
    if (!u || !hasRole(u, 'school_admin')) return bad('School admins only', 403)
    const school = idOf(u.school)
    if (!school) return bad('Your account is not linked to a school', 403)
    let b: { plan?: unknown; seats?: unknown } = {}
    try {
      b = ((req.json ? await req.json() : {}) ?? {}) as typeof b
    } catch {
      /* empty */
    }
    const plan = (typeof b.plan === 'string' && b.plan in PLANS ? b.plan : 'sekolah_tahunan') as PlanKey
    const seats = Number(b.seats)
    const p = PLANS[plan]
    if (!Number.isInteger(seats) || seats < p.minSeats || seats > p.maxSeats) return bad(`Seats must be between ${p.minSeats} and ${p.maxSeats}`)
    const amountIdr = quote(plan, seats)
    const provider = getPaymentProvider()
    const order = await req.payload.create({
      collection: 'orders',
      overrideAccess: true,
      data: { school, plan, seats, amountIdr, status: 'pending', provider: provider.name, createdBy: u.id },
    })
    try {
      const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
      const res = await provider.createCheckout({
        orderId: order.id,
        amountIdr,
        description: `${p.label.id} · ${seats} siswa`,
        customer: { name: u.name ?? '', email: u.email ?? '' },
        returnUrl: `${base}/sekolah`,
      })
      await req.payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { providerRef: res.providerRef, paymentUrl: res.paymentUrl, expiresAt: res.expiresAt } })
      return Response.json({ orderId: order.id, paymentUrl: res.paymentUrl, live: provider.live })
    } catch (e) {
      await req.payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { status: 'failed', note: (e as Error).message } })
      return bad('Payments are not available yet. Please contact the AI Literacy team.', 503)
    }
  },
}

/** POST /api/orders/webhook — called by the payment provider. Signature is checked by the provider adapter. */
const webhook: Endpoint = {
  path: '/webhook',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const raw = req.text ? await req.text() : ''
    let ev: WebhookEvent
    try {
      ev = await getPaymentProvider().parseWebhook(raw, req.headers)
    } catch (e) {
      return bad((e as Error).message, 401)
    }
    const result = await applyPaymentEvent(req.payload, ev)
    return Response.json(result)
  },
}

/** POST /api/orders/:id/mock-pay {status?} — TEST MODE ONLY: simulate the provider confirming a payment. */
const mockPay: Endpoint = {
  path: '/:id/mock-pay',
  method: 'post',
  handler: async (req) => {
    if (!mockPaymentsAllowed()) return bad('Not available', 404)
    const u = req.user as U
    if (!u || !hasRole(u, 'school_admin', 'super_admin')) return bad('Not allowed', 403)
    const order = await req.payload.findByID({ collection: 'orders', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!order || (!hasRole(u, 'super_admin') && idOf(order.school) !== idOf(u.school))) return bad('Not found', 404)
    let b: { status?: unknown } = {}
    try {
      b = ((req.json ? await req.json() : {}) ?? {}) as typeof b
    } catch {
      /* empty */
    }
    const status = b.status === 'failed' ? 'failed' : 'paid'
    // Go through the same signed-webhook path a real provider would use.
    const body = JSON.stringify({ orderId: order.id, providerRef: order.providerRef, status, amountIdr: order.amountIdr })
    const ev = await getPaymentProvider().parseWebhook(body, new Headers({ 'x-mock-signature': mockSign(body) }))
    return Response.json(await applyPaymentEvent(req.payload, ev))
  },
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: { defaultColumns: ['school', 'seats', 'amountIdr', 'status', 'createdAt'], group: 'Business', description: 'School licence payments. Payment gateway is a placeholder (test mode).' },
  access: { read: readOrders, create: () => false, update: ({ req }) => hasRole(req.user as U ?? {}, 'super_admin'), delete: () => false },
  endpoints: [checkout, webhook, mockPay],
  fields: [
    { name: 'school', type: 'relationship', relationTo: 'schools', required: true, index: true },
    { name: 'plan', type: 'select', required: true, options: Object.entries(PLANS).map(([value, p]) => ({ value, label: p.label.en })) },
    { name: 'seats', type: 'number', required: true, min: 1 },
    { name: 'amountIdr', label: 'Amount (IDR)', type: 'number', required: true, min: 0 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: ['pending', 'paid', 'failed', 'expired'].map((v) => ({ value: v, label: v })),
    },
    { name: 'provider', type: 'text', required: true },
    { name: 'providerRef', type: 'text', index: true },
    { name: 'paymentUrl', type: 'text' },
    { name: 'expiresAt', type: 'date' },
    { name: 'paidAt', type: 'date' },
    { name: 'createdBy', type: 'relationship', relationTo: 'users' },
    { name: 'note', type: 'textarea' },
  ],
}
