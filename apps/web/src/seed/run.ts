import { getPayload } from 'payload'
import config from '@payload-config'
import { seedCurriculum } from './curriculum'
import { seedLessonContent } from './lesson-content'
import { seedItems } from './items'
import { seedAiActivities } from './ai-activities'

const payload = await getPayload({ config })
const report = await seedCurriculum(payload)
payload.logger.info(`Curriculum seeded: ${JSON.stringify(report)}`)
payload.logger.info(`Lesson content: ${JSON.stringify(await seedLessonContent(payload))}`)
payload.logger.info(`AILIS items: ${JSON.stringify(await seedItems(payload))}`)
payload.logger.info(`AI Lab: ${JSON.stringify(await seedAiActivities(payload))}`)
process.exit(0)
