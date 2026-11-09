import { notFound, redirect } from 'next/navigation'
import { hasFullAccess, hasRole } from '@ailit/shared'
import { AiLabChat } from '../../../../components/AiLabChat'
import { Shell } from '../../../../components/Shell'
import { Card, Notice } from '../../../../components/ui'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../lib/session'

export default async function LabPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { slug } = await params
  const { t, locale } = await getDict()
  const payload = await getPayloadClient()
  const activity = (await payload.find({ collection: 'ai-activities', locale, where: { slug: { equals: slug } }, limit: 1, user, overrideAccess: false })).docs[0]
  if (!activity) notFound()
  const locked = hasRole(user, 'student') && !hasFullAccess(user)

  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <Card>
          <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">AI Lab · {activity.competency}</p>
          <h1 className="mt-1 text-2xl font-bold">{activity.title}</h1>
          <p className="mt-2 text-muted">{activity.goal}</p>
        </Card>
        {locked ? (
          <Notice tone="warn" title={t.home.pendingTitle}>{t.home.pendingBody}</Notice>
        ) : (
          <AiLabChat
            activityId={activity.id}
            starters={(activity.starterPrompts ?? []).map((s) => s.text)}
            reflection={(activity.reflection ?? []).map((r) => r.text)}
            locale={locale}
          />
        )}
      </div>
    </Shell>
  )
}
