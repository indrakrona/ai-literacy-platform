import type { Access, CollectionConfig, Endpoint, Payload, PayloadRequest, Where } from 'payload'
import { buy, confirmTransfer, refund, rejectTransfer, reportTransfer } from './commerce-endpoints'
import { hasRole } from '@ailit/shared'
import { getPaymentProvider, mockPaymentsAllowed, mockSign, PLANS, quote, type PlanKey, type WebhookEvent } from '../lib/payments'
import { track, type Actor } from '../lib/analytics'
import { invoiceNumber, invoicePdf } from '../lib/invoices'
import { siteUrl } from '../lib/site-url'

const idOf = (v: unknown): number => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number))
const bad = (error: string, status = 400) => Response.json({ error }, { status })
type U = { id: number; name?: string; email?: string; roles?: string[]; school?: number | { id: number } | null } | null

/** Buyers see their own orders (and beneficiaries the ones bought for them); school admins their school's; super admins all. */
const readOrders: Access = ({ req }) => {
  const u = req.user as U
  if (!u) return false
  if (hasRole(u, 'super_admin')) return true
  const school = idOf(u.school)
  const or: Where[] = [{ createdBy: { equals: u.id } }, { beneficiary: { equals: u.id } }]
  if (hasRole(u, 'school_admin') && school) or.push({ school: { equals: school } })
  const w: Where = { or }
  return w
}

const canSeeOrder = (u: U, order: { school?: unknown; createdBy?: unknown; beneficiary?: unknown }) =>
  Boolean(u && (hasRole(u, 'super_admin') || idOf(order.createdBy) === u.id || idOf(order.beneficiary) === u.id || (hasRole(u, 'school_admin') && order.school && idOf(order.school) === idOf(u.school))))

/** Add a paid licence order's seats and months to the school (a still-active licence is extended from its end). */
export async function extendLicence(payload: Payload, order: { school?: unknown; seats?: number | null; quantity?: number | null; plan?: string | null; months?: number | null }) {
  const now = new Date()
  const school = await payload.findByID({ collection: 'schools', id: idOf(order.school), depth: 0, overrideAccess: true })
  const lic = school.licence ?? {}
  const active = lic.endsAt && new Date(lic.endsAt) > now
  const from = active ? new Date(lic.endsAt as string) : now
  const ends = new Date(from)
  ends.setMonth(ends.getMonth() + (order.months ?? PLANS[order.plan as PlanKey]?.months ?? 12))
  const seats = order.seats ?? order.quantity ?? 0
  await payload.update({
    collection: 'schools',
    id: school.id,
    overrideAccess: true,
    data: { licence: { seats: active ? Math.max(lic.seats ?? 0, seats) : seats, startsAt: active ? lic.startsAt : now.toISOString(), endsAt: ends.toISOString() } },
  })
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
  const buyer = order.createdBy ? await payload.findByID({ collection: 'users', id: idOf(order.createdBy), depth: 0, overrideAccess: true }).catch(() => null) : null
  await track(payload, { name: 'payment_completed', user: buyer, props: { orderId: order.id, seats: order.seats, amountIdr: order.amountIdr } })

  await extendLicence(payload, order)
  await payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { fulfilledAt: now.toISOString() } })
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
      const base = siteUrl()
      const res = await provider.createCheckout({
        orderId: order.id,
        amountIdr,
        description: `${p.label.id} · ${seats} siswa`,
        customer: { name: u.name ?? '', email: u.email ?? '' },
        returnUrl: `${base}/sekolah`,
      })
      await req.payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { providerRef: res.providerRef, paymentUrl: res.paymentUrl, expiresAt: res.expiresAt } })
      await track(req.payload, { name: 'checkout_started', user: u as unknown as Actor, headers: req.headers, props: { orderId: order.id, plan, seats, amountIdr } })
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

