import Link from 'next/link'
import { Shell } from '../../components/Shell'
import { getDict } from '../../i18n/server'
import { PublicAnalytics } from '../../components/PublicAnalytics'

// Temporary landing page; the full public site is task A1/A2/A7/A8.
export default async function HomePage() {
  const { t, locale } = await getDict()
  return (
    <Shell narrow={false}>
      <PublicAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} locale={locale} />
      <section className="flex flex-col gap-6 py-10 sm:py-16">
        <p className="text-sm font-semibold tracking-widest text-brand-deep uppercase">Impact Thinklab</p>
        <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">
          {locale === 'id' ? 'Literasi AI untuk remaja Indonesia' : 'AI literacy for Indonesian teens'}
        </h1>
        <p className="max-w-xl text-lg text-muted">{t.signup.lead}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/daftar" className="rounded-xl bg-ink px-6 py-3.5 text-center font-semibold text-paper">{t.nav.signup}</Link>
          <Link href="/masuk" className="rounded-xl border border-ink px-6 py-3.5 text-center font-semibold">{t.nav.login}</Link>
        </div>
      </section>
    </Shell>
  )
}
