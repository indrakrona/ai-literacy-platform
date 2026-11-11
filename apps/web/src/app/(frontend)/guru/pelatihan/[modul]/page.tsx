import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../../components/Shell'
import { MarkModuleDone, PracticeCheck } from '../../../../../components/forms/TrainingForms'
import { getDict } from '../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../lib/session'
import { COURSE_MODULES, moduleByKey } from '../../../../../lib/teacher-course'
import { trainingState } from '../../../../../lib/teacher-training'

/** One module of the teacher course. */
export default async function ModulePage({ params }: { params: Promise<{ modul: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'teacher', 'school_admin', 'super_admin')) notFound()
  const m = moduleByKey((await params).modul)
  if (!m) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const s = await trainingState(await getPayloadClient(), user.id)
  const i = COURSE_MODULES.indexOf(m)
  const next = COURSE_MODULES[i + 1]
  return (
    <Shell>
      <article className="flex flex-col gap-5">
        <div>
          <Link href="/guru/pelatihan" className="text-sm underline">{id ? '← Pelatihan guru' : '← Teacher training'}</Link>
          <p className="mt-2 text-sm text-muted">{id ? `Modul ${i + 1} dari ${COURSE_MODULES.length}` : `Module ${i + 1} of ${COURSE_MODULES.length}`} · {m.minutes} {id ? 'menit' : 'min'}</p>
          <h1 className="text-3xl font-bold">{m.title[locale]}</h1>
          <p className="mt-1 text-muted">{m.summary[locale]}</p>
        </div>
        {m.sections.map((sec) => (
          <section key={sec.heading.en} className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">{sec.heading[locale]}</h2>
            {sec.paras.map((p) => <p key={p.en}>{p[locale]}</p>)}
            {sec.bullets && <ul className="list-disc space-y-1 pl-5">{sec.bullets.map((b) => <li key={b.en}>{b[locale]}</li>)}</ul>}
          </section>
        ))}
        <PracticeCheck
          questions={m.practice.map((q) => ({ prompt: q.prompt[locale], options: q.options.map((o) => o[locale]), answer: q.answer, why: q.why[locale] }))}
          labels={{ title: id ? 'Cek pemahaman' : 'Check your understanding', right: id ? 'Tepat.' : 'Correct.', wrong: id ? 'Belum tepat.' : 'Not quite.' }}
        />
        <MarkModuleDone
          module={m.key}
          done={s.done.has(m.key)}
          next={next ? `/guru/pelatihan/${next.key}` : '/guru/pelatihan'}
          labels={{ mark: id ? 'Tandai modul selesai' : 'Mark module as done', done: id ? 'Modul selesai' : 'Module done', next: next ? (id ? `Modul berikutnya: ${next.title.id}` : `Next module: ${next.title.en}`) : id ? 'Kembali ke halaman pelatihan' : 'Back to the training page' }}
        />
      </article>
    </Shell>
  )
}
