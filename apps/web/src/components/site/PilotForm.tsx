'use client'
import { useState } from 'react'
import { Button, Field, inputClass } from '../ui'
import { api, errorText } from '../forms/api'

const L = {
  id: {
    school: 'Nama sekolah', npsn: 'NPSN (opsional)', level: 'Jenjang', city: 'Kota/kabupaten', province: 'Provinsi',
    name: 'Nama Anda', role: 'Jabatan', rolePh: 'mis. Kepala Sekolah, Wakasek Kurikulum, Guru Informatika',
    email: 'Email', phone: 'Nomor WhatsApp (opsional)', students: 'Perkiraan jumlah siswa yang ikut (opsional)',
    message: 'Pesan (opsional)', send: 'Kirim permintaan', sending: 'Mengirim…', other: 'Lainnya',
    done: 'Terima kasih. Permintaan Anda sudah kami terima; tim kami akan menghubungi Anda dalam 5 hari kerja. Salinan dikirim ke email Anda.',
    privacy: 'Data ini hanya dipakai untuk menghubungi Anda tentang program pilot.',
  },
  en: {
    school: 'School name', npsn: 'NPSN (optional)', level: 'Level', city: 'City/regency', province: 'Province',
    name: 'Your name', role: 'Position', rolePh: 'e.g. Principal, Vice-principal for curriculum, ICT teacher',
    email: 'Email', phone: 'WhatsApp number (optional)', students: 'Approximate number of students (optional)',
    message: 'Message (optional)', send: 'Send request', sending: 'Sending…', other: 'Other',
    done: 'Thank you. We have received your request and will contact you within 5 working days. A copy was sent to your email.',
    privacy: 'We use this only to contact you about the pilot.',
  },
}

export function PilotForm({ locale }: { locale: 'id' | 'en' }) {
  const t = L[locale]
  const [v, setV] = useState({ schoolName: '', npsn: '', level: 'sma', city: '', province: '', contactName: '', contactRole: '', email: '', phone: '', students: '', message: '', website: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [err, setErr] = useState<string | null>(null)
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }))

  if (state === 'done') return <div role="status" className="rounded-2xl border border-ok/40 bg-ok/10 p-4">{t.done}</div>
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault()
        setState('sending')
        setErr(null)
        const res = await api('/api/pilot-requests/submit', { body: { ...v, students: v.students || undefined, locale } })
        if (res.ok) setState('done')
        else {
          setState('idle')
          setErr(errorText(res.data, locale === 'id' ? 'Gagal mengirim. Periksa isian Anda.' : 'Could not send. Please check the form.'))
        }
      }}
    >
      <div className="sm:col-span-2"><Field label={t.school}><input required minLength={3} className={inputClass} value={v.schoolName} onChange={set('schoolName')} /></Field></div>
      <Field label={t.npsn}><input inputMode="numeric" pattern="\d{8}" className={inputClass} value={v.npsn} onChange={set('npsn')} /></Field>
      <Field label={t.level}>
        <select className={inputClass} value={v.level} onChange={set('level')}>
          <option value="smp">SMP</option><option value="sma">SMA</option><option value="smk">SMK</option><option value="other">{t.other}</option>
        </select>
      </Field>
      <Field label={t.city}><input required className={inputClass} value={v.city} onChange={set('city')} /></Field>
      <Field label={t.province}><input required className={inputClass} value={v.province} onChange={set('province')} /></Field>
      <Field label={t.name}><input required className={inputClass} autoComplete="name" value={v.contactName} onChange={set('contactName')} /></Field>
      <Field label={t.role}><input required className={inputClass} placeholder={t.rolePh} value={v.contactRole} onChange={set('contactRole')} /></Field>
      <Field label={t.email}><input required type="email" autoComplete="email" className={inputClass} value={v.email} onChange={set('email')} /></Field>
      <Field label={t.phone}><input type="tel" autoComplete="tel" className={inputClass} value={v.phone} onChange={set('phone')} /></Field>
      <div className="sm:col-span-2"><Field label={t.students}><input type="number" min={1} max={10000} className={inputClass} value={v.students} onChange={set('students')} /></Field></div>
      <div className="sm:col-span-2"><Field label={t.message}><textarea rows={3} maxLength={1500} className={inputClass} value={v.message} onChange={set('message')} /></Field></div>
      {/* Honeypot, hidden from people */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={v.website} onChange={set('website')} />
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Button type="submit" disabled={state === 'sending'}>{state === 'sending' ? t.sending : t.send}</Button>
        <p className="text-sm text-muted">{t.privacy}</p>
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
      </div>
    </form>
  )
}
