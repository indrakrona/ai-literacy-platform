import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { ORDER_STATUS } from '../../../lib/commerce'
import { formatIdr } from '../../../lib/payments'

export default async function OrdersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { locale } = await getDict()
  const id = locale === 'id'
  const orders = (await (await getPayloadClient()).find({ collection: 'orders', overrideAccess: false, user, depth: 1, locale, limit: 50, sort: '-createdAt' })).docs
  const fmt = (d: string) => new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })
  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold">{id ? 'Pesanan saya' : 'My orders'}</h1>
          <Link href="/beli" className="text-sm font-semibold underline">{id ? 'Beli' : 'Buy'}</Link>
        </div>
        <Card>
          {orders.length === 0 ? <p className="text-muted">{id ? 'Belum ada pesanan.' : 'No orders yet.'}</p> : (
            <ul className="divide-y divide-line">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                  <Link href={`/pesanan/${o.id}`} className="font-medium underline">#{o.id} · {typeof o.product === 'object' && o.product ? o.product.name : o.plan} · {o.quantity ?? o.seats}×</Link>
                  <span className="text-sm text-muted">{formatIdr(o.amountIdr)} · {ORDER_STATUS[o.status]?.[locale] ?? o.status} · {fmt(o.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Shell>
  )
}
