'use client'
import { useState } from 'react'
import { api, errorText } from './api'
import { inputClass } from '../ui'

type L = { locale: 'id' | 'en' }
const btn = 'rounded-xl bg-ink px-5 py-3 font-semibold text-paper disabled:opacity-60'
const idr = (n: number) => `Rp${n.toLocaleString('id-ID')}`

/** Buy a product by bank transfer: quantity, optional promo code and (for parents) which child it is for. */
export function BuyForm({ product, children, ppnRate, problems, locale }: { product: { id: number; priceIdr: number; minQuantity: number; maxQuantity: number; kind: string }; children: { id: number; name: string }[]; ppnRate: number | null; problems: Record<string, string> } & L) {
  const id = locale === 'id'
  const [qty, setQty] = useState(product.minQuantity)
  const [promo, setPromo] = useState('')
  const [child, setChild] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const subtotal = product.priceIdr * qty
  const ppn = ppnRate ? Math.round((subtotal * ppnRate) / 100) : 0
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErr(null)
        const res = await api<{ id: number; problem?: string }>('/api/orders/buy', { body: { product: product.id, quantity: qty, promo: promo || undefined, beneficiary: child ? Number(child) : undefined } })
        setBusy(false)
        if (res.ok) window.location.href = `/pesanan/${res.data.id}`
        else setErr(problems[res.data.problem ?? ''] ?? errorText(res.data, id ? 'Gagal membuat pesanan' : 'Could not place the order'))
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          {product.kind === 'school_licence' ? (id ? 'Jumlah siswa' : 'Students') : id ? 'Jumlah voucher' : 'Vouchers'}
          <input type="number" required min={product.minQuantity} max={product.maxQuantity} className={inputClass} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {id ? 'Kode promo (opsional)' : 'Promo code (optional)'}
          <input className={`${inputClass} uppercase`} value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} />
        </label>
        {children.length > 0 && (
          <label className="flex flex-col gap-1 text-sm font-medium">
            {id ? 'Untuk' : 'For'}
            <select className={inputClass} value={child} onChange={(e) => setChild(e.target.value)}>
              <option value="">{id ? 'Saya sendiri' : 'Myself'}</option>
              {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}
      </div>
      <p className="text-sm">
        {id ? 'Perkiraan' : 'Estimate'}: <strong>{idr(subtotal + ppn)}</strong>
        {ppn ? <span className="text-muted"> ({idr(subtotal)} + PPN {idr(ppn)})</span> : null}
        <span className="text-muted"> · {id ? 'potongan promo dan kode unik dihitung di langkah berikutnya' : 'promo and the transfer code are applied on the next step'}</span>
      </p>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <button type="submit" disabled={busy} className={`${btn} self-start`}>{busy ? '…' : id ? 'Pesan dan bayar dengan transfer bank' : 'Order and pay by bank transfer'}</button>
    </form>
  )
}

export function TransferReport({ orderId, locale }: { orderId: number } & L) {
  const id = locale === 'id'
  const [note, setNote] = useState('')
  const [err, setErr] = useState<string | null>(null)
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        const res = await api(`/api/orders/${orderId}/transferred`, { body: { note } })
        if (res.ok) window.location.reload()
        else setErr(errorText(res.data, id ? 'Gagal mengirim' : 'Could not send'))
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        {id ? 'Nama pengirim, bank asal, dan tanggal transfer' : 'Sender name, bank and date of transfer'}
        <input required minLength={3} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder={id ? 'mis. Budi Santoso, BCA, 10 Nov' : 'e.g. Budi Santoso, BCA, 10 Nov'} />
      </label>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <button type="submit" className={`${btn} self-start`}>{id ? 'Saya sudah transfer' : 'I have transferred'}</button>
    </form>
  )
}

/** Operations: confirm a transfer, reject it (not found), or record a refund. */
export function PaymentActions({ orderId, status, amountIdr, locale }: { orderId: number; status: string; amountIdr: number } & L) {
  const id = locale === 'id'
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState(String(amountIdr))
  const [err, setErr] = useState<string | null>(null)
  const go = async (path: string, body: unknown, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return
    const res = await api(`/api/orders/${orderId}/${path}`, { body })
    if (res.ok) window.location.reload()
    else setErr(errorText(res.data, id ? 'Gagal' : 'Failed'))
  }
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {['pending', 'awaiting_confirmation'].includes(status) && <button type="button" className="rounded-lg bg-ok px-3 py-1.5 font-semibold text-white" onClick={() => go('confirm', {}, id ? `Uang ${idr(amountIdr)} sudah masuk ke rekening?` : `Has ${idr(amountIdr)} arrived in the account?`)}>{id ? 'Konfirmasi diterima' : 'Confirm received'}</button>}
        {status === 'awaiting_confirmation' && <button type="button" className="rounded-lg border border-ink px-3 py-1.5 font-semibold" onClick={() => go('reject', { reason })}>{id ? 'Belum ditemukan' : 'Not found'}</button>}
        {status === 'paid' && (
          <>
            <input aria-label={id ? 'Jumlah refund' : 'Refund amount'} className="w-32 rounded-lg border border-line px-2 py-1.5" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button type="button" className="rounded-lg border border-danger px-3 py-1.5 font-semibold text-danger" onClick={() => go('refund', { amountIdr: Number(amount), reason }, id ? 'Catat refund ini? Voucher yang belum dipakai akan dinonaktifkan.' : 'Record this refund? Unused vouchers will be switched off.')}>{id ? 'Catat refund' : 'Record refund'}</button>
          </>
        )}
        <input aria-label={id ? 'Alasan' : 'Reason'} placeholder={id ? 'Alasan (untuk tolak/refund)' : 'Reason (reject/refund)'} className="min-w-48 flex-1 rounded-lg border border-line px-2 py-1.5" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      {err && <p role="alert" className="text-danger">{err}</p>}
    </div>
  )
}

export function CopyCodes({ codes, locale }: { codes: string[] } & L) {
  const id = locale === 'id'
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <button
      type="button"
      className="text-sm underline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(codes.join('\n'))
          setMsg(id ? 'Tersalin' : 'Copied')
        } catch {
          setMsg(codes.join(' '))
        }
      }}
    >
      {msg ?? (id ? 'Salin semua kode' : 'Copy all codes')}
    </button>
  )
}
