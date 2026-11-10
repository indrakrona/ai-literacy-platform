/**
 * AILIS certificates (spec G11–G12): issued when an attempt is scored, valid two years, verifiable by
 * code or QR on a public page. While cut scores are provisional the certificate says so.
 */
import type { Payload } from 'payload'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import { needsGuardianConsent, SCORE_DOMAINS, SCORE_DOMAIN_LABELS } from '@ailit/shared'

export const BAND_NAMES = {
  id: ['Belum terlihat', 'Sadar', 'Sadar', 'Sadar', 'Pengguna cakap', 'Pengguna cakap', 'Terampil', 'Terampil', 'Ahli', 'Ahli'],
  en: ['Not yet shown', 'Aware', 'Aware', 'Aware', 'Capable user', 'Capable user', 'Skilled', 'Skilled', 'Expert', 'Expert'],
} as const

export const VALIDITY_YEARS = 2
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

/** Human-friendly, hard-to-guess code, e.g. AILIS-7KQ2-M9XD. */
export function certificateCode(rand: () => number = Math.random): string {
  const part = () => Array.from({ length: 4 }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)]).join('')
  return `AILIS-${part()}-${part()}`
}

/** Under-18s (and anyone whose age is unknown) are shown as first name + initial on public pages (spec: child safety). */
export function publicName(name: string, dateOfBirth?: string | null): string {
  if (dateOfBirth && !needsGuardianConsent(dateOfBirth)) return name
  const [first, ...rest] = name.trim().split(/\s+/)
  const last = rest.at(-1)
  return last ? `${first} ${last[0]}.` : (first ?? name)
}

export function verifyUrl(code: string): string {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  return `${base}/verifikasi/${code}`
}

/** Issue a certificate for a scored attempt once; returns the existing one if already issued. */
export async function issueCertificate(payload: Payload, attemptId: number) {
  const existing = (await payload.find({ collection: 'certificates', overrideAccess: true, depth: 0, limit: 1, where: { attempt: { equals: attemptId } } })).docs[0]
  if (existing) return existing
  const attempt = await payload.findByID({ collection: 'test-attempts', id: attemptId, depth: 0, overrideAccess: true })
  const report = attempt.report as { band: number; overall: number; subScores: Record<string, number>; provisional: boolean } | null
  if (attempt.status !== 'scored' || !report) return null
  const form = await payload.findByID({ collection: 'test-forms', id: typeof attempt.form === 'object' ? attempt.form.id : attempt.form, depth: 0, overrideAccess: true })
  const issuedAt = new Date()
  const expiresAt = new Date(issuedAt)
  expiresAt.setFullYear(expiresAt.getFullYear() + VALIDITY_YEARS)
  for (let tries = 0; tries < 5; tries++) {
    try {
      return await payload.create({
        collection: 'certificates',
        overrideAccess: true,
        data: {
          code: certificateCode(),
          candidate: typeof attempt.candidate === 'object' ? attempt.candidate.id : attempt.candidate,
          attempt: attempt.id,
          level: form.level,
          band: report.band,
          overall: report.overall,
          subScores: report.subScores,
          provisional: report.provisional,
          issuedAt: issuedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          status: 'valid',
        },
      })
    } catch (e) {
      if (!/unique|duplicate/i.test((e as Error).message)) throw e // retry only on a code collision
    }
  }
  throw new Error('Could not create a unique certificate code')
}

export type CertificateStatus = 'valid' | 'expired' | 'revoked'
export function statusOf(c: { status?: string | null; expiresAt: string }, now = new Date()): CertificateStatus {
  if (c.status === 'revoked') return 'revoked'
  return new Date(c.expiresAt) < now ? 'expired' : 'valid'
}

/** A4 landscape PDF with the band, sub-scores and a QR code to the verification page. */
export async function certificatePdf(c: { code: string; band: number; subScores: Record<string, number>; provisional?: boolean | null; issuedAt: string; expiresAt: string; level?: string | null }, name: string, locale: 'id' | 'en'): Promise<Uint8Array> {
  const id = locale === 'id'
  const pdf = await PDFDocument.create()
  pdf.setTitle(`AILIS ${c.code}`)
  const page = pdf.addPage([842, 595])
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const ink = rgb(0.086, 0.075, 0.059)
  const brand = rgb(0.76, 0.25, 0.1)
  const muted = rgb(0.36, 0.34, 0.31)
  const date = (d: string) => new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
  // The standard PDF fonts only cover Latin-1-like characters: keep those, strip accents from others, else '?'.
  const charset = new Set(regular.getCharacterSet())
  const safe = (t: string) =>
    [...t].map((ch) => (charset.has(ch.codePointAt(0)!) ? ch : ch.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').split('').filter((x) => charset.has(x.codePointAt(0)!)).join('') || '?')).join('')
  const center = (raw: string, y: number, size: number, font = regular, color = ink) => {
    const text = safe(raw)
    return page.drawText(text, { x: (842 - font.widthOfTextAtSize(text, size)) / 2, y, size, font, color })
  }

  page.drawRectangle({ x: 24, y: 24, width: 794, height: 547, borderColor: brand, borderWidth: 2 })
  center('IMPACT THINKLAB · AI LITERACY', 520, 12, bold, brand)
  center(id ? 'Sertifikat Skor Literasi AI (AILIS)' : 'AI Literacy Score Certificate (AILIS)', 485, 26, bold)
  center(id ? 'diberikan kepada' : 'awarded to', 452, 13, regular, muted)
  center(name, 415, 30, bold)
  center(`${id ? 'Skor' : 'Band'} ${c.band} · ${BAND_NAMES[locale][c.band] ?? ''}`, 370, 22, bold, brand)

  const domains = SCORE_DOMAINS.map((d) => `${SCORE_DOMAIN_LABELS[d][locale]} ${Math.round(c.subScores[d] ?? 0)}%`)
  center(domains.slice(0, 3).join('   ·   '), 330, 11, regular, muted)
  center(domains.slice(3).join('   ·   '), 312, 11, regular, muted)

  page.drawText(`${id ? 'Diterbitkan' : 'Issued'}: ${date(c.issuedAt)}`, { x: 70, y: 150, size: 11, font: regular, color: ink })
  page.drawText(`${id ? 'Berlaku sampai' : 'Valid until'}: ${date(c.expiresAt)}`, { x: 70, y: 132, size: 11, font: regular, color: ink })
  page.drawText(`${id ? 'Kode' : 'Code'}: ${c.code}`, { x: 70, y: 114, size: 11, font: bold, color: ink })
  page.drawText(verifyUrl(c.code), { x: 70, y: 96, size: 9, font: regular, color: muted })
  if (c.provisional) {
    const note = id ? 'Sertifikat pilot: ambang skor masih sementara dan belum ditetapkan panel ahli.' : 'Pilot certificate: score thresholds are provisional until set by the expert panel.'
    page.drawText(note, { x: 70, y: 60, size: 9, font: regular, color: brand })
  }
  const qr = await QRCode.toBuffer(verifyUrl(c.code), { margin: 1, width: 240 })
  const img = await pdf.embedPng(qr)
  page.drawImage(img, { x: 652, y: 70, width: 120, height: 120 })
  page.drawText(id ? 'Pindai untuk memeriksa' : 'Scan to verify', { x: 662, y: 56, size: 9, font: regular, color: muted })
  return pdf.save()
}
