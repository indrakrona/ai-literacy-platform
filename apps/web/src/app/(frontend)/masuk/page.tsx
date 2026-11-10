import { redirect } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { LoginForm } from '../../../components/forms/LoginForm'
import { getDict } from '../../../i18n/server'
import { getCurrentUser } from '../../../lib/session'
import { googleConfigured } from '../../../lib/sign-in'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  if (await getCurrentUser()) redirect('/beranda')
  const { t, locale } = await getDict()
  const { google } = await searchParams
  return (
    <Shell>
      <Card>
        <LoginForm t={t} locale={locale} google={googleConfigured()} googleProblem={google} />
      </Card>
    </Shell>
  )
}
