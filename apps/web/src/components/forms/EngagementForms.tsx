'use client'
import { useEffect, useState } from 'react'
import { api, errorText } from './api'
import { inputClass } from '../ui'

type L = { locale: 'id' | 'en' }
const btn = 'rounded-xl bg-ink px-4 py-2.5 font-semibold text-paper disabled:opacity-60'
const btn2 = 'rounded-xl border border-ink px-4 py-2.5 font-semibold disabled:opacity-60'

function useAction(locale: 'id' | 'en') {
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const run = async (path: string, body?: unknown, after: () => void = () => window.location.reload(), method = 'POST') => {
    setBusy(true)
    setErr(null)
    const res = await api(path, { body, method })
    setBusy(false)
    if (res.ok) after()
    else setErr(errorText(res.data, locale === 'id' ? 'Gagal' : 'Failed'))
    return res
  }
  return { err, busy, run }
}

export function VoteButton({ submissionId, votes, canVote, locale }: { submissionId: number; votes: number; canVote: boolean } & L) {
  const id = locale === 'id'
  const [n, setN] = useState(votes)
  const [voted, setVoted] = useState(false)
  const { err, busy, run } = useAction(locale)
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={!canVote || voted || busy}
        aria-label={id ? `Pilih proyek ini (${n} suara)` : `Vote for this project (${n} votes)`}
        className={`rounded-full border px-3 py-1 text-sm font-semibold ${voted ? 'border-brand-deep bg-brand/10' : 'border-line'} disabled:cursor-default`}
        onClick={() => run(`/api/submissions/${submissionId}/vote`, {}, () => undefined).then((r) => r.ok && (setVoted(true), setN((r.data as { votes: number }).votes)))}
      >
        ♥ {n}
      </button>
      {err && <span className="text-xs text-danger">{err}</span>}
    </span>
  )
}

export function ShowcaseConsent({ submissionId, agreed, published, locale }: { submissionId: number; agreed: boolean; published: boolean } & L) {
  const id = locale === 'id'
  const { err, busy, run } = useAction(locale)
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!agreed && !published && <button type="button" disabled={busy} className={btn} onClick={() => run(`/api/submissions/${submissionId}/showcase`, { agree: true })}>{id ? 'Saya setuju tampil di galeri' : 'I agree to the gallery'}</button>}
      {(agreed || published) && <button type="button" disabled={busy} className={btn2} onClick={() => window.confirm(id ? 'Tarik proyek dari galeri?' : 'Take the project out of the gallery?') && run(`/api/submissions/${submissionId}/showcase`, { agree: false })}>{published ? (id ? 'Tarik dari galeri' : 'Take out of the gallery') : id ? 'Batalkan persetujuan' : 'Withdraw my agreement'}</button>}
      {err && <span className="text-sm text-danger">{err}</span>}
    </div>
  )
}

export function NominateButton({ submissionId, locale }: { submissionId: number } & L) {
  const id = locale === 'id'
  const { err, busy, run } = useAction(locale)
  return (
    <span>
      <button type="button" disabled={busy} className={btn2} onClick={() => run(`/api/submissions/${submissionId}/nominate`)}>{id ? 'Pilih untuk galeri' : 'Nominate for the gallery'}</button>
      {err && <span className="ml-2 text-sm text-danger">{err}</span>}
    </span>
  )
}

export function HideReview({ reviewId, hidden, locale }: { reviewId: number; hidden: boolean } & L) {
  const id = locale === 'id'
  const { run } = useAction(locale)
  return <button type="button" className="text-xs underline" onClick={() => run(`/api/peer-reviews/${reviewId}/hide`, { hidden: !hidden })}>{hidden ? (id ? 'Tampilkan lagi' : 'Show again') : id ? 'Sembunyikan' : 'Hide'}</button>
}

type Rubric = { key: string; label: string }[]

