import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole, SCORE_DOMAINS, SCORE_DOMAIN_LABELS } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card, Notice } from '../../../components/ui'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { loadAnalysis } from '../../../lib/psychometrics'

/** Assessment analytics for the assessment lead (spec G14): reliability, distributions, items, raters, exports. */
export default async function AssessmentAnalytics({ searchParams }: { searchParams: Promise<{ form?: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'super_admin', 'assessment_author')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const forms = (await payload.find({ collection: 'test-forms', overrideAccess: true, depth: 0, limit: 100, sort: '-createdAt' })).docs
  const formId = Number((await searchParams).form) || undefined
  const a = await loadAnalysis(payload, formId)
  const pct = (x: number) => `${Math.round(x * 100)}%`
  const fix = (x: number | null | undefined, d = 2) => (x === null || x === undefined ? '—' : x.toFixed(d))
  const flagLabel: Record<string, string> = id
    ? { too_hard: 'terlalu sulit', too_easy: 'terlalu mudah', weak_discrimination: 'daya beda lemah', negative_discrimination: 'daya beda negatif' }
    : { too_hard: 'too hard', too_easy: 'too easy', weak_discrimination: 'weak discrimination', negative_discrimination: 'negative discrimination' }
  const pill = (active: boolean) => `rounded-full border px-3 py-1 text-sm ${active ? 'border-ink bg-ink text-paper' : 'border-line bg-white'}`
  const exportHref = (kind: string) => `/api/test-attempts/export?kind=${kind}${formId ? `&form=${formId}` : ''}`

  const bars = (values: number[], labels: string[], caption: string) => {
    const max = Math.max(1, ...values)
    return (
      <figure>
        <figcaption className="mb-2 text-sm font-semibold">{caption}</figcaption>
        <div className="flex h-32 items-end gap-1" role="img" aria-label={`${caption}: ${values.map((v, i) => `${labels[i]} ${v}`).join(', ')}`}>
          {values.map((v, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${labels[i]}: ${v}`}>
              <span className="text-[10px] tabular-nums text-muted">{v || ''}</span>
              <div className="w-full rounded-t bg-brand-deep" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 2 : 0 }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1 text-[10px] text-muted">{labels.map((l) => <span key={l} className="flex-1 text-center">{l}</span>)}</div>
      </figure>
    )
  }

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">AILIS</p>
          <h1 className="text-3xl font-bold">{id ? 'Analitik asesmen' : 'Assessment analytics'}</h1>
          <p className="mt-1 text-muted">
            {id ? `${a.scored} hasil dinilai dari ${a.attempts} percobaan` : `${a.scored} scored results from ${a.attempts} attempts`}
            {a.accommodated ? (id ? ` · ${a.accommodated} dengan akomodasi` : ` · ${a.accommodated} with accommodations`) : ''}
          </p>
        </div>
        <nav aria-label={id ? 'Formulir tes' : 'Test form'} className="flex flex-wrap gap-2">
          <Link href="/asesmen" className={pill(!formId)}>{id ? 'Semua formulir' : 'All forms'}</Link>
          {forms.map((f) => <Link key={f.id} href={`/asesmen?form=${f.id}`} className={pill(formId === f.id)}>{f.name}</Link>)}
        </nav>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{id ? 'Unduh data (CSV, ID samaran)' : 'Download data (CSV, pseudonymous IDs)'}</h2>
            <div className="flex flex-wrap gap-2">
              <a href={exportHref('responses')} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-paper">{id ? 'Matriks skor' : 'Score matrix'}</a>
              <a href={exportHref('items')} className="rounded-xl border border-ink px-4 py-2.5 text-sm font-semibold">{id ? 'Statistik soal' : 'Item statistics'}</a>
              <a href={exportHref('ratings')} className="rounded-xl border border-ink px-4 py-2.5 text-sm font-semibold">{id ? 'Nilai penilai' : 'Rater marks'}</a>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            {id
              ? 'Matriks skor: satu baris per peserta, skor tiap soal 0–1, siap untuk jMetrik, R (mirt/TAM) atau Excel. Tanpa nama atau email. Setiap unduhan tercatat di log audit.'
              : 'Score matrix: one row per candidate, each item scored 0–1, ready for jMetrik, R (mirt/TAM) or Excel. No names or emails. Every download is recorded in the audit log.'}
          </p>
        </Card>

        {a.scored === 0 ? (
          <Notice title={id ? 'Belum ada hasil yang dinilai' : 'No scored results yet'} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <p className="text-sm text-muted">{id ? 'Reliabilitas (alfa Cronbach)' : 'Reliability (Cronbach’s alpha)'}</p>
                {a.reliability ? (
                  <>
                    <p className="text-3xl font-bold tabular-nums">{fix(a.reliability.alpha)}</p>
                    <p className="text-xs text-muted">{id ? `SEM ±${a.reliability.sem.toFixed(1)} poin persen · ${a.reliability.n} peserta lengkap · ${a.reliability.k} soal` : `SEM ±${a.reliability.sem.toFixed(1)} percentage points · ${a.reliability.n} complete candidates · ${a.reliability.k} items`}</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted">{formId ? (id ? 'Perlu minimal 10 peserta yang menjawab semua soal.' : 'Needs at least 10 candidates who answered every item.') : id ? 'Pilih satu formulir.' : 'Choose one form.'}</p>
                )}
              </Card>
              <Card>
                <p className="text-sm text-muted">{id ? 'Kesepakatan penilai (tepat / ±1)' : 'Rater agreement (exact / ±1)'}</p>
                <p className="text-3xl font-bold tabular-nums">{a.raters.overall.pairs ? `${pct(a.raters.overall.exact)} / ${pct(a.raters.overall.adjacent)}` : '—'}</p>
                <p className="text-xs text-muted">{id ? `${a.raters.overall.pairs} pasang nilai · ${a.raters.overall.adjudicated} diadjudikasi` : `${a.raters.overall.pairs} mark pairs · ${a.raters.overall.adjudicated} adjudicated`}</p>
              </Card>
              <Card>
                <p className="text-sm text-muted">{id ? 'Kappa berbobot kuadratik' : 'Quadratic weighted kappa'}</p>
                <p className="text-3xl font-bold tabular-nums">{a.raters.kappa.length ? a.raters.kappa.map((k) => fix(k.qwk)).join(' · ') : '—'}</p>
                <p className="text-xs text-muted">{a.raters.kappa.map((k) => `0–${k.max}: ${k.pairs}`).join(' · ') || (id ? 'Belum ada nilai ganda.' : 'No double marks yet.')}</p>
              </Card>
            </div>

            <Card>
              <div className="grid gap-6 sm:grid-cols-2">
                {bars(a.histogram, ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90'], id ? 'Sebaran skor keseluruhan (%)' : 'Overall score distribution (%)')}
                {bars(a.bands, Array.from({ length: 10 }, (_, i) => String(i)), id ? 'Sebaran band' : 'Band distribution')}
              </div>
              <h3 className="mt-6 text-sm font-semibold">{id ? 'Rata-rata per domain' : 'Average by domain'}</h3>
              <dl className="mt-2 grid grid-cols-1 gap-x-6 text-sm sm:grid-cols-2">
                {SCORE_DOMAINS.map((d) => <div key={d} className="flex justify-between border-b border-line py-1.5"><dt>{SCORE_DOMAIN_LABELS[d][locale]}</dt><dd className="font-semibold tabular-nums">{Math.round(a.domains[d])}%</dd></div>)}
              </dl>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">{id ? 'Statistik soal' : 'Item statistics'}</h2>
              <p className="mt-1 text-xs text-muted">
                {id
                  ? 'p = tingkat kesulitan (proporsi skor maksimum); r = daya beda (korelasi soal–total terkoreksi). Statistik dihitung bila n ≥ 10. Pilihan: persentase peserta yang memilih tiap opsi; * = kunci.'
                  : 'p = difficulty (share of the maximum score); r = discrimination (corrected item–total correlation). Statistics need n ≥ 10. Options: share choosing each option; * = key.'}
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted">
                      <th className="py-1.5 pr-3 font-medium">{id ? 'Soal' : 'Item'}</th>
                      <th className="py-1.5 pr-3 font-medium">n</th>
                      <th className="py-1.5 pr-3 font-medium">p</th>
                      <th className="py-1.5 pr-3 font-medium">r</th>
                      <th className="py-1.5 pr-3 font-medium">{id ? 'Pilihan' : 'Options'}</th>
                      <th className="py-1.5 font-medium">{id ? 'Tanda' : 'Flags'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...a.items].sort((x, y) => y.flags.length - x.flags.length || x.code.localeCompare(y.code)).map((it) => (
                      <tr key={it.id} className="border-t border-line align-top">
                        <td className="py-1.5 pr-3 font-mono text-xs whitespace-nowrap">{it.code}<span className="block font-sans text-muted">{it.competency}</span></td>
                        <td className="py-1.5 pr-3 tabular-nums">{it.n}</td>
                        <td className="py-1.5 pr-3 tabular-nums">{fix(it.difficulty)}</td>
                        <td className="py-1.5 pr-3 tabular-nums">{fix(it.discrimination)}</td>
                        <td className="py-1.5 pr-3 text-xs whitespace-nowrap tabular-nums">
                          {it.distractors ? it.distractors.shares.map((s, j) => `${String.fromCharCode(65 + j)} ${Math.round(s * 100)}%${it.key[j] ? '*' : ''}`).join('  ') : id ? 'tugas praktik' : 'practical task'}
                        </td>
                        <td className="py-1.5 text-xs">{it.flags.map((f) => flagLabel[f]).join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {a.raters.perRater.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold">{id ? 'Kesepakatan per penilai' : 'Agreement by rater'}</h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-muted"><th className="py-1.5 pr-3 font-medium">{id ? 'Penilai' : 'Rater'}</th><th className="py-1.5 pr-3 font-medium">{id ? 'Pasang' : 'Pairs'}</th><th className="py-1.5 pr-3 font-medium">{id ? 'Tepat' : 'Exact'}</th><th className="py-1.5 pr-3 font-medium">±1</th><th className="py-1.5 font-medium">{id ? 'Rata-rata selisih' : 'Mean difference'}</th></tr></thead>
                    <tbody>
                      {a.raters.perRater.map((r) => (
                        <tr key={r.rater} className="border-t border-line">
                          <td className="py-1.5 pr-3 font-mono text-xs">{r.pseudo}</td>
                          <td className="py-1.5 pr-3 tabular-nums">{r.pairs}</td>
                          <td className={`py-1.5 pr-3 tabular-nums ${r.exact < 0.5 && r.pairs >= 10 ? 'font-semibold text-danger' : ''}`}>{pct(r.exact)}</td>
                          <td className="py-1.5 pr-3 tabular-nums">{pct(r.adjacent)}</td>
                          <td className="py-1.5 tabular-nums">{r.meanAbsDiff.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-muted">{id ? 'Penilai ditampilkan dengan ID samaran yang sama seperti di berkas unduhan.' : 'Raters are shown under the same pseudonymous IDs as in the downloads.'}</p>
              </Card>
            )}
          </>
        )}
      </div>
    </Shell>
  )
}
