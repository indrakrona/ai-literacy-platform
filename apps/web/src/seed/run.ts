import { getPayload } from 'payload'
import config from '@payload-config'
import { seedCurriculum } from './curriculum'

const payload = await getPayload({ config })
const report = await seedCurriculum(payload)
payload.logger.info(`Curriculum seeded: ${JSON.stringify(report)}`)
process.exit(0)