/** Peer review: one classmate's project at a time, mini rubric plus one praise and one suggestion. */
export function PeerReviewFlow({ rubric, locale }: { rubric: Rubric } & L) {
  const id = locale === 'id'
  const [sub, setSub] = useState<{ id: number; brief: string; text: string; links: string[] } | null | undefined>(undefined)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [praise, setPraise] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [done, setDone] = useState(0)
  const { err, busy, run } = useAction(locale)
  const load = () =>
    api<{ submission: { id: number; brief: string; text: string; links: string[] } | null }>('/api/peer-reviews/next', { method: 'GET' })
      .then((r) => setSub(r.ok ? (r.data.submission ?? null) : null))
      .catch(() => setSub(null))
  useEffect(() => {
    void load()
  }, [])
  if (sub === undefined) return <p className="text-muted">…</p>
  if (sub === null) return <p className="rounded-xl bg-paper p-4">{done ? (id ? `Terima kasih! Kamu memberi ${done} ulasan. ` : `Thank you! You gave ${done} reviews. `) : ''}{id ? 'Tidak ada proyek teman sekelas yang perlu diulas saat ini.' : 'No classmate projects to review right now.'}</p>
  const labels = id ? ['Belum', 'Cukup', 'Sangat'] : ['Not yet', 'Partly', 'Very']
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        await run('/api/peer-reviews/submit', { submission: sub.id, ratings, praise, suggestion }, () => {
          setDone(done + 1)
          setRatings({})
          setPraise('')
          setSuggestion('')
          setSub(undefined)
          void load()
        })
      }}
    >
      <div className="rounded-2xl border border-line bg-paper p-4">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{sub.brief}</p>
        <p className="mt-2 whitespace-pre-line">{sub.text}</p>
        {sub.links.map((l) => <a key={l} href={l} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 block text-sm break-all underline">{l}</a>)}
      </div>
      {rubric.map((c) => (
        <fieldset key={c.key} className="flex flex-col gap-1">
          <legend className="text-sm font-semibold">{c.label}</legend>
          <div className="flex gap-2">
            {[1, 2, 3].map((n) => (
              <label key={n} className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${ratings[c.key] === n ? 'border-ink bg-ink text-paper' : 'border-line'}`}>
                <input type="radio" name={c.key} className="sr-only" checked={ratings[c.key] === n} onChange={() => setRatings({ ...ratings, [c.key]: n })} />
                {labels[n - 1]}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <label className="flex flex-col gap-1 text-sm font-semibold">{id ? 'Satu hal yang sudah bagus' : 'One thing that works well'}<textarea required minLength={5} rows={2} className={inputClass} value={praise} onChange={(e) => setPraise(e.target.value)} /></label>
      <label className="flex flex-col gap-1 text-sm font-semibold">{id ? 'Satu saran perbaikan' : 'One suggestion'}<textarea required minLength={5} rows={2} className={inputClass} value={suggestion} onChange={(e) => setSuggestion(e.target.value)} /></label>
      <p className="text-xs text-muted">{id ? 'Tulis dengan sopan dan membangun. Nama kamu tidak ditampilkan ke pembuat proyek, tetapi gurumu dapat melihatnya.' : 'Be kind and constructive. The authors don’t see your name, but your teacher can.'}</p>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className={btn}>{id ? 'Kirim ulasan' : 'Send review'}</button>
      </div>
    </form>
  )
}

export function EnterEvent({ eventId, projects, locale }: { eventId: number; projects: { id: number; label: string }[] } & L) {
  const id = locale === 'id'
  const [pick, setPick] = useState(String(projects[0]?.id ?? ''))
  const { err, busy, run } = useAction(locale)
  if (!projects.length) return <p className="text-sm text-muted">{id ? 'Kirim proyek dulu untuk ikut.' : 'Send a project first to take part.'}</p>
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <select aria-label={id ? 'Proyek' : 'Project'} className={`${inputClass} sm:max-w-sm`} value={pick} onChange={(e) => setPick(e.target.value)}>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
      <button type="button" disabled={busy} className={btn} onClick={() => run(`/api/events/${eventId}/enter`, { submission: Number(pick) })}>{id ? 'Ikutkan proyek' : 'Enter project'}</button>
      {err && <span className="text-sm text-danger">{err}</span>}
    </div>
  )
}

export function JudgeForm({ eventId, submissionId, criteria, current, locale }: { eventId: number; submissionId: number; criteria: { name: string; max: number }[]; current?: { scores: number[]; comment?: string } } & L) {
  const id = locale === 'id'
  const [scores, setScores] = useState<number[]>(current?.scores ?? criteria.map(() => 0))
  const [comment, setComment] = useState(current?.comment ?? '')
  const [saved, setSaved] = useState(false)
  const { err, busy, run } = useAction(locale)
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); void run(`/api/events/${eventId}/score`, { submission: submissionId, scores, comment }, () => setSaved(true)) }}>
      <div className="flex flex-wrap gap-3">
        {criteria.map((c, i) => (
          <label key={i} className="flex flex-col gap-1 text-xs font-semibold">
            {c.name} (0–{c.max})
            <input type="number" min={0} max={c.max} className={`${inputClass} w-24`} value={scores[i]} onChange={(e) => setScores(scores.map((s, j) => (j === i ? Number(e.target.value) : s)))} />
          </label>
        ))}
      </div>
      <input className={inputClass} placeholder={id ? 'Komentar untuk tim (opsional)' : 'Comment for the team (optional)'} aria-label={id ? 'Komentar' : 'Comment'} value={comment} onChange={(e) => setComment(e.target.value)} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className={btn2}>{id ? 'Simpan nilai' : 'Save scores'}</button>
        {saved && <span className="text-sm text-ok">{id ? 'Tersimpan' : 'Saved'}</span>}
        {err && <span className="text-sm text-danger">{err}</span>}
      </div>
    </form>
  )
}

export function MakeTeams({ challengeId, students, locale }: { challengeId: number; students: number } & L) {
  const id = locale === 'id'
  const [count, setCount] = useState(String(Math.min(6, Math.max(2, Math.round(students / 4)))))
  const { err, busy, run } = useAction(locale)
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      <label className="flex items-center gap-1">{id ? 'Jumlah tim' : 'Teams'}<input type="number" min={2} max={12} className="w-16 rounded-lg border border-line px-2 py-1" value={count} onChange={(e) => setCount(e.target.value)} /></label>
      <button type="button" disabled={busy} className="rounded-lg border border-ink px-3 py-1 font-semibold" onClick={() => run(`/api/challenges/${challengeId}/teams`, { count: Number(count) })}>{id ? 'Bagi tim acak' : 'Make random teams'}</button>
      {err && <span className="text-danger">{err}</span>}
    </span>
  )
}

export function Toggle({ path, field, value, label, method = 'PATCH', extra = {} }: { path: string; field: string; value: boolean; label: string; method?: string; extra?: Record<string, unknown> }) {
  const [on, setOn] = useState(value)
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={on}
        onChange={async (e) => {
          const next = e.target.checked
          setOn(next)
          const res = await api(path, { method, body: { ...extra, [field]: next } })
          if (!res.ok) setOn(!next)
        }}
      />
      {label}
    </label>
  )
}

export function PortfolioForm({ initial, handleBase, minor, parentApproved, locale }: { initial: { enabled: boolean; handle: string; headline: string; showProjects: boolean; showBadges: boolean; showCertificate: boolean }; handleBase: string; minor: boolean; parentApproved: boolean } & L) {
  const id = locale === 'id'
  const [f, setF] = useState(initial)
  const { err, busy, run } = useAction(locale)
  const [saved, setSaved] = useState(false)
  const box = (k: 'enabled' | 'showProjects' | 'showBadges' | 'showCertificate', text: string) => (
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} />{text}</label>
  )
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void run('/api/users/portfolio', f, () => setSaved(true)) }}>
      {box('enabled', id ? 'Aktifkan halaman portofolio publik' : 'Turn on my public portfolio page')}
      {minor && f.enabled && !parentApproved && <p className="rounded-xl bg-brand/10 p-3 text-sm">{id ? 'Karena kamu di bawah 18 tahun, halaman ini baru terlihat publik setelah orang tuamu menyetujuinya di Ruang Orang Tua.' : 'Because you are under 18, the page becomes public only after your parent approves it in the parent space.'}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">{id ? 'Alamat halaman' : 'Page address'}
          <span className="flex items-center gap-1"><span className="text-muted">{handleBase}/</span><input className={inputClass} value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="nama-kamu" /></span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">{id ? 'Kalimat singkat' : 'Short headline'}<input maxLength={140} className={inputClass} value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} /></label>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {box('showProjects', id ? 'Tampilkan proyek di galeri' : 'Show gallery projects')}
        {box('showBadges', id ? 'Tampilkan lencana' : 'Show badges')}
        {box('showCertificate', id ? 'Tampilkan sertifikat AILIS' : 'Show AILIS certificate')}
      </div>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className={`${btn} self-start`}>{id ? 'Simpan' : 'Save'}</button>
        {saved && <span className="text-sm text-ok">{id ? 'Tersimpan' : 'Saved'}</span>}
      </div>
    </form>
  )
}
