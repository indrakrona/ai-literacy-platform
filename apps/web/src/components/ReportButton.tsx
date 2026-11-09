'use client'
import { useState } from 'react'
import { api, errorText } from './forms/api'

type Target = 'lesson' | 'ai_reply' | 'project_brief' | 'test_item' | 'page'
const REASONS = {
  id: { wrong: 'Informasi keliru', harmful: 'Berbahaya atau menyakiti', inappropriate: 'Tidak pantas', broken: 'Tidak berfungsi', other: 'Lainnya' },
  en: { wrong: 'Wrong information', harmful: 'Harmful or hurtful', inappropriate: 'Inappropriate', broken: 'Not working', other: 'Other' },
} as const

/** "Report a problem" on content and AI replies (spec M3). Sends to the content team. */
export function ReportButton({ targetType, targetId, locale, compact = false }: { targetType: Target; targetId?: string | number; locale: 'id' | 'en'; compact?: boolean }) {
  const id = locale === 'id'
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<keyof (typeof REASONS)['id']>('wrong')
  const [details, setDetails] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [err, setErr] = useState<string | null>(null)

  if (state === 'sent') return <p className="text-xs text-muted">{id ? 'Terima kasih, laporanmu sudah dikirim ke tim konten.' : 'Thank you, your report was sent to the content team.'}</p>
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`text-left underline ${compact ? 'text-xs text-muted' : 'text-sm text-muted'}`}>
        {targetType === 'ai_reply' ? (id ? 'Laporkan jawaban ini' : 'Report this reply') : id ? 'Laporkan masalah' : 'Report a problem'}
      </button>
    )
  }
  return (
    <form
      className="mt-2 flex flex-col gap-2 rounded-xl border border-line bg-paper p-3 text-sm text-ink"
      onSubmit={async (e) => {
        e.preventDefault()
        setState('sending')
        setErr(null)
        const res = await api('/api/reports/submit', { body: { targetType, targetId, url: window.location.pathname, reason, details } })
        if (res.ok) setState('sent')
        else {
          setState('idle')
          setErr(errorText(res.data, id ? 'Laporan gagal dikirim' : 'Could not send the report'))
        }
      }}
    >
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 font-semibold">{id ? 'Apa masalahnya?' : 'What is the problem?'}</legend>
        {Object.entries(REASONS[locale]).map(([k, label]) => (
          <label key={k} className="flex items-center gap-2">
            <input type="radio" name="reason" value={k} checked={reason === k} onChange={() => setReason(k as typeof reason)} /> {label}
          </label>
        ))}
      </fieldset>
      <textarea
        rows={2}
        maxLength={1000}
        className="rounded-lg border border-line bg-white px-2 py-1.5"
        placeholder={id ? 'Ceritakan singkat (jangan tulis data pribadi)' : 'Tell us briefly (no personal data)'}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={state === 'sending'} className="rounded-lg bg-ink px-3 py-1.5 font-semibold text-paper disabled:opacity-60">{id ? 'Kirim laporan' : 'Send report'}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-line px-3 py-1.5">{id ? 'Batal' : 'Cancel'}</button>
      </div>
      {err && <p className="text-danger">{err}</p>}
    </form>
  )
}
