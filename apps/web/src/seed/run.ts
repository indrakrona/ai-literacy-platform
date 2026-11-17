import { getPayload } from 'payload'
import config from '@payload-config'
import { seedAll } from './all'

const payload = await getPayload({ config })
await seedAll(payload)
process.exit(0)
