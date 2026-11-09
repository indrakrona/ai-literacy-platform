import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Blocks } from '../../../components/site/Blocks'
import { PublicAnalytics } from '../../../components/PublicAnalytics'
import { getDict } from '../../../i18n/server'
import { getPage } from '../../../lib/site'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await getDict()
  const page = await getPage((await params).slug, locale)
  if (!page) return {}
  return { title: `${page.title} · AI Literacy · Impact Thinklab`, description: page.description ?? undefined }
}

/** Any published website page from the CMS (programs, for schools, FAQ, contact, legal …). */
export default async function SitePage({ params }: Props) {
  const { slug } = await params
  if (slug === 'home') notFound()
  const { locale } = await getDict()
  const page = await getPage(slug, locale)
  if (!page) notFound()
  const hasHero = page.layout?.[0]?.blockType === 'hero'
  return (
    <Shell narrow={false}>
      <PublicAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} locale={locale} />
      {!hasHero && <h1 className="mb-8 text-3xl font-bold sm:text-4xl">{page.title}</h1>}
      <Blocks blocks={page.layout} locale={locale} />
    </Shell>
  )
}
