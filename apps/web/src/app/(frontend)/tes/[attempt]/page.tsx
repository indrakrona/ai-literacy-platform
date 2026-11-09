import { notFound, redirect } from 'next/navigation'
import { Shell } from '../../../../components/Shell'
import { TestPlayer } from '../../../../components/TestPlayer'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser } from '../../../../lib/session'

export default async function TestPage({ params }: { params: Promise<{ attempt: string }> }) {
  if (!(await getCurrentUser())) redirect('/masuk')
  const id = Number((await params).attempt)
  if (!Number.isInteger(id)) notFound()
  const { t } = await getDict()
  return (
    <Shell>
      <TestPlayer attemptId={id} t={t} />
    </Shell>
  )
}
