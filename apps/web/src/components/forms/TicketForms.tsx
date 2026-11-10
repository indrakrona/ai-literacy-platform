'use client'
import { useState } from 'react'
import { api, errorText } from './api'
import { inputClass } from '../ui'

type L = { locale: 'id' | 'en' }
const label = 'flex flex-col gap-1 text-sm font-medium'
const btn = 'rounded-xl bg-ink px-5 py-3 font-semibold text-paper disabled:opacity-60'

export function NewTicketForm({ categories, signedIn, locale }: { categories: { value: string; label: string }[]; signedIn: boolean } & L) {
  const id = locale === 'id'
  const [f, setF] = useState({ subject: '', category: categories[0]?.value ?? 'other', message: '', email: '', name: '', website: '' })
  const [err, setErr] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  if (sent) return <p role="status" className="rounded-xl bg-ok/10 p-4 font-semibold">{id ? 'Terima kasih. Kami akan membalas lewat email dalam 2 hari kerja.' : 'Thank you. We will reply by email within 2 working days.'}</p>
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErr(null)
        const res = await api<{ id: number }>('/api/support-tickets/open', { body: f })
        setBusy(false)
        if (!res.ok) return setErr(errorText(res.data, id ? 'Gagal mengirim' : 'Could not send'))
        if (signedIn && res.data.id) window.location.href = `/bantuan/tiket/${res.data.id}`
        else setSent(true)
      }}
    >
      {!signedIn && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>{id ? 'Nama' : 'Name'}<input className={inputClass} autoComplete="name" value={f.name} onChange={set('name')} /></label>
          <label className={label}>{id ? 'Email (untuk balasan)' : 'Email (for our reply)'}<input required type="email" autoComplete="email" className={inputClass} value={f.email} onChange={set('email')} /></label>
        </div>
      )}
      <label className={label}>{id ? 'Topik' : 'Topic'}
        <select className={inputClass} value={f.category} onChange={set('category')}>{categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
      </label>
      <label className={label}>{id ? 'Judul singkat' : 'Short title'}<input required minLength={4} maxLength={140} className={inputClass} value={f.subject} onChange={set('subject')} /></label>
      <label className={label}>{id ? 'Ceritakan masalahnya' : 'Describe the problem'}<textarea required minLength={10} rows={5} className={inputClass} value={f.message} onChange={set('message')} /></label>
      <p className="text-xs text-muted">{id ? 'Jangan menulis kata sandi atau data pribadi orang lain.' : 'Do not include passwords or other people’s personal details.'}</p>
      {/* Honeypot: hidden from people, filled by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" value={f.website} onChange={set('website')} />
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <button type="submit" disabled={busy} className={`${btn} self-start`}>{busy ? '…' : id ? 'Kirim' : 'Send'}</button>
    </form>
  )
}

export function TicketReply({ ticketId, staff, status, locale }: { ticketId: number; staff: boolean; status: string } & L) {
  const id = locale === 'id'
  const [message, setMessage] = useState('')
  const [internal, setInternal] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const setStatus = async (s: string) => {
    const res = await api(`/api/support-tickets/${ticketId}/status`, { body: { status: s } })
    if (res.ok) window.location.reload()
  }
  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setErr(null)
          const res = await api(`/api/support-tickets/${ticketId}/reply`, { body: { message, internal } })
          setBusy(false)
          if (res.ok) window.location.reload()
          else setErr(errorText(res.data, id ? 'Gagal mengirim' : 'Could not send'))
        }}
      >
        <label className={label}>{id ? 'Balas' : 'Reply'}<textarea required rows={4} className={inputClass} value={message} onChange={(e) => setMessage(e.target.value)} /></label>
        {staff && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
            {id ? 'Catatan internal (tidak terlihat oleh penanya)' : 'Internal note (not shown to the requester)'}
          </label>
        )}
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <button type="submit" disabled={busy} className={`${btn} self-start`}>{busy ? '…' : id ? 'Kirim balasan' : 'Send reply'}</button>
      </form>
      <div className="flex flex-wrap gap-4 text-sm">
        {status !== 'resolved' ? (
          <button type="button" className="underline" onClick={() => setStatus('resolved')}>{id ? 'Tandai selesai' : 'Mark as resolved'}</button>
        ) : (
          <button type="button" className="underline" onClick={() => setStatus('open')}>{id ? 'Buka lagi' : 'Reopen'}</button>
        )}
      </div>
    </div>
  )
}
