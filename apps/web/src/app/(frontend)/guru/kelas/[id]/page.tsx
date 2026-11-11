import Link from 'next/link'
import { BIG_IDEAS, BIG_IDEA_LABELS } from '@ailit/shared'
import { Shell } from '../../../../../components/Shell'
import { Card } from '../../../../../components/ui'
import { AssignForm } from '../../../../../components/forms/AssignForm'
import { getDict } from '../../../../../i18n/server'
import { classOverview, inactive } from '../../../../../lib/teacher'
import { requireClassTeacher } from '../../../../../lib/teacher-guard'
import { CreateChallengeForm } from '../../../../../components/forms/ChallengeForms'
import { MakeTeams, Toggle } from '../../../../../components/forms/EngagementForms'
import { ConsentShare } from '../../../../../components/forms/ConsentShare'
import { challengeProgress } from '../../../../../lib/gamification'

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const classId = Number((await params).id)
  const { payload, user } = await requireClassTeacher(classId)
  const { locale } = await getDict()
  const id = locale === 'id'
  const { klass, rows, totalLessons, lessons } = await classOverview(payload, classId)
  const idle = inactive(rows)
  const challenges = (await payload.find({ collection: 'challenges', overrideAccess: true, depth: 0, limit: 20, sort: '-endsAt', where: { class: { equals: classId } } })).docs
  const challengeRows = await Promise.all(challenges.map(async (c) => {
    const ids = (c.participants ?? []).map((p) => (typeof p === 'object' ? p.id : p))
    const done = await Promise.all(ids.map((uid) => challengeProgress(payload, uid, c)))
    return { id: c.id, title: c.title, endsAt: c.endsAt, joined: ids.length, completed: done.filter((d) => d >= (c.target ?? 1)).length, mode: c.mode ?? 'individual', teams: (c.teams ?? []).length }
  }))
  const assignments = await payload.find({ collection: 'assignments', overrideAccess: false, user, where: { class: { equals: classId } }, depth: 1, sort: 'dueDate', limit: 50 })
  const track = typeof klass.track === 'object' ? klass.track : null
  const consentLabel = (s: string) =>
    ({ pending: id ? 'Menunggu izin' : 'Awaiting consent', declined: id ? 'Izin ditolak' : 'Consent declined', granted: id ? 'Diizinkan' : 'Granted', not_required: '—' })[s] ?? s

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{klass.academicYear} · {id ? 'Kode kelas' : 'Class code'} <span className="font-mono font-bold">{klass.joinCode}</span></p>
            <h1 className="text-3xl font-bold">{klass.name}</h1>
          </div>
          <Link href={`/guru/kelas/${classId}/ai`} className="rounded-xl border border-ink px-4 py-2 font-semibold">{id ? 'Tinjau AI Lab' : 'Review AI Lab'}</Link>
          <Link href={`/guru/kelas/${classId}/nilai`} className="rounded-xl border border-ink px-4 py-2 font-semibold">{id ? 'Nilai proyek' : 'Mark projects'}</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card><p className="text-sm text-muted">{id ? 'Siswa' : 'Students'}</p><p className="text-3xl font-bold">{rows.length}</p></Card>
          <Card><p className="text-sm text-muted">{id ? 'Tidak aktif 7 hari' : 'Inactive 7 days'}</p><p className="text-3xl font-bold">{idle.length}</p></Card>
          <Card><p className="text-sm text-muted">{id ? 'Menunggu izin orang tua' : 'Awaiting parent consent'}</p><p className="text-3xl font-bold">{rows.filter((r) => r.consentStatus === 'pending').length}</p></Card>
        </div>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Kemajuan siswa' : 'Student progress'}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-2 pr-3">{id ? 'Nama' : 'Name'}</th>
                  <th className="pr-3">{id ? 'Selesai' : 'Done'}</th>
                  {BIG_IDEAS.map((b) => <th key={b} className="pr-3">{BIG_IDEA_LABELS[b][locale]}</th>)}
                  <th className="pr-3">{id ? 'Izin' : 'Consent'}</th>
                  <th>{id ? 'Ditandai' : 'Flagged'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-3 font-medium">{r.name}</td>
                    <td className="pr-3">{r.completed}/{totalLessons}</td>
                    {BIG_IDEAS.map((b) => <td key={b} className="pr-3">{r.byBigIdea[b]}%</td>)}
                    <td className="pr-3">{consentLabel(r.consentStatus)}{r.consentStatus === 'pending' && <div className="mt-1"><ConsentShare studentId={r.id} locale={locale} /></div>}</td>
                    <td>{r.flaggedChats || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Tugas' : 'Assignments'}</h2>
          <ul className="mt-2 divide-y divide-line">
            {assignments.docs.map((a) => (
              <li key={a.id} className="flex justify-between gap-3 py-2 text-sm">
                <span>{typeof a.lesson === 'object' ? `${a.lesson.order}. ${a.lesson.title}` : a.lesson}</span>
                <span className="text-muted">{new Date(a.dueDate).toLocaleDateString(id ? 'id-ID' : 'en-GB')}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <AssignForm classId={classId} locale={locale} lessons={lessons.map((l) => ({ id: l.id, label: `${l.order}. ${l.title}` }))} />
          </div>
          {track && (
            <p className="mt-4 text-sm">
              <Link className="underline" href={`/guru/presentasi/${track.slug}/1`}>{id ? 'Buka mode presentasi untuk kelas' : 'Open presentation mode for class'}</Link> · <Link className="underline" href={`/guru/rpp/${track.slug}`}>{id ? 'Unduh rencana pembelajaran (semua sesi)' : 'Download lesson plans (all sessions)'}</Link>
            </p>
          )}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Tantangan kelas' : 'Class challenges'}</h2>
          <p className="mt-1 text-sm text-muted">{id ? 'Kemajuan setiap siswa bersifat pribadi; Anda melihat jumlah peserta dan yang sudah selesai, tanpa peringkat. Untuk tantangan tim, bagi kelas menjadi tim: yang dibandingkan adalah skor tim.' : 'Each student’s progress is private; you see how many joined and finished, with no ranking. For a team challenge, split the class into teams: only team scores are compared.'}</p>
          <ul className="mt-3 divide-y divide-line text-sm">
            {challengeRows.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="font-medium">{r.title}</span>
                <span className="text-muted">{r.mode === 'team' ? `${r.teams} ${id ? 'tim' : 'teams'} · ` : ''}{r.joined} {id ? 'ikut' : 'joined'} · {r.completed} {id ? 'selesai' : 'finished'} · {id ? 'sampai' : 'until'} {new Date(r.endsAt).toLocaleDateString(id ? 'id-ID' : 'en-GB')}</span>
                {new Date(r.endsAt) > new Date() && <span className="w-full"><MakeTeams challengeId={r.id} students={rows.length} locale={locale} />{r.mode === 'team' && <> · <Link href="/papan-skor" className="text-sm underline">{id ? 'Papan skor tim' : 'Team board'}</Link></>}</span>}
              </li>
            ))}
            {!challengeRows.length && <li className="py-2 text-muted">{id ? 'Belum ada tantangan.' : 'No challenges yet.'}</li>}
          </ul>
          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3">
            <Toggle path={`/api/classes/${classId}`} field="leaderboardOptIn" value={Boolean(klass.leaderboardOptIn)} label={id ? 'Tampilkan kelas ini di papan skor sekolah (berbasis kelas, tanpa nama siswa)' : 'Show this class on the school board (class-based, no student names)'} />
            <p className="text-sm"><Link href="/acara" className="underline">{id ? 'Acara: hackathon, pekan tantangan, demo day' : 'Events: hackathons, challenge weeks, demo days'}</Link> · <Link href={`/guru/kelas/${classId}/nilai`} className="underline">{id ? 'Kiriman proyek, galeri dan ulasan teman' : 'Project submissions, gallery and peer reviews'}</Link></p>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">{id ? 'Buat tantangan baru' : 'Create a new challenge'}</summary>
            <div className="mt-3"><CreateChallengeForm classId={classId} locale={locale} /></div>
          </details>
        </Card>
      </div>
    </Shell>
  )
}
