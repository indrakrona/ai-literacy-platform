'use client'
import { useState } from 'react'
import { Button, Field, inputClass } from '../ui'
import { api, errorText } from './api'

export function SubmitProjectForm({
  briefId,
  classes,
  allowTeams,
  initial,
  locale,
}: {
  briefId: number
  classes: { id: number; name: string }[]
  allowTeams: boolean
  initial?: { classId?: number; text?: string; links?: string[] }
  locale: 'id' | 'en'
}) {
  const id = locale === 'id'
  const [klass, setKlass] = useState(initial?.classId ?? classes[0]?.id ?? 0)
  const [text, setText] = useState(initial?.text ?? '')
  const [links, setLinks] = useState((initial?.links ?? []).join('\n'))
  const [mates, setMates] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setMsg(null)
        const res = await api('/api/submissions/submit', {
          body: {
            brief: briefId,
            class: klass,
            text,
            links: links.split(/\s+/).filter(Boolean),
            teammates: mates.split(/[\s,;]+/).filter(Boolean),
          },
        })
        setBusy(false)
        if (res.ok) {
          setMsg({ ok: true, text: id ? 'Proyek terkirim. Gurumu akan menilainya.' : 'Project sent. Your teacher will mark it.' })
          window.location.reload()
        } else setMsg({ ok: false, text: errorText(res.data, id ? 'Gagal mengirim' : 'Could not send') })
      }}
    >
      {classes.length > 1 && (
        <Field label={id ? 'Kelas' : 'Class'}>
          <select className={inputClass} value={klass} onChange={(e) => setKlass(Number(e.target.value))}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      )}
      <Field label={id ? 'Jelaskan hasil kerjamu' : 'Describe your work'} hint={id ? 'Apa yang kamu buat, bagaimana kamu memakai AI, dan apa yang kamu periksa sendiri.' : 'What you made, how you used AI, and what you checked yourself.'}>
        <textarea required minLength={20} rows={8} className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <Field label={id ? 'Tautan (opsional, satu per baris)' : 'Links (optional, one per line)'} hint={id ? 'Misalnya Google Drive, Canva, atau Padlet.' : 'For example Google Drive, Canva or Padlet.'}>
        <textarea rows={2} className={inputClass} value={links} onChange={(e) => setLinks(e.target.value)} />
      </Field>
      {allowTeams && (
        <Field label={id ? 'Email teman satu tim (opsional)' : 'Teammates’ emails (optional)'} hint={id ? 'Pisahkan dengan koma. Mereka harus di kelas yang sama.' : 'Separate with commas. They must be in the same class.'}>
          <input className={inputClass} value={mates} onChange={(e) => setMates(e.target.value)} />
        </Field>
      )}
      <Button type="submit" disabled={busy || !klass || text.trim().length < 20}>{id ? 'Kirim proyek' : 'Send project'}</Button>
      {msg && <p className={`text-sm ${msg.ok ? 'text-ok' : 'text-danger'}`}>{msg.text}</p>}
    </form>
  )
}
