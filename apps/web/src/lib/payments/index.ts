/**
 * Payment gateway — PLACEHOLDER.
 *
 * Only the `mock` provider works today. It lets the whole school-licence flow be built and tested
 * (order → checkout → webhook → licence seats) without real money. The Midtrans and Xendit
 * providers are stubs that fail loudly until they are implemented; see docs/payments.md.
 */
import { createHmac, timingSafeEqual } from 'crypto'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired'

export interface CheckoutInput {
  orderId: number
  amountIdr: number
  description: string
  customer: { name: string; email: string }
  /** Where the payer returns after paying. */
  returnUrl: string
}

export interface CheckoutResult {
  /** The provider's reference for this payment. */
  providerRef: string
  /** Page the payer is sent to. */
  paymentUrl: string
  expiresAt: string
}

export interface WebhookEvent {
  orderId: number
  providerRef: string
  status: PaymentStatus
  amountIdr: number
}

export interface PaymentProvider {
  readonly name: 'mock' | 'midtrans' | 'xendit'
  /** True when real money moves. */
  readonly live: boolean
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>
  /** Verify the provider's signature and turn the raw callback into an event. Throws if invalid. */
  parseWebhook(rawBody: string, headers: Headers): Promise<WebhookEvent>
}

/** Placeholder prices. NOT FINAL — set with the business team before launch. */
export const PLANS = {
  sekolah_tahunan: {
    label: { id: 'Lisensi sekolah 1 tahun', en: 'School licence, 1 year' },
    pricePerSeatIdr: 50_000,
    months: 12,
    minSeats: 30,
    maxSeats: 3000,
  },
} as const
export type PlanKey = keyof typeof PLANS
export const PRICES_ARE_PLACEHOLDERS = true

export function quote(plan: PlanKey, seats: number): number {
  return PLANS[plan].pricePerSeatIdr * seats
}

export function formatIdr(n: number): string {
  return `Rp${n.toLocaleString('id-ID')}`
}

/** Mock webhook signature: HMAC-SHA256 of the body with PAYMENTS_WEBHOOK_SECRET. */
export function mockSign(body: string, secret = webhookSecret()): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}

function webhookSecret(): string {
  return process.env.PAYMENTS_WEBHOOK_SECRET || 'dev-only-payments-secret'
}

class MockProvider implements PaymentProvider {
  readonly name = 'mock' as const
  readonly live = false
  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const providerRef = `MOCK-${input.orderId}-${Date.now().toString(36).toUpperCase()}`
    return {
      providerRef,
      paymentUrl: `/sekolah/bayar/${input.orderId}`,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    }
  }
  async parseWebhook(rawBody: string, headers: Headers): Promise<WebhookEvent> {
    const given = headers.get('x-mock-signature') ?? ''
    const expected = mockSign(rawBody)
    if (given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) throw new Error('Invalid signature')
    const b = JSON.parse(rawBody) as Partial<WebhookEvent>
    if (!b.orderId || !b.providerRef || !b.status || typeof b.amountIdr !== 'number') throw new Error('Malformed event')
    return { orderId: Number(b.orderId), providerRef: String(b.providerRef), status: b.status, amountIdr: b.amountIdr }
  }
}

/** Stub for a real gateway. Implement createCheckout/parseWebhook with the provider's API (docs/payments.md). */
class NotConfiguredProvider implements PaymentProvider {
  readonly live = true
  constructor(readonly name: 'midtrans' | 'xendit') {}
  async createCheckout(): Promise<CheckoutResult> {
    throw new Error(`Payment provider "${this.name}" is not implemented yet`)
  }
  async parseWebhook(): Promise<WebhookEvent> {
    throw new Error(`Payment provider "${this.name}" is not implemented yet`)
  }
}

export function getPaymentProvider(): PaymentProvider {
  const name = (process.env.PAYMENTS_PROVIDER || 'mock').toLowerCase()
  if (name === 'midtrans' || name === 'xendit') return new NotConfiguredProvider(name)
  return new MockProvider()
}

/**
 * The test-mode "pay" button exists only with the mock provider, and in production only when
 * PAYMENTS_ALLOW_MOCK=true is set explicitly (e.g. a pilot server with no real gateway yet).
 */
export function mockPaymentsAllowed(): boolean {
  if (getPaymentProvider().name !== 'mock') return false
  return process.env.NODE_ENV !== 'production' || process.env.PAYMENTS_ALLOW_MOCK === 'true'
}
