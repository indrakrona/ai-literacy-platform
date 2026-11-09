import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card, Notice } from '../../../components/ui'
import { CreateClassForm, RosterUpload } from '../../../components/forms/SchoolForms'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { schoolOverview } from '../../../lib/school'

/** School admin space: classes, rosters and parent consent at a glance (spec I1–I2). */
export default async function SchoolAdminPage({ searchParams }: { searchParams: Promise<{ sekolah?: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'school_admin', 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const own = typeof user.school === 'object' ? user.school?.id : user.school
  const requested = Number((await searchParams).sekolah) || undefined
  const schoolId = hasRole(user, 'super_admin') ? (requested ?? own) : own
  if (!schoolId) {
    return (
      <Shell>
        <Notice tone="warn" title={id ? 'Akun belum terhubung ke sekolah' : 'Account not linked to a school'}>
          {id ? 'Hubungi tim AI Literacy agar akun Anda dihubungkan ke sekolah.' : 'Ask the AI Literacy team to link your account to a school.'}
        </Notice>
      </Shell>
    )
  }
  const { school, classes, totals, pending } = await schoolOverview(payload, schoolId)
  const tracks = (await payload.find({ collection: 'tracks', locale, depth: 0, limit: 20 })).docs.map((t) => ({ id: t.id, title: t.title }))
  const stat = (label: string, value: number) => (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  )

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">{id ? 'Ruang Sekolah' : 'School space'}</p>
          <h1 className="text-3xl font-bold">{school.name}</h1>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stat(id ? 'Kelas' : 'Classes', totals.classes)}
          {stat(id ? 'Siswa' : 'Students', totals.students)}
          {stat(id ? 'Guru' : 'Teachers', totals.teachers)}
          {stat(id ? 'Menunggu izin orang tua' : 'Awaiting parent consent', totals.pendingConsent)}
          {stat(id ? 'Pelajaran diselesaikan' : 'Lessons completed', totals.lessonsCompleted)}
        </div>
        {totals.declinedConsent > 0 && (
          <Notice tone="warn" title={id ? `${totals.declinedConsent} orang tua menolak izin` : `${totals.declinedConsent} parents declined consent`}>
            {id ? 'Siswa ini hanya dapat melihat materi tanpa AI Lab dan tanpa mengirim proyek.' : 'These students can view lessons but cannot use the AI Lab or submit projects.'}
          </Notice>
        )}

        <Card>
          <h2 className="mb-3 text-lg font-semibold">{id ? 'Buat kelas baru' : 'Create a class'}</h2>
          <CreateClassForm tracks={tracks} locale={locale} />
        </Card>

        {classes.map((c) => (
          <Card key={c.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{c.name}</h2>
                <p className="text-sm text-muted">
                  {c.academicYear}{c.track ? ` · ${c.track}` : ''} · {c.students} {id ? 'siswa' : 'students'}
                  {c.pendingConsent > 0 && ` · ${c.pendingConsent} ${id ? 'menunggu izin' : 'awaiting consent'}`}
                </p>
                <p className="text-sm text-muted">{id ? 'Guru' : 'Teachers'}: {c.teachers.length ? c.teachers.join(', ') : id ? 'belum ada' : 'none yet'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted uppercase">{id ? 'Kode gabung' : 'Join code'}</p>
                <p className="font-mono text-2xl font-bold tracking-widest">{c.joinCode}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link className="underline" href={`/guru/kelas/${c.id}`}>{id ? 'Lihat kemajuan kelas' : 'View class progress'}</Link>
              <Link className="underline" href={`/guru/kelas/${c.id}/nilai`}>{id ? 'Penilaian proyek' : 'Project marking'}</Link>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">{id ? 'Unggah daftar siswa dan guru (CSV)' : 'Upload students and teachers (CSV)'}</summary>
              <p className="mt-2 mb-3 text-sm text-muted">
                {id
                  ? 'Kolom: name, email, role (student/teacher), date_of_birth (YYYY-MM-DD, wajib untuk siswa), guardian_email atau guardian_phone (wajib untuk siswa di bawah 18 tahun), guardian_name. Setiap akun baru menerima email undangan; orang tua siswa di bawah 18 tahun menerima permintaan izin.'
                  : 'Columns: name, email, role (student/teacher), date_of_birth (YYYY-MM-DD, required for students), guardian_email or guardian_phone (required for students under 18), guardian_name. New accounts get an invitation email; parents of under-18s get a consent request.'}
              </p>
              <RosterUpload classId={c.id} locale={locale} />
            </details>
          </Card>
        ))}

        {pending.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold">{id ? 'Siswa yang menunggu izin orang tua' : 'Students awaiting parent consent'}</h2>
            <p className="mt-1 text-sm text-muted">{id ? 'Ingatkan siswa agar orang tuanya membuka tautan persetujuan.' : 'Remind students to ask their parents to open the consent link.'}</p>
            <ul className="mt-3 divide-y divide-line text-sm">
              {pending.map((p) => <li key={p.id} className="flex justify-between gap-3 py-2"><span>{p.name}</span><span className="text-muted">{p.email}</span></li>)}
            </ul>
          </Card>
        )}
      </div>
    </Shell>
  )
}