/** GET /api/orders/:id/invoice?lang=id|en — invoice PDF for the school's admins (proforma while unpaid). */
const invoice: Endpoint = {
  path: '/:id/invoice',
  method: 'get',
  handler: async (req) => {
    const u = req.user as U
    if (!u) return bad('Sign in first', 401)
    const order = await req.payload.findByID({ collection: 'orders', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!order) return bad('Not found', 404)
    if (!canSeeOrder(u, order)) return bad('Not allowed', 403)
    const school = order.school
      ? await req.payload.findByID({ collection: 'schools', id: idOf(order.school), depth: 0, overrideAccess: true })
      : await (async () => {
          const buyer = await req.payload.findByID({ collection: 'users', id: idOf(order.createdBy), depth: 0, overrideAccess: true }).catch(() => null)
          return { name: buyer?.name ?? '—', city: buyer?.email ?? null }
        })()
    const product = order.product ? await req.payload.findByID({ collection: 'products', id: idOf(order.product), depth: 0, locale: new URL(req.url ?? 'http://x').searchParams.get('lang') === 'en' ? 'en' : 'id', overrideAccess: true }).catch(() => null) : null
    const lang = new URL(req.url ?? 'http://x').searchParams.get('lang') === 'en' ? 'en' : 'id'
    const bytes = await invoicePdf({ ...order, productName: product?.name ?? null } as never, school as never, lang)
    const file = invoiceNumber(order).replace(/\//g, '-')
    return new Response(Buffer.from(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${file}.pdf"`, 'Cache-Control': 'private, no-store' } })
  },
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: { defaultColumns: ['school', 'seats', 'amountIdr', 'status', 'createdAt'], group: 'Business', description: 'School licence payments. Payment gateway is a placeholder (test mode).' },
  access: { read: readOrders, create: () => false, update: ({ req }) => hasRole(req.user as U ?? {}, 'super_admin'), delete: () => false },
  endpoints: [checkout, webhook, mockPay, invoice, buy, reportTransfer, confirmTransfer, rejectTransfer, refund],
  fields: [
    { name: 'school', type: 'relationship', relationTo: 'schools', index: true, admin: { description: 'For school licences' } },
    { name: 'kind', type: 'select', defaultValue: 'school_licence', options: [{ value: 'school_licence', label: 'School licence' }, { value: 'test_voucher', label: 'AILIS test vouchers' }] },
    { name: 'product', type: 'relationship', relationTo: 'products' },
    { name: 'quantity', type: 'number', min: 1 },
    { name: 'beneficiary', type: 'relationship', relationTo: 'users', admin: { description: 'The child a parent bought for' } },
    { name: 'plan', type: 'select', options: Object.entries(PLANS).map(([value, p]) => ({ value, label: p.label.en })) },
    { name: 'seats', type: 'number', min: 1 },
    { name: 'months', type: 'number' },
    {
      type: 'collapsible',
      label: 'Price breakdown',
      fields: [
        { name: 'subtotalIdr', type: 'number' },
        { name: 'discountIdr', type: 'number' },
        { name: 'promo', type: 'relationship', relationTo: 'promo-codes' },
        { name: 'ppnIdr', label: 'PPN (Rp)', type: 'number' },
        { name: 'uniqueCode', type: 'number', admin: { description: 'Added to the amount so a bank transfer can be matched' } },
      ],
    },
    { name: 'amountIdr', label: 'Amount (IDR)', type: 'number', required: true, min: 0 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: ['pending', 'awaiting_confirmation', 'paid', 'failed', 'expired', 'refunded'].map((v) => ({ value: v, label: v.replace('_', ' ') })),
    },
    { name: 'method', type: 'select', defaultValue: 'gateway', options: [{ value: 'gateway', label: 'Payment gateway' }, { value: 'bank_transfer', label: 'Bank transfer' }] },
    { name: 'transferNote', type: 'textarea', admin: { description: 'What the buyer said about their transfer (sender name, bank, date)' } },
    { name: 'confirmedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'fulfilledAt', type: 'date', admin: { readOnly: true } },
    { name: 'vouchers', type: 'relationship', relationTo: 'vouchers', hasMany: true, admin: { readOnly: true } },
    { name: 'refundIdr', type: 'number' },
    { name: 'refundedAt', type: 'date' },
    { name: 'provider', type: 'text', required: true },
    { name: 'providerRef', type: 'text', index: true },
    { name: 'paymentUrl', type: 'text' },
    { name: 'expiresAt', type: 'date' },
    { name: 'paidAt', type: 'date' },
    { name: 'createdBy', type: 'relationship', relationTo: 'users' },
    { name: 'note', type: 'textarea' },
  ],
}
