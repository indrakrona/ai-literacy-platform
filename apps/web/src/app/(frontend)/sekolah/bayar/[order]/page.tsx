import { ORDER_STATUS } from '../../../../../lib/commerce'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../../components/Shell'
import { Card, Notice } from '../../../../../components/ui'
import { MockPayButtons } from '../../../../../components/forms/LicenceForms'
import { getDict } from '../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../lib/session'
import { formatIdr, mockPaymentsAllowed, PLANS, type PlanKey } from '../../../../../lib/payments'

/** Test-mode payment page. A real gateway (Midtrans/Xendit) replaces this with its own hosted page. */
export default async function MockPaymentPage({ params }: { params: Promise<{ order: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'school_admin', 'super_admin') || !mockPaymentsAllowed()) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const order = await payload.findByID({ collection: 'orders', id: Number((await params).order), depth: 0, overrideAccess: false, user }).catch(() => null)
  if (!order) notFound()
  const plan = PLANS[order.plan as PlanKey]
  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <Notice tone="warn" title={id ? 'Mode uji — belum ada uang yang ditarik' : 'Test mode — no money is charged'}>
          {id
            ? 'Gerbang pembayaran (Midtrans/Xendit) belum disambungkan. Halaman ini hanya untuk menguji alur lisensi sekolah.'
            : 'The payment gateway (Midtrans/Xendit) is not connected yet. This page only tests the school licence flow.'}
        </Notice>
        <Card>
          <p className="text-sm text-muted">{id ? 'Pesanan' : 'Order'} #{order.id} · {order.providerRef}</p>
          <h1 className="mt-1 text-2xl font-bold">{plan ? plan.label[locale] : order.plan}</h1>
          <p className="mt-2">{order.seats} {id ? 'siswa' : 'students'}</p>
          <p className="mt-1 text-3xl font-bold">{formatIdr(order.amountIdr)}</p>
          <p className="mt-1 text-sm text-muted">Status: {ORDER_STATUS[order.status]?.[locale] ?? order.status}</p>
          <div className="mt-6">
            {order.status === 'pending' ? <MockPayButtons orderId={order.id} locale={locale} /> : <Link className="underline" href="/sekolah">{id ? 'Kembali ke Ruang Sekolah' : 'Back to school space'}</Link>}
          </div>
        </Card>
      </div>
    </Shell>
  )
}
