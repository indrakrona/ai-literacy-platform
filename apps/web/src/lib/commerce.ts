/**
 * Commerce (spec K1–K5) without a payment gateway: products in rupiah, promo codes, optional PPN, and
 * manual bank transfer. Each order gets a small unique code added to the amount (e.g. Rp150.037) so the team
 * can match an incoming transfer to its order. A gateway (Midtrans/Xendit) can be added later as another
 * method; the order, fulfilment, invoice and refund steps stay the same.
 */
import type { Payload } from 'payload'
import { formatIdr } from './payments'
import { voucherCode } from './booking'
import { notify } from './notify'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

export type ProductKind = 'school_licence' | 'test_voucher'

export interface Promo {
  id: number
  code: string
  percentOff?: number | null
  amountOffIdr?: number | null
  kinds?: string[] | null
  validUntil?: string | null
  maxUses?: number | null
  minSubtotalIdr?: number | null
  active?: boolean | null
}

export interface TaxSettings {
  ppnEnabled: boolean
  ppnRate: number // percent, e.g. 11
}

export interface Price {
  unitPriceIdr: number
  quantity: number
  subtotalIdr: number
  discountIdr: number
  /** Taxable base after discount (DPP). */
  dppIdr: number
  ppnIdr: number
  /** Before the unique transfer code. */
  totalIdr: number
}

/** Price an order. Prices exclude PPN; PPN (if enabled) is added on the discounted amount. */
export function priceOrder(unitPriceIdr: number, quantity: number, promo: Promo | null, tax: TaxSettings): Price {
  const subtotalIdr = Math.max(0, Math.round(unitPriceIdr * quantity))
  let discountIdr = 0
  if (promo) {
    if (promo.percentOff) discountIdr = Math.round((subtotalIdr * Math.min(100, promo.percentOff)) / 100)
    else if (promo.amountOffIdr) discountIdr = Math.min(subtotalIdr, promo.amountOffIdr)
  }
  const dppIdr = subtotalIdr - discountIdr
  const ppnIdr = tax.ppnEnabled ? Math.round((dppIdr * tax.ppnRate) / 100) : 0
  return { unitPriceIdr, quantity, subtotalIdr, discountIdr, dppIdr, ppnIdr, totalIdr: dppIdr + ppnIdr }
}

/** 1–499, different for neighbouring orders, so transfers can be told apart. */
export function uniqueCode(orderId: number): number {
  return ((orderId * 37) % 499) + 1
}

/** Why a promo code cannot be used, or null. Use counts are checked by the caller. */
export function promoProblem(p: Promo, kind: ProductKind, subtotalIdr: number, now = new Date()): string | null {
  if (p.active === false) return 'promo_inactive'
  if (p.validUntil && new Date(p.validUntil) < now) return 'promo_expired'
  if (p.kinds?.length && !p.kinds.includes(kind)) return 'promo_not_for_product'
  if (p.minSubtotalIdr && subtotalIdr < p.minSubtotalIdr) return 'promo_minimum'
  return null
}

export const COMMERCE_PROBLEMS: Record<string, { id: string; en: string }> = {
  promo_unknown: { id: 'Kode promo tidak ditemukan.', en: 'Promo code not found.' },
  promo_inactive: { id: 'Kode promo tidak aktif.', en: 'This promo code is not active.' },
  promo_expired: { id: 'Kode promo sudah berakhir.', en: 'This promo code has expired.' },
  promo_not_for_product: { id: 'Kode promo tidak berlaku untuk produk ini.', en: 'This promo code does not apply to this product.' },
  promo_minimum: { id: 'Belanja belum mencapai minimum untuk kode ini.', en: 'The order is below this code’s minimum.' },
  promo_used_up: { id: 'Kode promo sudah habis dipakai.', en: 'This promo code has been used up.' },
  quantity: { id: 'Jumlah tidak sesuai.', en: 'Quantity is not allowed.' },
  not_for_you: { id: 'Produk ini tidak tersedia untuk akun Anda.', en: 'This product is not available for your account.' },
  not_your_child: { id: 'Anak ini tidak terhubung dengan akun Anda.', en: 'This child is not linked to your account.' },
  busy: { id: 'Sedang ramai. Coba lagi sebentar.', en: 'Busy right now. Please try again in a moment.' },
}

/** Orders that count towards a promo's use limit. */
export const PROMO_COUNTED = ['pending', 'awaiting_confirmation', 'paid'] as const

export async function taxSettings(payload: Payload): Promise<TaxSettings & { bank: { name: string; account: string; holder: string }; transferDays: number }> {
  const s = (await payload.findGlobal({ slug: 'platform-settings', overrideAccess: true }).catch(() => null)) as Record<string, unknown> | null
  return {
    ppnEnabled: Boolean(s?.ppnEnabled),
    ppnRate: Number(s?.ppnRate ?? 11),
    bank: { name: String(s?.bankName ?? ''), account: String(s?.bankAccount ?? ''), holder: String(s?.bankHolder ?? '') },
    transferDays: Number(s?.transferDays ?? 3),
  }
}

/**
 * Deliver what was bought once an order is paid. Licences extend the school's seats and dates; vouchers are
 * created (100% off, single use, valid one year) for the buyer, or for the child a parent bought for.
 * Safe to call twice: it does nothing for an order already fulfilled.
 */
export async function fulfilOrder(payload: Payload, orderId: number): Promise<void> {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  if (order.status !== 'paid' || order.fulfilledAt) return
  const kind = (order.kind ?? 'school_licence') as ProductKind
  if (kind === 'test_voucher') {
    const ids: number[] = []
    const expiresAt = new Date(Date.now() + 365 * 86_400_000).toISOString()
    while (ids.length < (order.quantity ?? 1)) {
      try {
        const v = await payload.create({ collection: 'vouchers', overrideAccess: true, data: { code: voucherCode(), batch: `Pesanan #${order.id}`, discountPercent: 100, maxUses: 1, expiresAt, active: true, createdBy: idOf(order.createdBy) ?? undefined } })
        ids.push(v.id)
      } catch (e) {
        if (!/unique|duplicate/i.test((e as Error).message)) throw e
      }
    }
    await payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { vouchers: ids, fulfilledAt: new Date().toISOString() } })
  } else {
    const { extendLicence } = await import('../collections/Orders')
    await extendLicence(payload, order)
    await payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { fulfilledAt: new Date().toISOString() } })
  }
  await notify(payload, {
    userIds: [idOf(order.createdBy), idOf(order.beneficiary)],
    kind: 'order_paid',
    vars: { order: `#${order.id}`, amount: formatIdr(order.amountIdr) },
    link: `/pesanan/${order.id}`,
  })
}

export const ORDER_STATUS: Record<string, { id: string; en: string }> = {
  pending: { id: 'menunggu pembayaran', en: 'awaiting payment' },
  awaiting_confirmation: { id: 'menunggu konfirmasi tim', en: 'waiting for our confirmation' },
  paid: { id: 'lunas', en: 'paid' },
  failed: { id: 'gagal', en: 'failed' },
  expired: { id: 'kedaluwarsa', en: 'expired' },
  refunded: { id: 'dikembalikan', en: 'refunded' },
}
