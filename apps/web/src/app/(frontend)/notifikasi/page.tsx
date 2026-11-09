import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { MarkNotificationsRead } from '../../../components/MarkNotificationsRead'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const list = await payload.find({ collection: 'notifications', overrideAccess: false, user, depth: 0, limit: 50, sort: '-createdAt' })
  const hasUnread = list.docs.some((n) => !n.readAt)
  const when = (d: string) => new Date(d).toLocaleString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{id ? 'Pemberitahuan' : 'Notifications'}</h1>
        <MarkNotificationsRead hasUnread={hasUnread} />
        {list.docs.length === 0 && <Card><p className="text-muted">{id ? 'Belum ada pemberitahuan.' : 'No notifications yet.'}</p></Card>}
        <ul className="flex flex-col gap-2">
          {list.docs.map((n) => {
            const inner = (
              <>
                <p className="font-semibold">
                  {!n.readAt && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-deep align-middle" aria-label={id ? 'baru' : 'new'} />}
                  {n.title}
                </p>
                {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                <p className="mt-1 text-xs text-muted">{when(n.createdAt)}</p>
              </>
            )
            return (
              <li key={n.id} className={`rounded-2xl border p-4 ${n.readAt ? 'border-line bg-white' : 'border-brand/40 bg-brand/5'}`}>
                {n.link ? <Link href={n.link} className="block">{inner}</Link> : inner}
              </li>
            )
          })}
        </ul>
        <p className="text-sm text-muted">
          {id ? 'Atur email pemberitahuan di ' : 'Manage notification emails on '}
          <Link className="underline" href="/akun">{id ? 'halaman Akun' : 'your Account page'}</Link>.
        </p>
      </div>
    </Shell>
  )
}
