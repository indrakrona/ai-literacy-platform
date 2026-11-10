import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card, Notice } from '../../../components/ui'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { aiLab, consentStats, funnel, learning, loadEvents, overview, paths, retention } from '../../../lib/metrics'
import { bandDistribution, domainProfile, itemStats, type ScoredAttempt } from '../../../lib/assessment-stats'

const TABS = [
  { key: 'ringkasan', id: 'Ringkasan', en: 'Overview' },
  { key: 'perjalanan', id: 'Perjalanan pengguna', en: 'User journey' },
  { key: 'jalur', id: 'Jalur', en: 'Paths' },
  { key: 'retensi', id: 'Retensi', en: 'Retention' },
  { key: 'belajar', id: 'Pembelajaran', en: 'Learning' },
  { key: 'ailab', id: 'AI Lab', en: 'AI Lab' },
  { key: 'asesmen', id: 'Asesmen', en: 'Assessment' },
  { key: 'sekolah', id: 'Sekolah', en: 'Schools' },
] as const

const usd = (v: number) => (v > 0 && v < 0.01 ? '<$0.01' : `$${v.toFixed(2)}`)
const pct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`)

/** Platform admin analytics (spec: Analytics dashboards, P0). Super admins only. */
export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const requested = (await searchParams).tab
  const tab = TABS.find((t) => t.key === requested)?.key ?? 'ringkasan'
  const payload = await getPayloadClient()
  const events = await loadEvents(payload)

  const stat = (label: string, value: string | number, note?: string) => (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-sm text-muted">{label}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  )

  let body: React.ReactNode = null
  if (tab === 'ringkasan') {
    const o = overview(events)
    const c = await consentStats(payload)
    const max = Math.max(1, ...o.daily.map((d) => d.active))
    body = (
      <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stat(id ? 'Aktif hari ini' : 'Active today', o.dau)}
          {stat(id ? 'Aktif 7 hari' : 'Active, 7 days', o.wau)}
          {stat(id ? 'Aktif 30 hari' : 'Active, 30 days', o.mau)}
          {stat(id ? 'Pendaftar baru (7 hari)' : 'New sign-ups (7 days)', o.signups7, `${o.signups30} ${id ? 'dalam 30 hari' : 'in 30 days'}`)}
          {stat(id ? 'Izin orang tua diberikan' : 'Parent consent given', pct(c.rate), `${c.granted} ${id ? 'diberi' : 'given'} · ${c.pending} ${id ? 'menunggu' : 'waiting'} · ${c.declined} ${id ? 'ditolak' : 'declined'}`)}
          {stat(id ? 'Biaya AI hari ini' : 'AI cost today', usd(o.aiCostTodayUsd), `${o.tokensToday.toLocaleString('id-ID')} token · ${id ? 'perkiraan' : 'estimate'}`)}
        </div>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Pengguna aktif per hari (14 hari)' : 'Daily active users (14 days)'}</h2>
          <div className="mt-4 flex h-40 items-end gap-1 border-b border-line" role="img" aria-label={id ? 'Grafik pengguna aktif harian' : 'Daily active users chart'}>
            {o.daily.map((d) => (
              <div key={d.day} className="group relative flex h-full flex-1 items-end">
                <div className="w-full rounded-t bg-brand-deep" style={{ height: `${(d.active / max) * 100}%`, minHeight: d.active ? 2 : 0 }} />
                <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-ink px-2 py-0.5 text-xs whitespace-nowrap text-paper group-hover:block">
                  {d.day.slice(5)}: {d.active}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted"><span>{o.daily[0]?.day.slice(5)}</span><span>{o.daily.at(-1)?.day.slice(5)}</span></div>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-muted">{id ? 'Lihat sebagai tabel' : 'View as table'}</summary>
            <table className="mt-2 w-full max-w-sm"><tbody>{o.daily.map((d) => <tr key={d.day}><td>{d.day}</td><td className="text-right tabular-nums">{d.active}</td></tr>)}</tbody></table>
          </details>
        </Card>
      </>
    )
  } else if (tab === 'perjalanan') {
    const f = funnel(events)
    body = (
      <Card>
        <h2 className="text-lg font-semibold">{id ? 'Perjalanan pengguna (pendaftar 90 hari terakhir)' : 'User journey (sign-ups in the last 90 days)'}</h2>
        <p className="mt-1 text-sm text-muted">{id ? 'Kunjungan situs publik dihitung di Google Analytics.' : 'Public-site visits are counted in Google Analytics.'}</p>
        <ol className="mt-4 flex flex-col gap-3">
          {f.map((s, i) => (
            <li key={s.key}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="font-medium">{i + 1}. {id ? s.id : s.en}</span>
                <span className="tabular-nums"><strong>{s.count}</strong> · {pct(s.ofFirst)}{i > 0 && <span className="text-muted"> ({pct(s.ofPrev)} {id ? 'dari langkah sebelumnya' : 'of previous'})</span>}</span>
              </div>
              <div className="mt-1 h-3 rounded bg-paper"><div className="h-3 rounded bg-brand-deep" style={{ width: `${s.ofFirst * 100}%` }} title={`${s.count}`} /></div>
            </li>
          ))}
        </ol>
      </Card>
    )
  } else if (tab === 'jalur') {
    const p = paths(events)
    const list = (title: string, rows: { step: string; count: number }[]) => (
      <Card>
        <h2 className="text-lg font-semibold">{title}</h2>
        <table className="mt-3 w-full text-sm"><tbody>
          {rows.map((r) => <tr key={r.step} className="border-b border-line"><td className="py-1.5 font-mono text-xs">{r.step}</td><td className="text-right tabular-nums">{r.count}</td></tr>)}
          {!rows.length && <tr><td className="text-muted">{id ? 'Belum ada data.' : 'No data yet.'}</td></tr>}
        </tbody></table>
      </Card>
    )
    body = (
      <div className="grid gap-4 lg:grid-cols-2">
        {list(id ? 'Langkah berikutnya yang paling sering' : 'Most common next steps', p.transitions)}
        {list(id ? 'Langkah terakhir sebelum berhenti' : 'Last step before stopping', p.lastSteps)}
      </div>
    )
  } else if (tab === 'retensi') {
    const r = retention(events)
    body = (
      <Card>
        <h2 className="text-lg font-semibold">{id ? 'Retensi mingguan per kelompok pendaftar' : 'Weekly retention by sign-up cohort'}</h2>
        <p className="mt-1 text-sm text-muted">{id ? 'Persentase kelompok yang kembali aktif pada minggu ke-n setelah mendaftar.' : 'Share of each cohort active again in week n after signing up.'}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted"><th className="pr-3">{id ? 'Minggu daftar' : 'Sign-up week'}</th><th className="pr-3">{id ? 'Jumlah' : 'Size'}</th>{r[0]?.rates.map((_, i) => <th key={i} className="px-1 text-center">W{i + 1}</th>)}</tr></thead>
            <tbody>
              {r.map((row) => (
                <tr key={row.week}>
                  <td className="pr-3 py-1">{row.week}</td>
                  <td className="pr-3 tabular-nums">{row.size}</td>
                  {row.rates.map((v, i) => (
                    <td key={i} className="p-0.5">
                      <div
                        className="rounded px-1 py-1.5 text-center tabular-nums"
                        style={{ background: v === null ? 'transparent' : `rgb(194 64 26 / ${0.08 + v * 0.92})`, color: v !== null && v >= 0.5 ? '#fff' : 'var(--color-ink)' }}
                      >
                        {v === null ? '' : pct(v)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )
  } else if (tab === 'belajar') {
    const rows = learning(events)
    const ids = rows.map((r) => r.lessonId)
    const lessons = ids.length ? (await payload.find({ collection: 'lessons', locale, overrideAccess: true, depth: 0, limit: ids.length, where: { id: { in: ids } } })).docs : []
    const title = (lid: number) => lessons.find((l) => l.id === lid)?.title ?? `#${lid}`
    const hardest = rows.filter((r) => r.quizAverage !== null && r.quizzes >= 1).sort((a, b) => (a.quizAverage ?? 0) - (b.quizAverage ?? 0)).slice(0, 5)
    body = (
      <>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Pelajaran tersulit (rata-rata kuis terendah)' : 'Hardest lessons (lowest quiz average)'}</h2>
          <ul className="mt-3 text-sm">{hardest.map((r) => <li key={r.lessonId} className="flex justify-between border-b border-line py-1.5"><span>{title(r.lessonId)}</span><span className="tabular-nums">{pct(r.quizAverage)} · {r.quizzes} {id ? 'kuis' : 'quizzes'}</span></li>)}
            {!hardest.length && <li className="text-muted">{id ? 'Belum ada data kuis.' : 'No quiz data yet.'}</li>}</ul>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Penyelesaian per pelajaran' : 'Completion per lesson'}</h2>
          <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-muted"><th>{id ? 'Pelajaran' : 'Lesson'}</th><th className="text-right">{id ? 'Dibuka' : 'Opened'}</th><th className="text-right">{id ? 'Selesai' : 'Done'}</th><th className="text-right">%</th><th className="text-right">{id ? 'Kuis' : 'Quiz'}</th></tr></thead>
            <tbody>{rows.sort((a, b) => b.started - a.started).map((r) => (
              <tr key={r.lessonId} className="border-b border-line"><td className="py-1.5">{title(r.lessonId)}</td><td className="text-right tabular-nums">{r.started}</td><td className="text-right tabular-nums">{r.completed}</td><td className="text-right tabular-nums">{pct(r.completionRate)}</td><td className="text-right tabular-nums">{pct(r.quizAverage)}</td></tr>
            ))}</tbody>
          </table></div>
        </Card>
      </>
    )
  } else if (tab === 'asesmen') {
    const attempts = (await payload.find({ collection: 'test-attempts', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { status: { equals: 'scored' } } })).docs
    const scored = attempts.map((a) => ({ points: (a.points ?? {}) as Record<string, number>, report: a.report as ScoredAttempt['report'] }))
    const itemIds = [...new Set(attempts.flatMap((a) => Object.keys((a.points ?? {}) as object).map(Number)))]
    const items = itemIds.length ? (await payload.find({ collection: 'test-items', overrideAccess: true, depth: 0, limit: itemIds.length, where: { id: { in: itemIds } } })).docs : []
    const stats = itemStats(scored, items.map((it) => ({ id: it.id, code: it.code, maxPoints: it.type === 'performance_task' ? Math.max(0, ...(it.rubric ?? []).map((r) => r.points)) : 1 })))
    const bands = bandDistribution(scored)
    const maxBand = Math.max(1, ...bands)
    const profile = domainProfile(scored)
    const flagged = stats.filter((s) => s.flags.length).sort((a, b) => (a.discrimination ?? 1) - (b.discrimination ?? 1))
    const flagLabel: Record<string, string> = id
      ? { too_hard: 'terlalu sulit', too_easy: 'terlalu mudah', weak_discrimination: 'daya beda lemah', negative_discrimination: 'daya beda negatif' }
      : { too_hard: 'too hard', too_easy: 'too easy', weak_discrimination: 'weak discrimination', negative_discrimination: 'negative discrimination' }
    const domainLabel: Record<string, string> = id
      ? { understand: 'Memahami AI', use_create: 'Memakai & berkarya', evaluate: 'Mengevaluasi', protect: 'Melindungi', apply: 'Menerapkan' }
      : { understand: 'Understanding AI', use_create: 'Using & creating', evaluate: 'Evaluating', protect: 'Protecting', apply: 'Applying' }
    body = (
      <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stat(id ? 'Tes selesai dinilai' : 'Tests scored', attempts.length)}
          {stat(id ? 'Butir dianalisis' : 'Items analysed', stats.length)}
          {stat(id ? 'Butir ditandai' : 'Items flagged', flagged.length, id ? 'perlu ditinjau panel' : 'for panel review')}
          {stat(id ? 'Rata-rata skor' : 'Mean score', scored.length ? (scored.reduce((a, c) => a + (c.report?.overall ?? 0), 0) / scored.length).toFixed(0) + '%' : '—')}
        </div>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Sebaran band skor' : 'Score band distribution'}</h2>
          <div className="mt-4 flex h-36 items-end gap-2 border-b border-line" role="img" aria-label={id ? 'Grafik sebaran band' : 'Band distribution chart'}>
            {bands.map((n, b) => (
              <div key={b} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                <div className="w-full rounded-t bg-brand-deep" style={{ height: `${(n / maxBand) * 100}%`, minHeight: n ? 2 : 0 }} />
                <span className="pointer-events-none absolute -top-6 hidden rounded bg-ink px-2 py-0.5 text-xs text-paper group-hover:block">{n}</span>
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-2 text-center text-xs text-muted">{bands.map((_, b) => <span key={b} className="flex-1">{b}</span>)}</div>
          <p className="mt-2 text-xs text-muted">{id ? 'Ambang band masih sementara sampai ditetapkan panel ahli.' : 'Band thresholds are provisional until set by the expert panel.'}</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Profil rata-rata sub-skor' : 'Average sub-score profile'}</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {Object.entries(profile).map(([d, v]) => (
              <li key={d}>
                <div className="flex justify-between"><span>{domainLabel[d]}</span><span className="tabular-nums">{v.toFixed(0)}%</span></div>
                <div className="mt-1 h-2 rounded bg-paper"><div className="h-2 rounded bg-brand-deep" style={{ width: `${Math.min(100, v)}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Statistik butir' : 'Item statistics'}</h2>
          <p className="mt-1 text-sm text-muted">{id ? 'Tingkat kesulitan = rata-rata proporsi skor; daya beda = korelasi butir dengan skor total lainnya. Ditandai bila kesulitan <0,2 atau >0,9, atau daya beda <0,2 (minimal 10 peserta).' : 'Difficulty = mean proportion correct; discrimination = correlation with the rest of the score. Flagged when difficulty <0.2 or >0.9, or discrimination <0.2 (at least 10 candidates).'}</p>
          <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-muted"><th>{id ? 'Kode' : 'Code'}</th><th className="text-right">n</th><th className="text-right">{id ? 'Kesulitan' : 'Difficulty'}</th><th className="text-right">{id ? 'Daya beda' : 'Discrimination'}</th><th className="pl-4">{id ? 'Catatan' : 'Flags'}</th></tr></thead>
            <tbody>{[...flagged, ...stats.filter((s) => !s.flags.length)].map((s) => (
              <tr key={s.id} className="border-b border-line"><td className="py-1.5 font-mono text-xs">{s.code}</td><td className="text-right tabular-nums">{s.n}</td><td className="text-right tabular-nums">{s.difficulty.toFixed(2)}</td><td className="text-right tabular-nums">{s.discrimination === null ? '—' : s.discrimination.toFixed(2)}</td><td className="pl-4 text-danger">{s.flags.map((f) => flagLabel[f]).join(', ')}</td></tr>
            ))}</tbody>
          </table></div>
        </Card>
      </>
    )
  } else if (tab === 'sekolah') {
    const schools = (await payload.find({ collection: 'schools', overrideAccess: true, depth: 0, limit: 300, sort: 'name' })).docs
    const users = (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { school: { exists: true } } })).docs
    const weekAgo = Date.now() - 7 * 86400000
    const active = new Map<number, Set<string>>()
    for (const e of events) if (e.school && Date.parse(e.createdAt) >= weekAgo) {
      if (!active.has(e.school)) active.set(e.school, new Set())
      active.get(e.school)!.add(e.aid)
    }
    const lessons = new Map<number, number>()
    for (const e of events) if (e.school && e.name === 'lesson_completed') lessons.set(e.school, (lessons.get(e.school) ?? 0) + 1)
    const rows = schools.map((sc) => {
      const mine = users.filter((u) => (typeof u.school === 'object' ? u.school?.id : u.school) === sc.id)
      const students = mine.filter((u) => u.roles?.includes('student')).length
      const lic = sc.licence ?? {}
      const licActive = Boolean(lic.endsAt && new Date(lic.endsAt) > new Date())
      return {
        id: sc.id,
        name: sc.name,
        students,
        teachers: mine.filter((u) => u.roles?.includes('teacher')).length,
        pending: mine.filter((u) => u.consentStatus === 'pending').length,
        active7: active.get(sc.id)?.size ?? 0,
        lessons: lessons.get(sc.id) ?? 0,
        seats: licActive ? lic.seats ?? 0 : null,
        endsAt: licActive ? lic.endsAt : null,
      }
    })
    body = (
      <Card>
        <h2 className="text-lg font-semibold">{id ? 'Adopsi per sekolah' : 'Adoption by school'}</h2>
        <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-muted"><th>{id ? 'Sekolah' : 'School'}</th><th className="text-right">{id ? 'Siswa' : 'Students'}</th><th className="text-right">{id ? 'Aktif 7 hari' : 'Active 7d'}</th><th className="text-right">{id ? 'Guru' : 'Teachers'}</th><th className="text-right">{id ? 'Menunggu izin' : 'Awaiting consent'}</th><th className="text-right">{id ? 'Pelajaran selesai' : 'Lessons done'}</th><th className="text-right">{id ? 'Lisensi' : 'Licence'}</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-b border-line">
              <td className="py-1.5"><a className="underline" href={`/sekolah?sekolah=${r.id}`}>{r.name}</a></td>
              <td className="text-right tabular-nums">{r.students}</td>
              <td className="text-right tabular-nums">{r.active7}{r.students ? ` (${pct(r.active7 / r.students)})` : ''}</td>
              <td className="text-right tabular-nums">{r.teachers}</td>
              <td className={`text-right tabular-nums ${r.pending ? 'text-danger' : ''}`}>{r.pending}</td>
              <td className="text-right tabular-nums">{r.lessons}</td>
              <td className={`text-right tabular-nums ${r.seats !== null && r.students > r.seats ? 'text-danger' : ''}`}>{r.seats === null ? (id ? 'pilot' : 'pilot') : `${r.students}/${r.seats}`}</td>
            </tr>
          ))}</tbody>
        </table></div>
        <p className="mt-2 text-xs text-muted">{id ? '"Aktif 7 hari" dihitung dari aktivitas belajar yang tercatat. Klik nama sekolah untuk membuka Ruang Sekolah-nya.' : '"Active 7d" counts recorded learning activity. Click a school to open its school space.'}</p>
      </Card>
    )
  } else {
    const a = aiLab(events)
    const schoolIds = a.bySchool.map((s) => s.school).filter(Boolean)
    const schools = schoolIds.length ? (await payload.find({ collection: 'schools', overrideAccess: true, depth: 0, limit: schoolIds.length, where: { id: { in: schoolIds } } })).docs : []
    body = (
      <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stat(id ? 'Pesan ke AI (90 hari)' : 'AI messages (90 days)', a.messages)}
          {stat(id ? 'Rata-rata pesan per siswa' : 'Messages per student', a.perPerson.toFixed(1))}
          {stat(id ? 'Ditahan Perisai Data' : 'Safety Shield catches', a.shieldBlocks)}
          {stat(id ? 'Pesan ditandai' : 'Flagged messages', a.flagged.reduce((x, f) => x + f.count, 0), a.flagged.map((f) => `${f.category}: ${f.count}`).join(' · '))}
        </div>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Pemakaian dan biaya per sekolah' : 'Usage and cost per school'}</h2>
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-left text-muted"><th>{id ? 'Sekolah' : 'School'}</th><th className="text-right">{id ? 'Pesan' : 'Messages'}</th><th className="text-right">Token</th><th className="text-right">{id ? 'Biaya (perkiraan)' : 'Cost (est.)'}</th></tr></thead>
            <tbody>{a.bySchool.map((s) => (
              <tr key={s.school} className="border-b border-line"><td className="py-1.5">{schools.find((x) => x.id === s.school)?.name ?? (id ? 'Tanpa sekolah' : 'No school')}</td><td className="text-right tabular-nums">{s.messages}</td><td className="text-right tabular-nums">{s.tokens.toLocaleString('id-ID')}</td><td className="text-right tabular-nums">{usd(s.costUsd)}</td></tr>
            ))}</tbody>
          </table>
        </Card>
      </>
    )
  }

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">{id ? 'Admin platform' : 'Platform admin'}</p>
          <h1 className="text-3xl font-bold">{id ? 'Dasbor analitik' : 'Analytics dashboard'}</h1>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label={id ? 'Bagian dasbor' : 'Dashboard sections'}>
          {TABS.map((t) => (
            <Link key={t.key} href={`/dasbor?tab=${t.key}`} aria-current={t.key === tab ? 'page' : undefined} className={`rounded-full border px-3 py-1 text-sm ${t.key === tab ? 'border-ink bg-ink text-paper' : 'border-line bg-white'}`}>
              {id ? t.id : t.en}
            </Link>
          ))}
        </nav>
        {events.length === 0 && <Notice title={id ? 'Belum ada data' : 'No data yet'}>{id ? 'Data muncul setelah pengguna mulai memakai platform.' : 'Data appears once people start using the platform.'}</Notice>}
        {body}
        <p className="text-xs text-muted">
          {id
            ? 'Data bersifat anonim: tanpa nama, email, atau usia pasti. Biaya AI adalah perkiraan.'
            : 'Data is pseudonymous: no names, emails or exact ages. AI cost is an estimate.'}
        </p>
      </div>
    </Shell>
  )
}
