import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasFullAccess, hasRole } from '@ailit/shared'
import { Shell } from '../../../../components/Shell'
import { Card, Notice } from '../../../../components/ui'
import { SubmitProjectForm } from '../../../../components/forms/SubmitProjectForm'
import { ReportButton } from '../../../../components/ReportButton'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../lib/session'
import { rubricTotal } from '../../../../lib/projects'
import { SMK_MAJORS } from '../../../../collections/ProjectBriefs'

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { slug } = await params
  const { t, locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const brief = (await payload.find({ collection: 'project-briefs', locale, where: { slug: { equals: slug } }, limit: 1, user, overrideAccess: false })).docs[0]
  if (!brief) notFound()
  const isStudent = hasRole(user, 'student')
  const classes = isStudent
    ? (await payload.find({ collection: 'classes', overrideAccess: true, depth: 0, limit: 20, where: { students: { contains: user.id } } })).docs
    : []
  const mine = isStudent
    ? (await payload.find({ collection: 'submissions', overrideAccess: false, user, depth: 1, limit: 5, where: { brief: { equals: brief.id } }, sort: '-updatedAt' })).docs
    : []
  const sub = mine[0]
  const total = sub?.status === 'graded' ? rubricTotal(sub.scores) : null
  const major = SMK_MAJORS.find((m) => m.value === brief.smkMajor)

  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <Card>
          <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">
            {id ? 'Proyek' : 'Project'} · {brief.competency}{major ? ` · SMK ${major.label}` : ''}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{brief.title}</h1>
          {brief.client && <p className="mt-1 text-muted">{id ? 'Pemilik masalah' : 'Brief owner'}: {brief.client}</p>}
          <h2 className="mt-5 font-semibold">{id ? 'Masalahnya' : 'The problem'}</h2>
          <p className="mt-1 whitespace-pre-line">{brief.problem}</p>
          <h2 className="mt-5 font-semibold">{id ? 'Yang perlu kamu serahkan' : 'What to hand in'}</h2>
          <p className="mt-1 whitespace-pre-line">{brief.deliverables}</p>
          <p className="mt-3 text-sm text-muted">{brief.allowTeams ? (id ? 'Boleh dikerjakan berkelompok (maksimal 4 orang).' : 'Teams of up to 4 are allowed.') : (id ? 'Dikerjakan sendiri.' : 'Individual work.')}</p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Cara penilaian' : 'How it is marked'}</h2>
          <p className="mt-1 text-sm text-muted">{id ? 'Setiap kriteria dinilai 1 (mulai) sampai 4 (mahir).' : 'Each criterion is scored 1 (beginning) to 4 (advanced).'}</p>
          <ol className="mt-3 flex flex-col gap-3">
            {(brief.rubric ?? []).map((r, i) => (
              <li key={i}>
                <p className="font-medium">{i + 1}. {r.criterion}{total && Array.isArray(sub?.scores) ? ` — ${(sub.scores as number[])[i]}/4` : ''}</p>
                {r.description && <p className="text-sm text-muted">{id ? 'Nilai 4' : 'Level 4'}: {r.description}</p>}
              </li>
            ))}
          </ol>
        </Card>

        {sub?.status === 'graded' && total && (
          <Notice tone="ok" title={`${id ? 'Nilai' : 'Mark'}: ${total.total}/${total.max}`}>
            {sub.feedback || (id ? 'Gurumu belum menulis umpan balik.' : 'No written feedback yet.')}
          </Notice>
        )}

        {isStudent && !hasFullAccess(user) && <Notice tone="warn" title={t.home.pendingTitle}>{t.home.pendingBody}</Notice>}
        {isStudent && hasFullAccess(user) && classes.length === 0 && (
          <Notice tone="warn" title={id ? 'Belum bergabung dengan kelas' : 'Not in a class yet'}>
            <Link className="underline" href="/gabung">{id ? 'Gabung ke kelas dengan kode dari gurumu' : 'Join a class with the code from your teacher'}</Link>
          </Notice>
        )}
        {isStudent && hasFullAccess(user) && classes.length > 0 && sub?.status !== 'graded' && (
          <Card>
            <h2 className="mb-1 text-lg font-semibold">{sub ? (id ? 'Perbarui kirimanmu' : 'Update your submission') : (id ? 'Kirim proyekmu' : 'Send your project')}</h2>
            {sub && <p className="mb-4 text-sm text-muted">{id ? 'Sudah dikirim. Kamu masih bisa memperbaikinya sampai dinilai.' : 'Sent. You can still improve it until it is marked.'}</p>}
            <SubmitProjectForm
              briefId={brief.id}
              classes={classes.map((c) => ({ id: c.id, name: c.name }))}
              allowTeams={Boolean(brief.allowTeams)}
              initial={sub ? { classId: typeof sub.class === 'object' ? sub.class.id : sub.class, text: sub.text, links: (sub.links ?? []).map((l) => l.url) } : undefined}
              locale={locale}
            />
          </Card>
        )}
        <ReportButton targetType="project_brief" targetId={brief.id} locale={locale} />
        <Link href="/proyek" className="text-center underline">{id ? 'Semua proyek' : 'All projects'}</Link>
      </div>
    </Shell>
  )
}
