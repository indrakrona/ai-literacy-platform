import { redirect } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { LoginForm } from '../../../components/forms/LoginForm'
import { getDict } from '../../../i18n/server'
import { getCurrentUser } from '../../../lib/session'

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/beranda')
  const { t } = await getDict()
  return (
    <Shell>
      <Card>
        <LoginForm t={t} />
      </Card>
    </Shell>
  )
}
