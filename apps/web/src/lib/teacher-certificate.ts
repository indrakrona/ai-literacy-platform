/** The AI Literacy Teacher certificate (spec H7): code, verification link and a one-page PDF. */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import { verifyUrl } from './certificates'
import { COURSE_MODULES } from './teacher-course'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

/** e.g. GURU-7KQ2-M9XD. The prefix tells the verification page which register to look in. */
export function teacherCertificateCode(rand: () => number = Math.random): string {
  const part = () => Array.from({ length: 4 }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)]).join('')
  return `GURU-${part()}-${part()}`
}

export const isTeacherCode = (code: string) => /^GURU-/i.test(code.trim())

export async function teacherCertificatePdf(c: { code: string; issuedAt: string; expiresAt: string }, name: string, locale: 'id' | 'en'): Promise<Uint8Array> {
  const id = locale === 'id'
  const pdf = await PDFDocument.create()
  pdf.setTitle(`${id ? 'Guru Literasi AI' : 'AI Literacy Teacher'} ${c.code}`)
  const page = pdf.addPage([842, 595])
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const ink = rgb(0.086, 0.075, 0.059)
  const brand = rgb(0.76, 0.25, 0.1)
  const muted = rgb(0.36, 0.34, 0.31)
  const charset = new Set(regular.getCharacterSet())
  const safe = (t: string) =>
    [...t].map((ch) => (charset.has(ch.codePointAt(0)!) ? ch : ch.normalize('NFKD').replace(/[̀-ͯ]/g, '').split('').filter((x) => charset.has(x.codePointAt(0)!)).join('') || '?')).join('')
  const center = (raw: string, y: number, size: number, font = regular, color = ink) => {
    const text = safe(raw)
    page.drawText(text, { x: (842 - font.widthOfTextAtSize(text, size)) / 2, y, size, font, color })
  }
  const date = (d: string) => new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })

  page.drawRectangle({ x: 24, y: 24, width: 794, height: 547, borderColor: brand, borderWidth: 2 })
  center('IMPACT THINKLAB · AI LITERACY', 520, 12, bold, brand)
  center(id ? 'Sertifikat Guru Literasi AI' : 'AI Literacy Teacher Certificate', 482, 28, bold)
  center(id ? 'diberikan kepada' : 'awarded to', 450, 13, regular, muted)
  center(name, 412, 30, bold)
  center(id ? 'telah menyelesaikan pelatihan guru dan lulus ujian sertifikasi:' : 'has completed the teacher training and passed the certification exam:', 372, 12, regular, muted)
  const titles = COURSE_MODULES.map((m, i) => `${i + 1}. ${m.title[locale]}`)
  titles.forEach((t, i) => center(t, 346 - i * 17, 10.5, regular, ink))

  page.drawText(`${id ? 'Diterbitkan' : 'Issued'}: ${date(c.issuedAt)}`, { x: 70, y: 132, size: 11, font: regular, color: ink })
  page.drawText(`${id ? 'Berlaku sampai' : 'Valid until'}: ${date(c.expiresAt)}`, { x: 70, y: 114, size: 11, font: regular, color: ink })
  page.drawText(`${id ? 'Kode' : 'Code'}: ${c.code}`, { x: 70, y: 96, size: 11, font: bold, color: ink })
  page.drawText(verifyUrl(c.code), { x: 70, y: 78, size: 9, font: regular, color: muted })
  const qr = await QRCode.toBuffer(verifyUrl(c.code), { margin: 1, width: 240 })
  page.drawImage(await pdf.embedPng(qr), { x: 652, y: 70, width: 120, height: 120 })
  page.drawText(id ? 'Pindai untuk memeriksa' : 'Scan to verify', { x: 662, y: 56, size: 9, font: regular, color: muted })
  return pdf.save()
}
