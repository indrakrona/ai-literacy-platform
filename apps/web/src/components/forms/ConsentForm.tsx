'use client'
import { useState } from 'react'
import type { Dict } from '../../i18n/dict'
import { Button, Field, inputClass, Notice } from '../ui'
import { api } from './api'

export function ConsentForm({ t, token }: { t: Dict; token: string }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<null | 'granted' | 'declined' | 'error' | 'already' | 'expired'>(null)

  async function decide(decision: 'granted' | 'declined') {
    setBusy(true)
    const res = await api<{ decision: 'granted' | 'declined' }>('/api/consent-requests/decide', {
      body: { token, decision, guardianName: name },
    })
    setBusy(false)
    if (res.ok) return setOutcome(res.data.decision)
    if (res.data.error === 'already_decided') return setOutcome('already')
    if (res.data.error === 'expired') return setOutcome('expired')
    setOutcome('error')
  }

  if (outcome === 'granted')
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="ok" title={t.consent.granted} />
        <div className="rounded-2xl border border-line p-4">
          <p className="font-semibold">{t.consent.followTitle}</p>
          <p className="mt-1 text-sm text-muted">{t.consent.followBody}</p>
          <a href={`/daftar/orang-tua?token=${encodeURIComponent(token)}`} className="mt-3 inline-block rounded-xl bg-ink px-5 py-3 font-semibold text-paper">
            {t.consent.followCta}
          </a>
        </div>
      </div>
    )
  if (outcome === 'declined') return <Notice title={t.consent.declined} />
  if (outcome === 'already') return <Notice title={t.consent.already} />
  if (outcome === 'expired') return <Notice tone="warn" title={t.consent.expired} />

  return (
    <div className="flex flex-col gap-4">
      <Field label={t.consent.yourName}>
        <input className={inputClass} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      {outcome === 'error' && <p className="text-sm text-danger" role="alert">{t.common.error}</p>}
      <Button type="button" disabled={busy || name.trim().length < 2} onClick={() => decide('granted')}>
        {t.consent.grant}
      </Button>
      <Button type="button" variant="secondary" disabled={busy || name.trim().length < 2} onClick={() => decide('declined')}>
        {t.consent.decline}
      </Button>
    </div>
  )
}
