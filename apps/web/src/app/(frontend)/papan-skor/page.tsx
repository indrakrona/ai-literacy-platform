import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Card, Notice } from '../../../components/ui'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { schoolBoard, teamOf, teamScores, type Team } from '../../../lib/engagement'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

/** Team boards (spec E3–E4): team challenge standings in my classes, and opted-in classes across my school. */
export default async function Boards() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const classes = (await payload.find({ collection: 'classes', overrideAccess: true, depth: 0, limit: 20, where: { or: [{ students: { contains: user.id } }, { teachers: { contains: user.id } }] } })).docs
  const now = new Date().toISOString()
  const challenges = classes.length
    ? (await payload.find({ collection: 'challenges', overrideAccess: true, depth: 0, limit: 20, sort: '-endsAt', where: { and: [{ class: { in: classes.map((c) => c.id) } }, { mode: { equals: 'team' } }, { endsAt: { greater_than: new Date(Date.now() - 14 * 86_400_000).toISOString() } }] } })).docs
    : []
  const standings = await Promise.all(challenges.map((c) => teamScores(payload, c as never)))
  const schoolId = idOf(user.school) ?? idOf(classes[0]?.school)
  const board = schoolId ? await schoolBoard(payload, schoolId) : []
  const memberIds = [...new Set(challenges.flatMap((c) => ((c.teams ?? []) as Team[]).flatMap((t) => (t.members ?? []).map(idOf))))].filter(Boolean) as number[]
  const people = new Map((memberIds.length ? (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: memberIds.length, where: { id: { in: memberIds } } })).docs : []).map((u) => [u.id, u]))
  const nameOf = (m: number) => {
    const p = people.get(m)
    if (!p) return ''
    return p.hideNameOnBoards ? (id ? 'Anggota' : 'Member') : (p.name.split(' ')[0] ?? p.name)
  }

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-bold">{id ? 'Papan skor tim' : 'Team boards'}</h1>
          <p className="mt-1 text-muted">{id ? 'Yang diperingkat adalah tim dan kelas, bukan siswa perorangan. Skor tim = rata-rata pelajaran yang diselesaikan per anggota selama tantangan.' : 'Teams and classes are ranked, never individual students. Team score = average lessons completed per member during the challenge.'}</p>
        </div>
        {challenges.length === 0 && <Notice title={id ? 'Belum ada tantangan tim di kelasmu' : 'No team challenges in your classes yet'}>{id ? 'Guru dapat membuat tantangan tim di halaman kelas.' : 'Teachers can start one on the class page.'}</Notice>}
        {challenges.map((c, i) => {
          const mine = teamOf(c.teams as Team[], user.id)
          const ended = new Date(c.endsAt) < new Date(now)
          return (
            <Card key={c.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">{c.title}</h2>
                <p className="text-sm text-muted">{ended ? (id ? 'Selesai' : 'Finished') : `${id ? 'sampai' : 'until'} ${new Date(c.endsAt).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short' })}`} · {id ? 'target' : 'target'} {c.target}</p>
              </div>
              {mine && <p className="mt-1 text-sm">{id ? 'Timmu' : 'Your team'}: <strong>{mine.name}</strong> — {(mine.members ?? []).map((m) => nameOf(idOf(m)!)).join(', ')}</p>}
              <ol className="mt-3 flex flex-col gap-2">
                {standings[i]!.map((t, r) => (
                  <li key={t.name} className={`flex items-center gap-3 rounded-xl border p-2.5 ${mine?.name === t.name ? 'border-ink' : 'border-line'}`}>
                    <span className="w-6 text-center font-bold tabular-nums">{r + 1}</span>
                    <span className="flex-1 font-medium">{t.name} <span className="text-sm text-muted">· {t.members} {id ? 'anggota' : 'members'}</span></span>
                    <span className="h-2 w-24 overflow-hidden rounded-full bg-line" aria-hidden><span className="block h-full rounded-full bg-brand-deep" style={{ width: `${Math.min(100, (t.average / Math.max(1, c.target ?? 1)) * 100)}%` }} /></span>
                    <span className="w-12 text-right tabular-nums">{t.average}</span>
                    {t.reachedTarget && <span aria-label={id ? 'target tercapai' : 'target reached'}>✓</span>}
                  </li>
                ))}
              </ol>
            </Card>
          )
        })}
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Kelas di sekolahmu (30 hari terakhir)' : 'Classes at your school (last 30 days)'}</h2>
          {board.length === 0 ? (
            <p className="mt-1 text-sm text-muted">{id ? 'Belum ada kelas yang ikut papan skor sekolah. Guru dapat mengaktifkannya di halaman kelas.' : 'No class has joined the school board yet. Teachers can turn it on from the class page.'}</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2">
              {board.map((r, i) => (
                <li key={r.classId} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                  <span className="w-6 text-center font-bold tabular-nums">{i + 1}</span>
                  <span className="flex-1 font-medium">{r.name} <span className="text-sm text-muted">· {r.students} {id ? 'siswa' : 'students'}</span></span>
                  <span className="tabular-nums">{r.xpPerStudent} XP/{id ? 'siswa' : 'student'}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <p className="text-sm"><Link href="/acara" className="underline">{id ? 'Lihat acara dan musim tantangan →' : 'See events and challenge seasons →'}</Link></p>
      </div>
    </Shell>
  )
}
