import type { CollectionConfig, Endpoint, PayloadRequest } from 'payload'
import { hasRole } from '@ailit/shared'
import { roles } from '../access'
import { fulfilOrder, priceOrder, promoProblem, PROMO_COUNTED, taxSettings, uniqueCode, type ProductKind, type Promo } from '../lib/commerce'
import { withBookingLock, LOCK_BUSY } from '../lib/booking'
import { isGuardianOf } from '../lib/parents'
import { notify } from '../lib/notify'
import { audit, ipOf } from '../lib/audit'
import { formatIdr } from '../lib/payments'
import { track, type Actor } from '../lib/analytics'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
const bad = (error: string, status = 400, problem?: string) => Response.json({ error, problem: problem ?? error }, { status })
type U = { id: number; name?: string; email?: string; roles?: string[]; school?: unknown } | null

async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    return ((req.json ? await req.json() : {}) ?? {}) as Record<string, unknown>
  } catch {
    return {}
  }
}

const admins = async (req: PayloadRequest) => (await req.payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 20, where: { roles: { contains: 'super_admin' } } })).docs.map((u) => u.id)

/** Who may buy what: licences by school admins; test vouchers by anyone signed in (parents may buy for a child). */
export function canBuy(u: U, kind: ProductKind): boolean {
  if (!u) return false
  if (kind === 'school_licence') return hasRole(u, 'school_admin') && Boolean(idOf(u.school))
  return true
}

/**
 * POST /api/orders/buy {product, quantity, promo?, beneficiary?} — create a bank-transfer order. Returns the
 * amount to transfer (with the unique code) and where to send it.
 */
export const buy: Endpoint = {
  path: '/buy',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    const b = await body(req)
    const product = await req.payload.findByID({ collection: 'products', id: Number(b.product), depth: 0, overrideAccess: true }).catch(() => null)
    if (!product || product.active === false) return bad('Product not found', 404)
    const kind = product.kind as ProductKind
    if (!canBuy(u, kind)) return bad('not_for_you', 403, 'not_for_you')
    const quantity = Math.floor(Number(b.quantity) || 0)
    if (quantity < (product.minQuantity ?? 1) || quantity > (product.maxQuantity ?? 1000)) return bad(`quantity: ${product.minQuantity ?? 1}–${product.maxQuantity ?? 1000}`, 400, 'quantity')
    let beneficiary: number | null = null
    if (b.beneficiary) {
      if (!hasRole(u, 'parent') || !(await isGuardianOf(req.payload, u.id, Number(b.beneficiary)))) return bad('not_your_child', 403, 'not_your_child')
      beneficiary = Number(b.beneficiary)
    }
    const tax = await taxSettings(req.payload)
    const result = await withBookingLock(req.payload, async () => {
      let promo: Promo | null = null
      const code = String(b.promo ?? '').trim().toUpperCase()
      if (code) {
        promo = ((await req.payload.find({ collection: 'promo-codes', overrideAccess: true, depth: 0, limit: 1, where: { code: { equals: code } } })).docs[0] as Promo | undefined) ?? null
        if (!promo) return { problem: 'promo_unknown' }
        const pre = priceOrder(product.priceIdr, quantity, null, tax)
        const why = promoProblem(promo, kind, pre.subtotalIdr)
        if (why) return { problem: why }
        if (promo.maxUses) {
          const used = await req.payload.count({ collection: 'orders', overrideAccess: true, where: { and: [{ promo: { equals: promo.id } }, { status: { in: [...PROMO_COUNTED] } }] } })
          if (used.totalDocs >= promo.maxUses) return { problem: 'promo_used_up' }
        }
      }
      const price = priceOrder(product.priceIdr, quantity, promo, tax)
      const order = await req.payload.create({
        collection: 'orders',
        overrideAccess: true,
        data: {
          kind,
          product: product.id,
          quantity,
          seats: kind === 'school_licence' ? quantity : undefined,
          months: kind === 'school_licence' ? (product.months ?? 12) : undefined,
          plan: kind === 'school_licence' ? 'sekolah_tahunan' : undefined,
          school: kind === 'school_licence' ? idOf(u.school)! : undefined,
          beneficiary: beneficiary ?? undefined,
          subtotalIdr: price.subtotalIdr,
          discountIdr: price.discountIdr,
          promo: promo?.id,
          ppnIdr: price.ppnIdr,
          amountIdr: price.totalIdr,
          status: 'pending',
          method: 'bank_transfer',
          provider: 'bank_transfer',
          createdBy: u.id,
          expiresAt: new Date(Date.now() + tax.transferDays * 86_400_000).toISOString(),
        },
      })
      // The unique code depends on the id, so it is added once the order exists.
      const code3 = price.totalIdr > 0 ? uniqueCode(order.id) : 0
      await req.payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { uniqueCode: code3, amountIdr: price.totalIdr + code3 } })
      return { order: { id: order.id, amountIdr: price.totalIdr + code3, price } }
    })
    if (result === LOCK_BUSY) return bad('busy', 503, 'busy')
    if ('problem' in result) return bad(result.problem!, 400, result.problem)
    await track(req.payload, { name: 'checkout_started', user: u as unknown as Actor, headers: req.headers, props: { orderId: result.order!.id, amountIdr: result.order!.amountIdr } })
    // Free orders (100% promo) are paid at once.
    if (result.order!.amountIdr === 0) {
      await req.payload.update({ collection: 'orders', id: result.order!.id, overrideAccess: true, data: { status: 'paid', paidAt: new Date().toISOString() } })
      await fulfilOrder(req.payload, result.order!.id)
    }
    return Response.json({ ...result.order, bank: tax.bank }, { status: 201 })
  },
}

