import type { Metadata } from 'next'
import Link from 'next/link'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { getDict } from '../../../i18n/server'
import { getPayloadClient } from '../../../lib/session'
import { EVENT_STATUS, EVENT_TYPE } from '../../../lib/engagement'

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDict()
  return { title: locale === 'id' ? 'Acara dan musim tantangan · AI Literacy' : 'Events and seasons · AI Literacy' }
}

/** Seasons and events (spec E5): hackathons, challenge weeks and demo days. */
export default async function EventsPage() {
  const { locale } = await getDict()
  const id = locale === 'id'
  const events = (await (await getPayloadClient()).find({ collection: 'events', overrideAccess: true, depth: 0, locale, fallbackLocale: 'id', limit: 50, sort: '-startsAt' })).docs
  const fmt = (d: string) => new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })
  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-bold">{id ? 'Acara dan musim tantangan' : 'Events and challenge seasons'}</h1>
          <p className="mt-1 text-muted">{id ? 'Ikutkan proyek tim kalian, dinilai juri, dan pamerkan di demo day.' : 'Enter your team’s project, get judged, and show it at demo day.'}</p>
        </div>
        {events.length === 0 ? <Card><p className="text-muted">{id ? 'Belum ada acara.' : 'No events yet.'}</p></Card> : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/acara/${e.slug}`} className="block h-full rounded-2xl border border-line bg-white p-4 hover:border-ink">
                  <p className="text-xs font-semibold tracking-wide text-brand-deep uppercase">{EVENT_TYPE[e.type]?.[locale]} · {EVENT_STATUS[e.status]?.[locale]}</p>
                  <p className="mt-1 text-lg font-semibold">{e.title}</p>
                  <p className="text-sm text-muted">{fmt(e.startsAt)} – {fmt(e.endsAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  )
}
