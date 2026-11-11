import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../../../components/Shell'
import { LessonPlan, lessonPlanContext } from '../../../../../../components/LessonPlan'
import { PrintButton } from '../../../../../../components/forms/DataRightsForms'
import { getDict } from '../../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../../lib/session'

/** One session's lesson plan, printable (spec H3). */
export default async function SessionPlan({ params }: { params: Promise<{ track: string; session: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'teacher', 'school_admin', 'content_editor', 'content_reviewer', 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const { track: slug, session } = await params
  const track = (await payload.find({ collection: 'tracks', overrideAccess: true, locale, limit: 1, where: { slug: { equals: slug } } })).docs[0]
  if (!track) notFound()
  const units = (await payload.find({ collection: 'units', overrideAccess: true, depth: 0, limit: 20, where: { track: { equals: track.id } } })).docs.map((u) => u.id)
  const lesson = (await payload.find({ collection: 'lessons', overrideAccess: true, depth: 1, locale, limit: 1, where: { and: [{ unit: { in: units } }, { order: { equals: Number(session) } }, { _status: { equals: 'published' } }] } })).docs[0]
  if (!lesson) notFound()
  const ctx = await lessonPlanContext(payload, [lesson as never], track.level, locale)
  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <span className="flex gap-4 text-sm">
            <Link href={`/guru/presentasi/${slug}/${session}`} className="underline">{id ? 'Mode presentasi' : 'Presentation mode'}</Link>
            <Link href={`/guru/rpp/${slug}`} className="underline">{id ? 'Semua sesi' : 'All sessions'}</Link>
          </span>
          <PrintButton label={id ? 'Cetak / simpan PDF' : 'Print / save as PDF'} />
        </div>
        <LessonPlan lesson={lesson as never} trackTitle={track.title} level={track.level} ctx={ctx} locale={locale} />
      </div>
    </Shell>
  )
}
