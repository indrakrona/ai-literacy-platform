/**
 * Create (or promote) the first platform super admin on a fresh server.
 *   ADMIN_EMAIL=you@impact.id ADMIN_PASSWORD='…' ADMIN_NAME='Your Name' pnpm --filter web payload run src/seed/create-admin.ts
 * In the self-host stack: docker compose … --profile tools run --rm tools create-admin (see docs/hosting.md).
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD
const name = process.env.ADMIN_NAME?.trim() || 'Platform admin'
if (!email || !password || password.length < 10) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters).')
  process.exit(1)
}

const payload = await getPayload({ config })
const existing = (await payload.find({ collection: 'users', overrideAccess: true, limit: 1, where: { email: { equals: email } } })).docs[0]
if (existing) {
  const roles = Array.from(new Set([...((existing.roles as string[]) ?? []), 'super_admin']))
  await payload.update({ collection: 'users', id: existing.id, overrideAccess: true, data: { roles, password } as never })
  payload.logger.info(`Updated ${email}: super admin, password reset.`)
} else {
  await payload.create({ collection: 'users', overrideAccess: true, data: { email, password, name, roles: ['super_admin'], dateOfBirth: '1990-01-01' } as never })
  payload.logger.info(`Created super admin ${email}. Sign in at /admin or /masuk.`)
}
process.exit(0)