async function loadOrder(req: PayloadRequest) {
  return req.payload.findByID({ collection: 'orders', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
}

/** POST /api/orders/:id/transferred {note} — the buyer says they have transferred the money. */
export const reportTransfer: Endpoint = {
  path: '/:id/transferred',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    const order = await loadOrder(req)
    if (!order || idOf(order.createdBy) !== u.id) return bad('Not found', 404)
    if (order.method !== 'bank_transfer' || order.status !== 'pending') return bad('This order is not waiting for a transfer', 409)
    const note = String((await body(req)).note ?? '').trim().slice(0, 500)
    if (note.length < 3) return bad('Say who sent the money and from which bank')
    await req.payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { status: 'awaiting_confirmation', transferNote: note } })
    await notify(req.payload, { userIds: await admins(req), kind: 'order_transfer_reported', vars: { order: `#${order.id}`, amount: formatIdr(order.amountIdr) }, link: '/operasi?tab=pembayaran', email: false })
    return Response.json({ ok: true })
  },
}

/** POST /api/orders/:id/confirm — a super admin confirms the money arrived; the order is fulfilled. */
export const confirmTransfer: Endpoint = {
  path: '/:id/confirm',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!hasRole(u, 'super_admin')) return bad('Not allowed', 403)
    const order = await loadOrder(req)
    if (!order) return bad('Not found', 404)
    if (!['pending', 'awaiting_confirmation'].includes(order.status) || order.method !== 'bank_transfer') return bad('Only bank-transfer orders waiting for payment can be confirmed', 409)
    await req.payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { status: 'paid', paidAt: new Date().toISOString(), confirmedBy: u!.id } })
    await audit(req.payload, { actor: u!.id, action: 'payment_confirm', collection: 'orders', docId: order.id, summary: formatIdr(order.amountIdr), ip: ipOf(req) })
    const buyer = await req.payload.findByID({ collection: 'users', id: idOf(order.createdBy)!, depth: 0, overrideAccess: true }).catch(() => null)
    await track(req.payload, { name: 'payment_completed', user: buyer, props: { orderId: order.id, amountIdr: order.amountIdr } })
    await fulfilOrder(req.payload, order.id)
    return Response.json({ ok: true })
  },
}

/** POST /api/orders/:id/reject {reason} — no matching transfer arrived: back to waiting, with a note to the buyer. */
export const rejectTransfer: Endpoint = {
  path: '/:id/reject',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!hasRole(u, 'super_admin')) return bad('Not allowed', 403)
    const order = await loadOrder(req)
    if (!order || order.status !== 'awaiting_confirmation') return bad('Only orders awaiting confirmation can be rejected', 409)
    const reason = String((await body(req)).reason ?? '').trim().slice(0, 500)
    if (reason.length < 5) return bad('Give a reason')
    await req.payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { status: 'pending', note: reason } })
    await audit(req.payload, { actor: u!.id, action: 'payment_reject', collection: 'orders', docId: order.id, summary: reason, ip: ipOf(req) })
    await notify(req.payload, { userIds: [idOf(order.createdBy)], kind: 'order_rejected', vars: { order: `#${order.id}`, reason }, link: `/pesanan/${order.id}` })
    return Response.json({ ok: true })
  },
}

