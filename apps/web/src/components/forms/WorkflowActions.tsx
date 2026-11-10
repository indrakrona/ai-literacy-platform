'use client'
import { useState } from 'react'
import { api, errorText } from './api'
import { inputClass } from '../ui'

type Action = 'submit' | 'approve' | 'request_changes' | 'publish'

/** Buttons for the next workflow steps this person may take, with an optional note. */
export function WorkflowActions({ slug, id, actions, locale }: { slug: string; id: number; actions: Action[]; locale: 'id' | 'en' }) {
  const t = locale === 'id'
  const [note, setNote] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (!actions.length) return null
  const labels: Record<Action, string> = t
    ? { submit: 'Kirim untuk ditelaah', approve: 'Setujui', request_changes: 'Minta perbaikan', publish: 'Terbitkan' }
    : { submit: 'Submit for review', approve: 'Approve', request_changes: 'Request changes', publish: 'Publish' }
  const go = async (action: Action) => {
    setBusy(true)
    setErr(null)
    const res = await api(`/api/${slug}/${id}/workflow`, { body: { action, note } })
    setBusy(false)
    if (res.ok) window.location.reload()
    else setErr(errorText(res.data, t ? 'Gagal' : 'Failed'))
  }
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t ? 'Catatan (wajib saat meminta perbaikan)' : 'Note (required when requesting changes)'}
        <textarea rows={2} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a}
            type="button"
            disabled={busy}
            onClick={() => go(a)}
            className={`rounded-xl px-4 py-2.5 font-semibold disabled:opacity-60 ${a === 'request_changes' ? 'border border-ink' : 'bg-ink text-paper'}`}
          >
            {labels[a]}
          </button>
        ))}
      </div>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
    </div>
  )
}
