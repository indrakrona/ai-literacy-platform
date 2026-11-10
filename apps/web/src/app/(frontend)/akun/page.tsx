import { redirect } from 'next/navigation'
import Link from 'next/link'
import { hasRole, needsGuardianConsent } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { AccountForm } from '../../../components/forms/AccountForm'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { ParentCodeButton, UnlinkButton } from '../../../components/forms/ParentForms'

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { t, locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const isStudent = hasRole(user, 'student', 'candidate')
  const guardianIds = (user.guardians ?? []).map((g) => (typeof g === 'object' ? g.id : g))
  const guardians = guardianIds.length ? (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 10, where: { id: { in: guardianIds } } })).docs : []
  const adult = !user.dateOfBirth || !needsGuardianConsent(user.dateOfBirth)
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
      {isStudent && (
        <div className="mt-5">
          <Card>
            <h2 className="text-lg font-semibold">{id ? 'Orang tua / wali' : 'Parent or guardian'}</h2>
            <p className="mt-1 mb-4 text-sm text-muted">
              {id
                ? 'Orang tua yang terhubung dapat melihat pelajaran, lencana, hasil tes dan sertifikatmu, serta menerima ringkasan mingguan. Mereka tidak dapat membaca percakapanmu dengan AI.'
                : 'A connected parent can see your lessons, badges, test results and certificates, and gets a weekly summary. They cannot read your conversations with the AI.'}
            </p>
            {guardians.length > 0 && (
              <ul className="mb-4 text-sm">
                {guardians.map((g) => (
                  <li key={g.id} className="flex items-center justify-between border-b border-line py-2">
                    <span>{g.name}</span>
                    {adult && <UnlinkButton parentId={g.id} label={id ? 'Putuskan' : 'Disconnect'} confirmText={id ? `Putuskan ${g.name}?` : `Disconnect ${g.name}?`} />}
                  </li>
                ))}
              </ul>
            )}
            <ParentCodeButton locale={locale} />
          </Card>
        </div>
      )}
      {hasRole(user, 'parent') && (
        <p className="mt-5 text-sm">
          <Link href="/orang-tua" className="font-semibold underline">{id ? 'Buka Ruang Orang Tua →' : 'Open the parent space →'}</Link>
        </p>
      )}
    </Shell>
  )
}
