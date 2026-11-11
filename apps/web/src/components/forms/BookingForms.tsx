'use client'
import { useState } from 'react'
import { api, errorText } from './api'
import { inputClass } from '../ui'

type L = { locale: 'id' | 'en' }

/** Share a certificate's verification link (WhatsApp, LinkedIn, copy); each share is counted. */
export function CertificateShare({ code, url, locale }: { code: string; url: string } & L) {
  const id = locale === 'id'
  const [msg, setMsg] = useState<string | null>(null)
  const record = (channel: string) => void api(`/api/certificates/code/${code}/shared`, { body: { channel } })
  const text = id ? `Sertifikat Skor Literasi AI (AILIS) saya: ${url}` : `My AI Literacy Score (AILIS) certificate: ${url}`
  const link = 'rounded-lg border border-ink px-3 py-1.5 text-sm font-semibold'
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a className="rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-paper" href={`/api/certificates/code/${code}/pdf?lang=${locale}`}>
        {id ? 'Unduh PDF' : 'Download PDF'}
      </a>
      <a className={link} href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" onClick={() => record('whatsapp')}>
        WhatsApp
      </a>
      <a className={link} href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" onClick={() => record('linkedin')}>
        LinkedIn
      </a>
      <button
        type="button"
        className={link}
        onClick={async () => {
          record('copy')
          try {
            await navigator.clipboard.writeText(url)
            setMsg(id ? 'Tautan tersalin' : 'Link copied')
          } catch {
            setMsg(url)
          }
        }}
      >
        {id ? 'Salin tautan' : 'Copy link'}
      </button>
      {msg && <span className="text-xs break-all text-muted">{msg}</span>}
    </div>
  )
}

/** Book a seat on a test session, with an optional voucher code. */
export function BookSeat({ sessionId, priceLabel, locale, problems }: { sessionId: number; priceLabel: string; problems: Record<string, string> } & L) {
  const id = locale === 'id'
  const [voucher, setVoucher] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErr(null)
        const res = await api<{ problem?: string }>(`/api/test-sessions/${sessionId}/book`, { body: { voucher: voucher || undefined } })
        setBusy(false)
        if (res.ok) window.location.reload()
        else setErr(problems[res.data.problem ?? ''] ?? errorText(res.data, id ? 'Gagal mendaftar' : 'Could not book'))
      }}
    >
      <input
        className={`${inputClass} sm:max-w-56 uppercase`}
        placeholder={id ? 'Kode voucher (opsional)' : 'Voucher code (optional)'}
        aria-label={id ? 'Kode voucher' : 'Voucher code'}
        value={voucher}
        onChange={(e) => setVoucher(e.target.value.toUpperCase())}
      />
      <button type="submit" disabled={busy} className="rounded-xl bg-ink px-5 py-3 font-semibold text-paper disabled:opacity-60">
        {busy ? '…' : `${id ? 'Daftar' : 'Book'} · ${priceLabel}`}
      </button>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
    </form>
  )
}

/** Cancel (candidate or admin) or confirm payment (admin) for a booking. */
export function BookingAction({ bookingId, action, locale }: { bookingId: number; action: 'cancel' | 'confirm' } & L) {
  const id = locale === 'id'
  const [err, setErr] = useState<string | null>(null)
  const label = action === 'cancel' ? (id ? 'Batalkan' : 'Cancel') : id ? 'Konfirmasi pembayaran' : 'Confirm payment'
  return (
    <span>
      <button
        type="button"
        className="text-sm font-semibold underline"
        onClick={async () => {
          if (action === 'cancel' && !window.confirm(id ? 'Batalkan pendaftaran ini? Kursimu akan dilepas.' : 'Cancel this booking? Your seat will be released.')) return
          const res = await api(`/api/bookings/${bookingId}/${action}`)
          if (res.ok) window.location.reload()
          else setErr(errorText(res.data, id ? 'Gagal' : 'Failed'))
        }}
      >
        {label}
      </button>
      {err && <span className="ml-2 text-xs text-danger">{err}</span>}
    </span>
  )
}

/** Generate a batch of voucher codes and download them as CSV. */
export function VoucherBatchForm({ locale }: L) {
  const id = locale === 'id'
  const [f, setF] = useState({ batch: '', count: '30', discountPercent: '100', maxUses: '1', expiresAt: '' })
  const [codes, setCodes] = useState<string[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const csv = codes ? `data:text/csv;charset=utf-8,${encodeURIComponent(['code,batch,discount_percent', ...codes.map((c) => `${c},"${f.batch.replace(/"/g, '""')}",${f.discountPercent}`)].join('\n'))}` : ''
  const field = (label: string, k: keyof typeof f, type = 'text', extra: Record<string, string | number | boolean> = {}) => (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      <input className={inputClass} type={type} value={f[k]} onChange={set(k)} {...extra} />
    </label>
  )
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErr(null)
        const res = await api<{ codes: string[] }>('/api/vouchers/batch', {
          body: { batch: f.batch, count: Number(f.count), discountPercent: Number(f.discountPercent), maxUses: Number(f.maxUses), expiresAt: f.expiresAt || undefined },
        })
        setBusy(false)
        if (res.ok) setCodes(res.data.codes)
        else setErr(errorText(res.data, id ? 'Gagal membuat voucher' : 'Could not create vouchers'))
      }}
    >
      <div className="grid gap-3 sm:grid-cols-5">
        <div className="sm:col-span-2">{field(id ? 'Nama batch' : 'Batch name', 'batch', 'text', { required: true, minLength: 3, placeholder: id ? 'mis. Kelas XI · Nov 2026' : 'e.g. Grade 11 · Nov 2026' })}</div>
        {field(id ? 'Jumlah' : 'How many', 'count', 'number', { min: 1, max: 500 })}
        {field(id ? 'Potongan %' : 'Discount %', 'discountPercent', 'number', { min: 1, max: 100 })}
        {field(id ? 'Pemakaian per kode' : 'Uses per code', 'maxUses', 'number', { min: 1, max: 1000 })}
      </div>
      <div className="sm:max-w-xs">{field(id ? 'Berlaku sampai (opsional)' : 'Valid until (optional)', 'expiresAt', 'date')}</div>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <button type="submit" disabled={busy} className="self-start rounded-xl bg-ink px-5 py-3 font-semibold text-paper disabled:opacity-60">
        {busy ? '…' : id ? 'Buat voucher' : 'Create vouchers'}
      </button>
      {codes && (
        <div className="rounded-2xl border border-ok/40 bg-ok/10 p-4 text-sm">
          <p className="font-semibold">{id ? `${codes.length} voucher dibuat.` : `${codes.length} vouchers created.`}</p>
          <a className="mt-1 inline-block font-semibold underline" href={csv} download={`voucher-${f.batch.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`}>
            {id ? 'Unduh CSV' : 'Download CSV'}
          </a>
          <p className="mt-2 font-mono text-xs break-words">{codes.slice(0, 12).join('  ')}{codes.length > 12 ? '  …' : ''}</p>
        </div>
      )}
    </form>
  )
}

