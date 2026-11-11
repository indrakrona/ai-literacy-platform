import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../../components/Shell'
import { ExamForm } from '../../../../../components/forms/TrainingForms'
import { getDict } from '../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../lib/session'
import { COURSE_MODULES, EXAM, examForClient, passCount } from '../../../../../lib/teacher-course'
import { trainingState } from '../../../../../lib/teacher-training'

/** Certification exam page. The questions are sent without answers; scoring happens on the server. */
export default async function ExamPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'teacher', 'school_admin', 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const s = await trainingState(await getPayloadClient(), user.id)
  if (!s.allDone || s.retryAt || (s.cert && s.cert.status === 'valid')) redirect('/guru/pelatihan')
  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <div>
          <Link href="/guru/pelatihan" className="text-sm underline">{id ? '← Pelatihan guru' : '← Teacher training'}</Link>
          <h1 className="mt-1 text-3xl font-bold">{id ? 'Ujian sertifikasi' : 'Certification exam'}</h1>
          <p className="mt-1 text-muted">{id ? `${EXAM.length} soal pilihan ganda. Lulus dengan minimal ${passCount(EXAM.length)} jawaban benar. Tidak ada batas waktu.` : `${EXAM.length} multiple-choice questions. Pass with at least ${passCount(EXAM.length)} correct. No time limit.`}</p>
        </div>
        <ExamForm questions={examForClient(locale)} moduleTitles={Object.fromEntries(COURSE_MODULES.map((m) => [m.key, m.title[locale]]))} locale={locale} />
      </div>
    </Shell>
  )
}
