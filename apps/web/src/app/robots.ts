import type { MetadataRoute } from 'next'
import { siteUrl } from '../lib/site-url'

// Read the site address at request time: the Docker image is built without it.
export const dynamic = 'force-dynamic'

/** Public pages may be indexed; the learning area, accounts and admin may not. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/beranda', '/belajar', '/lab', '/tes', '/guru', '/sekolah', '/penilai', '/dasbor', '/akun', '/notifikasi', '/persetujuan', '/atur-sandi', '/proyek'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
