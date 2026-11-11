'use client'
import { useCallback, useEffect, useState } from 'react'
import { api, errorText } from './api'
import { inputClass } from '../ui'

type L = { locale: 'id' | 'en' }
type State = { live: boolean; order: number; title: string; objective: string; questions?: string[]; question: { index: number; prompt: string; options: string[] } | null; myAnswer: number | null; counts?: number[]; answered?: number }
const KEY = 'ailit-live-session'

function usePoll(id: number | null, locale: 'id' | 'en', every = 4000) {
  const [s, setS] = useState<State | null>(null)
  const load = useCallback(async () => {
    if (!id) return
    const r = await api<State>(`/api/live-sessions/${id}/state?lang=${locale}`, { method: 'GET' }).catch(() => null)
    if (r?.ok) setS(r.data)
  }, [id, locale])
  useEffect(() => {
    void load()
    const t = setInterval(() => void load(), every)
    return () => clearInterval(t)
  }, [load, every])
  return { s, reload: load }
}

/** On the teacher's presentation screen: start a live class, show the code, ask questions, see counts. */
export function LiveControl({ track, order, locale }: { track: string; order: number } & L) {
  const id = locale === 'id'
  const [live, setLive] = useState<{ id: number; code: string } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(KEY) ?? 'null') as { id: number; code: string; track: string } | null
      if (saved && saved.track === track) setLive(saved)
    } catch {
      /* none */
    }
  }, [track])
  const { s, reload } = usePoll(live?.id ?? null, locale, 3000)
  // Follow the teacher when they move to another session.
  useEffect(() => {
    if (live && s && s.live && s.order !== order) void api(`/api/live-sessions/${live.id}/control`, { body: { order } }).then(() => reload())
  }, [live, s, order, reload])
  useEffect(() => {
    if (s && !s.live && live) {
      window.localStorage.removeItem(KEY)
      setLive(null)
    }
  }, [s, live])
  const startLive = async () => {
    const r = await api<{ id: number; code: string }>('/api/live-sessions/start', { body: { track, order } })
    if (!r.ok) return setErr(errorText(r.data, id ? 'Gagal memulai' : 'Could not start'))
    const v = { ...r.data, track }
    window.localStorage.setItem(KEY, JSON.stringify(v))
    setLive(v)
  }
  const ctl = (body: unknown) => api(`/api/live-sessions/${live!.id}/control`, { body }).then(() => reload())
  if (!live)
    return (
      <div className="rounded-2xl border border-line bg-white p-4 text-base">
        <button type="button" onClick={startLive} className="rounded-xl bg-ink px-4 py-2.5 font-semibold text-paper">{id ? 'Mulai Kelas Langsung (siswa ikut dari ponsel)' : 'Start Live Class (students follow on phones)'}</button>
        {err && <p className="mt-2 text-sm text-danger">{err}</p>}
      </div>
    )
  const max = Math.max(1, ...(s?.counts ?? [0]))
  return (
    <div className="rounded-2xl border-2 border-ink bg-white p-4 text-base">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>
          {id ? 'Buka' : 'Go to'} <strong>{typeof window !== 'undefined' ? window.location.host : ''}/kelas-langsung</strong> · {id ? 'kode' : 'code'}{' '}
          <span className="font-mono text-4xl font-bold tracking-[0.2em]">{live.code}</span>
        </p>
        <button type="button" className="text-sm underline" onClick={() => ctl({ end: true })}>{id ? 'Akhiri kelas langsung' : 'End live class'}</button>
      </div>
      {(s?.questions?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="self-center font-semibold">{id ? 'Tanyakan:' : 'Ask:'}</span>
          {s!.questions!.map((q, i) => (
            <button key={i} type="button" title={q} onClick={() => ctl({ question: i })} className={`rounded-full border px-3 py-1 ${s?.question?.index === i ? 'border-ink bg-ink text-paper' : 'border-line'}`}>{id ? 'Soal' : 'Q'} {i + 1}</button>
          ))}
          {s?.question && <button type="button" onClick={() => ctl({ question: null })} className="rounded-full border border-line px-3 py-1">{id ? 'Tutup soal' : 'Close question'}</button>}
        </div>
      )}
      {s?.question && (
        <div className="mt-4">
          <p className="text-2xl font-semibold">{s.question.prompt}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {s.question.options.map((o, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-1/2 text-lg">{String.fromCharCode(65 + i)}. {o}</span>
                <span className="h-5 flex-1 overflow-hidden rounded bg-line" aria-hidden><span className="block h-full bg-brand-deep" style={{ width: `${((s.counts?.[i] ?? 0) / max) * 100}%` }} /></span>
                <span className="w-10 text-right tabular-nums">{s.counts?.[i] ?? 0}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">{s.answered ?? 0} {id ? 'siswa menjawab · nama tidak ditampilkan' : 'students answered · names are not shown'}</p>
        </div>
      )}
    </div>
  )
}

export function JoinLive({ locale }: L) {
  const id = locale === 'id'
  const [code, setCode] = useState('')
  const [err, setErr] = useState<string | null>(null)
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        const r = await api<{ id: number }>('/api/live-sessions/join', { body: { code } })
        if (r.ok) window.location.href = `/kelas-langsung/${r.data.id}`
        else setErr(id ? 'Kode tidak ditemukan atau kelas sudah berakhir.' : 'Code not found or the class has ended.')
      }}
    >
      <input aria-label={id ? 'Kode kelas langsung' : 'Live class code'} className={`${inputClass} text-center font-mono text-3xl tracking-[0.3em] uppercase`} maxLength={6} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <button type="submit" disabled={code.length !== 6} className="rounded-xl bg-ink px-5 py-3.5 font-semibold text-paper disabled:opacity-60">{id ? 'Ikut' : 'Join'}</button>
    </form>
  )
}

