import type { Payload } from 'payload'
import { seedCurriculum } from './curriculum'
import { seedLessonContent } from './lesson-content'
import { seedItems, seedItemsEn } from './items'
import { seedAiActivities } from './ai-activities'
import { seedProjectBriefs } from './project-briefs'
import { seedSitePages } from './site-pages'
import { seedGamification } from './gamification'
import { seedKkaOutcomes } from './kka-outcomes'
import { seedHelpArticles } from './help-articles'
import { seedProducts } from './products'

/**
 * Load all curriculum and site content. Matches by slug or code, so it is safe to run twice, but it resets
 * seeded lessons to the seed text. Used by `pnpm seed` (src/seed/run.ts) and the ops endpoint on servers.
 */
export async function seedAll(payload: Payload) {
  const steps: [string, () => Promise<unknown>][] = [
    ['Curriculum', () => seedCurriculum(payload)],
    ['Lesson content', () => seedLessonContent(payload)],
    ['AILIS items', () => seedItems(payload)],
    ['AILIS items (English)', () => seedItemsEn(payload)],
    ['AI Lab', () => seedAiActivities(payload)],
    ['Projects', () => seedProjectBriefs(payload)],
    ['Website', () => seedSitePages(payload)],
    ['Gamification', () => seedGamification(payload)],
    ['KKA mapping (draft)', () => seedKkaOutcomes(payload)],
    ['Help centre', () => seedHelpArticles(payload)],
    ['Products (placeholder prices)', () => seedProducts(payload)],
  ]
  const report: Record<string, unknown> = {}
  for (const [name, run] of steps) {
    report[name] = await run()
    payload.logger.info(`${name}: ${JSON.stringify(report[name])}`)
  }
  return report
}
