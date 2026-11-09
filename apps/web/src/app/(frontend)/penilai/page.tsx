import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { RateForm } from '../../../components/forms/RateForm'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { ratingQueue } from '../../../lib/projects'

/** AILIS rater queue: performance-task answers, shown without the candidate's name (spec G7). */
export default async function RaterPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'rater', 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const tasks = await ratingQueue(payload)
  const waiting = tasks.filter((t) => t.rated === undefined)

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{id ? 'Antrean penilai AILIS' : 'AILIS rating queue'}</h1>
        <p className="text-muted">
          {id
            ? `${waiting.length} jawaban menunggu. Identitas peserta disembunyikan; nilailah jawabannya berdasarkan rubrik.`
            : `${waiting.length} answers waiting. Candidates are anonymous; mark the answer against the rubric.`}
        </p>
        {tasks.length === 0 && <Card><p className="text-muted">{id ? 'Tidak ada yang perlu dinilai.' : 'Nothing to rate.'}</p></Card>}
        {tasks.map((t) => (
          <Card key={`${t.attemptId}-${t.item.id}`}>
            <p className="text-sm font-semibold text-brand-deep uppercase">
              {t.candidateCode} · {t.item.code} · {t.item.competency}
              {t.rated !== undefined && <span className="ml-2 rounded bg-ok/15 px-2 py-0.5 normal-case">{id ? 'Sudah dinilai' : 'Rated'}: {t.rated}</span>}
            </p>
            {t.item.scenario && <p className="mt-3 text-sm text-muted whitespace-pre-line">{t.item.scenario}</p>}
            <p className="mt-2 font-medium whitespace-pre-line">{t.item.stem}</p>
            <h2 className="mt-4 text-sm font-semibold uppercase">{id ? 'Jawaban peserta' : 'Candidate answer'}</h2>
            <blockquote className="mt-1 rounded-2xl bg-paper p-4 whitespace-pre-line">{t.answer || <em className="text-muted">{id ? '(kosong)' : '(blank)'}</em>}</blockquote>
            <h2 className="mt-4 mb-2 text-sm font-semibold uppercase">{id ? 'Pilih tingkat rubrik' : 'Choose a rubric level'}</h2>
            <RateForm attemptId={t.attemptId} itemId={t.item.id} rubric={(t.item.rubric ?? []).map((r) => ({ points: r.points, descriptor: r.descriptor }))} current={t.rated} locale={locale} />
          </Card>
        ))}
      </div>
    </Shell>
  )
}
