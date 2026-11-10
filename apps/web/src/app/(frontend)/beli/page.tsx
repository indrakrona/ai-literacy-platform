import Link from 'next/link'
import { redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card, Notice } from '../../../components/ui'
import { BuyForm } from '../../../components/forms/CommerceForms'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { COMMERCE_PROBLEMS, taxSettings } from '../../../lib/commerce'
import { canBuy } from '../../../collections/commerce-endpoints'
import { childrenOf } from '../../../lib/parents'
import { formatIdr } from '../../../lib/payments'

/** Store (spec K1–K2): school licences for school admins, AILIS test vouchers for everyone. Paid by bank transfer for now. */
export default async function StorePage({ searchParams }: { searchParams: Promise<{ produk?: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const wanted = (await searchParams).produk
  const products = (await payload.find({ collection: 'products', overrideAccess: true, depth: 0, locale, limit: 20, sort: 'priceIdr', where: { active: { equals: true } } })).docs.filter((p) => canBuy(user as never, p.kind as never) && (!wanted || p.slug === wanted))
  const tax = await taxSettings(payload)
  const kids = hasRole(user, 'parent') ? (await childrenOf(payload, user.id)).map((k) => ({ id: k.id, name: k.name })) : []
  const problems = Object.fromEntries(Object.entries(COMMERCE_PROBLEMS).map(([k, v]) => [k, v[locale]]))
  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold">{id ? 'Beli' : 'Buy'}</h1>
          <p className="mt-1 text-muted">{id ? 'Pembayaran saat ini lewat transfer bank; pesanan aktif setelah tim kami mengonfirmasi.' : 'Payment is by bank transfer for now; orders become active once our team confirms.'} <Link href="/pesanan" className="underline">{id ? 'Pesanan saya' : 'My orders'}</Link></p>
        </div>
        {products.length === 0 && <Notice title={id ? 'Tidak ada produk untuk akun Anda' : 'No products for your account'} />}
        {products.map((p) => (
          <Card key={p.id}>
            <h2 className="text-lg font-semibold">{p.name}</h2>
            {p.description && <p className="mt-1 text-sm text-muted">{p.description}</p>}
            <p className="mt-2 font-semibold">
              {formatIdr(p.priceIdr)} {p.kind === 'school_licence' ? (id ? 'per siswa' : 'per student') : id ? 'per voucher' : 'per voucher'}
              {tax.ppnEnabled ? <span className="font-normal text-muted"> + PPN {tax.ppnRate}%</span> : null}
            </p>
            {p.placeholderPrice && <p className="mt-1 text-xs text-brand-deep">{id ? 'Harga masih sementara (masa uji coba).' : 'Provisional price (pilot).'}</p>}
            <div className="mt-4">
              <BuyForm product={{ id: p.id, priceIdr: p.priceIdr, minQuantity: p.minQuantity ?? 1, maxQuantity: p.maxQuantity ?? 100, kind: p.kind }} children={p.kind === 'test_voucher' ? kids : []} ppnRate={tax.ppnEnabled ? tax.ppnRate : null} problems={problems} locale={locale} />
            </div>
          </Card>
        ))}
      </div>
    </Shell>
  )
}
