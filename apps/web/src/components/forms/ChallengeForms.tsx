'use client'
import { useState } from 'react'
import { BIG_IDEAS, BIG_IDEA_LABELS } from '@ailit/shared'
import { Button, inputClass } from '../ui'
import { api, errorText } from './api'

export function JoinChallengeButton({ challengeId, locale }: { challengeId: number; locale: 'id' | 'en' }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  return (
    <div>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          const res = await api(`/api/challenges/${challengeId}/join`, { body: {} })
          setBusy(false)
          if (res.ok) window.location.reload()
          else setErr(errorText(res.data, locale === 'id' ? 'Gagal bergabung' : 'Could not join'))
        }}
        className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
      >
        {locale === 'id' ? 'Ikut tantangan' : 'Join challenge'}
      </button>
      {err && <p className="mt-1 text-xs text-danger">{err}</p>}
    </div>
  )
}

const today = () => new Date().toISOString().slice(0, 10)
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

export function CreateChallengeForm({ classId, locale }: { classId: number; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [v, setV] = useState({ title: '', description: '', bigIdea: '', target: 3, startsAt: today(), endsAt: inDays(7) })
  const [err, setErr] = useState<string | null>(null)
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault()
        const res = await api('/api/challenges', {
          body: { ...v, class: classId, bigIdea: v.bigIdea || undefined, startsAt: new Date(`${v.startsAt}T00:00:00`).toISOString(), endsAt: new Date(`${v.endsAt}T23:59:59`).toISOString() },
        })
        if (res.ok) window.location.reload()
        else setErr(errorText(res.data, id ? 'Gagal membuat tantangan' : 'Could not create the challenge'))
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-semibold sm:col-span-2">
        {id ? 'Judul' : 'Title'}
        <input required className={inputClass} placeholder={id ? 'mis. Pekan Melindungi Data' : 'e.g. Protect-your-data week'} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {id ? 'Gagasan besar' : 'Big idea'}
        <select className={inputClass} value={v.bigIdea} onChange={(e) => setV({ ...v, bigIdea: e.target.value })}>
          <option value="">{id ? 'Pelajaran apa saja' : 'Any lesson'}</option>
          {BIG_IDEAS.map((b) => <option key={b} value={b}>{BIG_IDEA_LABELS[b][locale]}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {id ? 'Jumlah pelajaran' : 'Lessons to complete'}
        <input type="number" min={1} max={18} required className={inputClass} value={v.target} onChange={(e) => setV({ ...v, target: Number(e.target.value) })} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {id ? 'Mulai' : 'Starts'}
        <input type="date" required className={inputClass} value={v.startsAt} onChange={(e) => setV({ ...v, startsAt: e.target.value })} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {id ? 'Berakhir' : 'Ends'}
        <input type="date" required min={v.startsAt} className={inputClass} value={v.endsAt} onChange={(e) => setV({ ...v, endsAt: e.target.value })} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold sm:col-span-2">
        {id ? 'Keterangan (opsional)' : 'Description (optional)'}
        <textarea rows={2} className={inputClass} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
      </label>
      <div className="sm:col-span-2">
        <Button type="submit">{id ? 'Buat tantangan' : 'Create challenge'}</Button>
        {err && <p className="mt-2 text-sm text-danger">{err}</p>}
      </div>
    </form>
  )
}
