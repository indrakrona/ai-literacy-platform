import { redirect } from 'next/navigation'
import { needsGuardianConsent } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { AccountForm } from '../../../components/forms/AccountForm'
import { getDict } from '../../../i18n/server'
import { getCurrentUser } from '../../../lib/session'

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { t } = await getDict()
  return (
    <Shell>
      <Card>
        <AccountForm
          t={t}
          initial={{
            id: user.id,
            name: user.name,
            preferredLocale: (user.preferredLocale as 'id' | 'en') ?? 'id',
            phone: user.phone ?? '',
            notifyEmail: user.notifyEmail ?? true,
            notifyWhatsApp: user.notifyWhatsApp ?? false,
            showInShowcase: user.showInShowcase ?? false,
            isMinor: user.dateOfBirth ? needsGuardianConsent(user.dateOfBirth) : false,
          }}
        />
      </Card>
    </Shell>
  )
}
