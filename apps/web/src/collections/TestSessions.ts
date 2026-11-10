import type { Access, CollectionConfig, Endpoint, PayloadRequest, Where } from 'payload'
import { APIError } from 'payload'
import { hasRole } from '@ailit/shared'
import { bookSeat, voucherCode } from '../lib/booking'
import { audit, ipOf } from '../lib/audit'

const bad = (error: string, status = 400) => Response.json({ error }, { status })
const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
type U = { id: number; roles?: string[]; school?: unknown } | null

async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    return ((req.json ? await req.json() : {}) ?? {}) as Record<string, unknown>
  } catch {
    return {}
  }
}

/** Super admins manage everything; school admins manage their own school's records. */
const schoolManaged: Access = ({ req }) => {
  const u = req.user as U
  if (hasRole(u, 'super_admin')) return true
  const school = idOf(u?.school)
  if (hasRole(u, 'school_admin') && school) {
    const w: Where = { school: { equals: school } }
    return w
  }
  return false
}

/** A school admin can only create records for their own school. */
const pinSchool = ({ req, data, operation }: { req: PayloadRequest; data?: Record<string, unknown>; operation: string }) => {
  const u = req.user as U
  if (!data || hasRole(u, 'super_admin') || !u) return data
  if (operation === 'create' || 'school' in data) {
    const own = idOf(u.school)
    if (!own) throw new APIError('Account not linked to a school', 403, undefined, true)
    data.school = own
  }
  return data
}

// ---------- Test sessions ----------

/** POST /api/test-sessions/:id/book {voucher?} */
const book: Endpoint = {
  path: '/:id/book',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return bad('Sign in first', 401)
    const { voucher } = await body(req)
    const res = await bookSeat(req.payload, { sessionId: Number(req.routeParams?.id), user: req.user as unknown as { id: number; school?: unknown }, voucherCode: voucher ? String(voucher) : null })
    if (!res.ok) return Response.json({ error: res.problem, problem: res.problem }, { status: 409 })
    return Response.json(res.booking, { status: 201 })
  },
}

export const TestSessions: CollectionConfig = {
  slug: 'test-sessions',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'startsAt', 'seats', 'status'], group: 'Assessment' },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => hasRole(req.user as U, 'super_admin', 'school_admin'),
    update: schoolManaged,
    delete: ({ req }) => hasRole(req.user as U, 'super_admin'),
  },
  hooks: {
    beforeChange: [
      pinSchool,
      // A school admin may only schedule forms that belong to their school or to no school.
      async ({ req, data }) => {
        const u = req.user as U
        if (!u || hasRole(u, 'super_admin') || !data?.form) return data
        const form = await req.payload.findByID({ collection: 'test-forms', id: idOf(data.form)!, depth: 0, overrideAccess: true, req }).catch(() => null)
        const fs = idOf(form?.school)
        if (!form || (fs && fs !== idOf(u.school))) throw new APIError('This test form belongs to another school', 403, undefined, true)
        return data
      },
    ],
  },
  endpoints: [book],
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'e.g. AILIS SMA · Gelombang 1' } },
    { name: 'form', type: 'relationship', relationTo: 'test-forms', required: true, index: true, admin: { description: 'Once a form has sessions, candidates need a confirmed booking to start it' } },
    { name: 'school', type: 'relationship', relationTo: 'schools', index: true, admin: { description: 'Leave empty for a session open to everyone' } },
    { name: 'startsAt', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'endsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'location', type: 'text', admin: { description: 'Room and building, or "Online (proctored)"' } },
    { name: 'seats', type: 'number', required: true, min: 1, defaultValue: 30 },
    { name: 'priceIdr', label: 'Fee (Rp)', type: 'number', min: 0, defaultValue: 0, admin: { description: '0 = covered by the school licence. Paid seats wait for payment confirmation.' } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { value: 'open', label: 'Open for booking' },
        { value: 'closed', label: 'Closed' },
      ],
    },
  ],
}

// ---------- Bookings ----------

const readBookings: Access = ({ req }) => {
  const u = req.user as U
  if (!u) return false
  if (hasRole(u, 'super_admin')) return true
  const school = idOf(u.school)
  const w: Where = hasRole(u, 'school_admin') && school ? { or: [{ candidate: { equals: u.id } }, { school: { equals: school } }] } : { candidate: { equals: u.id } }
  return w
}

