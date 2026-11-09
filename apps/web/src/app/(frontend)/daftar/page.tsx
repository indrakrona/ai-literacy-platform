import { redirect } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { SignupForm } from '../../../components/forms/SignupForm'
import { getDict } from '../../../i18n/server'
import { getCurrentUser } from '../../../lib/session'

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ kode?: string }> }) {
  if (await getCurrentUser()) redirect('/beranda')
  const { t, locale } = await getDict()
  const { kode } = await searchParams
  return (
    <Shell>
      <Card>
        <SignupForm t={t} locale={locale} initialCode={kode?.toUpperCase().slice(0, 6)} />
      </Card>
    </Shell>
  )
}
