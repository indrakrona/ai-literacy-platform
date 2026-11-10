/**
 * AILIS test booking (spec A4): test sessions with dates and seats, candidates book a seat, vouchers
 * discount or cover the fee. Bookings are taken one at a time under a database lock, so two people taking
 * the last seat (or the last use of a voucher) at the same moment cannot both get it.
 */
import type { Payload } from 'payload'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

/** e.g. VCR-7KQ2-M9XD */
export function voucherCode(rand: () => number = Math.random): string {
  const part = () => Array.from({ length: 4 }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)]).join('')
  return `VCR-${part()}-${part()}`
}

export function priceAfter(priceIdr: number, discountPercent = 0): number {
  const pct = Math.min(100, Math.max(0, discountPercent))
  return Math.max(0, Math.round((priceIdr * (100 - pct)) / 100))
}

/** Bookings that hold a seat. */
export const HOLDS_SEAT = ['booked', 'awaiting_payment', 'attended'] as const

type SessionLike = { id: number; school?: unknown; startsAt: string; status?: string | null; seats: number }
type VoucherLike = { active?: boolean | null; expiresAt?: string | null; school?: unknown; maxUses?: number | null; discountPercent: number }

/** Why a session cannot be booked by this user right now, or null. */
export function sessionProblem(s: SessionLike, userSchool: number | null, now = new Date()): string | null {
  if (s.status !== 'open') return 'closed'
  if (new Date(s.startsAt) <= now) return 'started'
  const school = idOf(s.school)
  if (school && school !== userSchool) return 'other_school'
  return null
}

/** Why a voucher cannot be used for this session, or null. Use counts are checked separately. */
export function voucherProblem(v: VoucherLike, s: SessionLike, now = new Date()): string | null {
  if (v.active === false) return 'inactive'
  if (v.expiresAt && new Date(v.expiresAt) < now) return 'expired'
  const vs = idOf(v.school)
  if (vs && vs !== idOf(s.school)) return 'other_school'
  return null
}

export const PROBLEM_TEXT: Record<string, { id: string; en: string }> = {
  closed: { id: 'Sesi ini tidak menerima pendaftaran.', en: 'This session is not taking bookings.' },
  started: { id: 'Sesi ini sudah dimulai.', en: 'This session has already started.' },
  other_school: { id: 'Sesi atau voucher ini khusus untuk sekolah lain.', en: 'This session or voucher is for another school.' },
  full: { id: 'Kursi sudah penuh.', en: 'All seats are taken.' },
  already: { id: 'Kamu sudah terdaftar di sesi ini.', en: 'You are already booked on this session.' },
  voucher_unknown: { id: 'Kode voucher tidak ditemukan.', en: 'Voucher code not found.' },
  inactive: { id: 'Voucher ini tidak aktif.', en: 'This voucher is not active.' },
  expired: { id: 'Voucher ini sudah kedaluwarsa.', en: 'This voucher has expired.' },
  busy: { id: 'Sedang ramai. Coba lagi sebentar.', en: 'Busy right now. Please try again in a moment.' },
  used_up: { id: 'Voucher ini sudah habis dipakai.', en: 'This voucher has been used up.' },
}

/** Seats taken in a session. */
export async function seatsTaken(payload: Payload, sessionId: number): Promise<number> {
  const and: Record<string, unknown>[] = [{ session: { equals: sessionId } }, { status: { in: [...HOLDS_SEAT] } }]
  return (await payload.count({ collection: 'bookings', overrideAccess: true, where: { and } as never })).totalDocs
}

export async function voucherUses(payload: Payload, voucherId: number): Promise<number> {
  const and: Record<string, unknown>[] = [{ voucher: { equals: voucherId } }, { status: { in: [...HOLDS_SEAT] } }]
  return (await payload.count({ collection: 'bookings', overrideAccess: true, where: { and } as never })).totalDocs
}

const BOOKING_LOCK = 4_242_001 // any constant; shared by every booking

/**
 * Run fn while holding a Postgres advisory lock. Each Payload write inside commits on its own, so the next
 * booking (which waits for the lock) sees it. Waiters retry with try-lock instead of blocking, so they do not
 * hold pool connections the lock holder needs. Without a Postgres pool (other adapters) fn simply runs.
 */
