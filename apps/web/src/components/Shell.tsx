import Link from 'next/link'
import React from 'react'
import { getDict } from '../i18n/server'
import { getCurrentUser } from '../lib/session'
import { LanguageSwitcher } from './LanguageSwitcher'
import { LogoutButton } from './forms/LogoutButton'

export async function Shell({ children, narrow = true }: { children: React.ReactNode; narrow?: boolean }) {
  const { locale, t } = await getDict()
  const user = await getCurrentUser()
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
                <Link href="/akun" className="hidden sm:inline">
                  {t.nav.account}
                </Link>
                <LogoutButton label={t.nav.logout} />
              </>
            ) : (
              <Link href="/masuk">{t.nav.login}</Link>
            )}
            <LanguageSwitcher locale={locale} />
          </nav>
        </div>
      </header>
      <main className={`mx-auto w-full px-4 py-8 sm:py-12 ${narrow ? 'max-w-lg' : 'max-w-5xl'}`}>{children}</main>
    </div>
  )
}
