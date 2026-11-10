'use client'
import { useState } from 'react'
import { api, errorText } from './api'

/** Get a parent-consent link to share by WhatsApp or copy — works without an email provider. */
export function ConsentShare({ studentId, locale }: { studentId: number; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [data, setData] = useState<{ link: string; whatsapp: string; guardianPhone: string | null } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  if (!data)
    return (
      <span>
        <button
          type="button"
          className="text-sm underline"
          onClick={async () => {
            const res = await api<{ link: string; whatsapp: string; guardianPhone: string | null }>('/api/consent-requests/link', { body: { studentId } })
            if (res.ok) setData(res.data)
            else setMsg(errorText(res.data, id ? 'Gagal membuat tautan' : 'Could not create the link'))
          }}
        >
          {id ? 'Kirim tautan izin' : 'Send consent link'}
        </button>
        {msg && <span className="ml-2 text-xs text-danger">{msg}</span>}
      </span>
    )
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      <a href={data.whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-ok px-2.5 py-1 font-semibold text-white">
        {id ? 'Kirim lewat WhatsApp' : 'Send by WhatsApp'}
      </a>
      <button
        type="button"
        className="underline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(data.link)
            setMsg(id ? 'Tersalin' : 'Copied')
          } catch {
            setMsg(data.link)
          }
        }}
      >
        {id ? 'Salin tautan' : 'Copy link'}
      </button>
      {!data.guardianPhone && <span className="text-xs text-muted">{id ? '(nomor orang tua belum ada; pilih kontak di WhatsApp)' : '(no parent number on file; pick the contact in WhatsApp)'}</span>}
      {msg && <span className="text-xs text-muted break-all">{msg}</span>}
    </span>
  )
}
