import { redirect } from 'next/navigation'
import Link from 'next/link'
import { hasRole, needsGuardianConsent } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { AccountForm } from '../../../components/forms/AccountForm'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { ParentCodeButton, UnlinkButton } from '../../../components/forms/ParentForms'
import { MyDataPanel } from '../../../components/forms/DataRightsForms'
import { LiteToggle } from '../../../components/Lite'
import { isLite } from '../../../lib/lite'
import { PortfolioForm, Toggle } from '../../../components/forms/EngagementForms'
import { isMinor, portfolioPublic } from '../../../lib/engagement'

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
  const openDeletion = (await payload.find({ collection: 'data-requests', overrideAccess: true, depth: 0, limit: 1, where: { and: [{ user: { equals: user.id } }, { type: { equals: 'deletion' } }, { status: { equals: 'open' } }] } })).docs[0]
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
      {isStudent && (
        <div className="mt-5">
          <Card>
            <h2 className="text-lg font-semibold">{id ? 'Portofolio dan papan skor' : 'Portfolio and boards'}</h2>
            <p className="mt-1 mb-4 text-sm text-muted">
              {id ? 'Halaman portofolio menampilkan proyek galeri, lencana dan sertifikatmu. Mati secara bawaan; kamu yang memutuskan.' : 'Your portfolio page shows your gallery projects, badges and certificate. It is off unless you turn it on.'}
              {portfolioPublic(user as never) && user.portfolio?.handle ? <> {' '}<a className="underline" href={`/portofolio/${user.portfolio.handle}`}>{id ? 'Lihat halamanku' : 'View my page'}</a></> : null}
            </p>
            <PortfolioForm
              initial={{ enabled: Boolean(user.portfolio?.enabled), handle: user.portfolio?.handle ?? '', headline: user.portfolio?.headline ?? '', showProjects: user.portfolio?.showProjects !== false, showBadges: user.portfolio?.showBadges !== false, showCertificate: Boolean(user.portfolio?.showCertificate) }}
              handleBase={`${(process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/^https?:\/\//, '')}/portofolio`}
              minor={isMinor(user)}
              parentApproved={Boolean(user.portfolio?.parentApproved)}
              locale={locale}
            />
            <div className="mt-4 border-t border-line pt-3">
              <Toggle path={`/api/users/${user.id}`} field="hideNameOnBoards" value={Boolean(user.hideNameOnBoards)} label={id ? 'Sembunyikan namaku di papan skor tim (tampil sebagai “Anggota”)' : 'Hide my name on team boards (shown as “Member”)'} />
            </div>
          </Card>
        </div>
      )}
      <div className="mt-5">
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Hemat data' : 'Data saver'}</h2>
          <p className="mt-1 mb-3 text-sm text-muted">{id ? 'Untuk koneksi lambat atau kuota terbatas. Berlaku di perangkat ini.' : 'For slow connections or limited data. Applies on this device.'}</p>
          <LiteToggle on={await isLite()} locale={locale} />
        </Card>
      </div>
      <div className="mt-5">
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Data saya' : 'My data'}</h2>
          <p className="mt-1 mb-4 text-sm text-muted">
            {id ? 'Sesuai UU Pelindungan Data Pribadi, kamu dapat mengunduh atau meminta penghapusan datamu.' : 'Under Indonesia’s personal data protection law (UU PDP), you can download your data or ask for it to be deleted.'}
          </p>
          <MyDataPanel openRequest={openDeletion ? { id: openDeletion.id, dueAt: openDeletion.dueAt } : null} locale={locale} />
        </Card>
      </div>
      {hasRole(user, 'parent') && (
        <p className="mt-5 text-sm">
          <Link href="/orang-tua" className="font-semibold underline">{id ? 'Buka Ruang Orang Tua →' : 'Open the parent space →'}</Link>
        </p>
      )}
    </Shell>
  )
}
