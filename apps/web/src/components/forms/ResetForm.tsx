'use client'
import Link from 'next/link'
import { useState } from 'react'
import type { Dict } from '../../i18n/dict'
import { Button, Field, inputClass, Notice } from '../ui'
import { api } from './api'

export function ResetForm({ t, token }: { t: Dict; token: string }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState<'idle' | 'done' | 'invalid'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const res = await api('/api/users/reset-password', { body: { token, password } })
    setBusy(false)
    setState(res.ok ? 'done' : 'invalid')
  }

  if (state === 'done')
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="ok" title={t.reset.done} />
        <Link href="/masuk" className="rounded-xl bg-ink px-5 py-3.5 text-center font-semibold text-paper">{t.nav.login}</Link>
      </div>
    )

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{t.reset.title}</h1>
      <Field label={t.common.password} hint={t.common.passwordHint}>
        <input className={inputClass} type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {state === 'invalid' && <Notice tone="warn">{t.reset.invalid}</Notice>}
      <Button type="submit" disabled={busy || password.length < 8}>{busy ? t.common.loading : t.reset.submit}</Button>
    </form>
  )
}
