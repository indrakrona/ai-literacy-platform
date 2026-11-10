'use client'
import { useState } from 'react'
import type { Dict } from '../../i18n/dict'
import { Button, Field, inputClass, Notice } from '../ui'
import { api } from './api'

export function TestStart({ t }: { t: Dict }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<false | 'notFound' | 'bookingRequired'>(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const res = await api<{ attemptId: number }>('/api/test-attempts/start', { body: { accessCode: code } })
    setBusy(false)
    if (res.ok) window.location.href = `/tes/${res.data.attemptId}`
    else setErr((res.data as { problem?: string }).problem === 'booking_required' ? 'bookingRequired' : 'notFound')
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">{t.test.title}</h1>
        <p className="mt-1 text-muted">{t.test.lead}</p>
      </div>
      <Field label={t.test.code}>
        <input className={`${inputClass} text-center text-2xl uppercase tracking-[0.4em]`} maxLength={6} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </Field>
      {err && <Notice tone="warn">{t.test[err]}</Notice>}
      <Button type="submit" disabled={busy || code.length !== 6}>{busy ? t.common.loading : t.test.start}</Button>
      <a href="/tes/jadwal" className="text-center text-sm underline">{t.test.schedule}</a>
    </form>
  )
}
