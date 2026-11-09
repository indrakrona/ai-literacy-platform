import Link from 'next/link'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { getDict } from '../../../i18n/server'
import { getPayloadClient } from '../../../lib/session'

export default async function TracksPage() {
  const { t, locale } = await getDict()
  const payload = await getPayloadClient()
  const tracks = await payload.find({ collection: 'tracks', locale, sort: 'level', limit: 10 })
  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">{t.learn.title}</h1>
          <p className="mt-1 text-muted">{t.learn.lead}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {tracks.docs.map((tr) => (
            <Link key={tr.id} href={`/belajar/${tr.slug}`} className="block">
              <Card>
                <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">
                  {tr.level === 'smp' ? 'SMP' : 'SMA / SMK'}
                </p>
                <h2 className="mt-1 text-xl font-bold">{tr.title}</h2>
                <p className="mt-2 text-muted">{tr.summary}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  )
}
