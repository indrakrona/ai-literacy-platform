'use client'
import { useState } from 'react'
import { api, errorText } from './api'
import { inputClass } from '../ui'

type L = { locale: 'id' | 'en' }
const btn = 'rounded-xl bg-ink px-5 py-3 font-semibold text-paper disabled:opacity-60'
const label = 'flex flex-col gap-1 text-sm font-medium'

/** Parent sign-up from a consent link (token) or a child's code; signs in and opens the parent page. */
export function ParentSignupForm({ token, code: initialCode, email: initialEmail, problems, locale }: { token?: string; code?: string; email?: string; problems: Record<string, string> } & L) {
  const id = locale === 'id'
  const [f, setF] = useState({ name: '', email: initialEmail ?? '', password: '', phone: '', code: initialCode ?? '' })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErr(null)
        const res = await api<{ problem?: string }>('/api/users/parent-signup', { body: { ...f, phone: f.phone || undefined, token, code: token ? undefined : f.code, locale } })
        if (!res.ok) {
          setBusy(false)
          return setErr(problems[res.data.problem ?? ''] ?? errorText(res.data, id ? 'Gagal mendaftar' : 'Could not sign up'))
        }
        await api('/api/users/login', { body: { email: f.email, password: f.password } })
        window.location.href = '/orang-tua'
      }}
    >
      <label className={label}>{id ? 'Nama Anda' : 'Your name'}<input required minLength={2} autoComplete="name" className={inputClass} value={f.name} onChange={set('name')} /></label>
      <label className={label}>Email<input required type="email" autoComplete="email" className={inputClass} value={f.email} onChange={set('email')} /></label>
      <label className={label}>{id ? 'Kata sandi (min. 8 karakter)' : 'Password (8+ characters)'}<input required minLength={8} type="password" autoComplete="new-password" className={inputClass} value={f.password} onChange={set('password')} /></label>
      <label className={label}>{id ? 'Nomor WhatsApp (opsional, untuk ringkasan mingguan)' : 'WhatsApp number (optional, for the weekly summary)'}<input type="tel" autoComplete="tel" placeholder="0812…" className={inputClass} value={f.phone} onChange={set('phone')} /></label>
      {!token && <label className={label}>{id ? 'Kode dari anak (8 karakter)' : 'Code from your child (8 characters)'}<input required minLength={8} maxLength={8} className={`${inputClass} font-mono uppercase tracking-widest`} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></label>}
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <button type="submit" disabled={busy} className={btn}>{busy ? '…' : id ? 'Buat akun orang tua' : 'Create parent account'}</button>
    </form>
  )
}

/** A signed-in parent links another child with the child's code. */
export function LinkChildForm({ problems, locale, token }: { problems: Record<string, string>; token?: string } & L) {
  const id = locale === 'id'
  const [code, setCode] = useState('')
  const [err, setErr] = useState<string | null>(null)
  if (token)
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className={btn}
          onClick={async () => {
            const res = await api<{ problem?: string }>('/api/users/link-child', { body: { token } })
            if (res.ok) window.location.href = '/orang-tua'
            else setErr(problems[res.data.problem ?? ''] ?? errorText(res.data, id ? 'Gagal menghubungkan' : 'Could not link'))
          }}
        >
          {id ? 'Hubungkan ke akun saya' : 'Connect to my account'}
        </button>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      </div>
    )
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={async (e) => {
        e.preventDefault()
        setErr(null)
        const res = await api<{ problem?: string }>('/api/users/link-child', { body: { code } })
        if (res.ok) window.location.reload()
        else setErr(problems[res.data.problem ?? ''] ?? errorText(res.data, id ? 'Gagal menghubungkan' : 'Could not link'))
      }}
    >
      <input aria-label={id ? 'Kode dari anak' : 'Code from your child'} placeholder={id ? 'Kode 8 karakter' : '8-character code'} required minLength={8} maxLength={8} className={`${inputClass} font-mono uppercase tracking-widest sm:max-w-60`} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      <button type="submit" className={btn}>{id ? 'Hubungkan' : 'Connect'}</button>
      {err && <p role="alert" className="text-sm text-danger sm:self-center">{err}</p>}
    </form>
  )
}

