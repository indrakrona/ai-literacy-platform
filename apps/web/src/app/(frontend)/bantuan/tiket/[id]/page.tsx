import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../../components/Shell'
import { Card } from '../../../../../components/ui'
import { TicketReply } from '../../../../../components/forms/TicketForms'
import { getDict } from '../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../lib/session'
import { TICKET_CATEGORIES, TICKET_STATUS, visibleMessages } from '../../../../../collections/Support'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const t = await payload.findByID({ collection: 'support-tickets', id: Number((await params).id), depth: 0, overrideAccess: false, user }).catch(() => null)
  if (!t) notFound()
  const staff = hasRole(user, 'super_admin')
  const messages = visibleMessages(t.messages, staff)
  const people = new Map((await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 20, where: { id: { in: messages.map((m) => idOf(m.by)).filter(Boolean) as number[] } } })).docs.map((u) => [u.id, u.name]))
  const requester = t.requester ? people.get(idOf(t.requester)!) ?? (await payload.findByID({ collection: 'users', id: idOf(t.requester)!, depth: 0, overrideAccess: true }).catch(() => null))?.name : `${t.guestName ?? ''} <${t.guestEmail}>`
  const fmt = (d: string) => new Date(d).toLocaleString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
  const cat = TICKET_CATEGORIES.find((c) => c.value === t.category)

  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <Link href={staff ? '/operasi?tab=tiket' : '/bantuan/tiket'} className="text-sm underline">← {staff ? (id ? 'Semua tiket' : 'All tickets') : id ? 'Pertanyaan saya' : 'My questions'}</Link>
        <div>
          <h1 className="text-2xl font-bold">{t.subject}</h1>
          <p className="text-sm text-muted">{cat?.[locale]} · {TICKET_STATUS[t.status]?.[locale] ?? t.status}{staff ? ` · ${requester}` : ''}</p>
        </div>
        <ol className="flex flex-col gap-3">
          {messages.map((m, i) => (
            <li key={i} className={`rounded-2xl border p-4 ${m.internal ? 'border-dashed border-brand/50 bg-brand/5' : m.fromStaff ? 'border-line bg-white' : 'border-line bg-paper'}`}>
              <p className="text-xs text-muted">
                {m.fromStaff ? (id ? 'Tim AI Literacy' : 'AI Literacy team') : (people.get(idOf(m.by) ?? -1) ?? (id ? 'Penanya' : 'Requester'))}
                {staff && m.fromStaff && people.get(idOf(m.by) ?? -1) ? ` (${people.get(idOf(m.by)!)})` : ''} · {fmt(m.at)}
                {m.internal ? (id ? ' · catatan internal' : ' · internal note') : ''}
              </p>
              <p className="mt-1 whitespace-pre-line">{m.body}</p>
            </li>
          ))}
        </ol>
        {(staff || idOf(t.requester) === user.id) && (
          <Card>
            <TicketReply ticketId={t.id} staff={staff} status={t.status} locale={locale} />
          </Card>
        )}
      </div>
    </Shell>
  )
}
