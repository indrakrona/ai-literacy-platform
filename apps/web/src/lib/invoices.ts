/**
 * Invoices and licence renewals (spec I4). Each school order has an invoice PDF: "PROFORMA" while unpaid,
 * "LUNAS / PAID" once paid. School admins are reminded 30 and 7 days before their licence ends.
 */
import type { Payload } from 'payload'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatIdr, PLANS, PRICES_ARE_PLACEHOLDERS, type PlanKey } from './payments'
import { notify } from './notify'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

export const SELLER = { name: 'Impact Thinklab', address: 'The Plaza Thamrin, Jakarta', email: 'indra@impact.id' }

/** e.g. INV/AILIT/2026/11/000042 — from the order's creation month and id, so it never changes. */
export function invoiceNumber(order: { id: number; createdAt: string }): string {
  const d = new Date(order.createdAt)
  const jkt = new Date(d.getTime() + 7 * 3_600_000) // Asia/Jakarta, no DST
  return `INV/AILIT/${jkt.getUTCFullYear()}/${String(jkt.getUTCMonth() + 1).padStart(2, '0')}/${String(order.id).padStart(6, '0')}`
}

type OrderLike = { id: number; createdAt: string; plan: string; seats: number; amountIdr: number; status: string; paidAt?: string | null; provider?: string | null; providerRef?: string | null }
type SchoolLike = { name: string; npsn?: string | null; city?: string | null; address?: string | null }

export async function invoicePdf(order: OrderLike, school: SchoolLike, locale: 'id' | 'en'): Promise<Uint8Array> {
  const id = locale === 'id'
  const pdf = await PDFDocument.create()
  const number = invoiceNumber(order)
  pdf.setTitle(number)
  const page = pdf.addPage([595, 842]) // A4 portrait
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const charset = new Set(regular.getCharacterSet())
  const safe = (t: string) => [...t].map((ch) => (charset.has(ch.codePointAt(0)!) ? ch : '?')).join('')
  const ink = rgb(0.086, 0.075, 0.059)
  const muted = rgb(0.36, 0.34, 0.31)
  const brand = rgb(0.76, 0.25, 0.1)
  const text = (t: string, x: number, y: number, size = 10, font = regular, color = ink) => page.drawText(safe(t), { x, y, size, font, color })
  const right = (t: string, xr: number, y: number, size = 10, font = regular, color = ink) => text(t, xr - font.widthOfTextAtSize(safe(t), size), y, size, font, color)
  const date = (d: string) => new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
  const paid = order.status === 'paid'

  text('IMPACT THINKLAB · AI LITERACY', 50, 790, 11, bold, brand)
  text(paid ? (id ? 'INVOICE' : 'INVOICE') : 'PROFORMA INVOICE', 50, 760, 22, bold)
  right(paid ? (id ? 'LUNAS' : 'PAID') : id ? 'BELUM DIBAYAR' : 'UNPAID', 545, 765, 14, bold, paid ? rgb(0.13, 0.45, 0.25) : brand)

  text(`${id ? 'Nomor' : 'Number'}: ${number}`, 50, 730)
  text(`${id ? 'Tanggal' : 'Date'}: ${date(order.createdAt)}`, 50, 715)
  if (paid && order.paidAt) text(`${id ? 'Dibayar' : 'Paid'}: ${date(order.paidAt)}`, 50, 700)

  text(id ? 'Dari' : 'From', 50, 665, 9, bold, muted)
  text(SELLER.name, 50, 650, 11, bold)
  text(SELLER.address, 50, 636)
  text(SELLER.email, 50, 622)
  text(id ? 'Kepada' : 'Bill to', 320, 665, 9, bold, muted)
  text(school.name, 320, 650, 11, bold)
  if (school.npsn) text(`NPSN ${school.npsn}`, 320, 636)
  if (school.city) text(school.city, 320, 622)

  // Line item
  const plan = PLANS[order.plan as PlanKey]
  const perSeat = order.seats ? Math.round(order.amountIdr / order.seats) : 0
  page.drawRectangle({ x: 50, y: 560, width: 495, height: 22, color: rgb(0.96, 0.94, 0.9) })
  text(id ? 'Deskripsi' : 'Description', 58, 567, 9, bold)
  right(id ? 'Jumlah' : 'Qty', 360, 567, 9, bold)
  right(id ? 'Harga satuan' : 'Unit price', 450, 567, 9, bold)
  right('Total', 537, 567, 9, bold)
  text(plan ? plan.label[locale] : order.plan, 58, 540)
  text(id ? 'Akses platform AI Literacy per siswa' : 'AI Literacy platform access per student', 58, 526, 9, regular, muted)
  right(`${order.seats} ${id ? 'siswa' : 'students'}`, 360, 540)
  right(formatIdr(perSeat), 450, 540)
  right(formatIdr(order.amountIdr), 537, 540)
  page.drawLine({ start: { x: 50, y: 510 }, end: { x: 545, y: 510 }, thickness: 0.5, color: muted })
  right(id ? 'Total tagihan' : 'Amount due', 450, 490, 11, bold)
  right(formatIdr(order.amountIdr), 537, 490, 11, bold)

  let y = 440
  if (order.providerRef) {
    text(`${id ? 'Referensi pembayaran' : 'Payment reference'}: ${order.providerRef}`, 50, y, 9, regular, muted)
    y -= 15
  }
  if (PRICES_ARE_PLACEHOLDERS) {
    text(id ? 'Catatan: harga masih sementara (uji coba) dan belum final.' : 'Note: prices are provisional (pilot) and not final.', 50, y, 9, regular, brand)
    y -= 15
  }
  text(id ? 'Pertanyaan tentang tagihan ini: ' + SELLER.email : 'Questions about this invoice: ' + SELLER.email, 50, y, 9, regular, muted)
  return pdf.save()
}

/** Days until the licence ends (negative once ended), or null without a licence. */
export function daysLeft(endsAt: string | null | undefined, now = new Date()): number | null {
  if (!endsAt) return null
  return Math.ceil((new Date(endsAt).getTime() - now.getTime()) / 86_400_000)
}

/** Remind school admins at 30 and 7 days before the licence ends (each once). Returns schools reminded. */
export async function runLicenceReminders(payload: Payload, now = new Date()): Promise<number> {
  const soon = new Date(now.getTime() + 30 * 86_400_000).toISOString()
  const schools = (await payload.find({ collection: 'schools', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { and: [{ 'licence.endsAt': { greater_than: now.toISOString() } }, { 'licence.endsAt': { less_than_equal: soon } }] } })).docs
  let n = 0
  for (const s of schools) {
    const left = daysLeft(s.licence?.endsAt, now)!
    const stage = left <= 7 ? '7' : '30'
    const sent = (s as { licenceReminders?: string | null }).licenceReminders ?? ''
    if (sent.split(',').includes(`${s.licence?.endsAt}:${stage}`)) continue
    await payload.update({ collection: 'schools', id: s.id, overrideAccess: true, data: { licenceReminders: [sent, `${s.licence?.endsAt}:${stage}`].filter(Boolean).join(',') } as never })
    const admins = (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 20, where: { and: [{ school: { equals: s.id } }, { roles: { contains: 'school_admin' } }] } })).docs
    const end = (l: 'id' | 'en') => new Date(s.licence!.endsAt!).toLocaleDateString(l === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
    await notify(payload, { userIds: admins.map((a) => a.id), kind: 'licence_expiring', vars: { school: s.name, days: left, date: end('id') }, link: '/sekolah#lisensi' })
    n++
  }
  return n
}

