import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card, Notice } from '../../../components/ui'
import { Announcements } from '../../../components/Announcements'
import { LinkChildForm, UnlinkButton } from '../../../components/forms/ParentForms'
import { RequestChildDeletion, WithdrawConsent } from '../../../components/forms/DataRightsForms'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { childProgress, childrenOf, LINK_PROBLEMS, weekLine } from '../../../lib/parents'

/** Parent space (spec J2): each linked child's progress, badges, test results and certificates. */
export default async function ParentPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'parent')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const kids = await childrenOf(payload, user.id)
  const progress = await Promise.all(kids.map((k) => childProgress(payload, k.id, locale)))
  const problems = Object.fromEntries(Object.entries(LINK_PROBLEMS).map(([k, v]) => [k, v[locale]]))
  const date = (d: string) => new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })
  const stat = (value: number | string, label: string) => (
    <div className="rounded-xl border border-line bg-paper p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  )
  const consentText: Record<string, string> = id
    ? { pending: 'Menunggu izin orang tua', declined: 'Izin ditolak: AI Lab, proyek dan tes tidak aktif', granted: 'Izin diberikan', not_required: '' }
    : { pending: 'Waiting for parent permission', declined: 'Permission declined: AI Lab, projects and tests are off', granted: 'Permission given', not_required: '' }

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">{id ? 'Ruang Orang Tua' : 'Parent space'}</p>
          <h1 className="text-3xl font-bold">{id ? `Halo, ${user.name.split(' ')[0]}` : `Hello, ${user.name.split(' ')[0]}`}</h1>
          <p className="mt-1 text-muted">
            {id
              ? 'Anda melihat kemajuan belajar anak. Isi percakapan anak dengan AI tidak pernah ditampilkan, untuk menjaga privasinya.'
              : 'You see your child’s learning progress. Their conversations with the AI are never shown, to protect their privacy.'}
          </p>
        </div>

        <Announcements user={user} locale={locale} limit={2} />

        {progress.length === 0 && (
          <Notice title={id ? 'Belum ada anak yang terhubung' : 'No child connected yet'}>
            {id ? 'Minta anak membuka halaman Akun, menekan “Buat kode untuk orang tua”, lalu masukkan kodenya di bawah.' : 'Ask your child to open their Account page, tap “Make a code for my parent”, and enter the code below.'}
          </Notice>
        )}

        {progress.map((c) => (
          <Card key={c.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold">{c.name}</h2>
              <p className="text-sm text-muted">{c.classes.join(', ') || (id ? 'Belum bergabung ke kelas' : 'Not in a class yet')}</p>
            </div>
            {consentText[c.consentStatus] && <p className="mt-1 text-sm text-muted">{consentText[c.consentStatus]}</p>}

            <h3 className="mt-5 text-sm font-semibold tracking-wide text-muted uppercase">{id ? '7 hari terakhir' : 'Last 7 days'}</h3>
            <p className="mt-1">{weekLine(c.name, c.week, locale)}</p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stat(c.lessonsCompleted, id ? 'Pelajaran selesai' : 'Lessons completed')}
              {stat(c.xpTotal, 'XP')}
              {stat(c.badges.length, id ? 'Lencana' : 'Badges')}
              {stat(c.projects.filter((p) => p.status === 'graded').length, id ? 'Proyek dinilai' : 'Projects marked')}
            </div>

            {c.badges.length > 0 && (
              <p className="mt-4 text-sm" aria-label={id ? 'Lencana' : 'Badges'}>
                {c.badges.slice(0, 12).map((b) => (
                  <span key={b.name} className="mr-2 inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1">
                    <span aria-hidden>{b.icon}</span>
                    {b.name}
                  </span>
                ))}
              </p>
            )}

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <section>
                <h3 className="font-semibold">{id ? 'Pelajaran terakhir' : 'Recent lessons'}</h3>
                {c.recentLessons.length ? (
                  <ul className="mt-2 text-sm">
                    {c.recentLessons.map((l, i) => (
                      <li key={i} className="flex justify-between gap-3 border-b border-line py-1.5">
                        <span>{l.title}</span>
                        <span className="shrink-0 text-muted">{date(l.completedAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">{id ? 'Belum ada.' : 'None yet.'}</p>
                )}
              </section>
              <section>
                <h3 className="font-semibold">{id ? 'Tes AILIS dan sertifikat' : 'AILIS tests and certificates'}</h3>
                {c.tests.length ? (
                  <ul className="mt-2 text-sm">
                    {c.tests.map((t, i) => (
                      <li key={i} className="flex flex-wrap justify-between gap-2 border-b border-line py-1.5">
                        <span>
                          Band {t.band} · {t.bandName}
                          {t.provisional ? (id ? ' (sementara)' : ' (provisional)') : ''}
                        </span>
                        {t.certificateCode ? (
                          <Link className="underline" href={`/verifikasi/${t.certificateCode}`}>{id ? 'Sertifikat' : 'Certificate'}</Link>
                        ) : (
                          <span className="text-muted">{date(t.scoredAt)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">{id ? 'Belum mengikuti tes.' : 'No test taken yet.'}</p>
                )}
                {c.projects.length > 0 && (
                  <>
                    <h3 className="mt-4 font-semibold">{id ? 'Proyek' : 'Projects'}</h3>
                    <ul className="mt-2 text-sm">
                      {c.projects.map((p, i) => (
                        <li key={i} className="flex justify-between gap-2 border-b border-line py-1.5">
                          <span>{p.brief}</span>
                          <span className="shrink-0 text-muted">{p.status === 'graded' ? `${p.total}/${p.max}` : id ? 'menunggu nilai' : 'awaiting marks'}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {c.consentStatus === 'granted' && <WithdrawConsent childId={c.id} childName={c.name.split(' ')[0] ?? c.name} locale={locale} />}
              <RequestChildDeletion childId={c.id} childName={c.name.split(' ')[0] ?? c.name} locale={locale} />
              <UnlinkButton
                childId={c.id}
                label={id ? 'Berhenti memantau anak ini' : 'Stop following this child'}
                confirmText={id ? `Berhenti melihat kemajuan ${c.name}?` : `Stop seeing ${c.name}’s progress?`}
              />
            </div>
          </Card>
        ))}

        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Hubungkan anak' : 'Connect a child'}</h2>
          <p className="mt-1 mb-3 text-sm text-muted">
            {id ? 'Masukkan kode 8 karakter yang dibuat anak di halaman Akun miliknya.' : 'Enter the 8-character code your child made on their Account page.'}
          </p>
          <LinkChildForm problems={problems} locale={locale} />
        </Card>

        <p className="text-sm text-muted">
          {id ? 'Ringkasan mingguan dikirim setiap Minggu sore. Atur email dan WhatsApp di ' : 'A weekly summary is sent every Sunday afternoon. Choose email or WhatsApp on your '}
          <Link className="underline" href="/akun">{id ? 'halaman Akun' : 'Account page'}</Link>.
        </p>
      </div>
    </Shell>
  )
}
