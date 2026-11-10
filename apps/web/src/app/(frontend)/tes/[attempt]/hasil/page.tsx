import { notFound, redirect } from 'next/navigation'
import { SCORE_DOMAINS, SCORE_DOMAIN_LABELS } from '@ailit/shared'
import { Shell } from '../../../../../components/Shell'
import { Card, Notice } from '../../../../../components/ui'
import { getDict } from '../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../lib/session'
import { BAND_NAMES, issueCertificate, statusOf, verifyUrl } from '../../../../../lib/certificates'
import { CertificateShare } from '../../../../../components/forms/BookingForms'


export default async function ResultPage({ params }: { params: Promise<{ attempt: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const id = Number((await params).attempt)
  const { t, locale } = await getDict()
  const payload = await getPayloadClient()
  const attempt = await payload.findByID({ collection: 'test-attempts', id, overrideAccess: false, user, depth: 0 }).catch(() => null)
  if (!attempt) notFound()
  const report = attempt.report as null | { band: number; overall: number; subScores: Record<string, number>; provisional: boolean }
  // Issued when the score is released; this also covers attempts scored before certificates existed.
  const owner = (typeof attempt.candidate === 'object' ? attempt.candidate.id : attempt.candidate) === user.id
  const cert = report && owner ? await issueCertificate(payload, attempt.id) : null
  const id_ = locale === 'id'
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(id_ ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold">{t.test.resultTitle}</h1>
        {!report ? (
          <Notice title={attempt.status === 'in_progress' ? t.test.closed : t.test.awaiting} />
        ) : (
          <>
            <Card>
              <p className="text-sm font-semibold text-muted">{t.test.band}</p>
              <p className="text-6xl font-bold">{report.band}</p>
              <p className="mt-1 font-semibold">{BAND_NAMES[locale][report.band]}</p>
              {report.provisional && <p className="mt-3 text-sm text-muted">{t.test.provisional}</p>}
            </Card>
            <Card>
              <h2 className="font-semibold">{t.test.domains}</h2>
              <ul className="mt-3 flex flex-col gap-3">
                {SCORE_DOMAINS.map((d) => (
                  <li key={d}>
                    <div className="flex justify-between text-sm font-medium">
                      <span>{SCORE_DOMAIN_LABELS[d][locale]}</span>
                      <span>{report.subScores[d]}%</span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-line" aria-hidden>
                      <div className="h-full rounded-full bg-ink" style={{ width: `${report.subScores[d]}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            {cert && statusOf(cert) !== 'revoked' && (
              <Card>
                <h2 className="font-semibold">{id_ ? 'Sertifikat' : 'Certificate'}</h2>
                <p className="mt-1 text-sm text-muted">
                  {id_ ? 'Kode' : 'Code'} <span className="font-mono font-semibold text-ink">{cert.code}</span> · {id_ ? 'berlaku sampai' : 'valid until'} {fmtDate(cert.expiresAt)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {id_ ? 'Siapa pun dapat memeriksa keasliannya di ' : 'Anyone can check it is genuine at '}
                  <a className="underline" href={`/verifikasi/${cert.code}`}>{verifyUrl(cert.code).replace(/^https?:\/\//, '')}</a>
                </p>
                <div className="mt-4">
                  <CertificateShare code={cert.code} url={verifyUrl(cert.code)} locale={locale} />
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </Shell>
  )
}
