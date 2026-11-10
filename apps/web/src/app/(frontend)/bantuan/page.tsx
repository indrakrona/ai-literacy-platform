import type { Metadata } from 'next'
import Link from 'next/link'
import type { Where } from 'payload'
import { Shell } from '../../../components/Shell'
import { Card, inputClass } from '../../../components/ui'
import { getDict } from '../../../i18n/server'
import { getPayloadClient } from '../../../lib/session'
import { HELP_CATEGORIES } from '../../../collections/Support'

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDict()
  return { title: locale === 'id' ? 'Pusat bantuan · AI Literacy' : 'Help centre · AI Literacy' }
}

/** Help centre (spec M1): search and browse articles; send a ticket when they don't help. */
export default async function HelpCentre({ searchParams }: { searchParams: Promise<{ q?: string; kategori?: string }> }) {
  const { locale } = await getDict()
  const id = locale === 'id'
  const { q, kategori } = await searchParams
  const query = (q ?? '').trim().slice(0, 80)
  const and: Where[] = [{ published: { equals: true } }]
  if (kategori) and.push({ category: { equals: kategori } })
  if (query) and.push({ or: [{ title: { like: query } }, { summary: { like: query } }, { body: { like: query } }] })
  const articles = (await (await getPayloadClient()).find({ collection: 'help-articles', overrideAccess: true, depth: 0, locale, fallbackLocale: 'id', limit: 100, sort: 'order', where: { and } })).docs
  const pill = (active: boolean) => `rounded-full border px-3 py-1 text-sm ${active ? 'border-ink bg-ink text-paper' : 'border-line bg-white'}`
  const cats = HELP_CATEGORIES.filter((c) => !kategori || c.value === kategori)

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">{id ? 'Pusat bantuan' : 'Help centre'}</h1>
          <p className="mt-1 text-muted">{id ? 'Jawaban untuk siswa, guru, orang tua, dan sekolah.' : 'Answers for students, teachers, parents and schools.'}</p>
        </div>
        <form className="flex flex-col gap-2 sm:flex-row" role="search">
          <input name="q" defaultValue={query} className={inputClass} placeholder={id ? 'Cari, mis. "lupa kata sandi"' : 'Search, e.g. "forgot password"'} aria-label={id ? 'Cari bantuan' : 'Search help'} />
          {kategori && <input type="hidden" name="kategori" value={kategori} />}
          <button type="submit" className="rounded-xl bg-ink px-5 py-3 font-semibold text-paper">{id ? 'Cari' : 'Search'}</button>
        </form>
        <nav aria-label={id ? 'Kategori' : 'Categories'} className="flex flex-wrap gap-2">
          <Link href="/bantuan" className={pill(!kategori)}>{id ? 'Semua' : 'All'}</Link>
          {HELP_CATEGORIES.map((c) => <Link key={c.value} href={`/bantuan?kategori=${c.value}`} className={pill(kategori === c.value)}>{c[locale]}</Link>)}
        </nav>

        {articles.length === 0 ? (
          <Card><p className="text-muted">{id ? 'Tidak ada artikel yang cocok.' : 'No matching articles.'}</p></Card>
        ) : (
          cats.map((c) => {
            const list = articles.filter((a) => a.category === c.value)
            if (!list.length) return null
            return (
              <section key={c.value}>
                <h2 className="mb-2 text-lg font-semibold">{c[locale]}</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {list.map((a) => (
                    <li key={a.id}>
                      <Link href={`/bantuan/${a.slug}`} className="block h-full rounded-2xl border border-line bg-white p-4 hover:border-ink">
                        <p className="font-semibold">{a.title}</p>
                        {a.summary && <p className="mt-1 text-sm text-muted">{a.summary}</p>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })
        )}

        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Belum menemukan jawabannya?' : 'Didn’t find your answer?'}</h2>
          <p className="mt-1 text-sm text-muted">{id ? 'Kirim pertanyaan ke tim AI Literacy. Kami membalas di sini dan lewat email.' : 'Send your question to the AI Literacy team. We reply here and by email.'}</p>
          <Link href="/bantuan/tiket" className="mt-3 inline-block rounded-xl bg-ink px-5 py-3 font-semibold text-paper">{id ? 'Kirim pertanyaan' : 'Ask a question'}</Link>
        </Card>
      </div>
    </Shell>
  )
}
