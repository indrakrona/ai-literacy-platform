import type { Payload } from 'payload'
import { BIG_IDEAS, bigIdeaOf } from '@ailit/shared'
import { TRACKS, UNIT_TITLES } from './curriculum-data'

/**
 * Load (or update) both Phase 1 tracks. Safe to run repeatedly: tracks match by slug,
 * units by track + big idea, lessons by unit + session number. Lessons stay drafts
 * until content is written and reviewed.
 */
export async function seedCurriculum(payload: Payload) {
  const report = { tracks: 0, units: 0, lessons: 0 }
  for (const t of TRACKS) {
    const found = await payload.find({ collection: 'tracks', where: { slug: { equals: t.slug } }, limit: 1, draft: true })
    const trackData = { title: t.title.id, slug: t.slug, level: t.level, summary: t.summary.id, _status: 'published' as const }
    const track = found.docs[0]
      ? await payload.update({ collection: 'tracks', id: found.docs[0].id, locale: 'id', data: trackData })
      : await payload.create({ collection: 'tracks', locale: 'id', data: trackData })
    await payload.update({ collection: 'tracks', id: track.id, locale: 'en', data: { title: t.title.en, summary: t.summary.en } })
    report.tracks++

    for (const [i, idea] of BIG_IDEAS.entries()) {
      const u = await payload.find({
        collection: 'units',
        where: { and: [{ track: { equals: track.id } }, { bigIdea: { equals: idea } }] },
        limit: 1,
        draft: true,
      })
      const unitData = { title: UNIT_TITLES[idea].id, track: track.id, bigIdea: idea, order: i + 1, _status: 'published' as const }
      const unit = u.docs[0]
        ? await payload.update({ collection: 'units', id: u.docs[0].id, locale: 'id', data: unitData })
        : await payload.create({ collection: 'units', locale: 'id', data: unitData })
      await payload.update({ collection: 'units', id: unit.id, locale: 'en', data: { title: UNIT_TITLES[idea].en } })
      report.units++

      for (const l of t.lessons.filter((x) => bigIdeaOf(x.c) === idea)) {
        const existing = await payload.find({
          collection: 'lessons',
          where: { and: [{ unit: { equals: unit.id } }, { order: { equals: l.n } }] },
          limit: 1,
          draft: true,
        })
        const lessonData = {
          title: l.id,
          unit: unit.id,
          order: l.n,
          type: l.type,
          competency: l.c,
          alsoCovers: l.also ?? [],
          inCoreVersion: l.core,
          activity: l.activity,
          estimatedMinutes: t.level === 'smp' ? 80 : 90,
        }
        const lesson = existing.docs[0]
          ? await payload.update({ collection: 'lessons', id: existing.docs[0].id, locale: 'id', draft: true, data: lessonData })
          : await payload.create({ collection: 'lessons', locale: 'id', draft: true, data: lessonData })
        await payload.update({ collection: 'lessons', id: lesson.id, locale: 'en', draft: true, data: { title: l.en, activity: l.activity } })
        report.lessons++
      }
    }
  }
  return report
}