export async function withBookingLock<T>(payload: Payload, fn: () => Promise<T>, timeoutMs = 15_000): Promise<T | typeof LOCK_BUSY> {
  type Client = { query: (sql: string, args?: unknown[]) => Promise<{ rows: { ok: boolean }[] }>; release: () => void }
  const pool = (payload.db as unknown as { pool?: { connect: () => Promise<Client> } }).pool
  if (!pool) return fn()
  const until = Date.now() + timeoutMs
  while (Date.now() < until) {
    const client = await pool.connect()
    let locked = false
    try {
      locked = Boolean((await client.query('select pg_try_advisory_lock($1) as ok', [BOOKING_LOCK])).rows[0]?.ok)
      if (locked) return await fn()
    } finally {
      if (locked) await client.query('select pg_advisory_unlock($1)', [BOOKING_LOCK]).catch(() => {})
      client.release()
    }
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 60))
  }
  return LOCK_BUSY
}
export const LOCK_BUSY = Symbol('busy')

/**
 * Book a seat. Returns the booking, or a problem key from PROBLEM_TEXT. A free (or fully covered) seat is
 * booked at once; otherwise it is held as awaiting payment until the school or team confirms payment.
 */
type BookResult = { ok: true; booking: { id: number; status: string; priceIdr: number } } | { ok: false; problem: string }

export function bookSeat(payload: Payload, opts: { sessionId: number; user: { id: number; school?: unknown }; voucherCode?: string | null; now?: Date }): Promise<BookResult> {
  return withBookingLock(payload, () => bookSeatLocked(payload, opts)).then((r) => (r === LOCK_BUSY ? { ok: false as const, problem: 'busy' } : r))
}

async function bookSeatLocked(payload: Payload, opts: { sessionId: number; user: { id: number; school?: unknown }; voucherCode?: string | null; now?: Date }): Promise<BookResult> {
  const now = opts.now ?? new Date()
  const session = await payload.findByID({ collection: 'test-sessions', id: opts.sessionId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!session) return { ok: false, problem: 'closed' }
  const sp = sessionProblem(session as SessionLike, idOf(opts.user.school), now)
  if (sp) return { ok: false, problem: sp }

  const mine = await payload.count({
    collection: 'bookings',
    overrideAccess: true,
    where: { and: [{ session: { equals: session.id } }, { candidate: { equals: opts.user.id } }, { status: { in: [...HOLDS_SEAT] } }] },
  })
  if (mine.totalDocs) return { ok: false, problem: 'already' }
  if ((await seatsTaken(payload, session.id)) >= session.seats) return { ok: false, problem: 'full' }

  let voucher: { id: number; maxUses?: number | null; discountPercent: number } | null = null
  const code = (opts.voucherCode ?? '').trim().toUpperCase()
  if (code) {
    const v = (await payload.find({ collection: 'vouchers', overrideAccess: true, depth: 0, limit: 1, where: { code: { equals: code } } })).docs[0]
    if (!v) return { ok: false, problem: 'voucher_unknown' }
    const vp = voucherProblem(v as VoucherLike, session as SessionLike, now)
    if (vp) return { ok: false, problem: vp }
    if ((await voucherUses(payload, v.id)) >= (v.maxUses ?? 1)) return { ok: false, problem: 'used_up' }
    voucher = v
  }

  const priceIdr = priceAfter(session.priceIdr ?? 0, voucher?.discountPercent ?? 0)
  const booking = await payload.create({
    collection: 'bookings',
    overrideAccess: true,
    data: { session: session.id, candidate: opts.user.id, voucher: voucher?.id, priceIdr, status: priceIdr === 0 ? 'booked' : 'awaiting_payment' },
  })
  return { ok: true, booking: { id: booking.id, status: booking.status, priceIdr } }
}

/** Starting a test whose form has scheduled sessions needs a confirmed booking on one of them. */
export async function bookingForStart(payload: Payload, formId: number, userId: number): Promise<{ required: boolean; bookingId?: number }> {
  const sessions = (await payload.find({ collection: 'test-sessions', overrideAccess: true, depth: 0, limit: 200, where: { form: { equals: formId } } })).docs
  if (!sessions.length) return { required: false }
  const b = (
    await payload.find({
      collection: 'bookings',
      overrideAccess: true,
      depth: 0,
      limit: 1,
      where: { and: [{ candidate: { equals: userId } }, { session: { in: sessions.map((s) => s.id) } }, { status: { in: ['booked', 'attended'] } }] },
    })
  ).docs[0]
  return { required: true, bookingId: b?.id }
}
