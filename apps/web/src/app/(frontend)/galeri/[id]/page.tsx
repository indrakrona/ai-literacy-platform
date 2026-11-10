import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '../../../../components/Shell'
import { Card } from '../../../../components/ui'
import { VoteButton } from '../../../../components/forms/EngagementForms'
import { ReportButton } from '../../../../components/ReportButton'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../lib/session'
import { galleryItems } from '../../../../lib/gallery'

export default async function GalleryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { locale } = await getDict()
  const id = locale === 'id'
  const user = await getCurrentUser()
  const p = (await galleryItems(await getPayloadClient(), locale, { id: { equals: Number((await params).id) } }, 1))[0]
  if (!p) notFound()
  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <Link href="/galeri" className="text-sm underline">{id ? '← Galeri proyek' : '← Project gallery'}</Link>
        <Card>
          <h1 className="text-2xl font-bold">{p.title}</h1>
          <p className="mt-1 text-muted">{p.team.join(', ')}{p.school ? ` · ${p.school}` : ''}</p>
          <p className="mt-4 whitespace-pre-line">{p.text}</p>
          {p.links.length > 0 && (
            <ul className="mt-3 text-sm">
              {p.links.map((l) => <li key={l}><a href={l} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline">{l}</a></li>)}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <VoteButton submissionId={p.id} votes={p.votes} canVote={Boolean(user) && !p.members.includes(user?.id ?? -1)} locale={locale} />
            {user && <ReportButton targetType="page" targetId={p.id} locale={locale} />}
          </div>
        </Card>
      </div>
    </Shell>
  )
}
