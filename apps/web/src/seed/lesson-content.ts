import type { Payload } from 'payload'
import { SMP_02 } from './lessons/smp-02'

const WRITTEN = [SMP_02]

/** Apply written lesson content (Bahasa Indonesia) and publish those lessons. */
export async function seedLessonContent(payload: Payload) {
  let published = 0
  for (const l of WRITTEN) {
    const track = (await payload.find({ collection: 'tracks', where: { slug: { equals: l.track } }, limit: 1 })).docs[0]
    if (!track) continue
    const units = await payload.find({ collection: 'units', where: { track: { equals: track.id } }, limit: 10, depth: 0 })
    const lesson = (
      await payload.find({
        collection: 'lessons',
        draft: true,
        where: { and: [{ unit: { in: units.docs.map((u) => u.id) } }, { order: { equals: l.order } }] },
        limit: 1,
      })
    ).docs[0]
    if (!lesson) continue
    await payload.update({
      collection: 'lessons',
      id: lesson.id,
      locale: 'id',
      data: { objective: l.objective, content: l.content, quiz: l.quiz, reviewState: 'in_review', _status: 'published' },
    })
    published++
  }
  return { published }
}
