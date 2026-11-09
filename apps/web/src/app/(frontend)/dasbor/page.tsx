import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card, Notice } from '../../../components/ui'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { aiLab, consentStats, funnel, learning, loadEvents, overview, paths, retention } from '../../../lib/metrics'

const TABS = [
  { key: 'ringkasan', id: 'Ringkasan', en: 'Overview' },
  { key: 'perjalanan', id: 'Perjalanan pengguna', en: 'User journey' },
  { key: 'jalur', id: 'Jalur', en: 'Paths' },
  { key: 'retensi', id: 'Retensi', en: 'Retention' },
  { key: 'belajar', id: 'Pembelajaran', en: 'Learning' },
  { key: 'ailab', id: 'AI Lab', en: 'AI Lab' },
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
