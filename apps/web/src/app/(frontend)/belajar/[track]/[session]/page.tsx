import Link from 'next/link'
import { TrackOnMount } from '../../../../../components/Track'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { Shell } from '../../../../../components/Shell'
import { Card, Notice } from '../../../../../components/ui'
import { CompleteButton } from '../../../../../components/forms/CompleteButton'
import { QuizBlock } from '../../../../../components/QuizBlock'
import { Simulator } from '../../../../../simulators/Simulator'
import { fmt } from '../../../../../i18n/dict'
import { getDict } from '../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../lib/session'

export default async function LessonPage({ params }: { params: Promise<{ track: string; session: string }> }) {
  const { track: slug, session } = await params
  const n = Number(session)
  if (!Number.isInteger(n)) notFound()
  const { t, locale } = await getDict()
  const payload = await getPayloadClient()
  const user = await getCurrentUser()
  const track = (await payload.find({ collection: 'tracks', locale, where: { slug: { equals: slug } }, limit: 1 })).docs[0]
  if (!track) notFound()
  const units = await payload.find({ collection: 'units', locale, where: { track: { equals: track.id } }, limit: 10, depth: 0 })
  const lesson = (
    await payload.find({
      collection: 'lessons',
      locale,
      overrideAccess: false,
      user,
      draft: Boolean(user?.roles?.includes('content_editor') || user?.roles?.includes('super_admin')),
      where: { and: [{ unit: { in: units.docs.map((u) => u.id) } }, { order: { equals: n } }] },
      limit: 1,
    })
  ).docs[0]

  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <Link href={`/belajar/${slug}`} className="text-sm font-semibold underline">← {t.learn.back}</Link>
        {!lesson ? (
          <Notice tone="warn" title={t.learn.notPublished} />
        ) : (
          <Card>
            <p className="text-sm text-muted">
              {fmt(t.learn.session, { n: String(lesson.order) })} · {t.learn.canDo} {lesson.competency}
              {lesson.estimatedMinutes ? ` · ${fmt(t.learn.minutes, { n: String(lesson.estimatedMinutes) })}` : ''}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{lesson.title}</h1>
            {lesson.objective && (
              <section className="mt-4">
                <h2 className="font-semibold">{t.learn.objective}</h2>
                <p className="mt-1 text-muted">{lesson.objective}</p>
              </section>
            )}
            {lesson.content && (
              <div className="prose mt-4 max-w-none">
                <RichText data={lesson.content} />
              </div>
            )}
            {lesson.activity && (
              <section className="mt-4 rounded-2xl bg-paper p-4">
                <h2 className="font-semibold">{t.learn.activity}</h2>
                <p className="mt-1 text-muted">{lesson.activity}</p>
              </section>
            )}
          </Card>
        )}
        {lesson && user && <TrackOnMount name="lesson_started" props={{ lessonId: lesson.id }} track={track.slug} />}
        {lesson?.simulator && <Simulator name={lesson.simulator} locale={locale} />}
        {lesson?.aiActivity && typeof lesson.aiActivity === 'object' && (
          <Link href={`/lab/${lesson.aiActivity.slug}`} className="rounded-xl bg-ink px-5 py-3.5 text-center font-semibold text-paper">
            {locale === 'id' ? 'Buka AI Lab' : 'Open the AI Lab'} · {lesson.aiActivity.title}
          </Link>
        )}
        {lesson?.projectBrief && typeof lesson.projectBrief === 'object' && (
          <Link href={`/proyek/${lesson.projectBrief.slug}`} className="rounded-xl bg-ink px-5 py-3.5 text-center font-semibold text-paper">
            {locale === 'id' ? 'Buka brief proyek' : 'Open the project brief'} · {lesson.projectBrief.title}
          </Link>
        )}
        {lesson?.type === 'project' && track.level !== 'smp' && (
          <Link href="/proyek?jenjang=sma_smk" className="text-center text-sm underline">
            {locale === 'id' ? 'Siswa SMK: pilih proyek sesuai jurusanmu' : 'SMK students: choose a project for your major'}
          </Link>
        )}
        {lesson?.quiz && lesson.quiz.length > 0 && (
          <QuizBlock
            lessonId={lesson.id}
            track={track.slug}
            questions={lesson.quiz}
            labels={{ title: t.learn.quizTitle, correct: t.learn.quizCorrect, wrong: t.learn.quizWrong, score: t.learn.quizScore }}
          />
        )}
        {lesson && lesson._status === 'published' && (
          user ? (
            <CompleteButton
              lessonId={lesson.id}
              done={Boolean(
                (
                  await payload.find({
                    collection: 'lesson-progress',
                    overrideAccess: false,
                    user,
                    where: { and: [{ lesson: { equals: lesson.id } }, { status: { equals: 'completed' } }] },
                    limit: 1,
                  })
                ).docs[0],
              )}
              labels={{ markDone: t.learn.markDone, done: t.learn.done }}
            />
          ) : (
            <Notice>{t.learn.signInToSave}</Notice>
          )
        )}
      </div>
    </Shell>
  )
}
