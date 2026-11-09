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
  const { t } = await getDict()
  const payload = await getPayloadClient()
  const classes = await payload.find({
    collection: 'classes',
    overrideAccess: false,
    user,
    depth: 1,
    limit: 20,
  })
  const isStudent = user.roles?.includes('student')

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
        <Link href="/belajar" className="w-fit rounded-xl bg-ink px-5 py-3 font-semibold text-paper">
          {t.home.startLearning}
        </Link>
      </div>
    </Shell>
  )
}
