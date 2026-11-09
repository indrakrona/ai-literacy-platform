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
