import type { Payload, Where } from 'payload'
import { shownName } from './engagement'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

export type GalleryItem = { id: number; title: string; team: string[]; school: string | null; votes: number; text: string; links: string[]; members: number[]; showcaseAt?: string | null; event: number | null }

/** Published gallery projects with public-safe names (first name + initial for under-18s). */
export async function galleryItems(payload: Payload, locale: 'id' | 'en', where: Where = {}, limit = 60): Promise<GalleryItem[]> {
  const subs = (await payload.find({ collection: 'submissions', overrideAccess: true, depth: 0, limit, sort: '-votes', where: { and: [{ showcase: { equals: 'published' } }, where] } })).docs
  if (!subs.length) return []
  const memberIds = [...new Set(subs.flatMap((s) => (s.members ?? []).map(idOf)).filter(Boolean))] as number[]
  const [users, briefs, classes] = await Promise.all([
    payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: memberIds.length, where: { id: { in: memberIds } } }),
    payload.find({ collection: 'project-briefs', overrideAccess: true, depth: 0, locale, fallbackLocale: 'id', limit: 200, where: { id: { in: [...new Set(subs.map((s) => idOf(s.brief)))] as number[] } } }),
    payload.find({ collection: 'classes', overrideAccess: true, depth: 1, limit: 200, where: { id: { in: [...new Set(subs.map((s) => idOf(s.class)))] as number[] } } }),
  ])
  const u = new Map(users.docs.map((x) => [x.id, x]))
  const b = new Map(briefs.docs.map((x) => [x.id, x.title]))
  const c = new Map(classes.docs.map((x) => [x.id, typeof x.school === 'object' && x.school ? x.school.name : null]))
  return subs.map((s) => {
    const members = (s.members ?? []).map(idOf).filter(Boolean) as number[]
    return {
      id: s.id,
      title: b.get(idOf(s.brief)!) ?? '',
      team: members.map((m) => (u.get(m) ? shownName(u.get(m)!) : '')).filter(Boolean),
      school: c.get(idOf(s.class)!) ?? null,
      votes: s.votes ?? 0,
      text: s.text,
      links: (s.links ?? []).map((l) => l.url),
      members,
      showcaseAt: s.showcaseAt,
      event: idOf(s.event),
    }
  })
}
