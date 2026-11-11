import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../components/Shell'
import { Card } from '../../../../components/ui'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../lib/session'

/** Every session's teaching materials in one place: lesson plan, slides, worksheet and Live Class (spec H3). */
export default async function MaterialsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'teacher', 'school_admin', 'content_editor', 'content_reviewer', 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const tracks = (await payload.find({ collection: 'tracks', overrideAccess: true, locale, depth: 0, limit: 10, sort: 'level', where: { _status: { equals: 'published' } } })).docs
  const byTrack = await Promise.all(
    tracks.map(async (t) => {
      const units = (await payload.find({ collection: 'units', overrideAccess: true, depth: 0, limit: 20, where: { track: { equals: t.id } } })).docs.map((u) => u.id)
      const lessons = (await payload.find({ collection: 'lessons', overrideAccess: true, depth: 0, locale, limit: 60, sort: 'order', select: { title: true, order: true, inCoreVersion: true }, where: { and: [{ unit: { in: units } }, { _status: { equals: 'published' } }] } })).docs
      return { t, lessons }
    }),
  )
  const link = (href: string, label: string) => <Link href={href} className="underline">{label}</Link>
  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-5">
        <div>
          <Link href="/guru" className="text-sm underline">{id ? '← Ruang Guru' : '← Teacher space'}</Link>
          <h1 className="mt-1 text-3xl font-bold">{id ? 'Materi mengajar' : 'Teaching materials'}</h1>
          <p className="text-muted">{id ? 'Semua materi dibuat dari isi pelajaran di CMS, jadi selalu sama dengan yang dilihat siswa. ★ = termasuk versi 12 sesi.' : 'All materials are generated from the lesson content in the CMS, so they always match what students see. ★ = in the 12-session version.'}</p>
        </div>
        <p className="flex flex-wrap gap-4 text-sm">
          {link('/guru/proyek-templat', id ? 'Templat brief proyek untuk mitra' : 'Project brief template for partners')}
          {link('/guru/pelatihan', id ? 'Pelatihan dan sertifikasi guru' : 'Teacher training and certification')}
        </p>
        {byTrack.map(({ t, lessons }) => (
          <Card key={t.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold">{t.title}</h2>
              {link(`/guru/rpp/${t.slug}`, id ? 'Semua rencana pembelajaran (PDF)' : 'All lesson plans (PDF)')}
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    <th className="py-2 pr-3 font-medium">{id ? 'Sesi' : 'Session'}</th>
                    <th className="py-2 pr-3 font-medium">{id ? 'Materi' : 'Materials'}</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l) => (
                    <tr key={l.id} className="border-b border-line align-top">
                      <td className="py-2 pr-3"><span className="font-semibold">{l.order}.</span> {l.title}{l.inCoreVersion ? ' ★' : ''}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className="flex gap-3">
                          {link(`/guru/rpp/${t.slug}/${l.order}`, id ? 'Rencana' : 'Plan')}
                          {link(`/guru/slide/${t.slug}/${l.order}`, id ? 'Slide' : 'Slides')}
                          {link(`/guru/lkpd/${t.slug}/${l.order}`, id ? 'LKPD' : 'Worksheet')}
                          {link(`/guru/presentasi/${t.slug}/${l.order}`, id ? 'Kelas Langsung' : 'Live Class')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </Shell>
  )
}
