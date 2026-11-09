import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '../../../../components/Shell'
import { Card } from '../../../../components/ui'
import { fmt } from '../../../../i18n/dict'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../lib/session'

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track: slug } = await params
  const { t, locale } = await getDict()
  const payload = await getPayloadClient()
  const track = (await payload.find({ collection: 'tracks', locale, where: { slug: { equals: slug } }, limit: 1 })).docs[0]
  if (!track) notFound()
  const units = await payload.find({ collection: 'units', locale, where: { track: { equals: track.id } }, sort: 'order', limit: 10 })
  // Outline titles are public; lesson pages themselves show only published content.
  const lessons = await payload.find({
    collection: 'lessons',
    locale,
    draft: true,
    overrideAccess: true,
    where: { unit: { in: units.docs.map((u) => u.id) } },
    sort: 'order',
    limit: 100,
    select: { title: true, order: true, unit: true, competency: true, inCoreVersion: true, _status: true },
  })

  const user = await getCurrentUser()
  const doneIds = new Set<number>()
  if (user) {
    const progress = await payload.find({
      collection: 'lesson-progress',
      overrideAccess: false,
      user,
      where: { and: [{ lesson: { in: lessons.docs.map((l) => l.id) } }, { status: { equals: 'completed' } }] },
      limit: 100,
      depth: 0,
    })
    for (const p of progress.docs) doneIds.add(typeof p.lesson === 'object' ? p.lesson.id : p.lesson)
  }

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">{track.level === 'smp' ? 'SMP' : 'SMA / SMK'}</p>
          <h1 className="text-3xl font-bold">{track.title}</h1>
          <p className="mt-1 text-muted">{track.summary}</p>
          <p className="mt-2 text-sm font-semibold">
            {user
              ? fmt(t.learn.progress, { done: String(doneIds.size), total: String(lessons.totalDocs) })
              : fmt(t.learn.sessions, { n: String(lessons.totalDocs) })}
          </p>
        </div>
        <Card>
          <ol className="divide-y divide-line">
            {lessons.docs.map((l) => {
              const unitId = typeof l.unit === 'object' ? l.unit.id : l.unit
              const unit = units.docs.find((u) => u.id === unitId)
              const live = l._status === 'published'
              return (
                <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-muted">
                      {fmt(t.learn.session, { n: String(l.order) })} · {unit?.title} · {l.competency}
                      {l.inCoreVersion && <span className="ml-2 rounded bg-paper px-1.5 py-0.5 text-xs font-semibold">{t.learn.core}</span>}
                    </p>
                    <p className="font-medium">{l.title}</p>
                  </div>
                  {doneIds.has(l.id) ? (
                    <span className="shrink-0 text-sm font-semibold text-ok">✓ {t.learn.done}</span>
                  ) : live ? (
                    <Link href={`/belajar/${track.slug}/${l.order}`} className="shrink-0 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-paper">
                      {t.learn.open}
                    </Link>
                  ) : (
                    <span className="shrink-0 text-sm text-muted">{t.learn.comingSoon}</span>
                  )}
                </li>
              )
            })}
          </ol>
        </Card>
      </div>
    </Shell>
  )
}
