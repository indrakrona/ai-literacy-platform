'use client'
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Full-screen slide deck for the classroom projector. Arrow keys, space, Page Up/Down and swipes move between
 * slides; F toggles full screen. Printing outputs every slide on its own landscape page.
 */
export function SlideDeck({ children, labels }: { children: ReactNode; labels: { prev: string; next: string; full: string; slide: string } }) {
  const slides = Children.toArray(children)
  const [i, setI] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const touch = useRef<number | null>(null)
  const go = useCallback((d: number) => setI((n) => Math.min(slides.length - 1, Math.max(0, n + d))), [slides.length])
  const full = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void root.current?.requestFullscreen?.()
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,button')) return
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(1) }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1) }
      else if (e.key === 'Home') setI(0)
      else if (e.key === 'End') setI(slides.length - 1)
      else if (e.key.toLowerCase() === 'f') full()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, slides.length])
  return (
    <div
      ref={root}
      className="flex min-h-0 flex-1 flex-col bg-paper print:block"
      onTouchStart={(e) => { touch.current = e.touches[0]?.clientX ?? null }}
      onTouchEnd={(e) => {
        const start = touch.current
        const end = e.changedTouches[0]?.clientX
        if (start != null && end != null && Math.abs(end - start) > 50) go(end < start ? 1 : -1)
        touch.current = null
      }}
    >
      <div className="h-1.5 bg-line print:hidden" aria-hidden><div className="h-full bg-brand transition-all" style={{ width: `${((i + 1) / slides.length) * 100}%` }} /></div>
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-6 py-8 sm:items-center sm:px-16 print:block print:overflow-visible print:p-0">
        {slides.map((s, n) => (
          <section
            key={n}
            aria-roledescription="slide"
            aria-label={`${labels.slide} ${n + 1} / ${slides.length}`}
            className={`${n === i ? 'flex' : 'hidden'} w-full max-w-5xl flex-col justify-center gap-6 print:flex print:min-h-[17cm] print:max-w-none print:break-after-page print:px-8 print:py-6`}
          >
            {s}
          </section>
        ))}
      </div>
      <nav className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-base print:hidden">
        <button type="button" onClick={() => go(-1)} disabled={i === 0} className="rounded-xl border border-ink px-4 py-2 font-semibold disabled:opacity-30">← {labels.prev}</button>
        <span className="text-sm text-muted" aria-live="polite">{i + 1} / {slides.length}</span>
        <span className="flex gap-2">
          <button type="button" onClick={full} className="hidden rounded-xl border border-line px-3 py-2 sm:inline-block">{labels.full}</button>
          <button type="button" onClick={() => go(1)} disabled={i === slides.length - 1} className="rounded-xl bg-ink px-4 py-2 font-semibold text-paper disabled:opacity-30">{labels.next} →</button>
        </span>
      </nav>
    </div>
  )
}

/** A quiz question on a slide: the class answers first, then the teacher reveals the answer. */
export function RevealAnswer({ options, explanation, label }: { options: { text: string; correct: boolean }[]; explanation?: string | null; label: string }) {
  const [shown, setShown] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <ol className="grid gap-3 sm:grid-cols-2">
        {options.map((o, i) => (
          <li key={i} className={`rounded-2xl border-2 p-4 text-2xl ${shown && o.correct ? 'border-ok bg-ok/10' : shown ? 'border-line opacity-60' : 'border-line bg-white'}`}>
            <span className="mr-2 font-bold">{String.fromCharCode(65 + i)}.</span>{o.text}{shown && o.correct ? ' ✓' : ''}
          </li>
        ))}
      </ol>
      {shown ? (explanation && <p className="text-xl text-muted">{explanation}</p>) : (
        <button type="button" onClick={() => setShown(true)} className="self-start rounded-xl border border-ink px-4 py-2 text-base font-semibold print:hidden">{label}</button>
      )}
    </div>
  )
}
