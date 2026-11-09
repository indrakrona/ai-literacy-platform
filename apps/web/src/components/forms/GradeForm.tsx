'use client'
import { useState } from 'react'
import { Button, inputClass } from '../ui'
import { api, errorText } from './api'

/** Rubric marking: one score 1–4 per criterion plus written feedback (spec F2/H6). */
export function GradeForm({
  submissionId,
  rubric,
  initial,
  locale,
}: {
  submissionId: number
  rubric: { criterion: string; description?: string | null }[]
  initial?: { scores?: number[]; feedback?: string }
  locale: 'id' | 'en'
}) {
  const id = locale === 'id'
  const [scores, setScores] = useState<number[]>(initial?.scores ?? rubric.map(() => 0))
  const [feedback, setFeedback] = useState(initial?.feedback ?? '')
  const [msg, setMsg] = useState<string | null>(null)
  const levels = id ? ['Mulai', 'Berkembang', 'Cakap', 'Mahir'] : ['Beginning', 'Developing', 'Proficient', 'Advanced']
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        const res = await api(`/api/submissions/${submissionId}/grade`, { body: { scores, feedback } })
        if (res.ok) window.location.reload()
        else setMsg(errorText(res.data, id ? 'Gagal menyimpan nilai' : 'Could not save the marks'))
      }}
    >
      {rubric.map((r, i) => (
        <fieldset key={i} className="flex flex-col gap-2">
          <legend className="font-semibold">{r.criterion}</legend>
          {r.description && <p className="text-sm text-muted">4 = {r.description}</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <button
                type="button"
                key={n}
                aria-pressed={scores[i] === n}
                onClick={() => setScores((s) => s.map((v, j) => (j === i ? n : v)))}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${scores[i] === n ? 'border-ink bg-ink text-paper' : 'border-line bg-paper'}`}
              >
                {n} · {levels[n - 1]}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {id ? 'Umpan balik untuk siswa' : 'Feedback for the student'}
        <textarea rows={4} className={inputClass} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      </label>
      <Button type="submit" disabled={scores.some((s) => s < 1)}>{id ? 'Simpan nilai' : 'Save marks'}</Button>
      {msg && <p className="text-sm text-danger">{msg}</p>}
    </form>
  )
}
