import Link from 'next/link'
import { Shell } from '../../../../components/Shell'
import { Card } from '../../../../components/ui'
import { NewTicketForm } from '../../../../components/forms/TicketForms'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../lib/session'
import { TICKET_CATEGORIES, TICKET_STATUS } from '../../../../collections/Support'

/** Support tickets (spec M2): ask the team; signed-in users also see their earlier tickets. */
export default async function TicketsPage() {
  const user = await getCurrentUser()
  const { locale } = await getDict()
  const id = locale === 'id'
  const mine = user ? (await (await getPayloadClient()).find({ collection: 'support-tickets', overrideAccess: false, user, depth: 0, limit: 50, sort: '-lastActivityAt' })).docs : []
  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' }) : '')
  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <Link href="/bantuan" className="text-sm underline">{id ? '← Pusat bantuan' : '← Help centre'}</Link>
        <Card>
          <h1 className="text-2xl font-bold">{id ? 'Kirim pertanyaan' : 'Ask a question'}</h1>
          <p className="mt-1 mb-5 text-muted">{id ? 'Tim AI Literacy membalas dalam 2 hari kerja.' : 'The AI Literacy team replies within 2 working days.'}</p>
          <NewTicketForm signedIn={Boolean(user)} categories={TICKET_CATEGORIES.map((c) => ({ value: c.value, label: c[locale] }))} locale={locale} />
        </Card>
        {mine.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold">{id ? 'Pertanyaan saya' : 'My questions'}</h2>
            <ul className="mt-2 divide-y divide-line">
              {mine.map((t) => (
                <li key={t.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                  <Link href={`/bantuan/tiket/${t.id}`} className="font-medium underline">{t.subject}</Link>
                  <span className="text-sm text-muted">{TICKET_STATUS[t.status]?.[locale] ?? t.status} · {fmt(t.lastActivityAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </Shell>
  )
}
