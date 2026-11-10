'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { enqueue, flush, readQueue, type QueuedAnswer } from '../lib/offline-queue'
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
  accommodations?: { largeText?: boolean; highContrast?: boolean; screenReader?: boolean; extraTimePercent?: number } | null
}

/** Minutes left at which screen readers hear the time (the visible clock is not announced every second). */
const ANNOUNCE_AT = [30, 10, 5, 1]

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
  const [pending, setPending] = useState(0)
  const [offline, setOffline] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const announced = useRef(new Set<number>())
  const heading = useRef<HTMLHeadingElement | null>(null)
  const firstRender = useRef(true)
  const storage = () => {
    try {
      return window.localStorage
    } catch {
      return undefined
    }
  }

  useEffect(() => {
    api<Paper>(`/api/test-attempts/${attemptId}/paper`, { method: 'GET' }).then((r) => {
      if (!r.ok) return setClosed(true)
      setPaper(r.data)
      // Answers given offline before a reload are newer than the server copy.
      const local = readQueue(storage(), attemptId)
      const merged = { ...(r.data.responses ?? {}) }
      for (const [k, v] of Object.entries(local)) merged[k] = { ...merged[k], ...(v.selected ? { selected: v.selected } : {}), ...(v.text !== undefined ? { text: v.text } : {}) }
      setAnswers(merged)
      setPending(Object.keys(local).length)
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

  /** Send one queued answer. True when stored; false on network/server trouble (it stays queued). */
  const send = useCallback(
    async (a: QueuedAnswer): Promise<boolean> => {
      try {
        const r = await api(`/api/test-attempts/${attemptId}/answer`, { body: a })
        if (r.status === 409) {
          setClosed(true)
          return true // the test is closed; nothing more can be stored
        }
        if (r.ok) setOffline(false)
        return r.ok
      } catch {
        setOffline(true)
        return false
      }
    },
    [attemptId],
  )

  const syncAll = useCallback(async () => {
    const left = await flush(storage(), attemptId, send)
    setPending(left)
    return left
  }, [attemptId, send])

  const save = useCallback(
    async (itemId: number, value: { selected?: number[]; text?: string }) => {
      setSaving(true)
      enqueue(storage(), attemptId, { itemId, ...value, queuedAt: new Date().toISOString() })
      await syncAll()
      setSaving(false)
    },
    [attemptId, syncAll],
  )

  // Retry queued answers when the connection returns, and every 15 seconds while any are waiting.
  useEffect(() => {
    const onOnline = () => {
      setOffline(false)
      void syncAll()
    }
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    const retry = setInterval(() => {
      if (Object.keys(readQueue(storage(), attemptId)).length) void syncAll()
    }, 15_000)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearInterval(retry)
    }
  }, [attemptId, syncAll])

  const submitting = useRef(false)
  const submit = useCallback(async () => {
    if (submitting.current) return
    submitting.current = true
    try {
      // Never submit with answers still on the device: they would be lost from scoring.
      if ((await syncAll()) > 0) return
      const r = await api(`/api/test-attempts/${attemptId}/submit`)
      if (r.ok || r.status === 409) window.location.href = `/tes/${attemptId}/hasil`
    } catch {
      setOffline(true)
    } finally {
      submitting.current = false
    }
  }, [attemptId, syncAll])

  const left = paper ? Math.max(0, new Date(paper.deadline).getTime() - now) : 0
  useEffect(() => {
    if (!paper) return
    const mins = Math.ceil(left / 60000)
    for (const m of ANNOUNCE_AT) {
      if (mins === m && !announced.current.has(m) && left > 0) {
        announced.current.add(m)
        setAnnouncement(`${t.test.timeLeft}: ${m} ${t.test.minutes}`)
      }
    }
  }, [left, paper, t])
  // Move focus to the question when changing questions, so keyboard and screen-reader users start there.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    heading.current?.focus()
  }, [i])
  useEffect(() => {
    if (paper && left === 0 && !closed) void submit()
  }, [left, paper, closed, submit])
  // When time is up but answers were stuck offline, keep trying to sync and submit once back online.
  useEffect(() => {
    if (!paper || left > 0 || closed) return
    const t = setInterval(() => void submit(), 10_000)
    return () => clearInterval(t)
  }, [paper, left, closed, submit])

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

  const acc = paper.accommodations ?? {}
  const wrap = [acc.largeText ? 'text-xl [&_button]:text-xl [&_textarea]:text-xl' : '', acc.highContrast ? 'rounded-2xl bg-white p-3 text-black [&_*]:border-black [&_.text-muted]:text-black' : ''].join(' ')
  const isMulti = item.type === 'multiple_choice'
  return (
    <div className={`flex flex-col gap-5 ${wrap}`}>
      <p className="sr-only" aria-live="assertive">{announcement}</p>
      {(acc.extraTimePercent || acc.largeText || acc.highContrast || acc.screenReader) ? (
        <p className="text-sm text-muted">{t.test.accommodated}</p>
      ) : null}
      {canFullscreen && !isFullscreen && !acc.screenReader && (
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 text-sm ${leftFullscreen ? 'border-danger/40 bg-danger/10' : 'border-line bg-paper'}`} role={leftFullscreen ? 'alert' : undefined}>
          {leftFullscreen && <p className="font-semibold">{t.test.fullscreenLeft}</p>}
          <button type="button" onClick={() => void document.documentElement.requestFullscreen?.().catch(() => undefined)} className="rounded-xl bg-ink px-4 py-2 font-semibold text-paper">{t.test.fullscreenStart}</button>
        </div>
      )}
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>{fmt(t.test.question, { n: String(i + 1), total: String(paper.items.length) })}</span>
        <span role="timer" aria-label={`${t.test.timeLeft} ${mm}:${ss}`} className={left < 5 * 60000 ? 'text-danger' : ''}>{t.test.timeLeft}: {mm}:{ss}</span>
      </div>
      <nav className="flex flex-wrap gap-1.5" aria-label={t.test.questionNav}>
        {paper.items.map((it, n) => {
          const done = answers[String(it.id)]?.selected?.length || answers[String(it.id)]?.text
          return (
            <button key={it.id} type="button" onClick={() => setI(n)} aria-current={n === i ? 'step' : undefined}
              aria-label={`${fmt(t.test.question, { n: String(n + 1), total: String(paper.items.length) })}${done ? `, ${t.test.answered}` : ''}`}
              className={`min-h-8 min-w-8 rounded-lg px-1 text-sm font-semibold ${n === i ? 'bg-ink text-paper' : done ? 'bg-ok/20' : 'border border-line'}`}>
              {n + 1}
            </button>
          )
        })}
      </nav>
      <section className="rounded-3xl border border-line bg-white p-5">
        {item.scenario && <p className="mb-3 rounded-xl bg-paper p-3 text-muted">{item.scenario}</p>}
        <h2 ref={heading} tabIndex={-1} id={`stem-${item.id}`} className="text-lg font-semibold whitespace-pre-line outline-none">{item.stem}</h2>
        {item.type === 'performance_task' ? (
          <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold">
            {t.test.yourAnswer}
            <textarea className="min-h-48 rounded-xl border border-line bg-paper p-3 text-base font-normal" value={a.text ?? ''}
              onChange={(e) => setAnswer({ text: e.target.value }, true)} />
          </label>
        ) : (
          <fieldset className="mt-4 flex flex-col gap-2" aria-labelledby={`stem-${item.id}`}>
            {isMulti && <legend className="mb-1 text-sm text-muted">{t.test.chooseAll}</legend>}
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
                <label key={oi} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${on ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}>
                  <input type={isMulti ? 'checkbox' : 'radio'} name={`q-${item.id}`} checked={Boolean(on)} onChange={pick} className="mt-1 size-4 shrink-0 accent-brand-deep" />
                  <span>{o}</span>
                </label>
              )
            })}
          </fieldset>
        )}
        <p className={`mt-3 text-xs ${offline || pending ? 'font-semibold text-danger' : 'text-muted'}`} aria-live="polite">
          {pending ? fmt(t.test.offlinePending, { n: String(pending) }) : offline ? t.test.offlineNoPending : saving ? t.test.saving : t.test.saved}
        </p>
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
