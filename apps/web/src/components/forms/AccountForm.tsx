'use client'
import { useState } from 'react'
import type { Dict } from '../../i18n/dict'
import { Button, Field, inputClass, Notice } from '../ui'
import { api, errorText } from './api'

export interface AccountValues {
  id: number
  name: string
  preferredLocale: 'id' | 'en'
  phone: string
  notifyEmail: boolean
  notifyWhatsApp: boolean
  showInShowcase: boolean
  isMinor: boolean
}

export function AccountForm({ t, initial }: { t: Dict; initial: AccountValues }) {
  const [v, setV] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const res = await api(`/api/users/${v.id}`, {
      method: 'PATCH',
      body: {
        name: v.name,
        preferredLocale: v.preferredLocale,
        phone: v.phone || null,
        notifyEmail: v.notifyEmail,
        notifyWhatsApp: v.notifyWhatsApp,
        showInShowcase: v.isMinor ? false : v.showInShowcase,
      },
    })
    setBusy(false)
    if (res.ok) document.cookie = `lang=${v.preferredLocale}; path=/; max-age=31536000; samesite=lax`
    setMsg(res.ok ? { ok: true, text: t.common.saved } : { ok: false, text: errorText(res.data, t.common.error) })
  }

  const check = (k: 'notifyEmail' | 'notifyWhatsApp' | 'showInShowcase', label: string, disabled = false) => (
    <label className="flex items-start gap-3">
      <input type="checkbox" className="mt-1 size-4" disabled={disabled} checked={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.checked })} />
      <span>{label}</span>
    </label>
  )

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.account.title}</h1>
      <Field label={t.common.name}>
        <input className={inputClass} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      </Field>
      <Field label={t.account.language}>
        <select className={inputClass} value={v.preferredLocale} onChange={(e) => setV({ ...v, preferredLocale: e.target.value as 'id' | 'en' })}>
          <option value="id">Bahasa Indonesia</option>
          <option value="en">English</option>
        </select>
      </Field>
      <Field label={t.account.phone}>
        <input className={inputClass} type="tel" inputMode="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />
      </Field>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold">{t.account.notifications}</legend>
        {check('notifyEmail', t.account.notifyEmail)}
        {check('notifyWhatsApp', t.account.notifyWhatsApp)}
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold">{t.account.privacy}</legend>
        {check('showInShowcase', t.account.showcase, v.isMinor)}
        {v.isMinor && <p className="text-sm text-muted">{t.account.showcaseMinor}</p>}
      </fieldset>
      <div>
        <p className="font-semibold">{t.account.data}</p>
        <p className="mt-1 text-sm text-muted">{t.account.dataBody}</p>
      </div>
      {msg && <Notice tone={msg.ok ? 'ok' : 'warn'}>{msg.text}</Notice>}
      <Button type="submit" disabled={busy}>{busy ? t.common.loading : t.common.save}</Button>
    </form>
  )
}
