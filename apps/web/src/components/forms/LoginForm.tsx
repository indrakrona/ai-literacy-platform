'use client'
import Link from 'next/link'
import { useState } from 'react'
import type { Dict } from '../../i18n/dict'
import { Button, Field, inputClass, Notice } from '../ui'
import { api } from './api'

export function LoginForm({ t }: { t: Dict }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotSent, setForgotSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await api('/api/users/login', { body: { email, password } })
    setBusy(false)
    if (res.ok) return void (window.location.href = '/beranda')
    const msg = JSON.stringify(res.data).toLowerCase()
    setError(msg.includes('locked') ? t.login.locked : t.login.failed)
  }

  async function forgot() {
    if (!email) return setError(t.common.email)
    await api('/api/users/forgot-password', { body: { email } })
    setForgotSent(true)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{t.login.title}</h1>
      <Field label={t.common.email}>
        <input className={inputClass} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label={t.common.password}>
        <input className={inputClass} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error && <p className="text-sm font-medium text-danger" role="alert">{error}</p>}
      {forgotSent && <Notice tone="ok">{t.login.forgotSent}</Notice>}
      <Button type="submit" disabled={busy}>{busy ? t.common.loading : t.login.submit}</Button>
      <button type="button" onClick={forgot} className="text-sm font-semibold underline">
        {t.login.forgot}
      </button>
      <p className="text-center text-sm text-muted">
        {t.login.noAccount}{' '}
        <Link href="/daftar" className="font-semibold text-ink underline">{t.nav.signup}</Link>
      </p>
    </form>
  )
}
