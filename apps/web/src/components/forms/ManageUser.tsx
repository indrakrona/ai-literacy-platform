'use client'
import { useState } from 'react'
import { api, errorText } from './api'

/** Super admin actions on one account; every action is written to the audit log by the server. */
export function ManageUser({ userId, suspended, roles, allRoles, locale }: { userId: number; suspended: boolean; roles: string[]; allRoles: { value: string; label: string }[]; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [msg, setMsg] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[]>(roles)
  const act = async (body: Record<string, unknown>, done: string) => {
    const res = await api<{ link?: string }>(`/api/users/${userId}/manage`, { body })
    if (!res.ok) return setMsg(errorText(res.data, id ? 'Gagal' : 'Failed'))
    if (res.data.link) setLink(res.data.link)
    else window.location.reload()
    setMsg(done)
  }
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => act({ action: suspended ? 'unsuspend' : 'suspend' }, id ? 'Disimpan' : 'Saved')}
          className={`rounded-xl px-4 py-2 font-semibold ${suspended ? 'bg-ok text-white' : 'bg-danger text-white'}`}
        >
          {suspended ? (id ? 'Aktifkan kembali akun' : 'Reactivate account') : id ? 'Tangguhkan akun' : 'Suspend account'}
        </button>
        <button type="button" onClick={() => act({ action: 'reset_link' }, id ? 'Tautan dibuat' : 'Link created')} className="rounded-xl border border-ink px-4 py-2 font-semibold">
          {id ? 'Buat tautan atur ulang sandi' : 'Create password reset link'}
        </button>
      </div>
      {link && (
        <p className="rounded-xl bg-paper p-3 break-all">
          {id ? 'Berikan tautan ini langsung kepada pengguna (berlaku 1 jam):' : 'Give this link to the user personally (valid for 1 hour):'} <span className="font-mono">{link}</span>
        </p>
      )}
      <fieldset className="rounded-xl border border-line p-3">
        <legend className="px-1 font-semibold">{id ? 'Peran' : 'Roles'}</legend>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
          {allRoles.map((r) => (
            <label key={r.value} className="flex items-center gap-2">
              <input type="checkbox" checked={picked.includes(r.value)} onChange={(e) => setPicked(e.target.checked ? [...picked, r.value] : picked.filter((x) => x !== r.value))} />
              {r.label}
            </label>
          ))}
        </div>
        <button type="button" onClick={() => act({ action: 'set_roles', roles: picked }, id ? 'Peran disimpan' : 'Roles saved')} className="mt-2 rounded-lg bg-ink px-3 py-1.5 font-semibold text-paper">
          {id ? 'Simpan peran' : 'Save roles'}
        </button>
      </fieldset>
      {msg && <p className="text-muted" role="status">{msg}</p>}
    </div>
  )
}
