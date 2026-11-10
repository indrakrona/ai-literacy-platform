'use client'
import { useState } from 'react'
import { api, errorText } from './api'

/** A rater picks one rubric level for a performance task (spec G7). */
export function RateForm({
  attemptId,
  itemId,
  rubric,
  current,
  locale,
}: {
  attemptId: number
  itemId: number | string
  rubric: { points: number; descriptor: string }[]
  current?: number
  locale: 'id' | 'en'
}) {
  const id = locale === 'id'
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      {[...rubric].sort((a, b) => a.points - b.points).map((r) => (
        <button
          key={r.points}
          disabled={busy}
          aria-pressed={current === r.points}
          onClick={async () => {
            setBusy(true)
            const res = await api(`/api/test-attempts/${attemptId}/rate`, { body: { itemId, points: r.points } })
            setBusy(false)
            if (res.ok) window.location.reload()
            else setMsg(errorText(res.data, id ? 'Gagal menyimpan' : 'Could not save'))
          }}
          className={`rounded-xl border px-4 py-3 text-left text-sm ${current === r.points ? 'border-ink bg-ink text-paper' : 'border-line bg-paper hover:border-ink'}`}
        >
          <span className="font-bold">{r.points} {id ? 'poin' : r.points === 1 ? 'point' : 'points'}</span> · {r.descriptor}
        </button>
      ))}
      {msg && <p className="text-sm text-danger">{msg}</p>}
    </div>
  )
}

/** AI-suggested rubric level, on request, for adjudication or single marking only. Advice, not a mark. */
export function SuggestButton({ attemptId, itemId, locale }: { attemptId: number; itemId: number | string; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [s, setS] = useState<{ points: number; rationale: string; mock?: boolean } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (s)
    return (
      <div className="rounded-2xl border border-line bg-paper p-3 text-sm" role="status">
        <p className="font-semibold">{id ? 'Saran AI (bukan nilai akhir)' : 'AI suggestion (not a final mark)'}: {s.points} {id ? 'poin' : 'points'}</p>
        <p className="mt-1 text-muted">{s.rationale}</p>
        <p className="mt-1 text-xs text-muted">{id ? 'Putuskan sendiri berdasarkan rubrik. AI dapat keliru.' : 'Decide yourself using the rubric. AI can be wrong.'}</p>
      </div>
    )
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          const res = await api<{ points: number; rationale: string; mock?: boolean }>(`/api/test-attempts/${attemptId}/suggest`, { body: { itemId } })
          setBusy(false)
          if (res.ok) setS(res.data)
          else setErr(errorText(res.data, id ? 'Saran tidak tersedia' : 'No suggestion available'))
        }}
        className="text-sm underline disabled:opacity-60"
      >
        {busy ? (id ? 'Meminta saran…' : 'Asking…') : id ? 'Lihat saran AI' : 'See AI suggestion'}
      </button>
      {err && <p className="mt-1 text-xs text-danger">{err}</p>}
    </div>
  )
}
