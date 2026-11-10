import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { RateForm, SuggestButton } from '../../../components/forms/RateForm'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { markHistory, ratingQueue } from '../../../lib/projects'
import { ADJACENT_TOLERANCE, agreement } from '../../../lib/marking'

const pct = (v: number) => `${Math.round(v * 100)}%`

/** AILIS rater queue: blind double marking of performance tasks, candidates anonymous (spec G7). */
export default async function RaterPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'rater', 'super_admin', 'assessment_author')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const canRate = hasRole(user, 'rater', 'super_admin')
  const tasks = canRate ? await ratingQueue(payload, user.id) : []
  const staff = hasRole(user, 'super_admin', 'assessment_author')
  const history = await markHistory(payload)
  const mine = agreement(history, user.id)
  const overall = agreement(history)
  const raterIds = [...new Set(history.flatMap((m) => m.map((x) => x.rater)))]
  const raters = staff && raterIds.length ? (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: raterIds.length, where: { id: { in: raterIds } } })).docs : []
  const stageLabel = {
    first: id ? 'Penilaian pertama' : 'First mark',
    second: id ? 'Penilaian kedua (buta)' : 'Second mark (blind)',
    adjudication: id ? 'Adjudikasi: dua penilai berbeda ≥2 poin' : 'Adjudication: two raters differ by 2+ points',
    single: id ? 'Penilaian tunggal' : 'Single mark',
  }
  const statBlock = (label: string, a: ReturnType<typeof agreement>) => (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <p className="text-sm font-semibold">{label}</p>
      {a.pairs ? (
        <p className="mt-1 text-sm tabular-nums">
          {a.pairs} {id ? 'pasangan' : 'pairs'} · {id ? 'sama persis' : 'exact'} {pct(a.exact)} · {id ? `selisih ≤${ADJACENT_TOLERANCE}` : `within ${ADJACENT_TOLERANCE}`} {pct(a.adjacent)} · {id ? 'rata-rata selisih' : 'mean difference'} {a.meanAbsDiff.toFixed(2)} · {a.adjudicated} {id ? 'adjudikasi' : 'adjudicated'}
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted">{id ? 'Belum ada pasangan penilaian.' : 'No marking pairs yet.'}</p>
      )}
    </div>
  )

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{id ? 'Antrean penilai AILIS' : 'AILIS rating queue'}</h1>
        <p className="text-muted">
          {id
            ? `${tasks.length} jawaban menunggu Anda. Setiap jawaban dinilai dua penilai tanpa melihat nilai satu sama lain; identitas peserta disembunyikan.`
            : `${tasks.length} answers waiting for you. Each answer is marked by two raters who cannot see each other’s scores; candidates are anonymous.`}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {statBlock(id ? 'Kesepakatan Anda dengan penilai lain' : 'Your agreement with other raters', mine)}
          {staff && statBlock(id ? 'Kesepakatan semua penilai' : 'All raters', overall)}
        </div>
        {staff && raters.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold">{id ? 'Kesepakatan per penilai' : 'Agreement by rater'}</h2>
            <table className="mt-3 w-full text-sm">
              <thead><tr className="text-left text-muted"><th>{id ? 'Penilai' : 'Rater'}</th><th className="text-right">{id ? 'Pasangan' : 'Pairs'}</th><th className="text-right">{id ? 'Sama' : 'Exact'}</th><th className="text-right">≤{ADJACENT_TOLERANCE}</th><th className="text-right">{id ? 'Selisih' : 'Diff'}</th></tr></thead>
              <tbody>{raters.map((r) => {
                const a = agreement(history, r.id)
                return <tr key={r.id} className="border-b border-line"><td className="py-1.5">{r.name}</td><td className="text-right tabular-nums">{a.pairs}</td><td className="text-right tabular-nums">{a.pairs ? pct(a.exact) : '—'}</td><td className="text-right tabular-nums">{a.pairs ? pct(a.adjacent) : '—'}</td><td className="text-right tabular-nums">{a.pairs ? a.meanAbsDiff.toFixed(2) : '—'}</td></tr>
              })}</tbody>
            </table>
            <p className="mt-2 text-xs text-muted">{id ? 'Penilai dengan kesepakatan rendah sebaiknya mengikuti kalibrasi ulang dengan contoh jawaban.' : 'Raters with low agreement should recalibrate with sample answers.'}</p>
          </Card>
        )}
        {canRate && tasks.length === 0 && <Card><p className="text-muted">{id ? 'Tidak ada yang perlu Anda nilai.' : 'Nothing for you to rate.'}</p></Card>}
        {tasks.map((t) => (
          <Card key={`${t.attemptId}-${t.item.id}`}>
            <p className="text-sm font-semibold text-brand-deep uppercase">
              {t.candidateCode} · {t.item.code} · {t.item.competency}
              <span className={`ml-2 rounded px-2 py-0.5 normal-case ${t.stage === 'adjudication' ? 'bg-danger/10 text-danger' : 'bg-paper text-ink'}`}>{stageLabel[t.stage]}</span>
            </p>
            {t.item.scenario && <p className="mt-3 text-sm text-muted whitespace-pre-line">{t.item.scenario}</p>}
            <p className="mt-2 font-medium whitespace-pre-line">{t.item.stem}</p>
            <h2 className="mt-4 text-sm font-semibold uppercase">{id ? 'Jawaban peserta' : 'Candidate answer'}</h2>
            <blockquote className="mt-1 rounded-2xl bg-paper p-4 whitespace-pre-line">{t.answer || <em className="text-muted">{id ? '(kosong)' : '(blank)'}</em>}</blockquote>
            {(t.stage === 'adjudication' || t.stage === 'single') && <div className="mt-3"><SuggestButton attemptId={t.attemptId} itemId={t.item.id} locale={locale} /></div>}
            <h2 className="mt-4 mb-2 text-sm font-semibold uppercase">{id ? 'Pilih tingkat rubrik' : 'Choose a rubric level'}</h2>
            <RateForm attemptId={t.attemptId} itemId={t.item.id} rubric={(t.item.rubric ?? []).map((r) => ({ points: r.points, descriptor: r.descriptor }))} locale={locale} />
          </Card>
        ))}
      </div>
    </Shell>
  )
}