/** On the Account page: a student makes a code for their parent. */
export function ParentCodeButton({ locale }: L) {
  const id = locale === 'id'
  const [data, setData] = useState<{ code: string; expiresAt: string } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  if (data) {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${base}/daftar/orang-tua?kode=${data.code}`
    const text = id ? `Hubungkan akun AI Literacy saya agar Anda bisa melihat kemajuan belajar saya: ${link}` : `Connect to my AI Literacy account to see my learning progress: ${link}`
    return (
      <div className="flex flex-col gap-2">
        <p className="font-mono text-2xl font-bold tracking-[0.3em]">{data.code}</p>
        <p className="text-sm text-muted">
          {id ? 'Berlaku sampai' : 'Valid until'} {new Date(data.expiresAt).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long' })}
        </p>
        <div className="flex flex-wrap gap-2">
          <a className="rounded-lg bg-ok px-3 py-1.5 text-sm font-semibold text-white" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
            {id ? 'Kirim lewat WhatsApp' : 'Send by WhatsApp'}
          </a>
          <button
            type="button"
            className="rounded-lg border border-ink px-3 py-1.5 text-sm font-semibold"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link)
                setMsg(id ? 'Tautan tersalin' : 'Link copied')
              } catch {
                setMsg(link)
              }
            }}
          >
            {id ? 'Salin tautan' : 'Copy link'}
          </button>
          {msg && <span className="self-center text-xs break-all text-muted">{msg}</span>}
        </div>
      </div>
    )
  }
  return (
    <div>
      <button
        type="button"
        className="rounded-xl border border-ink px-4 py-2.5 font-semibold"
        onClick={async () => {
          const res = await api<{ code: string; expiresAt: string }>('/api/users/parent-code')
          if (res.ok) setData(res.data)
          else setMsg(errorText(res.data, id ? 'Gagal membuat kode' : 'Could not create a code'))
        }}
      >
        {id ? 'Buat kode untuk orang tua' : 'Make a code for my parent'}
      </button>
      {msg && <p className="mt-2 text-sm text-danger">{msg}</p>}
    </div>
  )
}

export function UnlinkButton({ childId, parentId, label, confirmText }: { childId?: number; parentId?: number; label: string; confirmText: string }) {
  return (
    <button
      type="button"
      className="text-sm underline"
      onClick={async () => {
        if (!window.confirm(confirmText)) return
        const res = await api('/api/users/unlink-guardian', { body: { childId, parentId } })
        if (res.ok) window.location.reload()
      }}
    >
      {label}
    </button>
  )
}

/** School admin (or super admin): post an announcement to the school. */
export function AnnouncementForm({ schoolId, locale }: { schoolId: number } & L) {
  const id = locale === 'id'
  const [f, setF] = useState({ title: '', body: '', endsAt: '', notify: true, audience: [] as string[] })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const audiences: [string, string][] = id
    ? [['student', 'Siswa'], ['teacher', 'Guru'], ['parent', 'Orang tua']]
    : [['student', 'Students'], ['teacher', 'Teachers'], ['parent', 'Parents']]
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErr(null)
        const res = await api(`/api/announcements?locale=${locale}`, {
          body: { title: f.title, body: f.body, scope: 'school', school: schoolId, audience: f.audience, startsAt: new Date().toISOString(), endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : undefined, notify: f.notify },
        })
        setBusy(false)
        if (res.ok) window.location.reload()
        else setErr(errorText(res.data, id ? 'Gagal mengirim' : 'Could not post'))
      }}
    >
      <label className={label}>{id ? 'Judul' : 'Title'}<input required maxLength={120} className={inputClass} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
      <label className={label}>{id ? 'Isi' : 'Message'}<textarea required maxLength={2000} rows={4} className={inputClass} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></label>
      <fieldset className="flex flex-wrap items-center gap-4 text-sm">
        <legend className="mb-1 font-medium">{id ? 'Untuk (kosong = semua)' : 'For (none = everyone)'}</legend>
        {audiences.map(([v, l]) => (
          <label key={v} className="flex items-center gap-2">
            <input type="checkbox" checked={f.audience.includes(v)} onChange={(e) => setF({ ...f, audience: e.target.checked ? [...f.audience, v] : f.audience.filter((x) => x !== v) })} />
            {l}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>{id ? 'Tampilkan sampai (opsional)' : 'Show until (optional)'}<input type="date" className={inputClass} value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} /></label>
        <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium">
          <input type="checkbox" checked={f.notify} onChange={(e) => setF({ ...f, notify: e.target.checked })} />
          {id ? 'Kirim juga sebagai pemberitahuan' : 'Also send as a notification'}
        </label>
      </div>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <button type="submit" disabled={busy} className={`${btn} self-start`}>{busy ? '…' : id ? 'Umumkan' : 'Post announcement'}</button>
    </form>
  )
}

export function DeleteAnnouncement({ id: annId, locale }: { id: number } & L) {
  const id = locale === 'id'
  return (
    <button
      type="button"
      className="text-sm underline"
      onClick={async () => {
        if (!window.confirm(id ? 'Hapus pengumuman ini?' : 'Delete this announcement?')) return
        const res = await api(`/api/announcements/${annId}`, { method: 'DELETE' })
        if (res.ok) window.location.reload()
      }}
    >
      {id ? 'Hapus' : 'Delete'}
    </button>
  )
}
