import type { MetadataRoute } from 'next'

/** Public pages may be indexed; the learning area, accounts and admin may not. */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/beranda', '/belajar', '/lab', '/tes', '/guru', '/sekolah', '/penilai', '/dasbor', '/akun', '/notifikasi', '/persetujuan', '/atur-sandi', '/proyek'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
