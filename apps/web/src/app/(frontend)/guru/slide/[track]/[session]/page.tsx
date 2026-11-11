import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { RevealAnswer, SlideDeck } from '../../../../../../components/SlideDeck'
import { Simulator } from '../../../../../../simulators/Simulator'
import { getDict } from '../../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../../lib/session'
import { loadSession, minutesIn, REFLECTION_PROMPTS, splitSections } from '../../../../../../lib/teaching-materials'

/** Slide deck for one session, generated from the lesson content (spec H3). */
export default async function SlidesPage({ params }: { params: Promise<{ track: string; session: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'teacher', 'school_admin', 'content_editor', 'content_reviewer', 'super_admin')) notFound()
  const { track: slug, session } = await params
  const { locale } = await getDict()
  const id = locale === 'id'
  const found = await loadSession(await getPayloadClient(), slug, Number(session), locale)
  if (!found) notFound()
  const { track, lesson, total } = found
  const n = lesson.order
  const ai = lesson.aiActivity && typeof lesson.aiActivity === 'object' ? lesson.aiActivity : null
  const brief = lesson.projectBrief && typeof lesson.projectBrief === 'object' ? lesson.projectBrief : null
  const kicker = (t: string) => <p className="text-lg font-semibold tracking-wide text-brand-deep uppercase">{t}</p>

  return (
    <main className="flex h-dvh flex-col text-xl print:block print:h-auto">
      <style>{'@media print { @page { size: A4 landscape; margin: 1cm } }'}</style>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2 text-sm print:hidden">
        <span className="flex gap-4">
          <Link className="underline" href={`/guru/rpp/${slug}/${n}`}>{id ? 'Rencana pembelajaran' : 'Lesson plan'}</Link>
          <Link className="underline" href={`/guru/lkpd/${slug}/${n}`}>{id ? 'Lembar kerja' : 'Worksheet'}</Link>
          <Link className="underline" href={`/guru/presentasi/${slug}/${n}`}>{id ? 'Kelas Langsung' : 'Live Class'}</Link>
        </span>
        <span className="flex gap-4">
          {n > 1 && <Link className="underline" href={`/guru/slide/${slug}/${n - 1}`}>← {id ? 'Sesi' : 'Session'} {n - 1}</Link>}
          {n < total && <Link className="underline" href={`/guru/slide/${slug}/${n + 1}`}>{id ? 'Sesi' : 'Session'} {n + 1} →</Link>}
        </span>
      </div>
      <SlideDeck labels={{ prev: id ? 'Sebelumnya' : 'Previous', next: id ? 'Berikutnya' : 'Next', full: id ? 'Layar penuh' : 'Full screen', slide: id ? 'Slide' : 'Slide' }}>
        <div className="flex flex-col gap-4">
          {kicker(track.title)}
          <h1 className="text-5xl font-bold sm:text-6xl">{id ? 'Sesi' : 'Session'} {n}: {lesson.title}</h1>
          <p className="text-2xl text-muted">{lesson.estimatedMinutes ?? 80} {id ? 'menit' : 'minutes'} · {lesson.competency}</p>
        </div>
        {lesson.objective && (
          <div className="flex flex-col gap-4">
            {kicker(id ? 'Tujuan hari ini' : 'Today’s goal')}
            <p className="text-4xl leading-snug font-semibold">{lesson.objective}</p>
          </div>
        )}
        {splitSections(lesson.content).map((s, k) => {
          const mins = minutesIn(s.heading)
          return (
            <div key={`s${k}`} className="flex flex-col gap-4">
              {s.heading && <h2 className="text-4xl font-bold">{s.heading.replace(/\s*\(\d+\s*(menit|minutes?|min)\)/i, '')}{mins ? <span className="ml-3 rounded-full bg-line px-3 py-1 align-middle text-lg font-medium">{mins} {id ? 'menit' : 'min'}</span> : null}</h2>}
              <div className="prose prose-2xl max-w-none"><RichText data={s.body as never} /></div>
            </div>
          )
        })}
        {lesson.simulator && (
          <div className="flex flex-col gap-4">
            {kicker(id ? 'Aktivitas interaktif' : 'Interactive activity')}
            <Simulator name={lesson.simulator} locale={locale} />
          </div>
        )}
        {ai && (
          <div className="flex flex-col gap-4">
            {kicker('AI Lab')}
            <h2 className="text-4xl font-bold">{ai.title}</h2>
            {ai.goal && <p className="text-2xl">{ai.goal}</p>}
            <p className="text-xl text-muted">{id ? 'Buka AI Lab di perangkat siswa. Ingat: jangan menulis data pribadi.' : 'Open the AI Lab on student devices. Remember: never type personal data.'}</p>
          </div>
        )}
        {brief && (
          <div className="flex flex-col gap-4">
            {kicker(id ? 'Proyek' : 'Project')}
            <h2 className="text-4xl font-bold">{brief.title}</h2>
            {brief.client && <p className="text-2xl text-muted">{id ? 'Pemilik masalah' : 'Problem owner'}: {brief.client}</p>}
            <p className="text-2xl">{brief.problem}</p>
          </div>
        )}
        {(lesson.quiz ?? []).map((q, k) => (
          <div key={`q${k}`} className="flex flex-col gap-5">
            {kicker(`${id ? 'Cek pemahaman' : 'Check'} ${k + 1}/${lesson.quiz!.length}`)}
            <h2 className="text-4xl font-bold">{q.prompt}</h2>
            <RevealAnswer options={(q.options ?? []).map((o) => ({ text: o.text, correct: Boolean(o.correct) }))} explanation={q.explanation} label={id ? 'Tampilkan jawaban' : 'Show answer'} />
          </div>
        ))}
        <div className="flex flex-col gap-5">
          {kicker(id ? 'Refleksi' : 'Reflection')}
          <ol className="list-decimal space-y-4 pl-8 text-3xl">
            {REFLECTION_PROMPTS[locale].map((p) => <li key={p}>{p}</li>)}
          </ol>
          <p className="text-xl text-muted">{id ? 'Jangan lupa tandai sesi ini selesai di platform.' : 'Remember to mark this session as done on the platform.'}</p>
        </div>
      </SlideDeck>
    </main>
  )
}
