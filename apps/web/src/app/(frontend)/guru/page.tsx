import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'

export default async function TeacherHome() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'teacher', 'school_admin', 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const classes = await payload.find({ collection: 'classes', overrideAccess: false, user, depth: 1, limit: 50 })
  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-bold">{id ? 'Ruang Guru' : 'Teacher space'}</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/guru/materi">
            <Card>
              <h2 className="text-lg font-bold">{id ? 'Materi mengajar' : 'Teaching materials'}</h2>
              <p className="mt-1 text-sm text-muted">{id ? 'Rencana pembelajaran, slide, dan lembar kerja siswa untuk setiap sesi.' : 'Lesson plans, slides and student worksheets for every session.'}</p>
            </Card>
          </Link>
          <Link href="/guru/pelatihan">
            <Card>
              <h2 className="text-lg font-bold">{id ? 'Pelatihan guru' : 'Teacher training'}</h2>
              <p className="mt-1 text-sm text-muted">{id ? 'Kursus mandiri dan sertifikat Guru Literasi AI.' : 'Self-paced course and the AI Literacy Teacher certificate.'}</p>
            </Card>
          </Link>
        </div>
        <h2 className="mt-2 text-xl font-bold">{id ? 'Kelas saya' : 'My classes'}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {classes.docs.map((c) => (
            <Link key={c.id} href={`/guru/kelas/${c.id}`}>
              <Card>
                <p className="text-sm text-muted">{c.academicYear}</p>
                <h2 className="text-xl font-bold">{c.name}</h2>
                <p className="mt-1 text-muted">{typeof c.track === 'object' && c.track ? c.track.title : id ? 'Belum ada jalur' : 'No track yet'}</p>
                <p className="mt-3 text-sm">
                  {id ? 'Kode kelas' : 'Class code'}: <span className="font-mono font-bold tracking-widest">{c.joinCode}</span> · {(c.students ?? []).length} {id ? 'siswa' : 'students'}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  )
}
