import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { Simulator } from '../../../../../../simulators/Simulator'
import { getDict } from '../../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../../lib/session'

/** Projector view for the classroom (spec H4, one-device mode): big type, no navigation chrome. */
export default async function PresentPage({ params }: { params: Promise<{ track: string; session: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'teacher', 'school_admin', 'super_admin')) notFound()
  const { track: slug, session } = await params
  const n = Number(session)
  const { locale } = await getDict()
  const payload = await getPayloadClient()
  const track = (await payload.find({ collection: 'tracks', locale, where: { slug: { equals: slug } }, limit: 1 })).docs[0]
  if (!track) notFound()
  const units = await payload.find({ collection: 'units', locale, where: { track: { equals: track.id } }, limit: 10, depth: 0 })
  const lesson = (await payload.find({ collection: 'lessons', locale, where: { and: [{ unit: { in: units.docs.map((u) => u.id) } }, { order: { equals: n } }] }, limit: 1 })).docs[0]
  return (
    <main className="min-h-screen bg-paper px-6 py-8 text-xl sm:px-12">
      <nav className="mb-6 flex justify-between text-base font-semibold">
        {n > 1 ? <Link href={`/guru/presentasi/${slug}/${n - 1}`}>← {n - 1}</Link> : <span />}
        <span className="text-muted">{track.title}</span>
        {n < 18 ? <Link href={`/guru/presentasi/${slug}/${n + 1}`}>{n + 1} →</Link> : <span />}
      </nav>
      {!lesson ? (
        <p className="text-muted">{locale === 'id' ? 'Sesi ini belum dipublikasikan.' : 'This session is not published yet.'}</p>
      ) : (
        <article className="mx-auto flex max-w-4xl flex-col gap-6">
          <h1 className="text-4xl font-bold sm:text-5xl">{lesson.order}. {lesson.title}</h1>
          {lesson.objective && <p className="text-2xl text-muted">{lesson.objective}</p>}
          {lesson.content && <div className="prose prose-xl max-w-none"><RichText data={lesson.content} /></div>}
          {lesson.simulator && <Simulator name={lesson.simulator} locale={locale} />}
        </article>
      )}
    </main>
  )
}
