/**
 * Create (or promote) the first platform super admin on a fresh server.
 *   ADMIN_EMAIL=you@impact.id ADMIN_PASSWORD='…' ADMIN_NAME='Your Name' pnpm --filter web payload run src/seed/create-admin.ts
 * In the self-host stack: docker compose … --profile tools run --rm tools create-admin (see docs/hosting.md).
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { createOrPromoteAdmin } from '../lib/admin'

const email = process.env.ADMIN_EMAIL?.trim()
const password = process.env.ADMIN_PASSWORD
if (!email || !password || password.length < 10) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters).')
  process.exit(1)
}
const payload = await getPayload({ config })
const result = await createOrPromoteAdmin(payload, { email, password, name: process.env.ADMIN_NAME })
payload.logger.info(result.status === 'created' ? `Created super admin ${result.email}. Sign in at /admin or /masuk.` : `Updated ${result.email}: super admin, password reset.`)
process.exit(0)
