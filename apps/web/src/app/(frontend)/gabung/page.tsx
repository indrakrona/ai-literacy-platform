import { redirect } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { JoinForm } from '../../../components/forms/JoinForm'
import { getDict } from '../../../i18n/server'
import { getCurrentUser } from '../../../lib/session'

export default async function JoinPage() {
  if (!(await getCurrentUser())) redirect('/masuk')
  const { t } = await getDict()
  return (
    <Shell>
      <Card>
        <JoinForm t={t} />
      </Card>
    </Shell>
  )
}
