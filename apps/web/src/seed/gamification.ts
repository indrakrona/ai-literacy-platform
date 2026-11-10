import type { Payload } from 'payload'
import { award, bigIdeaFromCompetency, DEFAULT_RULES, getRules } from '../lib/gamification'

type L = { id: string; en: string }
const BADGES: { slug: string; icon: string; name: L; description: L; criterion: string; target: number; bigIdea?: string; order: number }[] = [
  { slug: 'langkah-pertama', icon: '🚀', name: { id: 'Langkah Pertama', en: 'First Step' }, description: { id: 'Menyelesaikan pelajaran pertama.', en: 'Completed your first lesson.' }, criterion: 'lessons_total', target: 1, order: 1 },
  { slug: 'penjelajah', icon: '🔭', name: { id: 'Penjelajah AI', en: 'AI Explorer' }, description: { id: 'Menyelesaikan 3 pelajaran Mengenal.', en: 'Completed 3 Discover lessons.' }, criterion: 'lessons_in_big_idea', target: 3, bigIdea: 'discover', order: 2 },
  { slug: 'pemeriksa', icon: '🔍', name: { id: 'Pemeriksa Fakta', en: 'Fact Checker' }, description: { id: 'Menyelesaikan 3 pelajaran Memahami.', en: 'Completed 3 Understand lessons.' }, criterion: 'lessons_in_big_idea', target: 3, bigIdea: 'understand', order: 3 },
  { slug: 'kreator', icon: '🎨', name: { id: 'Kreator Jujur', en: 'Honest Creator' }, description: { id: 'Menyelesaikan 3 pelajaran Berkarya.', en: 'Completed 3 Create lessons.' }, criterion: 'lessons_in_big_idea', target: 3, bigIdea: 'create', order: 4 },
  { slug: 'perisai', icon: '🛡️', name: { id: 'Perisai Data', en: 'Data Shield' }, description: { id: 'Menyelesaikan 3 pelajaran Melindungi.', en: 'Completed 3 Protect lessons.' }, criterion: 'lessons_in_big_idea', target: 3, bigIdea: 'protect', order: 5 },
  { slug: 'pembaru', icon: '🌱', name: { id: 'Pembawa Perubahan', en: 'Changemaker' }, description: { id: 'Menyelesaikan 3 pelajaran Berkembang.', en: 'Completed 3 Thrive lessons.' }, criterion: 'lessons_in_big_idea', target: 3, bigIdea: 'thrive', order: 6 },
  { slug: 'peneliti', icon: '🧪', name: { id: 'Peneliti Teliti', en: 'Careful Researcher' }, description: { id: 'Menyelesaikan 5 sesi AI Lab.', en: 'Completed 5 AI Lab sessions.' }, criterion: 'ai_lab_sessions', target: 5, order: 7 },
  { slug: 'pembuat-proyek', icon: '🛠️', name: { id: 'Pembuat Proyek', en: 'Project Maker' }, description: { id: 'Proyek pertama sudah dinilai guru.', en: 'Your first project was marked by your teacher.' }, criterion: 'projects_graded', target: 1, order: 8 },
  { slug: 'juara-tantangan', icon: '🏁', name: { id: 'Penuntas Tantangan', en: 'Challenge Finisher' }, description: { id: 'Menyelesaikan satu tantangan kelas.', en: 'Finished a class challenge.' }, criterion: 'challenges_completed', target: 1, order: 9 },
  { slug: 'lima-gagasan', icon: '⭐', name: { id: 'Lima Gagasan', en: 'All Five Ideas' }, description: { id: 'Mencapai Lv 2 di kelima gagasan besar.', en: 'Reached Lv 2 in all five big ideas.' }, criterion: 'all_big_ideas_level', target: 2, order: 10 },
  { slug: 'lulus-jalur', icon: '🎓', name: { id: 'Lulus Jalur', en: 'Track Graduate' }, description: { id: 'Menyelesaikan 18 pelajaran.', en: 'Completed 18 lessons.' }, criterion: 'lessons_total', target: 18, order: 11 },
]

const LEVEL_NAMES: L[] = [
  { id: 'Pemula', en: 'Beginner' },
  { id: 'Penjelajah', en: 'Explorer' },
  { id: 'Terampil', en: 'Skilled' },
  { id: 'Cakap', en: 'Proficient' },
  { id: 'Mahir', en: 'Advanced' },
]

export async function seedGamification(payload: Payload) {
  for (const b of BADGES) {
    const data = { slug: b.slug, icon: b.icon, name: b.name.id, description: b.description.id, criterion: b.criterion as never, target: b.target, bigIdea: (b.bigIdea ?? null) as never, order: b.order, active: true }
    const ex = (await payload.find({ collection: 'badges', where: { slug: { equals: b.slug } }, limit: 1, depth: 0 })).docs[0]
    const doc = ex ? await payload.update({ collection: 'badges', id: ex.id, locale: 'id', data }) : await payload.create({ collection: 'badges', locale: 'id', data })
    await payload.update({ collection: 'badges', id: doc.id, locale: 'en', data: { name: b.name.en, description: b.description.en } })
  }
  const g = await payload.findGlobal({ slug: 'gamification' })
  if (!g.levelThresholds?.length) {
    const rows = DEFAULT_RULES.levelThresholds.map((xp, i) => ({ xp, name: LEVEL_NAMES[i]?.id }))
    const saved = await payload.updateGlobal({ slug: 'gamification', locale: 'id', data: { ...DEFAULT_RULES, levelThresholds: rows } })
    await payload.updateGlobal({ slug: 'gamification', locale: 'en', data: { levelThresholds: (saved.levelThresholds ?? []).map((r, i) => ({ id: r.id, xp: r.xp, name: LEVEL_NAMES[i]?.en })) } })
  }
  // Backfill: lessons completed before gamification existed earn their XP once (the ledger prevents doubles).
  const rules = await getRules(payload)
  const done = await payload.find({ collection: 'lesson-progress', overrideAccess: true, depth: 1, pagination: false, limit: 0, where: { status: { equals: 'completed' } } })
  let backfilled = 0
  for (const lp of done.docs) {
    const lesson = typeof lp.lesson === 'object' ? lp.lesson : null
    const userId = typeof lp.user === 'object' ? lp.user.id : lp.user
    if (lesson && (await award(payload, { userId, source: 'lesson_complete', sourceId: lesson.id, bigIdea: bigIdeaFromCompetency(lesson.competency), xp: rules.lessonComplete }))) backfilled++
  }
  return { badges: BADGES.length, backfilled }
}
