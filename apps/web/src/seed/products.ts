/** Starter products. PRICES ARE PLACEHOLDERS until the business team sets them; existing products are not changed. */
import type { Payload } from 'payload'

const PRODUCTS = [
  {
    slug: 'lisensi-sekolah-tahunan', kind: 'school_licence', priceIdr: 50_000, minQuantity: 30, maxQuantity: 3000, months: 12,
    name: ['Lisensi sekolah 1 tahun', 'School licence, 1 year'],
    description: ['Akses platform AI Literacy untuk satu siswa selama 12 bulan: pelajaran, AI Lab, proyek, dan laporan sekolah.', 'AI Literacy platform access for one student for 12 months: lessons, AI Lab, projects and school reports.'],
  },
  {
    slug: 'voucher-tes-ailis', kind: 'test_voucher', priceIdr: 150_000, minQuantity: 1, maxQuantity: 100, months: 12,
    name: ['Voucher tes AILIS', 'AILIS test voucher'],
    description: ['Satu kali tes Skor Literasi AI (AILIS) dengan sertifikat. Masukkan kodenya saat mendaftar sesi tes.', 'One AI Literacy Score (AILIS) test with a certificate. Enter the code when booking a test session.'],
  },
] as const

export async function seedProducts(payload: Payload) {
  let created = 0
  for (const p of PRODUCTS) {
    if ((await payload.count({ collection: 'products', overrideAccess: true, where: { slug: { equals: p.slug } } })).totalDocs) continue
    const doc = await payload.create({ collection: 'products', overrideAccess: true, locale: 'id', data: { slug: p.slug, kind: p.kind, priceIdr: p.priceIdr, minQuantity: p.minQuantity, maxQuantity: p.maxQuantity, months: p.months, active: true, placeholderPrice: true, name: p.name[0], description: p.description[0] } })
    await payload.update({ collection: 'products', id: doc.id, overrideAccess: true, locale: 'en', data: { name: p.name[1], description: p.description[1] } })
    created++
  }
  return { created, total: PRODUCTS.length }
}
