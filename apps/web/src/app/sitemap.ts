import type { MetadataRoute } from 'next'
import { getPayloadClient } from '../lib/session'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const payload = await getPayloadClient()
  const pages = await payload.find({ collection: 'pages', depth: 0, limit: 100, where: { _status: { equals: 'published' } }, select: { slug: true, updatedAt: true } }).catch(() => ({ docs: [] }))
  return [
    ...pages.docs.map((p) => ({ url: p.slug === 'home' ? `${base}/` : `${base}/${p.slug}`, lastModified: p.updatedAt })),
    { url: `${base}/daftar` },
    { url: `${base}/masuk` },
    { url: `${base}/verifikasi` },
  ]
}
