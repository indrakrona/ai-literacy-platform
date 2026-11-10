'use client'
import Link from 'next/link'
import { useState } from 'react'
import type { Dict } from '../../i18n/dict'
import { Button, Field, inputClass, Notice } from '../ui'
import { api } from './api'

export function LoginForm({ t, google, googleProblem, locale }: { t: Dict; google: boolean; googleProblem?: string; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [mode, setMode] = useState<'password' | 'code'>('password')
  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const googleText: Record<string, string> = id
    ? { no_account: 'Belum ada akun dengan email Google itu. Daftar dulu, lalu Anda bisa masuk dengan Google.', failed: 'Masuk dengan Google gagal. Coba lagi.', suspended: 'Akun ini ditangguhkan.', off: 'Masuk dengan Google belum tersedia.' }
    : { no_account: 'No account uses that Google email yet. Sign up first, then you can sign in with Google.', failed: 'Google sign-in failed. Please try again.', suspended: 'This account is suspended.', off: 'Google sign-in is not available yet.' }
  const codeErrors: Record<string, string> = id
    ? { wrong: 'Kode salah.', expired: 'Kode sudah tidak berlaku. Minta kode baru.', too_many: 'Terlalu banyak percobaan. Minta kode baru.', suspended: 'Akun ini ditangguhkan.' }
    : { wrong: 'Wrong code.', expired: 'The code has expired. Ask for a new one.', too_many: 'Too many tries. Ask for a new code.', suspended: 'This account is suspended.' }
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

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    await api('/api/users/otp/request', { body: { identifier } })
    setBusy(false)
    setCodeSent(true)
  }
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await api<{ problem?: string }>('/api/users/otp/verify', { body: { identifier, code } })
    setBusy(false)
    if (res.ok) return void (window.location.href = '/beranda')
    setError(codeErrors[res.data.problem ?? ''] ?? t.login.failed)
  }
  const tab = (m: 'password' | 'code', label: string) => (
    <button type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(null) }} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode === m ? 'bg-ink text-paper' : 'text-ink'}`}>{label}</button>
  )
  const header = (
    <>
      <h1 className="text-2xl font-bold">{t.login.title}</h1>
      {googleProblem && googleText[googleProblem] && <Notice tone="warn">{googleText[googleProblem]}</Notice>}
      {google && (
        <a href="/api/users/google/start" className="flex items-center justify-center gap-2 rounded-xl border border-ink px-5 py-3 font-semibold">
          <span aria-hidden className="font-bold">G</span> {id ? 'Masuk dengan Google' : 'Sign in with Google'}
        </a>
      )}
      <div role="tablist" className="flex gap-1 rounded-xl border border-line p-1">
        {tab('password', id ? 'Kata sandi' : 'Password')}
        {tab('code', id ? 'Kode sekali pakai' : 'One-time code')}
      </div>
    </>
  )
  if (mode === 'code')
    return (
      <div className="flex flex-col gap-5">
        {header}
        {!codeSent ? (
          <form onSubmit={sendCode} className="flex flex-col gap-4">
            <Field label={id ? 'Email atau nomor WhatsApp' : 'Email or WhatsApp number'}>
              <input className={inputClass} autoComplete="username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            </Field>
            <Button type="submit" disabled={busy}>{busy ? t.common.loading : id ? 'Kirim kode' : 'Send code'}</Button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="flex flex-col gap-4">
            <Notice tone="ok">{id ? 'Jika akun ditemukan, kode 6 angka sudah dikirim. Berlaku 10 menit.' : 'If the account exists, a 6-digit code has been sent. It is valid for 10 minutes.'}</Notice>
            <Field label={id ? 'Kode 6 angka' : '6-digit code'}>
              <input className={`${inputClass} text-center text-2xl tracking-[0.4em]`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
            </Field>
            {error && <p className="text-sm font-medium text-danger" role="alert">{error}</p>}
            <Button type="submit" disabled={busy || code.length !== 6}>{busy ? t.common.loading : t.login.submit}</Button>
            <button type="button" className="text-sm underline" onClick={() => { setCodeSent(false); setCode('') }}>{id ? 'Kirim ulang atau ganti alamat' : 'Resend or change address'}</button>
          </form>
        )}
      </div>
    )

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {header}
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
