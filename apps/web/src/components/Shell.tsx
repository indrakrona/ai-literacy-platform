import Link from 'next/link'
import React from 'react'
import { getDict } from '../i18n/server'
import { getCurrentUser, getPayloadClient } from '../lib/session'
import { LanguageSwitcher } from './LanguageSwitcher'
import { LogoutButton } from './forms/LogoutButton'
import { PublicNav } from './site/PublicNav'
import { Footer } from './site/Footer'
import { getSiteChrome } from '../lib/site'

export async function Shell({ children, narrow = true }: { children: React.ReactNode; narrow?: boolean }) {
  const { locale, t } = await getDict()
  const user = await getCurrentUser()
  const chrome = user ? null : await getSiteChrome(locale)
  const unread = user
    ? (await (await getPayloadClient()).count({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: user.id } }, { readAt: { exists: false } }] } }).catch(() => ({ totalDocs: 0 }))).totalDocs
    : 0
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href={user ? '/beranda' : '/'} className="text-lg font-bold">
            {t.brand}
          </Link>
          <nav className="flex items-center gap-3 text-sm font-semibold">
            {user ? (
              <>
                <Link href="/notifikasi" className="relative inline-flex items-center" aria-label={`${locale === 'id' ? 'Pemberitahuan' : 'Notifications'}${unread ? ` (${unread})` : ''}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                  {unread > 0 && <span className="absolute -top-1.5 -right-2 min-w-[18px] rounded-full bg-brand-deep px-1 text-center text-[11px] leading-[18px] text-white">{unread > 9 ? '9+' : unread}</span>}
                </Link>
                <Link href="/akun" className="hidden sm:inline">
                  {t.nav.account}
                </Link>
                <LogoutButton label={t.nav.logout} />
              </>
            ) : (
              <>
                <PublicNav items={chrome?.nav ?? []} menuLabel={locale === 'id' ? 'Menu' : 'Menu'} />
                <Link href="/masuk">{t.nav.login}</Link>
              </>
            )}
            <LanguageSwitcher locale={locale} />
          </nav>
        </div>
      </header>
      <main className={`mx-auto w-full px-4 py-8 sm:py-12 ${narrow ? 'max-w-lg' : 'max-w-5xl'}`}>{children}</main>
      <Footer locale={locale} />
    </div>
  )
}
