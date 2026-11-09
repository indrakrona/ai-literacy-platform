import type { Payload } from 'payload'
import { BIG_IDEAS, type BigIdea } from '@ailit/shared'

export interface StudentRow {
  id: number
  name: string
  consentStatus: string
  completed: number
  byBigIdea: Record<BigIdea, number>
  lastActive: string | null
  flaggedChats: number
}

/** Class overview for a teacher: per-student progress against the class track's published lessons. */
export async function classOverview(payload: Payload, classId: number) {
  const klass = await payload.findByID({ collection: 'classes', id: classId, depth: 1, overrideAccess: true })
  const students = (klass.students ?? []).filter((s) => typeof s === 'object')
  const trackId = typeof klass.track === 'object' ? klass.track?.id : klass.track

  const units = trackId ? await payload.find({ collection: 'units', where: { track: { equals: trackId } }, limit: 10, depth: 0, overrideAccess: true }) : { docs: [] }
  const lessons = units.docs.length
    ? await payload.find({ collection: 'lessons', where: { and: [{ unit: { in: units.docs.map((u) => u.id) } }, { _status: { equals: 'published' } }] }, limit: 100, depth: 0, overrideAccess: true })
    : { docs: [] }
  const ideaOfLesson = new Map(lessons.docs.map((l) => [l.id, units.docs.find((u) => u.id === (typeof l.unit === 'object' ? l.unit.id : l.unit))?.bigIdea as BigIdea]))
  const totalByIdea = Object.fromEntries(BIG_IDEAS.map((b) => [b, lessons.docs.filter((l) => ideaOfLesson.get(l.id) === b).length])) as Record<BigIdea, number>

  const ids = students.map((s) => s.id)
  const progress = ids.length
    ? await payload.find({ collection: 'lesson-progress', where: { and: [{ user: { in: ids } }, { status: { equals: 'completed' } }] }, limit: 5000, depth: 0, overrideAccess: true })
    : { docs: [] }
  const chats = ids.length
    ? await payload.find({ collection: 'ai-conversations', where: { user: { in: ids } }, limit: 5000, depth: 0, overrideAccess: true, select: { user: true, flagged: true, updatedAt: true } })
    : { docs: [] }

  const rows: StudentRow[] = students.map((s) => {
    const mine = progress.docs.filter((p) => (typeof p.user === 'object' ? p.user.id : p.user) === s.id && ideaOfLesson.has(typeof p.lesson === 'object' ? p.lesson.id : p.lesson))
    const myChats = chats.docs.filter((c) => (typeof c.user === 'object' ? c.user.id : c.user) === s.id)
    const byBigIdea = Object.fromEntries(
      BIG_IDEAS.map((b) => {
        const done = mine.filter((p) => ideaOfLesson.get(typeof p.lesson === 'object' ? p.lesson.id : p.lesson) === b).length
        return [b, totalByIdea[b] ? Math.round((done / totalByIdea[b]) * 100) : 0]
      }),
    ) as Record<BigIdea, number>
    const dates = [...mine.map((p) => p.completedAt ?? p.updatedAt), ...myChats.map((c) => c.updatedAt)].filter(Boolean).sort()
    return {
      id: s.id,
      name: s.name,
      consentStatus: s.consentStatus ?? 'not_required',
      completed: mine.length,
      byBigIdea,
      lastActive: dates.at(-1) ?? null,
      flaggedChats: myChats.filter((c) => c.flagged).length,
    }
  })
  return { klass, rows, totalLessons: lessons.docs.length, totalByIdea, lessons: lessons.docs }
}

/** Students with no activity in the last N days (or never). */
export function inactive(rows: StudentRow[], days = 7, now = Date.now()) {
  return rows.filter((r) => !r.lastActive || now - new Date(r.lastActive).getTime() > days * 864e5)
}
