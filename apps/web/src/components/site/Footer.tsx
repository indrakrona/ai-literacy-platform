import Link from 'next/link'
import { getSiteChrome } from '../../lib/site'

export async function Footer({ locale }: { locale: 'id' | 'en' }) {
  const { nav, legal, settings } = await getSiteChrome(locale)
  const id = locale === 'id'
  const wa = settings?.whatsapp?.replace(/\D/g, '')
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <p className="font-bold">Impact Thinklab · AI Literacy</p>
          {settings?.tagline && <p className="mt-1 text-muted">{settings.tagline}</p>}
        </div>
        <nav aria-label={id ? 'Tautan situs' : 'Site links'} className="flex flex-col gap-1.5">
          {nav.map((l) => <Link key={l.href} href={l.href} className="text-muted hover:text-ink">{l.label}</Link>)}
          {legal.map((l) => <Link key={l.href} href={l.href} className="text-muted hover:text-ink">{l.label}</Link>)}
          <Link href="/galeri" className="text-muted hover:text-ink">{id ? 'Galeri proyek' : 'Project gallery'}</Link>
          <Link href="/bantuan" className="text-muted hover:text-ink">{id ? 'Pusat bantuan' : 'Help centre'}</Link>
          <Link href="/verifikasi" className="text-muted hover:text-ink">{id ? 'Verifikasi sertifikat' : 'Verify a certificate'}</Link>
        </nav>
        <div className="flex flex-col gap-1.5 text-muted">
          {settings?.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="hover:text-ink">{settings.contactEmail}</a>}
          {wa && <a href={`https://wa.me/${wa}`} className="hover:text-ink">WhatsApp</a>}
          {settings?.address && <p className="whitespace-pre-line">{settings.address}</p>}
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-muted">© {new Date().getFullYear()} Impact Thinklab</p>
    </footer>
  )
}
