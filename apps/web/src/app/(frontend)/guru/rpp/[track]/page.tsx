import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../../components/Shell'
import { LessonPlan, lessonPlanContext } from '../../../../../components/LessonPlan'
import { PrintButton } from '../../../../../components/forms/DataRightsForms'
import { getDict } from '../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../lib/session'

/** All lesson plans of a track in one printable document (spec H3). */
export default async function TrackPlans({ params }: { params: Promise<{ track: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'teacher', 'school_admin', 'content_editor', 'content_reviewer', 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const slug = (await params).track
  const track = (await payload.find({ collection: 'tracks', overrideAccess: true, locale, limit: 1, where: { slug: { equals: slug } } })).docs[0]
  if (!track) notFound()
  const units = (await payload.find({ collection: 'units', overrideAccess: true, depth: 0, limit: 20, where: { track: { equals: track.id } } })).docs.map((u) => u.id)
  const lessons = (await payload.find({ collection: 'lessons', overrideAccess: true, depth: 1, locale, limit: 50, sort: 'order', where: { and: [{ unit: { in: units } }, { _status: { equals: 'published' } }] } })).docs
  const ctx = await lessonPlanContext(payload, lessons as never, track.level, locale)
  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
          <div>
            <Link href="/guru" className="text-sm underline">{id ? '← Ruang Guru' : '← Teacher space'}</Link>
            <h1 className="mt-1 text-3xl font-bold">{id ? 'Rencana pembelajaran' : 'Lesson plans'}: {track.title}</h1>
            <p className="text-muted">{id ? `${lessons.length} sesi. Cetak atau simpan sebagai PDF; setiap sesi dimulai di halaman baru.` : `${lessons.length} sessions. Print or save as PDF; each session starts on a new page.`}</p>
          </div>
          <PrintButton label={id ? 'Cetak / simpan PDF' : 'Print / save as PDF'} />
        </div>
        {lessons.map((l) => <LessonPlan key={l.id} lesson={l as never} trackTitle={track.title} level={track.level} ctx={ctx} locale={locale} />)}
      </div>
    </Shell>
  )
}
