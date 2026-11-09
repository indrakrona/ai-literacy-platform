import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Card, Notice } from '../../../components/ui'
import { getDict } from '../../../i18n/server'
import { fmt } from '../../../i18n/dict'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
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
  const isTeacher = user.roles?.some((r) => ['teacher', 'school_admin', 'super_admin'].includes(r))
  const assignments = classes.docs.length
    ? await payload.find({ collection: 'assignments', overrideAccess: false, user, where: { class: { in: classes.docs.map((c) => c.id) } }, sort: 'dueDate', depth: 2, limit: 20 })
    : { docs: [] }

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">{fmt(t.home.hello, { name: user.name.split(' ')[0] ?? user.name })}</h1>
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
        <div className="flex flex-wrap gap-3">
        <Link href="/proyek" className="w-fit rounded-xl border border-ink px-5 py-3 font-semibold">{locale === 'id' ? 'Proyek nyata' : 'Real-world projects'}</Link>
        {user.roles?.some((r) => r === 'school_admin' || r === 'super_admin') && (
          <Link href="/sekolah" className="w-fit rounded-xl border border-ink px-5 py-3 font-semibold">{locale === 'id' ? 'Ruang Sekolah' : 'School space'}</Link>
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
