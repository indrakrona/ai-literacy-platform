'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { inputClass } from '../ui'
import { api, errorText } from './api'
import { INCIDENT_LABELS } from '../../lib/incidents'

/** Re-renders the proctor view every 30 seconds so statuses and integrity counts stay current. */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000)
    return () => clearInterval(t)
  }, [router, seconds])
  return null
}

const TYPES = INCIDENT_LABELS

export function IncidentForm({ attemptId, locale }: { attemptId: number; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<keyof (typeof TYPES)['id']>('device_issue')
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-sm underline">{id ? 'Catat kejadian' : 'Log incident'}</button>
  return (
    <form
      className="mt-2 flex flex-col gap-2 rounded-xl border border-line bg-paper p-3 text-sm"
      onSubmit={async (e) => {
        e.preventDefault()
        const res = await api(`/api/test-attempts/${attemptId}/incident`, { body: { type, note } })
        if (res.ok) window.location.reload()
        else setMsg(errorText(res.data, id ? 'Gagal menyimpan' : 'Could not save'))
      }}
    >
      <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label={id ? 'Jenis kejadian' : 'Incident type'}>
        {Object.entries(TYPES[locale]).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>
      <textarea rows={2} maxLength={1000} className={inputClass} placeholder={id ? 'Catatan singkat' : 'Short note'} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-ink px-3 py-1.5 font-semibold text-paper">{id ? 'Simpan' : 'Save'}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-line px-3 py-1.5">{id ? 'Batal' : 'Cancel'}</button>
      </div>
      {msg && <p className="text-danger">{msg}</p>}
    </form>
  )
}

