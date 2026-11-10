import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { BIG_IDEAS, BIG_IDEA_LABELS, hasRole, SCORE_DOMAINS, SCORE_DOMAIN_LABELS } from '@ailit/shared'
import { Shell } from '../../../../components/Shell'
import { Card, Notice } from '../../../../components/ui'
import { PrintButton } from '../../../../components/forms/DataRightsForms'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../lib/session'
import { reportCsv, schoolReport, type GroupStats } from '../../../../lib/school-report'
import { KKA_ELEMENTS } from '../../../../collections/KkaOutcomes'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

/** School report (spec I3): by grade, class and big idea, with KKA learning-outcome coverage. Aggregates only. */
export default async function SchoolReportPage({ searchParams }: { searchParams: Promise<{ sekolah?: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'school_admin', 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const requested = Number((await searchParams).sekolah) || undefined
  const schoolId = hasRole(user, 'super_admin') ? (requested ?? idOf(user.school)) : idOf(user.school)
  if (!schoolId) return <Shell><Notice tone="warn" title={id ? 'Akun belum terhubung ke sekolah' : 'Account not linked to a school'} /></Shell>
  const school = await payload.findByID({ collection: 'schools', id: schoolId, depth: 0, overrideAccess: true })
  const r = await schoolReport(payload, schoolId, locale)
  const csv = `data:text/csv;charset=utf-8,${encodeURIComponent(reportCsv([r.school, ...r.byGrade, ...r.byClass], locale))}`
  const elementName = (v: string) => KKA_ELEMENTS.find((e) => e.value === v)?.[locale] ?? v

  const bar = (value: number | null) => (
    <span className="flex items-center gap-2">
      <span className="h-2 w-16 overflow-hidden rounded-full bg-line" aria-hidden>
        <span className="block h-full rounded-full bg-brand-deep" style={{ width: `${value ?? 0}%` }} />
      </span>
      <span className="tabular-nums">{value === null ? '—' : `${value}%`}</span>
    </span>
  )

  const table = (rows: GroupStats[], first: string) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted">
            <th className="py-1.5 pr-3 font-medium">{first}</th>
            <th className="py-1.5 pr-3 font-medium">{id ? 'Siswa' : 'Students'}</th>
            <th className="py-1.5 pr-3 font-medium">{id ? 'Aktif 30 hr' : 'Active 30d'}</th>
            <th className="py-1.5 pr-3 font-medium">{id ? 'Penyelesaian' : 'Completion'}</th>
            {BIG_IDEAS.map((b) => <th key={b} className="py-1.5 pr-3 font-medium">{BIG_IDEA_LABELS[b][locale]}</th>)}
            <th className="py-1.5 pr-3 font-medium">{id ? 'Proyek' : 'Projects'}</th>
            <th className="py-1.5 pr-3 font-medium">AILIS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.key} className="border-t border-line">
              <td className="py-2 pr-3 font-medium whitespace-nowrap">{g.label}</td>
              <td className="py-2 pr-3 tabular-nums">{g.students}</td>
              <td className="py-2 pr-3 tabular-nums">{g.active30}</td>
              <td className="py-2 pr-3">{bar(g.completion)}</td>
              {BIG_IDEAS.map((b) => <td key={b} className="py-2 pr-3 tabular-nums">{g.byBigIdea[b]}%</td>)}
              <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{g.projectsGraded ? `${g.projectsGraded} · ${g.projectAvg}%` : '—'}</td>
              <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{g.tested ? `${g.tested} · band ${g.bandAvg}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const s = r.school
  const stat = (value: string | number, label: string) => (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  )

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link href="/sekolah" className="text-sm underline print:hidden">{id ? '← Ruang Sekolah' : '← School space'}</Link>
            <h1 className="mt-1 text-3xl font-bold">{id ? 'Laporan sekolah' : 'School report'}</h1>
            <p className="text-muted">
              {school.name} · {new Date(r.generatedAt).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })}
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <a href={csv} download={`laporan-${school.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`} className="rounded-xl bg-ink px-4 py-2.5 font-semibold text-paper">{id ? 'Unduh CSV' : 'Download CSV'}</a>
            <PrintButton label={id ? 'Cetak / PDF' : 'Print / PDF'} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stat(s.students, id ? 'Siswa' : 'Students')}
          {stat(`${s.completion}%`, id ? 'Rata-rata penyelesaian' : 'Average completion')}
          {stat(s.active30, id ? 'Aktif 30 hari terakhir' : 'Active in the last 30 days')}
          {stat(s.tested ? `${s.bandAvg}` : '—', id ? `Rata-rata band AILIS (${s.tested} siswa)` : `Average AILIS band (${s.tested} students)`)}
        </div>

        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Per gagasan besar' : 'By big idea'}</h2>
          <p className="mt-1 text-sm text-muted">{id ? 'Rata-rata persentase pelajaran yang diselesaikan siswa di tiap gagasan besar.' : 'Average share of lessons students completed in each big idea.'}</p>
          <ul className="mt-4 flex flex-col gap-3">
            {BIG_IDEAS.map((b) => (
              <li key={b}>
                <div className="flex justify-between text-sm font-medium"><span>{BIG_IDEA_LABELS[b][locale]}</span><span className="tabular-nums">{s.byBigIdea[b]}%</span></div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-line" aria-hidden><div className="h-full rounded-full bg-brand-deep" style={{ width: `${s.byBigIdea[b]}%` }} /></div>
              </li>
            ))}
          </ul>
          {s.tested > 0 && (
            <>
              <h3 className="mt-6 font-semibold">{id ? 'Skor AILIS per domain (rata-rata)' : 'AILIS scores by domain (average)'}</h3>
              <dl className="mt-2 grid grid-cols-1 gap-x-6 text-sm sm:grid-cols-2">
                {SCORE_DOMAINS.map((d) => (
                  <div key={d} className="flex justify-between border-b border-line py-1.5"><dt>{SCORE_DOMAIN_LABELS[d][locale]}</dt><dd className="font-semibold tabular-nums">{s.domains[d] ?? '—'}%</dd></div>
                ))}
              </dl>
            </>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">{id ? 'Per tingkat kelas' : 'By grade'}</h2>
          {table(r.byGrade, id ? 'Tingkat' : 'Grade')}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-semibold">{id ? 'Per kelas' : 'By class'}</h2>
          {r.byClass.length ? table(r.byClass, id ? 'Kelas' : 'Class') : <p className="text-sm text-muted">{id ? 'Belum ada kelas.' : 'No classes yet.'}</p>}
          <p className="mt-3 text-xs text-muted">
            {id
              ? 'Tingkat diambil dari pengaturan kelas, atau dari nama kelas (mis. 8B, XI IPA 2). Proyek: jumlah dinilai · rata-rata nilai. AILIS: jumlah ikut tes · rata-rata band.'
              : 'Grade comes from the class setting, or the class name (e.g. 8B, XI IPA 2). Projects: number marked · average mark. AILIS: number tested · average band.'}
          </p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Capaian pembelajaran KKA' : 'KKA learning outcomes'}</h2>
          <p className="mt-1 text-sm text-muted">
            {id
              ? 'Mata pelajaran Koding dan Kecerdasan Artifisial: capaian yang dicakup program ini, dan persentase siswa yang sudah menyelesaikan minimal satu pelajaran terkait.'
              : 'Koding dan Kecerdasan Artifisial (KKA): which outcomes this programme covers, and the share of students who completed at least one related lesson.'}
          </p>
          {r.kkaDraft && (
            <div className="mt-3">
              <Notice tone="warn" title={id ? 'Pemetaan masih draf' : 'Mapping is a draft'}>
                {id ? 'Pemetaan ke capaian KKA belum diperiksa oleh guru KKA. Gunakan sebagai gambaran, bukan laporan resmi.' : 'The mapping to KKA outcomes has not yet been checked by a KKA teacher. Use it as a guide, not an official report.'}
              </Notice>
            </div>
          )}
          {r.kka.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{id ? 'Belum ada kelas dengan jalur belajar.' : 'No classes with a learning track yet.'}</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="py-1.5 pr-3 font-medium">{id ? 'Kode' : 'Code'}</th>
                    <th className="py-1.5 pr-3 font-medium">{id ? 'Capaian' : 'Outcome'}</th>
                    <th className="py-1.5 pr-3 font-medium">{id ? 'Pelajaran' : 'Lessons'}</th>
                    <th className="py-1.5 pr-3 font-medium">{id ? 'Siswa tercapai' : 'Students reached'}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.kka.map((k) => (
                    <tr key={k.code} className="border-t border-line align-top">
                      <td className="py-2 pr-3 font-mono text-xs whitespace-nowrap">{k.code}{k.status !== 'checked' && <span className="ml-1 text-muted">*</span>}</td>
                      <td className="py-2 pr-3">
                        <span className="text-xs text-muted">{elementName(k.element)}</span>
                        <br />
                        {k.description}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">{k.competencies.length ? k.lessons : <span className="text-muted">{id ? 'tidak dicakup' : 'not covered'}</span>}</td>
                      <td className="py-2 pr-3">{k.competencies.length ? bar(k.reached) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {r.kkaDraft && <p className="mt-2 text-xs text-muted">{id ? '* belum diperiksa guru KKA' : '* not yet checked by a KKA teacher'}</p>}
            </div>
          )}
        </Card>
        <p className="text-xs text-muted">
          {id ? 'Laporan ini hanya berisi angka gabungan; tidak ada data siswa perorangan.' : 'This report contains aggregate figures only; no individual student data.'}
        </p>
      </div>
    </Shell>
  )
}
