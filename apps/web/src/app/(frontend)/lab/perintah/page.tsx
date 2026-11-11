import Link from 'next/link'
import { Shell } from '../../../../components/Shell'
import { Card } from '../../../../components/ui'
import { CopyText } from '../../../../components/forms/CopyText'
import { getDict } from '../../../../i18n/server'
import { PROMPT_CATEGORIES, PROMPT_LIBRARY } from '../../../../lib/prompt-library'

/** Prompt library (spec D7): patterns for learning honestly, checking facts and protecting privacy. */
export default async function PromptLibrary() {
  const { locale } = await getDict()
  const id = locale === 'id'
  const cats = Object.keys(PROMPT_CATEGORIES) as (keyof typeof PROMPT_CATEGORIES)[]
  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/beranda" className="text-sm underline">{id ? '← Beranda' : '← Home'}</Link>
          <h1 className="mt-1 text-3xl font-bold">{id ? 'Perpustakaan perintah' : 'Prompt library'}</h1>
          <p className="mt-1 text-muted">{id ? 'Pola perintah (prompt) yang membantu kamu belajar dengan jujur, memeriksa fakta, dan menjaga privasi. Salin, ganti bagian dalam [kurung], lalu pakai di AI Lab.' : 'Prompt patterns that help you learn honestly, check facts and protect privacy. Copy one, replace the parts in [brackets], and use it in the AI Lab.'}</p>
        </div>
        {cats.map((c) => (
          <section key={c} className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">{PROMPT_CATEGORIES[c][locale]}</h2>
            {PROMPT_LIBRARY.filter((p) => p.category === c).map((p) => (
              <Card key={p.slug}>
                <h3 className="text-lg font-semibold">{p.title[locale]}</h3>
                <p className="text-sm text-muted">{p.when[locale]}</p>
                <div className="mt-3 rounded-xl bg-paper p-3">
                  <p className="font-mono text-sm whitespace-pre-line">{p.template[locale]}</p>
                  <div className="mt-2"><CopyText text={p.template[locale]} label={id ? 'Salin pola' : 'Copy pattern'} done={id ? 'Tersalin' : 'Copied'} /></div>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p className="rounded-xl border border-danger/30 p-2"><span className="font-semibold">✗ {id ? 'Kurang jelas' : 'Weak'}:</span> {p.weak[locale]}</p>
                  <p className="rounded-xl border border-ok/40 p-2"><span className="font-semibold">✓ {id ? 'Lebih baik' : 'Better'}:</span> {p.strong[locale]}</p>
                </div>
                {p.caution && <p className="mt-2 text-sm text-brand-deep">⚠ {p.caution[locale]}</p>}
              </Card>
            ))}
          </section>
        ))}
      </div>
    </Shell>
  )
}
