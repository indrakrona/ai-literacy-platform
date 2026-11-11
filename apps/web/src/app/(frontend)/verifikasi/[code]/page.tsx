import type { Metadata } from 'next'
import Link from 'next/link'
import { SCORE_DOMAINS, SCORE_DOMAIN_LABELS } from '@ailit/shared'
import { Shell } from '../../../../components/Shell'
import { Card, Notice } from '../../../../components/ui'
import { getDict } from '../../../../i18n/server'
import { getPayloadClient } from '../../../../lib/session'
import { verifyCertificate } from '../../../../collections/Certificates'
import { BAND_NAMES } from '../../../../lib/certificates'
import { verifyTeacherCertificate } from '../../../../collections/TeacherCertifications'
import { isTeacherCode } from '../../../../lib/teacher-certificate'

// Individual certificates are not for search engines: the page is for whoever was given the code.
export const metadata: Metadata = { title: 'AILIS · Verifikasi', robots: { index: false, follow: false } }

const LEVELS: Record<string, { id: string; en: string }> = {
  smp: { id: 'SMP', en: 'Junior secondary (SMP)' },
  sma_smk: { id: 'SMA/SMK', en: 'Senior secondary (SMA/SMK)' },
  adult: { id: 'Dewasa', en: 'Adult' },
}

export default async function VerifyCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { locale } = await getDict()
  const id = locale === 'id'
  const code = decodeURIComponent((await params).code).slice(0, 40)
  const payload = await getPayloadClient()
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  if (isTeacherCode(code)) {
    const t = await verifyTeacherCertificate(payload, code)
    const tone = !t ? 'warn' : t.status === 'valid' ? 'ok' : 'warn'
    const title = !t
      ? id ? 'Sertifikat tidak ditemukan' : 'Certificate not found'
      : t.status === 'valid' ? (id ? 'Sertifikat asli dan masih berlaku' : 'Genuine and valid')
      : t.status === 'expired' ? (id ? `Sertifikat asli, tetapi masa berlakunya habis pada ${fmtDate(t.expiresAt)}` : `Genuine, but it expired on ${fmtDate(t.expiresAt)}`)
      : id ? 'Sertifikat ini telah dicabut dan tidak berlaku' : 'This certificate has been revoked and is not valid'
    return (
      <Shell>
        <div className="flex flex-col gap-4">
          <Notice tone={tone} title={title}>{!t ? (id ? `Tidak ada sertifikat guru dengan kode ${code}.` : `There is no teacher certificate with the code ${code}.`) : null}</Notice>
          {t && (
            <Card>
              <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">{id ? 'Sertifikat Guru Literasi AI' : 'AI Literacy Teacher Certificate'}</p>
              <h1 className="mt-2 text-2xl font-bold">{t.name}</h1>
              {t.school && <p className="text-muted">{t.school}</p>}
              <p className="mt-3 text-sm">{id ? 'Telah menyelesaikan pelatihan guru literasi AI (6 modul) dan lulus ujian sertifikasi.' : 'Has completed the AI literacy teacher training (6 modules) and passed the certification exam.'}</p>
              <dl className="mt-5 grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-muted">{id ? 'Kode' : 'Code'}</dt>
                <dd className="font-mono font-semibold">{t.code}</dd>
                <dt className="text-muted">{id ? 'Diterbitkan' : 'Issued'}</dt>
                <dd>{fmtDate(t.issuedAt)}</dd>
                <dt className="text-muted">{id ? 'Berlaku sampai' : 'Valid until'}</dt>
                <dd>{fmtDate(t.expiresAt)}</dd>
              </dl>
              <p className="mt-4 text-xs text-muted">{id ? 'Diterbitkan oleh Impact Thinklab.' : 'Issued by Impact Thinklab.'}</p>
            </Card>
          )}
          <Link href="/verifikasi" className="text-sm underline">{id ? 'Periksa kode lain' : 'Check another code'}</Link>
        </div>
      </Shell>
    )
  }
  const c = await verifyCertificate(payload, code)
  const fmt = (d: string) => new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const back = (
    <Link href="/verifikasi" className="text-sm underline">
      {id ? 'Periksa kode lain' : 'Check another code'}
    </Link>
  )

  if (!c)
    return (
      <Shell>
        <div className="flex flex-col gap-4">
          <Notice tone="warn" title={id ? 'Sertifikat tidak ditemukan' : 'Certificate not found'}>
            {id ? `Tidak ada sertifikat AILIS dengan kode ${code}. Periksa kembali penulisannya.` : `There is no AILIS certificate with the code ${code}. Check how it is written.`}
          </Notice>
          {back}
        </div>
      </Shell>
    )

  const status = {
    valid: { tone: 'ok' as const, text: id ? 'Sertifikat asli dan masih berlaku' : 'Genuine and valid' },
    expired: { tone: 'warn' as const, text: id ? `Sertifikat asli, tetapi masa berlakunya habis pada ${fmt(c.expiresAt)}` : `Genuine, but it expired on ${fmt(c.expiresAt)}` },
    revoked: { tone: 'warn' as const, text: id ? 'Sertifikat ini telah dicabut dan tidak berlaku' : 'This certificate has been revoked and is not valid' },
  }[c.status]

  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <Notice tone={status.tone} title={status.text} />
        <Card>
          <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">{id ? 'Sertifikat Skor Literasi AI (AILIS)' : 'AI Literacy Score Certificate (AILIS)'}</p>
          <h1 className="mt-2 text-2xl font-bold">{c.name}</h1>
          {c.status !== 'revoked' && (
            <>
              <p className="mt-4 text-sm text-muted">{id ? 'Band keseluruhan' : 'Overall band'}</p>
              <p className="text-5xl font-bold">{c.band}</p>
              <p className="font-semibold">{BAND_NAMES[locale][c.band] ?? ''}</p>
              <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {SCORE_DOMAINS.map((d) => (
                  <div key={d} className="flex justify-between border-b border-line py-1.5">
                    <dt>{SCORE_DOMAIN_LABELS[d][locale]}</dt>
                    <dd className="font-semibold">{Math.round(c.subScores[d] ?? 0)}%</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-muted">{id ? 'Kode' : 'Code'}</dt>
            <dd className="font-mono font-semibold">{c.code}</dd>
            {c.level && LEVELS[c.level] && (
              <>
                <dt className="text-muted">{id ? 'Jenjang tes' : 'Test level'}</dt>
                <dd>{LEVELS[c.level][locale]}</dd>
              </>
            )}
            <dt className="text-muted">{id ? 'Diterbitkan' : 'Issued'}</dt>
            <dd>{fmt(c.issuedAt)}</dd>
            <dt className="text-muted">{id ? 'Berlaku sampai' : 'Valid until'}</dt>
            <dd>{fmt(c.expiresAt)}</dd>
          </dl>
          {c.provisional && c.status !== 'revoked' && (
            <p className="mt-4 text-sm text-muted">
              {id
                ? 'Sertifikat pilot: ambang band masih sementara sampai ditetapkan panel ahli.'
                : 'Pilot certificate: band thresholds are provisional until set by the expert panel.'}
            </p>
          )}
          <p className="mt-4 text-xs text-muted">
            {id ? 'Diterbitkan oleh Impact Thinklab. Nama peserta di bawah 18 tahun ditampilkan disingkat.' : 'Issued by Impact Thinklab. Names of candidates under 18 are shortened.'}
          </p>
        </Card>
        {back}
      </div>
    </Shell>
  )
}
