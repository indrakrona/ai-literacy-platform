'use client'
import { useState } from 'react'
import { api, errorText } from './api'
import { inputClass } from '../ui'

type L = { locale: 'id' | 'en' }
type Existing = { id: number; candidate: number; extraTimePercent: string; largeText: boolean; highContrast: boolean; screenReader: boolean; validUntil?: string | null }

/** School admin: give a student extra time, larger text, high contrast or screen-reader mode for tests. */
export function AccommodationForm({ students, existing, locale }: { students: { id: number; name: string }[]; existing: Existing[] } & L) {
  const id = locale === 'id'
  const blank = { candidate: String(students[0]?.id ?? ''), extraTimePercent: '25', largeText: false, highContrast: false, screenReader: false, reason: '', validUntil: '' }
  const [f, setF] = useState(blank)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const label = 'flex flex-col gap-1 text-sm font-medium'
  const check = (k: 'largeText' | 'highContrast' | 'screenReader', text: string) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} />
      {text}
    </label>
  )
  if (!students.length) return <p className="text-sm text-muted">{id ? 'Belum ada siswa.' : 'No students yet.'}</p>
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErr(null)
        const current = existing.find((x) => x.candidate === Number(f.candidate))
        const data = { candidate: Number(f.candidate), extraTimePercent: f.extraTimePercent, largeText: f.largeText, highContrast: f.highContrast, screenReader: f.screenReader, reason: f.reason || undefined, validUntil: f.validUntil ? new Date(f.validUntil).toISOString() : null }
        const res = current ? await api(`/api/accommodations/${current.id}`, { method: 'PATCH', body: data }) : await api('/api/accommodations', { body: data })
        setBusy(false)
        if (res.ok) window.location.reload()
        else setErr(errorText(res.data, id ? 'Gagal menyimpan' : 'Could not save'))
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>{id ? 'Siswa' : 'Student'}
          <select className={inputClass} value={f.candidate} onChange={(e) => setF({ ...f, candidate: e.target.value })}>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className={label}>{id ? 'Waktu tambahan' : 'Extra time'}
          <select className={inputClass} value={f.extraTimePercent} onChange={(e) => setF({ ...f, extraTimePercent: e.target.value })}>
            {['0', '25', '50', '100'].map((p) => <option key={p} value={p}>{p === '0' ? (id ? 'Tidak ada' : 'None') : `+${p}%`}</option>)}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {check('largeText', id ? 'Teks lebih besar' : 'Larger text')}
        {check('highContrast', id ? 'Kontras tinggi' : 'High contrast')}
        {check('screenReader', id ? 'Mode pembaca layar (tanpa layar penuh)' : 'Screen-reader mode (no full screen)')}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>{id ? 'Alasan (rahasia, opsional)' : 'Reason (private, optional)'}<input className={inputClass} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder={id ? 'mis. surat dari guru BK' : 'e.g. letter from the school counsellor'} /></label>
        <label className={label}>{id ? 'Berlaku sampai (opsional)' : 'Valid until (optional)'}<input type="date" className={inputClass} value={f.validUntil} onChange={(e) => setF({ ...f, validUntil: e.target.value })} /></label>
      </div>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <button type="submit" disabled={busy} className="self-start rounded-xl bg-ink px-5 py-3 font-semibold text-paper disabled:opacity-60">{busy ? '…' : id ? 'Simpan akomodasi' : 'Save accommodation'}</button>
    </form>
  )
}

export function RemoveAccommodation({ accId, locale }: { accId: number } & L) {
  const id = locale === 'id'
  return (
    <button
      type="button"
      className="text-sm underline"
      onClick={async () => {
        if (!window.confirm(id ? 'Hapus akomodasi ini?' : 'Remove this accommodation?')) return
        const res = await api(`/api/accommodations/${accId}`, { method: 'DELETE' })
        if (res.ok) window.location.reload()
      }}
    >
      {id ? 'Hapus' : 'Remove'}
    </button>
  )
}
