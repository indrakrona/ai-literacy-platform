'use client'
import { useState } from 'react'
import { Button, inputClass } from '../ui'
import { api, errorText } from './api'

export function CreateClassForm({ tracks, locale }: { tracks: { id: number; title: string }[]; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [name, setName] = useState('')
  const [year, setYear] = useState('2026/2027')
  const [track, setTrack] = useState<number | ''>('')
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <form
      className="grid gap-3 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault()
        // The server sets the school from the admin's account.
        const res = await api('/api/classes', { body: { name, academicYear: year, ...(track ? { track } : {}) } })
        if (res.ok) window.location.reload()
        else setMsg(errorText(res.data, id ? 'Gagal membuat kelas' : 'Could not create the class'))
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {id ? 'Nama kelas' : 'Class name'}
        <input required className={inputClass} placeholder={id ? 'mis. XI IPA 2' : 'e.g. XI IPA 2'} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {id ? 'Tahun ajaran' : 'Academic year'}
        <input required pattern="\d{4}/\d{4}" className={inputClass} value={year} onChange={(e) => setYear(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {id ? 'Jalur belajar' : 'Learning track'}
        <select className={inputClass} value={track} onChange={(e) => setTrack(e.target.value ? Number(e.target.value) : '')}>
          <option value="">{id ? '— pilih nanti —' : '— choose later —'}</option>
          {tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </label>
      <Button type="submit" className="sm:w-auto">{id ? 'Buat kelas' : 'Create class'}</Button>
      {msg && <p className="text-sm text-danger sm:col-span-4">{msg}</p>}
    </form>
  )
}

interface Report {
  created: number
  addedExisting: number
  invited: number
  consentRequested: number
  errors: { row: number; email?: string; reason: string }[]
}

export const ROSTER_TEMPLATE =
  'name,email,role,date_of_birth,guardian_email,guardian_phone,guardian_name\n' +
  'Ayu Lestari,ayu@example.sch.id,student,2010-05-14,ibu.ayu@example.com,081234567890,Ibu Sari\n' +
  'Ratna Dewi,ratna@example.sch.id,teacher,,,,\n'

const REASONS_ID: [RegExp, string][] = [
  [/guardian_email or guardian_phone is required/, 'email atau nomor HP orang tua wajib diisi untuk siswa di bawah 18 tahun'],
  [/date_of_birth is required/, 'tanggal lahir wajib diisi untuk siswa'],
  [/already registered at another school/, 'sudah terdaftar di sekolah lain'],
  [/Too many rows/, 'terlalu banyak baris (maksimal 2000)'],
  [/^email:/, 'format email tidak valid'],
]
const reasonText = (reason: string, id: boolean) => (id ? REASONS_ID.find(([re]) => re.test(reason))?.[1] ?? reason : reason)

export function RosterUpload({ classId, locale }: { classId: number; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [csv, setCsv] = useState('')
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <input
          type="file"
          accept=".csv,text/csv"
          aria-label={id ? 'Pilih berkas CSV' : 'Choose a CSV file'}
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) setCsv(await f.text())
          }}
        />
        <a className="underline" download="templat-daftar-siswa.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(ROSTER_TEMPLATE)}`}>
          {id ? 'Unduh templat CSV' : 'Download CSV template'}
        </a>
      </div>
      <textarea
        rows={4}
        className={`${inputClass} font-mono text-sm`}
        placeholder={id ? 'Atau tempel isi CSV di sini' : 'Or paste the CSV here'}
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={busy || !csv.trim()}
        onClick={async () => {
          setBusy(true)
          setMsg(null)
          const res = await api<Report>('/api/classes/import', { body: { classId, csv } })
          setBusy(false)
          if (res.ok) setReport(res.data)
          else setMsg(errorText(res.data, id ? 'Gagal mengunggah' : 'Upload failed'))
        }}
      >
        {busy ? (id ? 'Memproses…' : 'Processing…') : id ? 'Unggah daftar' : 'Upload roster'}
      </Button>
      {msg && <p className="text-sm text-danger">{msg}</p>}
      {report && (
        <div role="status" className="rounded-2xl border border-line bg-paper p-4 text-sm">
          <p className="font-semibold">
            {id
              ? `${report.created} akun baru, ${report.addedExisting} akun lama ditambahkan, ${report.invited} undangan terkirim, ${report.consentRequested} permintaan izin orang tua.`
              : `${report.created} new accounts, ${report.addedExisting} existing added, ${report.invited} invitations sent, ${report.consentRequested} parent consent requests.`}
          </p>
          {report.errors.length > 0 && (
            <>
              <p className="mt-2 font-semibold text-danger">{id ? `${report.errors.length} baris tidak diproses:` : `${report.errors.length} rows skipped:`}</p>
              <ul className="mt-1 list-disc pl-5">
                {report.errors.map((e, i) => <li key={i}>{id ? 'Baris' : 'Row'} {e.row}{e.email ? ` (${e.email})` : ''}: {reasonText(e.reason, id)}</li>)}
              </ul>
            </>
          )}
          <button className="mt-3 underline" onClick={() => window.location.reload()}>{id ? 'Muat ulang data kelas' : 'Refresh class data'}</button>
        </div>
      )}
    </div>
  )
}
