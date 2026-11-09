'use client'
import { useState } from 'react'
import { Button, inputClass } from '../ui'
import { api, errorText } from './api'

const idr = (n: number) => `Rp${n.toLocaleString('id-ID')}`

export function BuyLicenceForm({ pricePerSeat, minSeats, maxSeats, suggested, locale }: { pricePerSeat: number; minSeats: number; maxSeats: number; suggested: number; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [seats, setSeats] = useState(Math.min(maxSeats, Math.max(minSeats, suggested)))
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const valid = Number.isInteger(seats) && seats >= minSeats && seats <= maxSeats
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setMsg(null)
        const res = await api<{ paymentUrl: string }>('/api/orders/checkout', { body: { plan: 'sekolah_tahunan', seats } })
        setBusy(false)
        if (res.ok) window.location.href = res.data.paymentUrl
        else setMsg(errorText(res.data, id ? 'Pembayaran belum dapat diproses' : 'Payment could not be started'))
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {id ? 'Jumlah siswa' : 'Number of students'}
        <input type="number" min={minSeats} max={maxSeats} className={inputClass} value={seats} onChange={(e) => setSeats(Number(e.target.value))} />
      </label>
      <div className="flex-1 text-sm">
        <p className="text-muted">{idr(pricePerSeat)} × {seats || 0} {id ? 'siswa' : 'students'}</p>
        <p className="text-xl font-bold">{idr(pricePerSeat * (seats || 0))}</p>
      </div>
      <Button type="submit" className="sm:w-auto" disabled={!valid || busy}>{id ? 'Lanjut ke pembayaran' : 'Continue to payment'}</Button>
      {msg && <p className="text-sm text-danger">{msg}</p>}
    </form>
  )
}

export function MockPayButtons({ orderId, locale }: { orderId: number; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [msg, setMsg] = useState<string | null>(null)
  const go = async (status: 'paid' | 'failed') => {
    const res = await api<{ applied: boolean; reason?: string }>(`/api/orders/${orderId}/mock-pay`, { body: { status } })
    if (res.ok && res.data.applied) window.location.href = '/sekolah'
    else setMsg(res.data.reason ?? errorText(res.data, id ? 'Gagal' : 'Failed'))
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button onClick={() => go('paid')}>{id ? 'Simulasikan pembayaran berhasil' : 'Simulate successful payment'}</Button>
      <Button variant="secondary" onClick={() => go('failed')}>{id ? 'Simulasikan pembayaran gagal' : 'Simulate failed payment'}</Button>
      {msg && <p className="text-sm text-danger">{msg}</p>}
    </div>
  )
}