/** The student's phone during a live class: current session, and the teacher's question when one is open. */
export function LiveFollow({ sessionId, locale }: { sessionId: number } & L) {
  const id = locale === 'id'
  const { s, reload } = usePoll(sessionId, locale, 4000)
  const [picked, setPicked] = useState<{ q: number; option: number } | null>(null)
  if (!s) return <p className="text-muted">…</p>
  const mine = picked && s.question && picked.q === s.question.index ? picked.option : s.myAnswer
  if (!s.live) return <p className="rounded-xl bg-paper p-4">{id ? 'Kelas langsung sudah berakhir. Terima kasih!' : 'The live class has ended. Thank you!'}</p>
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-muted">{id ? 'Sesi' : 'Session'} {s.order}</p>
        <h1 className="text-2xl font-bold">{s.title}</h1>
        {s.objective && <p className="mt-1 text-muted">{s.objective}</p>}
      </div>
      {s.question ? (
        <fieldset aria-labelledby="live-q" className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
          <p id="live-q" className="text-lg font-semibold">{s.question.prompt}</p>
          {s.question.options.map((o, i) => (
            <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 ${mine === i ? 'border-ink bg-ink text-paper' : 'border-line'}`}>
              <input
                type="radio"
                name="live"
                className="mt-1"
                checked={mine === i}
                onChange={() => {
                  setPicked({ q: s.question!.index, option: i })
                  void api(`/api/live-sessions/${sessionId}/answer`, { body: { option: i } }).then(() => reload())
                }}
              />
              <span>{o}</span>
            </label>
          ))}
          <p className="text-xs text-muted">{mine !== null ? (id ? 'Jawaban terkirim. Kamu masih bisa menggantinya.' : 'Answer sent. You can still change it.') : id ? 'Gurumu hanya melihat jumlah jawaban, bukan namamu.' : 'Your teacher sees only the counts, not your name.'}</p>
        </fieldset>
      ) : (
        <p className="rounded-xl bg-paper p-4 text-muted">{id ? 'Perhatikan layar di depan kelas. Pertanyaan dari guru akan muncul di sini.' : 'Watch the screen at the front. Your teacher’s questions appear here.'}</p>
      )}
    </div>
  )
}
