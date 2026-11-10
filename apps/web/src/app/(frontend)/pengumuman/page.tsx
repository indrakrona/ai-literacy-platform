import { redirect } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Notice } from '../../../components/ui'
import { Announcements } from '../../../components/Announcements'
import { announcementsFor } from '../../../collections/Announcements'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'

export default async function AnnouncementsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { locale } = await getDict()
  const id = locale === 'id'
  const any = (await announcementsFor(await getPayloadClient(), user, locale)).length > 0
  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold">{id ? 'Pengumuman' : 'Announcements'}</h1>
        {any ? <Announcements user={user} locale={locale} /> : <Notice title={id ? 'Belum ada pengumuman' : 'No announcements right now'} />}
      </div>
    </Shell>
  )
}
