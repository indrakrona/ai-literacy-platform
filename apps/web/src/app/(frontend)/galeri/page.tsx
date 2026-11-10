import type { Metadata } from 'next'
import Link from 'next/link'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { VoteButton } from '../../../components/forms/EngagementForms'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { galleryItems } from '../../../lib/gallery'

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDict()
  return { title: locale === 'id' ? 'Galeri proyek · AI Literacy' : 'Project gallery · AI Literacy' }
}

/** Showcase gallery (spec F5): projects published with every member's (and parents') consent. */
export default async function GalleryPage() {
  const { locale } = await getDict()
  const id = locale === 'id'
  const user = await getCurrentUser()
  const items = await galleryItems(await getPayloadClient(), locale)
  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">{id ? 'Galeri proyek' : 'Project gallery'}</h1>
          <p className="mt-1 text-muted">{id ? 'Proyek pilihan guru yang dipublikasikan dengan persetujuan siswa dan orang tua.' : 'Projects picked by teachers and published with the consent of students and parents.'}</p>
        </div>
        {items.length === 0 ? (
          <Card><p className="text-muted">{id ? 'Belum ada proyek di galeri.' : 'No projects in the gallery yet.'}</p></Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <li key={p.id} className="flex flex-col rounded-2xl border border-line bg-white p-4">
                <Link href={`/galeri/${p.id}`} className="font-semibold underline-offset-2 hover:underline">{p.title}</Link>
                <p className="mt-1 text-sm text-muted">{p.team.join(', ')}{p.school ? ` · ${p.school}` : ''}</p>
                <p className="mt-2 line-clamp-4 text-sm">{p.text}</p>
                <div className="mt-auto pt-3">
                  <VoteButton submissionId={p.id} votes={p.votes} canVote={Boolean(user) && !p.members.includes(user?.id ?? -1)} locale={locale} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {!user && <p className="text-sm text-muted">{id ? 'Masuk untuk memberi suara.' : 'Sign in to vote.'}</p>}
      </div>
    </Shell>
  )
}
