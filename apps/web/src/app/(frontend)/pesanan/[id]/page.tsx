import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Shell } from '../../../../components/Shell'
import { Card, Notice } from '../../../../components/ui'
import { CopyCodes, TransferReport } from '../../../../components/forms/CommerceForms'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../lib/session'
import { ORDER_STATUS, taxSettings } from '../../../../lib/commerce'
import { formatIdr } from '../../../../lib/payments'
import { invoiceNumber } from '../../../../lib/invoices'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

/** One order: what to transfer and where, "I have transferred", invoice/receipt, and voucher codes once paid. */
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const o = await payload.findByID({ collection: 'orders', id: Number((await params).id), depth: 1, locale, overrideAccess: false, user }).catch(() => null)
  if (!o) notFound()
  const tax = await taxSettings(payload)
  const product = typeof o.product === 'object' ? o.product : null
  const buyer = idOf(o.createdBy) === user.id
  // Voucher codes belong to the order's buyer and beneficiary; read them directly (vouchers are school-managed records).
  const voucherIds = (o.vouchers ?? []).map(idOf).filter(Boolean) as number[]
  const vouchers = voucherIds.length ? (await payload.find({ collection: 'vouchers', overrideAccess: true, depth: 0, limit: voucherIds.length, where: { id: { in: voucherIds } } })).docs : []
  const beneficiary = o.beneficiary ? await payload.findByID({ collection: 'users', id: idOf(o.beneficiary)!, depth: 0, overrideAccess: true }).catch(() => null) : null
  const fmt = (d: string) => new Date(d).toLocaleString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
  const row = (label: string, value: string, strong = false) => (
    <div className={`flex justify-between gap-3 border-b border-line py-1.5 ${strong ? 'font-semibold' : ''}`}><dt className={strong ? '' : 'text-muted'}>{label}</dt><dd className="tabular-nums">{value}</dd></div>
  )
  const bankReady = Boolean(tax.bank.account)

  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <Link href="/pesanan" className="text-sm underline">{id ? '← Pesanan saya' : '← My orders'}</Link>
        <Card>
          <p className="text-sm text-muted">{invoiceNumber(o)}</p>
          <h1 className="text-2xl font-bold">{product?.name ?? o.plan}</h1>
          <p className="mt-1 font-semibold">{ORDER_STATUS[o.status]?.[locale] ?? o.status}</p>
          {beneficiary && <p className="text-sm text-muted">{id ? 'Untuk' : 'For'}: {beneficiary.name}</p>}
          <dl className="mt-4 text-sm">
            {row(id ? 'Jumlah' : 'Quantity', String(o.quantity ?? o.seats ?? 1))}
            {o.subtotalIdr != null && row('Subtotal', formatIdr(o.subtotalIdr))}
            {o.discountIdr ? row(id ? 'Potongan promo' : 'Promo discount', `-${formatIdr(o.discountIdr)}`) : null}
            {o.ppnIdr ? row('PPN', formatIdr(o.ppnIdr)) : null}
            {o.uniqueCode ? row(id ? 'Kode unik' : 'Transfer code', formatIdr(o.uniqueCode)) : null}
            {row(id ? 'Total' : 'Total', formatIdr(o.amountIdr), true)}
            {o.refundIdr ? row(id ? 'Dikembalikan' : 'Refunded', formatIdr(o.refundIdr)) : null}
          </dl>
          <p className="mt-3 text-sm">
            <a className="underline" href={`/api/orders/${o.id}/invoice?lang=${locale}`}>{o.status === 'paid' || o.status === 'refunded' ? (id ? 'Unduh kuitansi (PDF)' : 'Download receipt (PDF)') : id ? 'Unduh invoice proforma (PDF)' : 'Download proforma invoice (PDF)'}</a>
          </p>
        </Card>

        {o.method === 'bank_transfer' && o.status === 'pending' && buyer && (
          <Card>
            <h2 className="text-lg font-semibold">{id ? 'Cara membayar' : 'How to pay'}</h2>
            {o.note && <Notice tone="warn" title={id ? 'Pesan dari tim kami' : 'Message from our team'}>{o.note}</Notice>}
            {bankReady ? (
              <dl className="mt-3 text-sm">
                {row('Bank', tax.bank.name)}
                {row(id ? 'Nomor rekening' : 'Account number', tax.bank.account)}
                {row(id ? 'Atas nama' : 'Account holder', tax.bank.holder)}
                {row(id ? 'Transfer tepat sebesar' : 'Transfer exactly', formatIdr(o.amountIdr), true)}
              </dl>
            ) : (
              <Notice tone="warn" title={id ? 'Rekening belum diatur' : 'Bank account not set yet'}>{id ? 'Tim kami akan mengirim detail rekening. Hubungi kami lewat halaman Bantuan.' : 'Our team will send the account details. Contact us through the Help page.'}</Notice>
            )}
            <p className="mt-3 text-sm text-muted">
              {id ? `Transfer tepat sampai 3 digit terakhir agar mudah dicocokkan${o.expiresAt ? `, sebelum ${fmt(o.expiresAt)}` : ''}. Setelah transfer, beri tahu kami di bawah.` : `Transfer the exact amount, including the last 3 digits, so we can match it${o.expiresAt ? `, before ${fmt(o.expiresAt)}` : ''}. Then let us know below.`}
            </p>
            <div className="mt-4"><TransferReport orderId={o.id} locale={locale} /></div>
          </Card>
        )}
        {o.status === 'awaiting_confirmation' && <Notice title={id ? 'Terima kasih, kami sedang memeriksa transfer Anda' : 'Thank you, we are checking your transfer'}>{id ? 'Biasanya selesai dalam 1 hari kerja. Anda akan mendapat pemberitahuan.' : 'Usually within 1 working day. You will be notified.'}</Notice>}

        {vouchers.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold">{id ? 'Kode voucher tes' : 'Test voucher codes'}</h2>
            <p className="mt-1 text-sm text-muted">{id ? 'Masukkan satu kode saat mendaftar sesi tes AILIS (Jadwal Tes). Setiap kode berlaku sekali.' : 'Enter one code when booking an AILIS session (Test dates). Each code works once.'}</p>
            <ul className="mt-3 grid gap-1 font-mono text-sm sm:grid-cols-2">
              {vouchers.map((v) => <li key={v.id} className={v.active === false ? 'text-muted line-through' : ''}>{v.code}</li>)}
            </ul>
            <div className="mt-2"><CopyCodes codes={vouchers.filter((v) => v.active !== false).map((v) => v.code)} locale={locale} /></div>
          </Card>
        )}
        {o.status === 'paid' && o.kind === 'school_licence' && <Notice tone="ok" title={id ? 'Lisensi sekolah sudah aktif' : 'The school licence is active'}><Link href="/sekolah" className="underline">{id ? 'Lihat di Ruang Sekolah' : 'See it in the school space'}</Link></Notice>}
      </div>
    </Shell>
  )
}
