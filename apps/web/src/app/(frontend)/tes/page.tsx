import { redirect } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { TestStart } from '../../../components/forms/TestStart'
import { getDict } from '../../../i18n/server'
import { getCurrentUser } from '../../../lib/session'

export default async function TestStartPage() {
  if (!(await getCurrentUser())) redirect('/masuk')
  const { t } = await getDict()
  return (
    <Shell>
      <Card>
        <TestStart t={t} />
      </Card>
    </Shell>
  )
}
