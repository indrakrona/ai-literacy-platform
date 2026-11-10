import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '../../../../components/Shell'
import { Card } from '../../../../components/ui'
import { getDict } from '../../../../i18n/server'
import { getPayloadClient } from '../../../../lib/session'
import { portfolioPublic, shownName } from '../../../../lib/engagement'
import { galleryItems } from '../../../../lib/gallery'
import { BAND_NAMES } from '../../../../lib/certificates'

async function owner(handle: string) {
  const payload = await getPayloadClient()
  const u = (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 1, where: { and: [{ 'portfolio.handle': { equals: handle.toLowerCase() } }, { suspended: { not_equals: true } }] } })).docs[0]
  return u && portfolioPublic(u as never) ? u : null
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const u = await owner((await params).handle)
  // Portfolios are shared by link; they are not listed in search engines.
  return u ? { title: `${shownName(u)} · Portofolio AI Literacy`, robots: { index: false, follow: false } } : { robots: { index: false } }
}

/** Public portfolio (spec F6): off by default, and for under-18s only after a parent approves. */
export default async function PortfolioPage({ params }: { params: Promise<{ handle: string }> }) {
  const { locale } = await getDict()
  const id = locale === 'id'
  const u = await owner((await params).handle)
  if (!u) notFound()
  const payload = await getPayloadClient()
  const p = u.portfolio ?? {}
  const [badges, projects, cert] = await Promise.all([
    p.showBadges ? payload.find({ collection: 'user-badges', overrideAccess: true, depth: 1, locale, limit: 50, where: { user: { equals: u.id } } }) : null,
    p.showProjects ? galleryItems(payload, locale, { members: { contains: u.id } }, 20) : [],
    p.showCertificate ? payload.find({ collection: 'certificates', overrideAccess: true, depth: 0, limit: 1, sort: '-issuedAt', where: { and: [{ candidate: { equals: u.id } }, { status: { equals: 'valid' } }, { expiresAt: { greater_than: new Date().toISOString() } }] } }) : null,
  ])
  const c = cert?.docs[0]
  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <Card>
          <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">{id ? 'Portofolio AI Literacy' : 'AI Literacy portfolio'}</p>
          <h1 className="mt-1 text-3xl font-bold">{shownName(u)}</h1>
          {p.headline && <p className="mt-1 text-muted">{p.headline}</p>}
        </Card>
        {c && (
          <Card>
            <h2 className="font-semibold">{id ? 'Skor Literasi AI (AILIS)' : 'AI Literacy Score (AILIS)'}</h2>
            <p className="mt-1">Band <strong>{c.band}</strong> · {BAND_NAMES[locale][c.band]}{c.provisional ? (id ? ' (pilot)' : ' (pilot)') : ''}</p>
            <Link href={`/verifikasi/${c.code}`} className="mt-1 inline-block text-sm underline">{id ? 'Periksa sertifikat' : 'Verify certificate'} · {c.code}</Link>
          </Card>
        )}
        {badges && badges.docs.length > 0 && (
          <Card>
            <h2 className="font-semibold">{id ? 'Lencana' : 'Badges'}</h2>
            <ul className="mt-2 flex flex-wrap gap-2 text-sm">
              {badges.docs.map((b) => (typeof b.badge === 'object' ? <li key={b.id} className="rounded-full border border-line px-3 py-1"><span aria-hidden>{b.badge.icon}</span> {b.badge.name}</li> : null))}
            </ul>
          </Card>
        )}
        {projects.length > 0 && (
          <Card>
            <h2 className="font-semibold">{id ? 'Proyek' : 'Projects'}</h2>
            <ul className="mt-2 divide-y divide-line">
              {projects.map((x) => <li key={x.id} className="py-2"><Link href={`/galeri/${x.id}`} className="font-medium underline">{x.title}</Link><span className="text-sm text-muted"> · {x.team.join(', ')}</span></li>)}
            </ul>
          </Card>
        )}
        <p className="text-xs text-muted">{id ? 'Halaman ini dibuat dan dikendalikan oleh pemiliknya.' : 'This page is created and controlled by its owner.'}</p>
      </div>
    </Shell>
  )
}
