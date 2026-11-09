'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Dict } from '../../i18n/dict'
import { Button, Field, inputClass, Notice } from '../ui'
import { api, errorText } from './api'

function ageFrom(dob: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null
  const d = new Date(dob)
  const now = new Date()
  let a = now.getFullYear() - d.getFullYear()
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--
  return a
}

export function SignupForm({ t, locale, initialCode }: { t: Dict; locale: 'id' | 'en'; initialCode?: string }) {
  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    dateOfBirth: '',
    accountType: 'student' as 'student' | 'candidate',
    classCode: initialCode ?? '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    agree: false,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<null | { pending: boolean }>(null)
  const age = useMemo(() => ageFrom(f.dateOfBirth), [f.dateOfBirth])
  const minor = age !== null && age < 18
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (minor && !f.guardianEmail && !f.guardianPhone) return setError(t.signup.guardianNeedOne)
    setBusy(true)
    const { agree, ...rest } = f
    void agree
    const body = {
      ...rest,
      locale,
      classCode: f.classCode || undefined,
      guardianEmail: minor ? f.guardianEmail || undefined : undefined,
      guardianPhone: minor ? f.guardianPhone || undefined : undefined,
      guardianName: minor ? f.guardianName || undefined : undefined,
    }
    const res = await api<{ consentStatus: string }>('/api/users/signup', { body })
    if (!res.ok) {
      setBusy(false)
      return setError(errorText(res.data, t.common.error))
    }
    await api('/api/users/login', { body: { email: f.email, password: f.password } })
    setBusy(false)
    setDone({ pending: res.data.consentStatus === 'pending' })
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{t.signup.doneTitle}</h1>
        <Notice tone={done.pending ? 'warn' : 'ok'}>{done.pending ? t.signup.donePending : t.signup.doneReady}</Notice>
        <Link href="/beranda" className="rounded-xl bg-ink px-5 py-3.5 text-center font-semibold text-paper">
          {t.common.continue}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <div>
        <h1 className="text-2xl font-bold">{t.signup.title}</h1>
        <p className="mt-1 text-muted">{t.signup.lead}</p>
      </div>
      <Field label={t.common.name}>
        <input className={inputClass} required autoComplete="name" value={f.name} onChange={set('name')} />
      </Field>
      <Field label={t.common.email}>
        <input className={inputClass} type="email" required autoComplete="email" value={f.email} onChange={set('email')} />
      </Field>
      <Field label={t.common.password} hint={t.common.passwordHint}>
        <input className={inputClass} type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={set('password')} />
      </Field>
      <Field label={t.signup.dob}>
        <input className={inputClass} type="date" required value={f.dateOfBirth} onChange={set('dateOfBirth')} />
      </Field>
      <Field label={t.signup.accountType}>
        <select className={inputClass} value={f.accountType} onChange={set('accountType')}>
          <option value="student">{t.signup.student}</option>
          <option value="candidate">{t.signup.candidate}</option>
        </select>
      </Field>
      {f.accountType === 'student' && (
        <Field label={t.signup.classCode} hint={t.signup.classCodeHint}>
          <input className={`${inputClass} uppercase tracking-widest`} maxLength={6} value={f.classCode} onChange={set('classCode')} />
        </Field>
      )}
      {minor && (
        <fieldset className="flex flex-col gap-4 rounded-2xl border border-brand/40 bg-brand/5 p-4">
          <legend className="px-1 font-semibold">{t.signup.guardianTitle}</legend>
          <p className="text-sm text-muted">{t.signup.guardianLead}</p>
          <Field label={t.signup.guardianName}>
            <input className={inputClass} value={f.guardianName} onChange={set('guardianName')} />
          </Field>
          <Field label={t.signup.guardianEmail}>
            <input className={inputClass} type="email" value={f.guardianEmail} onChange={set('guardianEmail')} />
          </Field>
          <Field label={t.signup.guardianPhone}>
            <input className={inputClass} type="tel" inputMode="tel" placeholder="08…" value={f.guardianPhone} onChange={set('guardianPhone')} />
          </Field>
        </fieldset>
      )}
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1 size-4" checked={f.agree} onChange={set('agree')} required />
        <span>{t.signup.agree}</span>
      </label>
      {error && <p className="text-sm font-medium text-danger" role="alert">{error}</p>}
      <Button type="submit" disabled={busy || !f.agree}>
        {busy ? t.common.loading : t.signup.submit}
      </Button>
      <p className="text-center text-sm text-muted">
        {t.signup.haveAccount}{' '}
        <Link href="/masuk" className="font-semibold text-ink underline">
          {t.nav.login}
        </Link>
      </p>
    </form>
  )
}
