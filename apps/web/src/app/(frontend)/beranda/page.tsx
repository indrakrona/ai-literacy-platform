import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Card, Notice } from '../../../components/ui'
import { ProgressPanel } from '../../../components/ProgressPanel'
import { Announcements } from '../../../components/Announcements'
import { recommendNext } from '../../../lib/learning-path'
import { SCORE_DOMAIN_LABELS } from '@ailit/shared'
import { getDict } from '../../../i18n/server'
import { fmt } from '../../../i18n/dict'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  // Parents (without another role) have their own home.
  if (user.roles?.length && user.roles.every((r) => r === 'parent')) redirect('/orang-tua')
  const { t, locale } = await getDict()
  const payload = await getPayloadClient()
  const classes = await payload.find({
    collection: 'classes',
    overrideAccess: false,
    user,
    depth: 1,
    limit: 20,
  })
  const isStudent = user.roles?.includes('student')
  const next = isStudent ? await recommendNext(payload, user.id, locale) : null
  const isTeacher = user.roles?.some((r) => ['teacher', 'school_admin', 'super_admin'].includes(r))
  const assignments = classes.docs.length
    ? await payload.find({ collection: 'assignments', overrideAccess: false, user, where: { class: { in: classes.docs.map((c) => c.id) } }, sort: 'dueDate', depth: 2, limit: 20 })
    : { docs: [] }

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">{fmt(t.home.hello, { name: user.name.split(' ')[0] ?? user.name })}</h1>
        <Announcements user={user} locale={locale} limit={2} />
        {isStudent && next && (
          <Card>
            <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">{locale === 'id' ? 'Disarankan untukmu' : 'Recommended for you'}</p>
            {next.lesson ? (
              <>
                <Link href={`/belajar/${next.lesson.track}/${next.lesson.order}`} className="mt-1 block text-xl font-bold underline-offset-2 hover:underline">{locale === 'id' ? 'Sesi' : 'Session'} {next.lesson.order}: {next.lesson.title}</Link>
                <p className="mt-1 text-sm text-muted">
                  {next.reason === 'weak_domain' && next.domain
                    ? locale === 'id' ? `Karena skor “${SCORE_DOMAIN_LABELS[next.domain].id}” di tes AILIS-mu masih bisa naik.` : `Because your AILIS “${SCORE_DOMAIN_LABELS[next.domain].en}” score has room to grow.`
                    : locale === 'id' ? 'Sesi berikutnya yang belum kamu selesaikan.' : 'Your next unfinished session.'}
                  {' '}· {next.done}/{next.total} {locale === 'id' ? 'selesai' : 'done'}
                </p>
              </>
            ) : (
              <p className="mt-1">{locale === 'id' ? `Semua sesi ${next.trackTitle} sudah selesai. Hebat!` : `You have finished every session of ${next.trackTitle}. Well done!`}</p>
            )}
          </Card>
        )}
        {user.roles?.some((r) => ['content_editor', 'content_reviewer'].includes(r)) && (
          <Link href="/konten" className="rounded-2xl border border-line bg-white p-4 font-semibold hover:border-ink">
            {locale === 'id' ? 'Ruang telaah konten →' : 'Content review workspace →'}
          </Link>
        )}
        {user.consentStatus === 'pending' && <Notice tone="warn" title={t.home.pendingTitle}>{t.home.pendingBody}</Notice>}
        {user.consentStatus === 'declined' && <Notice tone="warn" title={t.home.declinedTitle}>{t.home.declinedBody}</Notice>}
        <Card>
          <h2 className="text-lg font-semibold">{t.home.yourClasses}</h2>
          {classes.docs.length ? (
            <ul className="mt-3 divide-y divide-line">
              {classes.docs.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-sm text-muted">{typeof c.school === 'object' ? c.school.name : ''}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              <p className="text-muted">{t.home.noClass}</p>
              {isStudent && (
                <Link href="/gabung" className="w-fit rounded-xl bg-ink px-5 py-3 font-semibold text-paper">{t.home.joinClass}</Link>
              )}
            </div>
          )}
        </Card>
        {assignments.docs.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold">{locale === 'id' ? 'Tugas dari guru' : 'Assignments'}</h2>
            <ul className="mt-2 divide-y divide-line">
              {assignments.docs.map((a) => {
                const l = typeof a.lesson === 'object' ? a.lesson : null
                const tr = l && typeof l.unit === 'object' && typeof l.unit.track === 'object' ? l.unit.track : null
                return (
                  <li key={a.id} className="flex justify-between gap-3 py-2 text-sm">
                    {l && tr ? <Link className="underline" href={`/belajar/${tr.slug}/${l.order}`}>{l.title}</Link> : <span>{l?.title}</span>}
                    <span className="text-muted">{new Date(a.dueDate).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-GB')}</span>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
        {isStudent && <ProgressPanel payload={payload} userId={user.id} classIds={classes.docs.map((c) => c.id)} locale={locale} />}
        <div className="flex flex-wrap gap-3">
        <Link href="/proyek" className="w-fit rounded-xl border border-ink px-5 py-3 font-semibold">{locale === 'id' ? 'Proyek nyata' : 'Real-world projects'}</Link>
        <nav aria-label={locale === 'id' ? 'Bersama teman' : 'With classmates'} className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
          <Link href="/lab/perintah" className="underline">{locale === 'id' ? 'Perpustakaan perintah' : 'Prompt library'}</Link>
          <Link href="/kelas-langsung" className="underline">{locale === 'id' ? 'Ikut Kelas Langsung' : 'Join Live Class'}</Link>
          <Link href="/papan-skor" className="underline">{locale === 'id' ? 'Papan skor tim' : 'Team boards'}</Link>
          <Link href="/proyek/ulasan" className="underline">{locale === 'id' ? 'Ulas proyek teman' : 'Review classmates’ projects'}</Link>
          <Link href="/galeri" className="underline">{locale === 'id' ? 'Galeri proyek' : 'Project gallery'}</Link>
          <Link href="/acara" className="underline">{locale === 'id' ? 'Acara' : 'Events'}</Link>
        </nav>
        {user.roles?.includes('super_admin') && (
          <Link href="/operasi" className="w-fit rounded-xl border border-ink px-5 py-3 font-semibold">{locale === 'id' ? 'Operasi' : 'Operations'}</Link>
        )}
        {user.roles?.includes('super_admin') && (
          <Link href="/dasbor" className="w-fit rounded-xl border border-ink px-5 py-3 font-semibold">{locale === 'id' ? 'Dasbor analitik' : 'Analytics dashboard'}</Link>
        )}
        {user.roles?.some((r) => r === 'school_admin' || r === 'super_admin') && (
          <Link href="/sekolah" className="w-fit rounded-xl border border-ink px-5 py-3 font-semibold">{locale === 'id' ? 'Ruang Sekolah' : 'School space'}</Link>
        )}
        {user.roles?.some((r) => r === 'proctor' || r === 'super_admin') && (
          <Link href="/pengawas" className="w-fit rounded-xl border border-ink px-5 py-3 font-semibold">{locale === 'id' ? 'Pengawasan tes' : 'Test proctoring'}</Link>
        )}
        {user.roles?.some((r) => r === 'rater' || r === 'super_admin') && (
          <Link href="/penilai" className="w-fit rounded-xl border border-ink px-5 py-3 font-semibold">{locale === 'id' ? 'Antrean penilai' : 'Rating queue'}</Link>
        )}
        </div>
        {isTeacher && (
          <Link href="/guru" className="w-fit rounded-xl border border-ink px-5 py-3 font-semibold">{locale === 'id' ? 'Ruang Guru' : 'Teacher space'}</Link>
        )}
        <Link href="/belajar" className="w-fit rounded-xl bg-ink px-5 py-3 font-semibold text-paper">
          {t.home.startLearning}
        </Link>
      </div>
    </Shell>
  )
}