/** Look up a certificate code on the public verification page. */
export function VerifyLookup({ locale }: L) {
  const id = locale === 'id'
  const [code, setCode] = useState('')
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault()
        const c = code.trim().toUpperCase()
        if (c) window.location.href = `/verifikasi/${encodeURIComponent(c)}`
      }}
    >
      <input className={`${inputClass} font-mono uppercase`} placeholder="AILIS-XXXX-XXXX / GURU-XXXX-XXXX" aria-label={id ? 'Kode sertifikat' : 'Certificate code'} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      <button type="submit" className="rounded-xl bg-ink px-5 py-3 font-semibold text-paper">{id ? 'Periksa' : 'Verify'}</button>
    </form>
  )
}

/** School admin: schedule a test session for one of the available test forms. */
export function CreateSessionForm({ forms, locale }: { forms: { id: number; name: string }[] } & L) {
  const id = locale === 'id'
  const [f, setF] = useState({ title: '', form: String(forms[0]?.id ?? ''), startsAt: '', location: '', seats: '30', priceIdr: '0' })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const label = 'flex flex-col gap-1 text-sm font-medium'
  if (!forms.length) return <p className="text-sm text-muted">{id ? 'Belum ada formulir tes yang bisa dijadwalkan. Hubungi tim AI Literacy.' : 'No test form is available to schedule yet. Contact the AI Literacy team.'}</p>
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErr(null)
        const res = await api('/api/test-sessions', {
          body: { title: f.title, form: Number(f.form), startsAt: new Date(f.startsAt).toISOString(), location: f.location || undefined, seats: Number(f.seats), priceIdr: Number(f.priceIdr), status: 'open' },
        })
        setBusy(false)
        if (res.ok) window.location.reload()
        else setErr(errorText(res.data, id ? 'Gagal membuat sesi' : 'Could not create the session'))
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>{id ? 'Judul sesi' : 'Session title'}<input required minLength={3} className={inputClass} value={f.title} onChange={set('title')} placeholder={id ? 'mis. AILIS Kelas XI · Gelombang 1' : 'e.g. AILIS Grade 11 · Round 1'} /></label>
        <label className={label}>{id ? 'Formulir tes' : 'Test form'}<select className={inputClass} value={f.form} onChange={set('form')}>{forms.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className={label}>{id ? 'Mulai (waktu perangkat Anda)' : 'Starts (your device time)'}<input required type="datetime-local" className={inputClass} value={f.startsAt} onChange={set('startsAt')} /></label>
        <label className={label}>{id ? 'Tempat' : 'Location'}<input className={inputClass} value={f.location} onChange={set('location')} placeholder={id ? 'mis. Lab Komputer 2' : 'e.g. Computer lab 2'} /></label>
        <label className={label}>{id ? 'Jumlah kursi' : 'Seats'}<input required type="number" min={1} className={inputClass} value={f.seats} onChange={set('seats')} /></label>
        <label className={label}>{id ? 'Biaya per siswa (Rp, 0 = gratis)' : 'Fee per student (Rp, 0 = free)'}<input required type="number" min={0} className={inputClass} value={f.priceIdr} onChange={set('priceIdr')} /></label>
      </div>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <button type="submit" disabled={busy} className="self-start rounded-xl bg-ink px-5 py-3 font-semibold text-paper disabled:opacity-60">{busy ? '…' : id ? 'Buat sesi' : 'Create session'}</button>
    </form>
  )
}

/** Open or close a session for booking. */
export function SessionStatusToggle({ sessionId, open, locale }: { sessionId: number; open: boolean } & L) {
  const id = locale === 'id'
  return (
    <button
      type="button"
      className="text-sm font-semibold underline"
      onClick={async () => {
        const res = await api(`/api/test-sessions/${sessionId}`, { method: 'PATCH', body: { status: open ? 'closed' : 'open' } })
        if (res.ok) window.location.reload()
      }}
    >
      {open ? (id ? 'Tutup pendaftaran' : 'Close booking') : id ? 'Buka pendaftaran' : 'Reopen booking'}
    </button>
  )
}
