'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dict } from '../i18n/dict'
import { fmt } from '../i18n/dict'
import { Button, Notice } from './ui'
import { api } from './forms/api'

interface PaperItem {
  id: number
  type: string
  scenario: string | null
  stem: string
  options: string[]
}
interface Paper {
  status: string
  deadline: string
  items: PaperItem[]
  responses: Record<string, { selected?: number[]; text?: string }>
}

export function TestPlayer({ attemptId, t }: { attemptId: number; t: Dict }) {
  const [paper, setPaper] = useState<Paper | null>(null)
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Paper['responses']>({})
  const [saving, setSaving] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [closed, setClosed] = useState(false)
  const [canFullscreen, setCanFullscreen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [leftFullscreen, setLeftFullscreen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    api<Paper>(`/api/test-attempts/${attemptId}/paper`, { method: 'GET' }).then((r) => {
      if (!r.ok) return setClosed(true)
      setPaper(r.data)
      setAnswers(r.data.responses ?? {})
      if (r.data.status !== 'in_progress') setClosed(true)
    })
    const tick = setInterval(() => setNow(Date.now()), 1000)
    const onHide = () => document.visibilityState === 'hidden' && api(`/api/test-attempts/${attemptId}/integrity`, { body: { event: 'tab_hidden' } })
    const onPaste = () => api(`/api/test-attempts/${attemptId}/integrity`, { body: { event: 'paste' } })
    // Full screen where the browser supports it (most phones' Safari does not; then only tab switches are logged).
    setCanFullscreen(Boolean(document.fullscreenEnabled))
    const onFs = () => {
      const fs = Boolean(document.fullscreenElement)
      setIsFullscreen((was) => {
        if (was && !fs) {
          setLeftFullscreen(true)
          void api(`/api/test-attempts/${attemptId}/integrity`, { body: { event: 'fullscreen_exit' } })
        }
        return fs
      })
      if (fs) setLeftFullscreen(false)
    }
    document.addEventListener('fullscreenchange', onFs)
    document.addEventListener('visibilitychange', onHide)
    document.addEventListener('paste', onPaste)
    return () => {
      document.removeEventListener('fullscreenchange', onFs)
      clearInterval(tick)
      document.removeEventListener('visibilitychange', onHide)
      document.removeEventListener('paste', onPaste)
    }
  }, [attemptId])

  const save = useCallback(
    async (itemId: number, value: { selected?: number[]; text?: string }) => {
      setSaving(true)
      const r = await api(`/api/test-attempts/${attemptId}/answer`, { body: { itemId, ...value } })
      setSaving(false)
      if (r.status === 409) setClosed(true)
    },
    [attemptId],
  )

  const submit = useCallback(async () => {
    await api(`/api/test-attempts/${attemptId}/submit`)
    window.location.href = `/tes/${attemptId}/hasil`
  }, [attemptId])

  const left = paper ? Math.max(0, new Date(paper.deadline).getTime() - now) : 0
  useEffect(() => {
    if (paper && left === 0 && !closed) void submit()
  }, [left, paper, closed, submit])

  if (closed)
    return (
      <div className="flex flex-col gap-4">
        <Notice title={t.test.closed} />
        <a href={`/tes/${attemptId}/hasil`} className="rounded-xl bg-ink px-5 py-3.5 text-center font-semibold text-paper">{t.test.seeResult}</a>
      </div>
    )
  if (!paper) return <p className="text-muted">{t.common.loading}</p>

  const item = paper.items[i]!
  const a = answers[String(item.id)] ?? {}
  const mm = String(Math.floor(left / 60000)).padStart(2, '0')
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0')
  const setAnswer = (value: { selected?: number[]; text?: string }, debounce = false) => {
    setAnswers({ ...answers, [String(item.id)]: { ...a, ...value } })
    if (timer.current) clearTimeout(timer.current)
    if (debounce) timer.current = setTimeout(() => save(item.id, value), 800)
    else void save(item.id, value)
  }

  return (
    <div className="flex flex-col gap-5">
      {canFullscreen && !isFullscreen && (
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 text-sm ${leftFullscreen ? 'border-danger/40 bg-danger/10' : 'border-line bg-paper'}`} role={leftFullscreen ? 'alert' : undefined}>
          {leftFullscreen && <p className="font-semibold">{t.test.fullscreenLeft}</p>}
          <button type="button" onClick={() => void document.documentElement.requestFullscreen?.().catch(() => undefined)} className="rounded-xl bg-ink px-4 py-2 font-semibold text-paper">{t.test.fullscreenStart}</button>
        </div>
      )}
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>{fmt(t.test.question, { n: String(i + 1), total: String(paper.items.length) })}</span>
        <span aria-live="polite" className={left < 5 * 60000 ? 'text-danger' : ''}>{t.test.timeLeft}: {mm}:{ss}</span>
      </div>
      <div className="flex flex-wrap gap-1.5" aria-label="Questions">
        {paper.items.map((it, n) => {
          const done = answers[String(it.id)]?.selected?.length || answers[String(it.id)]?.text
          return (
            <button key={it.id} type="button" onClick={() => setI(n)} aria-current={n === i}
              className={`size-8 rounded-lg text-sm font-semibold ${n === i ? 'bg-ink text-paper' : done ? 'bg-ok/20' : 'border border-line'}`}>
              {n + 1}
            </button>
          )
        })}
      </div>
      <section className="rounded-3xl border border-line bg-white p-5">
        {item.scenario && <p className="mb-3 rounded-xl bg-paper p-3 text-muted">{item.scenario}</p>}
        <p className="text-lg font-semibold whitespace-pre-line">{item.stem}</p>
        {item.type === 'performance_task' ? (
          <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold">
            {t.test.yourAnswer}
            <textarea className="min-h-48 rounded-xl border border-line bg-paper p-3 text-base font-normal" value={a.text ?? ''}
              onChange={(e) => setAnswer({ text: e.target.value }, true)} />
          </label>
        ) : (
          <div className="mt-4 flex flex-col gap-2" role={item.type === 'multiple_choice' ? 'group' : 'radiogroup'}>
            {item.options.map((o, oi) => {
              const on = a.selected?.includes(oi)
              const pick = () => {
                if (item.type === 'multiple_choice') {
                  const cur = new Set(a.selected ?? [])
                  if (cur.has(oi)) cur.delete(oi)
                  else cur.add(oi)
                  setAnswer({ selected: [...cur] })
                } else setAnswer({ selected: [oi] })
              }
              return (
                <button key={oi} type="button" onClick={pick} aria-pressed={on}
                  className={`rounded-xl border px-3.5 py-3 text-left ${on ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}>
                  {o}
                </button>
              )
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-muted" aria-live="polite">{saving ? t.test.saving : t.test.saved}</p>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}>{t.test.prev}</Button>
        {i < paper.items.length - 1 ? (
          <Button type="button" onClick={() => setI(i + 1)}>{t.test.next}</Button>
        ) : (
          <Button type="button" onClick={() => window.confirm(t.test.confirm) && submit()}>{t.test.submit}</Button>
        )}
      </div>
      <p className="text-xs text-muted">{t.test.integrityNote}</p>
    </div>
  )
}