async function managedBooking(req: PayloadRequest) {
  const b = await req.payload.findByID({ collection: 'bookings', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
  if (!b) return null
  return b
}

/** POST /api/bookings/:id/cancel — the candidate frees their seat before the session starts. */
const cancel: Endpoint = {
  path: '/:id/cancel',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return bad('Sign in first', 401)
    const b = await managedBooking(req)
    if (!b) return bad('Not found', 404)
    const u = req.user as unknown as U
    const own = idOf(b.candidate) === u!.id
    const admin = hasRole(u, 'super_admin') || (hasRole(u, 'school_admin') && idOf(b.school) && idOf(b.school) === idOf(u!.school))
    if (!own && !admin) return bad('Not allowed', 403)
    if (!['booked', 'awaiting_payment'].includes(b.status)) return bad('This booking cannot be cancelled', 409)
    const s = await req.payload.findByID({ collection: 'test-sessions', id: idOf(b.session)!, depth: 0, overrideAccess: true })
    if (own && !admin && new Date(s.startsAt) <= new Date()) return bad('The session has started', 409)
    await req.payload.update({ collection: 'bookings', id: b.id, overrideAccess: true, data: { status: 'cancelled', note: own ? 'cancelled by candidate' : 'cancelled by admin' } })
    if (!own) await audit(req.payload, { actor: u!.id, action: 'cancel_booking', collection: 'bookings', docId: b.id, summary: `session ${s.id}`, ip: ipOf(req) })
    return Response.json({ ok: true })
  },
}

/** POST /api/bookings/:id/confirm — a school admin or super admin confirms payment for a held seat. */
const confirm: Endpoint = {
  path: '/:id/confirm',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    const b = await managedBooking(req)
    if (!b) return bad('Not found', 404)
    const admin = hasRole(u, 'super_admin') || (hasRole(u, 'school_admin') && idOf(b.school) && idOf(b.school) === idOf(u?.school))
    if (!admin) return bad('Not allowed', 403)
    if (b.status !== 'awaiting_payment') return bad('Only seats awaiting payment can be confirmed', 409)
    await req.payload.update({ collection: 'bookings', id: b.id, overrideAccess: true, data: { status: 'booked', note: `payment confirmed by user ${u!.id}` } })
    await audit(req.payload, { actor: u!.id, action: 'confirm_payment', collection: 'bookings', docId: b.id, summary: `Rp${b.priceIdr ?? 0}`, ip: ipOf(req) })
    return Response.json({ ok: true })
  },
}

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: { defaultColumns: ['session', 'candidate', 'status', 'priceIdr', 'createdAt'], group: 'Assessment' },
  access: {
    read: readBookings,
    create: () => false, // only through /test-sessions/:id/book
    update: ({ req }) => hasRole(req.user as U, 'super_admin'),
    delete: () => false,
  },
  hooks: {
    beforeChange: [
      // Copy the session's school so school admins can see bookings for their sessions.
      async ({ data, req, operation }) => {
        if (operation === 'create' && data?.session) {
          const s = await req.payload.findByID({ collection: 'test-sessions', id: idOf(data.session)!, depth: 0, overrideAccess: true, req })
          data.school = idOf(s.school) ?? undefined
        }
        return data
      },
    ],
  },
  endpoints: [cancel, confirm],
  fields: [
    { name: 'session', type: 'relationship', relationTo: 'test-sessions', required: true, index: true },
    { name: 'candidate', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'school', type: 'relationship', relationTo: 'schools', index: true, admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'booked',
      options: [
        { value: 'booked', label: 'Booked' },
        { value: 'awaiting_payment', label: 'Awaiting payment' },
        { value: 'attended', label: 'Attended' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    { name: 'voucher', type: 'relationship', relationTo: 'vouchers' },
    { name: 'priceIdr', label: 'Fee after voucher (Rp)', type: 'number', min: 0 },
    { name: 'note', type: 'text' },
    { name: 'remindedAt', type: 'date', admin: { readOnly: true, description: 'Reminder sent (24 hours before)' } },
  ],
}

// ---------- Vouchers ----------

/** POST /api/vouchers/batch {batch, count, discountPercent, maxUses?, expiresAt?, school?} → {codes} */
const batch: Endpoint = {
  path: '/batch',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!hasRole(u, 'super_admin', 'school_admin')) return bad('Not allowed', 403)
    const b = await body(req)
    const name = String(b.batch ?? '').trim().slice(0, 60)
    const count = Math.floor(Number(b.count))
    const discountPercent = Math.floor(Number(b.discountPercent ?? 100))
    const maxUses = Math.floor(Number(b.maxUses ?? 1))
    if (name.length < 3) return bad('Give the batch a name (at least 3 characters)')
    if (!(count >= 1 && count <= 500)) return bad('count must be 1–500')
    if (!(discountPercent >= 1 && discountPercent <= 100)) return bad('discountPercent must be 1–100')
    if (!(maxUses >= 1 && maxUses <= 1000)) return bad('maxUses must be 1–1000')
    const expiresAt = b.expiresAt ? new Date(String(b.expiresAt)) : null
    if (expiresAt && Number.isNaN(expiresAt.getTime())) return bad('expiresAt is not a date')
    const school = hasRole(u, 'super_admin') ? (Number(b.school) || null) : idOf(u!.school)
    if (!hasRole(u, 'super_admin') && !school) return bad('Account not linked to a school', 403)

    const codes: string[] = []
    while (codes.length < count) {
      const code = voucherCode()
      try {
        await req.payload.create({
          collection: 'vouchers',
          overrideAccess: true,
          data: { code, batch: name, school: school ?? undefined, discountPercent, maxUses, expiresAt: expiresAt?.toISOString(), active: true, createdBy: u!.id },
        })
        codes.push(code)
      } catch (e) {
        if (!/unique|duplicate/i.test((e as Error).message)) throw e
      }
    }
    await audit(req.payload, { actor: u!.id, action: 'create_vouchers', collection: 'vouchers', summary: `${count} × ${discountPercent}% in "${name}"`, ip: ipOf(req) })
    return Response.json({ batch: name, codes }, { status: 201 })
  },
}

export const Vouchers: CollectionConfig = {
  slug: 'vouchers',
  admin: { useAsTitle: 'code', defaultColumns: ['code', 'batch', 'discountPercent', 'maxUses', 'expiresAt', 'active'], group: 'Assessment' },
  access: {
    read: schoolManaged,
    create: () => false, // only through /vouchers/batch
    update: schoolManaged,
    delete: () => false,
  },
  hooks: { beforeChange: [pinSchool] },
  endpoints: [batch],
  fields: [
    { name: 'code', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'batch', type: 'text', required: true, index: true },
    { name: 'school', type: 'relationship', relationTo: 'schools', index: true, admin: { description: 'Only valid for this school’s sessions (empty = any session)' } },
    { name: 'discountPercent', type: 'number', required: true, min: 1, max: 100, defaultValue: 100 },
    { name: 'maxUses', type: 'number', required: true, min: 1, defaultValue: 1 },
    { name: 'expiresAt', type: 'date' },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
  ],
}
