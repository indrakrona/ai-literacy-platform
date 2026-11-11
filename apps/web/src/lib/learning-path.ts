/**
 * Learning paths (spec C8): the recommended next lesson for a student. With an AILIS result, the weakest
 * score domain points to its big idea, and the first unfinished lesson there is suggested; otherwise the
 * next unfinished lesson in order. Lessons are never locked: earlier sessions are only recommended first.
 */
import type { Payload } from 'payload'
import { BIG_IDEAS, DOMAIN_OF_BIG_IDEA, SCORE_DOMAINS, type BigIdea, type ScoreDomain } from '@ailit/shared'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

export type Lite = { id: number; order: number; title: string; bigIdea: BigIdea; track: string }

/** Pure choice of the next lesson. `lessons` must be in track order. */
export function chooseNext(lessons: Lite[], done: Set<number>, subScores?: Partial<Record<ScoreDomain, number>> | null): { lesson: Lite; reason: 'weak_domain' | 'next'; domain?: ScoreDomain } | null {
  const open = lessons.filter((l) => !done.has(l.id))
  if (!open.length) return null
  if (subScores) {
    const weakest = [...SCORE_DOMAINS].filter((d) => typeof subScores[d] === 'number').sort((a, b) => subScores[a]! - subScores[b]!)[0]
    const bigIdea = weakest ? BIG_IDEAS.find((b) => DOMAIN_OF_BIG_IDEA[b] === weakest) : undefined
    const pick = bigIdea ? open.find((l) => l.bigIdea === bigIdea) : undefined
    if (pick && weakest && (subScores[weakest] ?? 100) < 70) return { lesson: pick, reason: 'weak_domain', domain: weakest }
  }
  return { lesson: open[0]!, reason: 'next' }
}

/** Load the student's track lessons, completions and latest AILIS sub-scores, then choose. */
export async function recommendNext(payload: Payload, userId: number, locale: 'id' | 'en') {
  const klass = (await payload.find({ collection: 'classes', overrideAccess: true, depth: 1, limit: 5, where: { students: { contains: userId } } })).docs.find((c) => c.track)
  let trackId = idOf(klass?.track)
  if (!trackId) {
    // Not in a class with a track: use the track of their latest lesson, if any.
    const last = (await payload.find({ collection: 'lesson-progress', overrideAccess: true, depth: 2, limit: 1, sort: '-updatedAt', where: { user: { equals: userId } } })).docs[0]
    const lesson = last && typeof last.lesson === 'object' ? last.lesson : null
    trackId = lesson && typeof lesson.unit === 'object' ? idOf(lesson.unit.track) : null
  }
  if (!trackId) return null
  const track = await payload.findByID({ collection: 'tracks', id: trackId, depth: 0, locale, overrideAccess: true })
  const units = (await payload.find({ collection: 'units', overrideAccess: true, depth: 0, limit: 20, where: { track: { equals: trackId } } })).docs
  const bigIdeaOf = new Map(units.map((u) => [u.id, u.bigIdea as BigIdea]))
  const lessons = (await payload.find({ collection: 'lessons', overrideAccess: true, depth: 0, locale, limit: 60, sort: 'order', where: { and: [{ unit: { in: units.map((u) => u.id) } }, { _status: { equals: 'published' } }] } })).docs.map(
    (l) => ({ id: l.id, order: l.order, title: l.title, bigIdea: bigIdeaOf.get(idOf(l.unit)!) ?? 'discover', track: track.slug }) as Lite,
  )
  const done = new Set((await payload.find({ collection: 'lesson-progress', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { and: [{ user: { equals: userId } }, { status: { equals: 'completed' } }] } })).docs.map((p) => idOf(p.lesson)!))
  const attempt = (await payload.find({ collection: 'test-attempts', overrideAccess: true, depth: 0, limit: 1, sort: '-updatedAt', where: { and: [{ candidate: { equals: userId } }, { status: { equals: 'scored' } }] } })).docs[0]
  const sub = (attempt?.report as { subScores?: Record<ScoreDomain, number> } | null)?.subScores ?? null
  const choice = chooseNext(lessons, done, sub)
  return choice ? { ...choice, trackTitle: track.title, done: done.size, total: lessons.length } : { lesson: null, trackTitle: track.title, done: done.size, total: lessons.length }
}

/** Earlier sessions of the same track the student has not finished (shown as a gentle note, never a lock). */
export async function unfinishedBefore(payload: Payload, userId: number, lesson: { id: number; order: number; unit?: unknown }) {
  const unit = await payload.findByID({ collection: 'units', id: idOf(lesson.unit)!, depth: 0, overrideAccess: true }).catch(() => null)
  if (!unit) return []
  const units = (await payload.find({ collection: 'units', overrideAccess: true, depth: 0, limit: 20, where: { track: { equals: idOf(unit.track) } } })).docs.map((u) => u.id)
  const earlier = (await payload.find({ collection: 'lessons', overrideAccess: true, depth: 0, limit: 60, where: { and: [{ unit: { in: units } }, { order: { less_than: lesson.order } }, { _status: { equals: 'published' } }] } })).docs
  if (!earlier.length) return []
  const done = new Set((await payload.find({ collection: 'lesson-progress', overrideAccess: true, depth: 0, limit: 100, where: { and: [{ user: { equals: userId } }, { status: { equals: 'completed' } }, { lesson: { in: earlier.map((l) => l.id) } }] } })).docs.map((p) => idOf(p.lesson)))
  return earlier.filter((l) => !done.has(l.id)).map((l) => l.order).sort((a, b) => a - b)
}
