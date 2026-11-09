'use client'
import { useState } from 'react'
import type { Dict } from '../../i18n/dict'
import { Button, Field, inputClass, Notice } from '../ui'
import { api } from './api'

export function JoinForm({ t }: { t: Dict }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const res = await api<{ className: string }>('/api/classes/join', { body: { code } })
    setBusy(false)
    setResult(res.ok ? { ok: true, text: `${t.join.joined} ${res.data.className}` } : { ok: false, text: res.status === 404 ? t.join.notFound : t.common.error })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">{t.join.title}</h1>
        <p className="mt-1 text-muted">{t.join.lead}</p>
      </div>
      <Field label={t.join.code}>
        <input
          className={`${inputClass} text-center text-2xl uppercase tracking-[0.4em]`}
          maxLength={6}
          autoComplete="off"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
      </Field>
      {result && <Notice tone={result.ok ? 'ok' : 'warn'}>{result.text}</Notice>}
      <Button type="submit" disabled={busy || code.length !== 6}>{busy ? t.common.loading : t.join.submit}</Button>
    </form>
  )
}
