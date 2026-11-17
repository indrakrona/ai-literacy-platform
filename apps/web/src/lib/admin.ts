import { randomBytes } from 'node:crypto'
import type { Payload } from 'payload'

/**
 * Create a platform super admin, or promote an existing account. Without a password a random one is set that
 * nobody knows; the person then chooses their own with "Lupa kata sandi" (forgot password).
 */
export async function createOrPromoteAdmin(payload: Payload, input: { email: string; password?: string; name?: string }) {
  const email = input.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid email is required')
  if (input.password !== undefined && input.password.length < 10) throw new Error('Password must be at least 10 characters')
  const password = input.password ?? randomBytes(24).toString('base64url')
  const existing = (await payload.find({ collection: 'users', overrideAccess: true, limit: 1, where: { email: { equals: email } } })).docs[0]
  if (existing) {
    const roles = Array.from(new Set([...((existing.roles as string[]) ?? []), 'super_admin']))
    await payload.update({ collection: 'users', id: existing.id, overrideAccess: true, data: { roles, ...(input.password ? { password } : {}) } as never })
    return { status: 'promoted' as const, id: existing.id, email, passwordSet: Boolean(input.password) }
  }
  const user = await payload.create({ collection: 'users', overrideAccess: true, data: { email, password, name: input.name?.trim() || 'Platform admin', roles: ['super_admin'], dateOfBirth: '1990-01-01' } as never })
  return { status: 'created' as const, id: user.id, email, passwordSet: Boolean(input.password) }
}
