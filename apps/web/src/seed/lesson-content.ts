import type { Payload } from 'payload'
import { EN_LESSONS } from './lessons-en'
import { SMP_02 } from './lessons/smp-02'
import { SMP_01, SMP_03, SMP_04, SMP_06 } from './lessons/smp-batch1'
import { SMP_07, SMP_08, SMP_10, SMP_11 } from './lessons/smp-batch2'
import { SMP_14, SMP_17, SMP_18 } from './lessons/smp-batch3'
import { SMA_01, SMA_02, SMA_03, SMA_06 } from './lessons/sma-batch1'
import { SMA_07, SMA_08, SMA_09, SMA_11 } from './lessons/sma-batch2'
import { SMA_12, SMA_13, SMA_16, SMA_18 } from './lessons/sma-batch3'
import { SMP_05, SMP_09, SMP_12, SMP_13, SMP_15, SMP_16 } from './lessons/smp-batch4'
import { SMA_04, SMA_05, SMA_10, SMA_14, SMA_15, SMA_17 } from './lessons/sma-batch4'

export const WRITTEN = [SMP_01, SMP_02, SMP_03, SMP_04, SMP_06, SMP_07, SMP_08, SMP_10, SMP_11, SMP_14, SMP_17, SMP_18,
  SMA_01, SMA_02, SMA_03, SMA_06, SMA_07, SMA_08, SMA_09, SMA_11,
  SMA_12, SMA_13, SMA_16, SMA_18,
  SMP_05, SMP_09, SMP_12, SMP_13, SMP_15, SMP_16,
  SMA_04, SMA_05, SMA_10, SMA_14, SMA_15, SMA_17]

const SIMULATORS: Record<string, string> = {
  'smp-ai-untuk-belajar-dan-integritas:2': 'shield-sort',
  'smp-ai-untuk-belajar-dan-integritas:3': 'program-vs-ai',
  'smp-ai-untuk-belajar-dan-integritas:6': 'data-trainer',
  'smp-ai-untuk-belajar-dan-integritas:7': 'fair-data',
  'smp-ai-untuk-belajar-dan-integritas:10': 'prompt-builder',
  'smp-ai-untuk-belajar-dan-integritas:13': 'fair-data',
  'smp-ai-untuk-belajar-dan-integritas:4': 'feed-bubble',
  'smp-ai-untuk-belajar-dan-integritas:8': 'hallucination-hunt',
  'smp-ai-untuk-belajar-dan-integritas:9': 'ai-or-human',
  'sma-smk-membangun-dengan-ai:4': 'feed-bubble',
  'sma-smk-membangun-dengan-ai:8': 'hallucination-hunt',
  'sma-smk-membangun-dengan-ai:9': 'prompt-battle',
  'sma-smk-membangun-dengan-ai:12': 'bias-fix',
  'sma-smk-membangun-dengan-ai:2': 'shield-sort',
  'sma-smk-membangun-dengan-ai:6': 'data-trainer',
}

/** Apply written lesson content (Bahasa Indonesia) and publish those lessons. */
export async function seedLessonContent(payload: Payload) {
  let published = 0
  let translated = 0
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
      data: {
        objective: l.objective,
        // The written lesson has its own Bahasa activity section; the English planning note stays on the 'en' locale only.
        activity: null,
        content: l.content,
        quiz: l.quiz,
        simulator: (SIMULATORS[`${l.track}:${l.order}`] ?? null) as never,
        reviewState: 'in_review',
        _status: 'published',
      },
    })
    published++
    const en = EN_LESSONS[`${l.track}:${l.order}`]
    if (en) {
      // Write the English text onto the same quiz rows so the answer key stays shared.
      const saved = await payload.findByID({ collection: 'lessons', id: lesson.id, locale: 'id', depth: 0 })
      const rows = saved.quiz ?? []
      await payload.update({
        collection: 'lessons',
        id: lesson.id,
        locale: 'en',
        data: {
          objective: en.objective,
          content: en.content,
          quiz: rows.map((row, i) => ({
            id: row.id,
            prompt: en.quiz[i]?.prompt ?? row.prompt,
            explanation: en.quiz[i]?.explanation ?? row.explanation,
            options: (row.options ?? []).map((o, j) => ({ id: o.id, correct: o.correct, text: en.quiz[i]?.options[j] ?? o.text })),
          })),
          _status: 'published',
        },
      })
      translated++
    }
  }
  return { published, translated }
}
