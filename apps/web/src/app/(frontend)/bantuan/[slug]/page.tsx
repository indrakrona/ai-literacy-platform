import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '../../../../components/Shell'
import { Card } from '../../../../components/ui'
import { HelpBody } from '../../../../components/HelpBody'
import { getDict } from '../../../../i18n/server'
import { getPayloadClient } from '../../../../lib/session'
import { HELP_CATEGORIES } from '../../../../collections/Support'

async function load(slug: string, locale: 'id' | 'en') {
  return (await (await getPayloadClient()).find({ collection: 'help-articles', overrideAccess: true, depth: 0, locale, fallbackLocale: 'id', limit: 1, where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] } })).docs[0]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { locale } = await getDict()
  const a = await load((await params).slug, locale)
  return a ? { title: `${a.title} · ${locale === 'id' ? 'Bantuan' : 'Help'} · AI Literacy`, description: a.summary ?? undefined } : {}
}

export default async function HelpArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { locale } = await getDict()
  const id = locale === 'id'
  const a = await load((await params).slug, locale)
  if (!a) notFound()
  const cat = HELP_CATEGORIES.find((c) => c.value === a.category)
  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <Link href={`/bantuan?kategori=${a.category}`} className="text-sm underline">← {cat ? cat[locale] : id ? 'Pusat bantuan' : 'Help centre'}</Link>
        <Card>
          <h1 className="text-2xl font-bold">{a.title}</h1>
          {a.summary && <p className="mt-1 text-muted">{a.summary}</p>}
          <div className="mt-5"><HelpBody text={a.body} /></div>
        </Card>
        <p className="text-sm text-muted">
          {id ? 'Masih perlu bantuan? ' : 'Still need help? '}
          <Link href="/bantuan/tiket" className="underline">{id ? 'Kirim pertanyaan ke tim kami' : 'Ask our team'}</Link>
        </p>
      </div>
    </Shell>
  )
}
