'use client'
import { useState } from 'react'
import { api, errorText } from './api'
import { inputClass } from '../ui'

type L = { locale: 'id' | 'en' }

/** Account page: download my data, ask for deletion (or cancel an open request). */
export function MyDataPanel({ openRequest, locale }: { openRequest: { id: number; dueAt: string } | null } & L) {
  const id = locale === 'id'
  const [reason, setReason] = useState('')
  const [asking, setAsking] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const due = (d: string) => new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="flex flex-col gap-4">
      <div>
        <a href="/api/data-requests/export" className="inline-block rounded-xl border border-ink px-4 py-2.5 font-semibold">
          {id ? 'Unduh data saya (JSON)' : 'Download my data (JSON)'}
        </a>
        <p className="mt-1 text-xs text-muted">{id ? 'Berisi profil, kemajuan, percakapan AI, proyek, hasil tes dan izin orang tua.' : 'Includes your profile, progress, AI chats, projects, test results and parent consent.'}</p>
      </div>
      {openRequest ? (
        <div className="rounded-xl border border-brand/40 bg-brand/10 p-3 text-sm">
          <p className="font-semibold">{id ? 'Permintaan penghapusan sedang diproses' : 'Deletion request in progress'}</p>
          <p className="text-muted">{id ? `Akan diselesaikan paling lambat ${due(openRequest.dueAt)}.` : `It will be completed by ${due(openRequest.dueAt)}.`}</p>
          <button
            type="button"
            className="mt-2 underline"
            onClick={async () => {
              const res = await api(`/api/data-requests/${openRequest.id}/cancel`)
              if (res.ok) window.location.reload()
            }}
          >
            {id ? 'Batalkan permintaan' : 'Cancel the request'}
          </button>
        </div>
      ) : asking ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            const res = await api('/api/data-requests/delete', { body: { reason } })
            if (res.ok) window.location.reload()
            else setErr(errorText(res.data, id ? 'Gagal mengirim' : 'Could not send'))
          }}
        >
          <p className="text-sm">
            {id
              ? 'Akun dan data pribadimu akan dihapus permanen: kemajuan, lencana, percakapan AI, proyek pribadi. Sertifikat akan dicabut. Ini tidak dapat dibatalkan setelah diproses.'
              : 'Your account and personal data will be permanently deleted: progress, badges, AI chats, solo projects. Certificates will be revoked. This cannot be undone once processed.'}
          </p>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {id ? 'Alasan (opsional)' : 'Reason (optional)'}
            <textarea rows={2} className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <div className="flex gap-3">
            <button type="submit" className="rounded-xl bg-danger px-4 py-2.5 font-semibold text-white">{id ? 'Kirim permintaan penghapusan' : 'Send deletion request'}</button>
            <button type="button" className="underline" onClick={() => setAsking(false)}>{id ? 'Batal' : 'Cancel'}</button>
          </div>
        </form>
      ) : (
        <button type="button" className="self-start text-sm text-danger underline" onClick={() => setAsking(true)}>
          {id ? 'Minta penghapusan akun dan data' : 'Ask for my account and data to be deleted'}
        </button>
      )}
    </div>
  )
}

/** Parent page (per child) or consent page (token): withdraw permission; parent page also offers deletion. */
export function WithdrawConsent({ childId, token, childName, locale }: { childId?: number; token?: string; childName: string } & L) {
  const id = locale === 'id'
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  if (done) return <p className="text-sm font-semibold">{id ? 'Izin sudah ditarik.' : 'Permission withdrawn.'}</p>
  return (
    <span>
      <button
        type="button"
        className="text-sm underline"
        onClick={async () => {
          const msg = id
            ? `Tarik izin untuk ${childName}? AI Lab, proyek dan tes akan dinonaktifkan; materi tetap bisa dibaca. Anda bisa memberi izin lagi melalui sekolah.`
            : `Withdraw permission for ${childName}? The AI Lab, projects and tests will be turned off; lessons stay readable. You can give permission again through the school.`
          if (!window.confirm(msg)) return
          const res = await api('/api/data-requests/withdraw-consent', { body: { childId, token } })
          if (res.ok) {
            setDone(true)
            if (childId) window.location.reload()
          } else setErr(errorText(res.data, id ? 'Gagal' : 'Failed'))
        }}
      >
        {id ? 'Tarik izin' : 'Withdraw permission'}
      </button>
      {err && <span className="ml-2 text-xs text-danger">{err}</span>}
    </span>
  )
}

export function RequestChildDeletion({ childId, childName, locale }: { childId: number; childName: string } & L) {
  const id = locale === 'id'
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <span>
      <button
        type="button"
        className="text-sm text-danger underline"
        onClick={async () => {
          if (!window.confirm(id ? `Minta penghapusan akun dan data ${childName}? Ini permanen setelah diproses.` : `Ask for ${childName}’s account and data to be deleted? It is permanent once processed.`)) return
          const res = await api<{ dueAt: string }>('/api/data-requests/delete', { body: { childId } })
          setMsg(res.ok ? (id ? 'Permintaan terkirim.' : 'Request sent.') : errorText(res.data, id ? 'Gagal' : 'Failed'))
        }}
      >
        {id ? 'Minta penghapusan data' : 'Request data deletion'}
      </button>
      {msg && <span className="ml-2 text-xs text-muted">{msg}</span>}
    </span>
  )
}

/** Operations: carry out or reject a deletion request. */
export function ProcessDataRequest({ requestId, locale }: { requestId: number } & L) {
  const id = locale === 'id'
  const [note, setNote] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const go = async (action: 'erase' | 'reject') => {
    if (action === 'erase' && !window.confirm(id ? 'Hapus akun ini secara permanen?' : 'Permanently erase this account?')) return
    setBusy(true)
    const res = await api(`/api/data-requests/${requestId}/process`, { body: { action, note } })
    setBusy(false)
    if (res.ok) window.location.reload()
    else setErr(errorText(res.data, id ? 'Gagal' : 'Failed'))
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input className={`${inputClass} sm:max-w-sm`} placeholder={id ? 'Catatan (wajib jika ditolak)' : 'Note (required to reject)'} aria-label={id ? 'Catatan' : 'Note'} value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="button" disabled={busy} onClick={() => go('erase')} className="rounded-xl bg-danger px-4 py-2.5 font-semibold text-white disabled:opacity-60">{id ? 'Hapus akun' : 'Erase account'}</button>
      <button type="button" disabled={busy} onClick={() => go('reject')} className="rounded-xl border border-ink px-4 py-2.5 font-semibold disabled:opacity-60">{id ? 'Tolak' : 'Reject'}</button>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
    </div>
  )
}

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="rounded-xl border border-ink px-4 py-2.5 font-semibold print:hidden" onClick={() => window.print()}>
      {label}
    </button>
  )
}
