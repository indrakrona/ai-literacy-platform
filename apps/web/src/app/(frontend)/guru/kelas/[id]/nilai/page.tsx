import Link from 'next/link'
import { Shell } from '../../../../../../components/Shell'
import { Card } from '../../../../../../components/ui'
import { GradeForm } from '../../../../../../components/forms/GradeForm'
import { getDict } from '../../../../../../i18n/server'
import { requireClassTeacher } from '../../../../../../lib/teacher-guard'
import { gradingQueue, idOf, rubricTotal } from '../../../../../../lib/projects'

/** Teacher's marking queue for project submissions (spec H6). */
export default async function GradingQueuePage({ params }: { params: Promise<{ id: string }> }) {
  const classId = Number((await params).id)
  const { payload, klass } = await requireClassTeacher(classId)
  const { locale } = await getDict()
  const id = locale === 'id'
  const { pending, graded } = await gradingQueue(payload, classId)
  const briefIds = [...new Set([...pending, ...graded].map((s) => idOf(s.brief)))]
  const briefs = briefIds.length
    ? (await payload.find({ collection: 'project-briefs', locale, overrideAccess: true, depth: 0, limit: briefIds.length, where: { id: { in: briefIds } } })).docs
    : []
  const briefOf = (s: (typeof pending)[number]) => briefs.find((b) => b.id === idOf(s.brief))
  const names = (s: (typeof pending)[number]) => (s.members ?? []).map((m) => (typeof m === 'object' ? m.name : `#${m}`)).join(', ')
  const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{id ? 'Penilaian proyek' : 'Project marking'} · {klass.name}</h1>
        <p className="text-muted">{id ? `${pending.length} menunggu dinilai · ${graded.length} sudah dinilai` : `${pending.length} waiting · ${graded.length} marked`}</p>
        {pending.length === 0 && <Card><p className="text-muted">{id ? 'Tidak ada kiriman yang menunggu.' : 'Nothing waiting to be marked.'}</p></Card>}
        {pending.map((s) => {
          const brief = briefOf(s)
          return (
            <Card key={s.id}>
              <p className="text-sm font-semibold text-brand-deep uppercase">{brief?.title}</p>
              <h2 className="mt-1 text-lg font-semibold">{names(s)}</h2>
              <p className="text-sm text-muted">{id ? 'Dikirim' : 'Sent'} {date(s.submittedAt)} · <a className="underline" href={`/proyek/kiriman/${s.id}`}>{id ? 'ulasan teman' : 'peer reviews'}</a></p>
              <p className="mt-3 whitespace-pre-line">{s.text}</p>
              {(s.links ?? []).length > 0 && (
                <ul className="mt-2 text-sm">
                  {(s.links ?? []).map((l, i) => <li key={i}><a className="break-all underline" href={l.url} target="_blank" rel="noopener noreferrer nofollow">{l.url}</a></li>)}
                </ul>
              )}
              <div className="mt-5 border-t border-line pt-5">
                <GradeForm submissionId={s.id} rubric={(brief?.rubric ?? []).map((r) => ({ criterion: r.criterion, description: r.description }))} locale={locale} />
              </div>
            </Card>
          )
        })}
        {graded.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold">{id ? 'Sudah dinilai' : 'Marked'}</h2>
            <ul className="mt-3 divide-y divide-line">
              {graded.map((s) => {
                const t = rubricTotal(s.scores)
                return (
                  <li key={s.id} className="py-3">
                    <details>
                      <summary className="cursor-pointer">
                        <span className="font-medium">{names(s)}</span> · {briefOf(s)?.title} · <span className="font-semibold">{t ? `${t.total}/${t.max}` : ''}</span>
                        {s.showcase === 'published' ? ' · 🖼' : s.showcase === 'nominated' ? (id ? ' · dipilih untuk galeri' : ' · nominated') : ''}
                      </summary>
                      <p className="mt-2 text-sm"><a className="underline" href={`/proyek/kiriman/${s.id}`}>{id ? 'Ulasan teman dan galeri' : 'Peer reviews and gallery'}</a></p>
                      <div className="mt-3">
                        <p className="mb-3 text-sm text-muted">{id ? 'Ubah nilai bila perlu:' : 'Change the marks if needed:'}</p>
                        <GradeForm
                          submissionId={s.id}
                          rubric={(briefOf(s)?.rubric ?? []).map((r) => ({ criterion: r.criterion, description: r.description }))}
                          initial={{ scores: (s.scores as number[]) ?? [], feedback: s.feedback ?? '' }}
                          locale={locale}
                        />
                      </div>
                    </details>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
        <Link className="underline" href={`/guru/kelas/${classId}`}>{id ? 'Kembali ke kelas' : 'Back to class'}</Link>
      </div>
    </Shell>
  )
}
