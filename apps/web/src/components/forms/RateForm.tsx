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
