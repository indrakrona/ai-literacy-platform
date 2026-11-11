import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../components/Shell'
import { Card } from '../../../../components/ui'
import { TeacherCertificateLinks } from '../../../../components/forms/TrainingForms'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../lib/session'
import { COURSE_MODULES, EXAM, PASS_MARK, CERT_VALIDITY_YEARS, passCount } from '../../../../lib/teacher-course'
import { trainingState } from '../../../../lib/teacher-training'

/** Teacher training course and certification overview (spec H7). */
export default async function TrainingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'teacher', 'school_admin', 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const s = await trainingState(await getPayloadClient(), user.id)
  const minutes = COURSE_MODULES.reduce((t, m) => t + m.minutes, 0)
  const fmt = (d: string | Date) => new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-5">
        <div>
          <Link href="/guru" className="text-sm underline">{id ? '← Ruang Guru' : '← Teacher space'}</Link>
          <h1 className="mt-1 text-3xl font-bold">{id ? 'Pelatihan Guru Literasi AI' : 'AI Literacy Teacher training'}</h1>
          <p className="mt-1 text-muted">
            {id
              ? `Kursus mandiri ${COURSE_MODULES.length} modul (sekitar ${Math.round(minutes / 60 * 2) / 2} jam) untuk guru yang akan mengajarkan jalur literasi AI. Selesaikan semua modul, lalu ikuti ujian sertifikasi.`
              : `A self-paced course of ${COURSE_MODULES.length} modules (about ${Math.round(minutes / 60 * 2) / 2} hours) for teachers who will teach the AI literacy tracks. Finish every module, then take the certification exam.`}
          </p>
        </div>

        {s.cert && (
          <Card>
            <p className="text-sm font-semibold text-ok">✓ {id ? 'Tersertifikasi' : 'Certified'}</p>
            <h2 className="mt-1 text-xl font-bold">{id ? 'Guru Literasi AI' : 'AI Literacy Teacher'}</h2>
            <p className="mt-1 text-sm">{id ? `Kode ${s.cert.code} · berlaku sampai ${fmt(s.cert.expiresAt)}` : `Code ${s.cert.code} · valid until ${fmt(s.cert.expiresAt)}`}{s.cert.status === 'expired' ? (id ? ' (sudah habis, ikuti ujian lagi untuk memperbarui)' : ' (expired; take the exam again to renew)') : ''}</p>
            <div className="mt-3"><TeacherCertificateLinks code={s.cert.code} locale={locale} /></div>
          </Card>
        )}

        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Syarat sertifikasi' : 'Certification criteria'}</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>{id ? `Menyelesaikan ke-${COURSE_MODULES.length} modul.` : `Complete all ${COURSE_MODULES.length} modules.`} <span className="text-muted">({s.done.size}/{COURSE_MODULES.length})</span></li>
            <li>{id ? `Lulus ujian ${EXAM.length} soal dengan skor minimal ${PASS_MARK * 100}% (${passCount(EXAM.length)} benar). Jika belum lulus, ujian dapat diulang setelah 1 jam.` : `Pass the ${EXAM.length}-question exam with at least ${PASS_MARK * 100}% (${passCount(EXAM.length)} correct). If you do not pass, you can retake it after 1 hour.`}</li>
            <li>{id ? `Sertifikat berlaku ${CERT_VALIDITY_YEARS} tahun dan dapat diperiksa siapa pun lewat kodenya.` : `The certificate is valid for ${CERT_VALIDITY_YEARS} years and anyone can check it by its code.`}</li>
          </ol>
          <p className="mt-2 text-xs text-muted">{id ? 'Disarankan: setelah tersertifikasi, jalankan satu sesi dengan Kelas Langsung dan diskusikan pengalaman Anda dengan rekan guru.' : 'Recommended: once certified, run one session with Live Class and discuss it with a colleague.'}</p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Modul' : 'Modules'}</h2>
          <ol className="mt-2 divide-y divide-line">
            {COURSE_MODULES.map((m, i) => (
              <li key={m.key} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <Link href={`/guru/pelatihan/${m.key}`} className="font-medium underline">{i + 1}. {m.title[locale]}</Link>
                  <p className="text-sm text-muted">{m.summary[locale]} · {m.minutes} {id ? 'menit' : 'min'}</p>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${s.done.has(m.key) ? 'text-ok' : 'text-muted'}`}>{s.done.has(m.key) ? (id ? '✓ Selesai' : '✓ Done') : id ? 'Belum' : 'Not yet'}</span>
              </li>
            ))}
          </ol>
        </Card>

        {!s.cert || s.cert.status === 'expired' ? (
          <Card>
            <h2 className="text-lg font-semibold">{id ? 'Ujian sertifikasi' : 'Certification exam'}</h2>
            {!s.allDone ? (
              <p className="mt-1 text-sm text-muted">{id ? 'Ujian terbuka setelah semua modul selesai.' : 'The exam opens once every module is done.'}</p>
            ) : s.retryAt ? (
              <p className="mt-1 text-sm">{id ? `Anda dapat mencoba lagi mulai pukul ${s.retryAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.` : `You can try again from ${s.retryAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`}</p>
            ) : (
              <Link href="/guru/pelatihan/ujian" className="mt-3 inline-block rounded-xl bg-ink px-5 py-3 font-semibold text-paper">{id ? 'Mulai ujian' : 'Start the exam'}</Link>
            )}
            {s.attempts > 0 && <p className="mt-2 text-xs text-muted">{id ? `Percobaan: ${s.attempts} · skor terbaik ${Math.round(s.best * 100)}%` : `Attempts: ${s.attempts} · best score ${Math.round(s.best * 100)}%`}</p>}
          </Card>
        ) : null}
      </div>
    </Shell>
  )
}
