import { redirect } from 'next/navigation'
import { Shell } from '../../../../components/Shell'
import { LiveFollow } from '../../../../components/forms/LiveForms'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser } from '../../../../lib/session'

export default async function FollowLivePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) redirect('/masuk')
  const { locale } = await getDict()
  return (
    <Shell>
      <LiveFollow sessionId={Number((await params).id)} locale={locale} />
    </Shell>
  )
}