/**
 * POST /api/orders/:id/refund {amountIdr, reason} — record a refund (the money itself is returned by bank
 * transfer). Unused vouchers from the order are switched off; licence seats are adjusted by hand if needed.
 */
export const refund: Endpoint = {
  path: '/:id/refund',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!hasRole(u, 'super_admin')) return bad('Not allowed', 403)
    const order = await loadOrder(req)
    if (!order || order.status !== 'paid') return bad('Only paid orders can be refunded', 409)
    const b = await body(req)
    const amountIdr = Math.floor(Number(b.amountIdr))
    const reason = String(b.reason ?? '').trim().slice(0, 500)
    if (!(amountIdr > 0 && amountIdr <= order.amountIdr)) return bad(`amountIdr must be 1–${order.amountIdr}`)
    if (reason.length < 5) return bad('Give a reason')
    let switchedOff = 0
    for (const vid of (order.vouchers ?? []).map(idOf).filter(Boolean) as number[]) {
      const used = await req.payload.count({ collection: 'bookings', overrideAccess: true, where: { and: [{ voucher: { equals: vid } }, { status: { not_equals: 'cancelled' } }] } })
      if (!used.totalDocs) {
        await req.payload.update({ collection: 'vouchers', id: vid, overrideAccess: true, data: { active: false } })
        switchedOff++
      }
    }
    await req.payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { status: 'refunded', refundIdr: amountIdr, refundedAt: new Date().toISOString(), note: reason } })
    await audit(req.payload, { actor: u!.id, action: 'payment_refund', collection: 'orders', docId: order.id, summary: `${formatIdr(amountIdr)} · ${reason}${switchedOff ? ` · ${switchedOff} vouchers off` : ''}`, ip: ipOf(req) })
    return Response.json({ ok: true, vouchersSwitchedOff: switchedOff })
  },
}

export const Products: CollectionConfig = {
  slug: 'products',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'kind', 'priceIdr', 'active'], group: 'Business' },
  access: { read: () => true, create: roles('super_admin'), update: roles('super_admin'), delete: roles('super_admin') },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'description', type: 'textarea', localized: true },
    {
      type: 'row',
      fields: [
        { name: 'kind', type: 'select', required: true, options: [{ value: 'school_licence', label: 'School licence (per student seat)' }, { value: 'test_voucher', label: 'AILIS test voucher' }] },
        { name: 'priceIdr', label: 'Price per unit (Rp, before PPN)', type: 'number', required: true, min: 0 },
        { name: 'active', type: 'checkbox', defaultValue: true },
      ],
    },
    { type: 'row', fields: [{ name: 'minQuantity', type: 'number', defaultValue: 1, min: 1 }, { name: 'maxQuantity', type: 'number', defaultValue: 100, min: 1 }, { name: 'months', type: 'number', defaultValue: 12, admin: { description: 'Licences only' } }] },
    { name: 'placeholderPrice', type: 'checkbox', defaultValue: true, admin: { description: 'Shows “provisional price” until the business team sets final prices' } },
  ],
}

export const PromoCodes: CollectionConfig = {
  slug: 'promo-codes',
  admin: { useAsTitle: 'code', defaultColumns: ['code', 'percentOff', 'amountOffIdr', 'validUntil', 'active'], group: 'Business' },
  access: { read: roles('super_admin'), create: roles('super_admin'), update: roles('super_admin'), delete: roles('super_admin') },
  hooks: { beforeChange: [({ data }) => (data.code ? { ...data, code: String(data.code).trim().toUpperCase() } : data)] },
  fields: [
    { name: 'code', type: 'text', required: true, unique: true, index: true },
    { type: 'row', fields: [{ name: 'percentOff', type: 'number', min: 1, max: 100 }, { name: 'amountOffIdr', label: 'Amount off (Rp)', type: 'number', min: 1 }] },
    { name: 'kinds', label: 'Applies to', type: 'select', hasMany: true, options: [{ value: 'school_licence', label: 'School licence' }, { value: 'test_voucher', label: 'Test voucher' }], admin: { description: 'Empty = everything' } },
    { type: 'row', fields: [{ name: 'validUntil', type: 'date' }, { name: 'maxUses', type: 'number', min: 1 }, { name: 'minSubtotalIdr', label: 'Minimum order (Rp)', type: 'number', min: 0 }] },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
