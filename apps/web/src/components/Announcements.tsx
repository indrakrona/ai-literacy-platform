import Link from 'next/link'
import { announcementsFor } from '../collections/Announcements'
import { getPayloadClient } from '../lib/session'

/** Active announcements for the signed-in user (spec L4). `limit` shows the newest few with a link to all. */
export async function Announcements({ user, locale, limit }: { user: { id: number; roles?: string[] | null; school?: unknown }; locale: 'id' | 'en'; limit?: number }) {
  const all = await announcementsFor(await getPayloadClient(), user, locale)
  if (!all.length) return null
  const shown = limit ? all.slice(0, limit) : all
  const id = locale === 'id'
  const date = (d: string) => new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', timeZone: 'Asia/Jakarta' })
  return (
    <section aria-label={id ? 'Pengumuman' : 'Announcements'} className="flex flex-col gap-3">
      {shown.map((a) => (
        <article key={a.id} id={`a${a.id}`} className="rounded-2xl border border-brand/40 bg-brand/10 p-4">
          <p className="text-xs font-semibold tracking-wide text-brand-deep uppercase">
            {id ? 'Pengumuman' : 'Announcement'} · {a.scope === 'platform' ? 'AI Literacy' : id ? 'Sekolah' : 'School'} · {date(a.startsAt)}
          </p>
          <h2 className="mt-1 font-semibold">{a.title}</h2>
          <p className="mt-1 text-sm whitespace-pre-line">{a.body}</p>
        </article>
      ))}
      {limit && all.length > limit && (
        <Link href="/pengumuman" className="text-sm underline">
          {id ? `Lihat semua pengumuman (${all.length})` : `See all announcements (${all.length})`}
        </Link>
      )}
    </section>
  )
}
