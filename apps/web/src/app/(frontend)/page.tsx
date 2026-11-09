import type { Metadata } from 'next'
import Link from 'next/link'
import { Shell } from '../../components/Shell'
import { Blocks } from '../../components/site/Blocks'
import { PublicAnalytics } from '../../components/PublicAnalytics'
import { getDict } from '../../i18n/server'
import { getPage } from '../../lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDict()
  const page = await getPage('home', locale)
  return { title: page ? `${page.title} · Impact Thinklab` : 'AI Literacy · Impact Thinklab', description: page?.description ?? undefined }
}

export default async function HomePage() {
  const { t, locale } = await getDict()
  const page = await getPage('home', locale)
  return (
    <Shell narrow={false}>
      <PublicAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} locale={locale} />
      {page ? (
        <Blocks blocks={page.layout} locale={locale} />
      ) : (
        // Shown only until the website pages are seeded or written in the CMS.
        <section className="flex flex-col gap-6 py-10 sm:py-16">
          <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">{locale === 'id' ? 'Literasi AI untuk remaja Indonesia' : 'AI literacy for Indonesian teens'}</h1>
          <p className="max-w-xl text-lg text-muted">{t.signup.lead}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/daftar" className="rounded-xl bg-ink px-6 py-3.5 text-center font-semibold text-paper">{t.nav.signup}</Link>
            <Link href="/masuk" className="rounded-xl border border-ink px-6 py-3.5 text-center font-semibold">{t.nav.login}</Link>
          </div>
        </section>
      )}
    </Shell>
  )
}
