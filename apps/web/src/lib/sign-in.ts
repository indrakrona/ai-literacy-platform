/**
 * Passwordless sign-in (spec B1, B3): one-time codes by email (or WhatsApp) and Google sign-in.
 * Both end in the same session Payload creates for a password login (same cookie, session list and audit),
 * and both refuse suspended accounts.
 */
import type { Payload, PayloadRequest } from 'payload'
import { getFieldsToSign, jwtSign } from 'payload'
import { addSessionToUser, generatePayloadCookie } from 'payload/shared'
import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { normalizeIdPhone } from '@ailit/shared'
import { audit, ipOf } from './audit'
import { siteUrl } from './site-url'

export const CODE_MINUTES = 10
export const CODE_ATTEMPTS = 5
export const CODES_PER_15_MIN = 3

type UserDoc = { id: number; email: string; name?: string; suspended?: boolean | null; phone?: string | null; preferredLocale?: string | null; googleSub?: string | null }

/** Create a logged-in session for this user and return the Set-Cookie header value. */
export async function issueSession(req: PayloadRequest, user: UserDoc, method: string): Promise<string> {
  if (user.suspended) throw new Error('suspended')
  const collection = req.payload.collections.users.config
  const fields: Record<string, unknown> = getFieldsToSign({ collectionConfig: collection, email: user.email, user: user as never })
  const { sid } = await addSessionToUser({ collectionConfig: collection, payload: req.payload, req, user: user as never })
  if (sid) fields.sid = sid
  const { token } = await jwtSign({ fieldsToSign: fields, secret: req.payload.secret, tokenExpiration: collection.auth.tokenExpiration })
  await audit(req.payload, { actor: user.id, action: 'login', collection: 'users', docId: user.id, summary: method, ip: ipOf(req) })
  return generatePayloadCookie({ collectionAuthConfig: collection.auth, cookiePrefix: req.payload.config.cookiePrefix, token }) as string
}

const hashCode = (code: string, userId: number) => createHash('sha256').update(`${process.env.PAYLOAD_SECRET || 'dev'}:${userId}:${code}`).digest('hex')

/** Find an account by email or Indonesian mobile number. */
export async function findByIdentifier(payload: Payload, identifier: string): Promise<UserDoc | null> {
  const value = identifier.trim().toLowerCase()
  if (!value) return null
  if (value.includes('@')) {
    return ((await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 1, where: { email: { equals: value } } })).docs[0] as UserDoc | undefined) ?? null
  }
  const phone = normalizeIdPhone(value)
  if (!phone) return null
  return ((await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 1, where: { phone: { equals: phone } } })).docs[0] as UserDoc | undefined) ?? null
}

/** Make and store a 6-digit code (only its hash is kept). Returns null when too many were requested. */
export async function createLoginCode(payload: Payload, userId: number, channel: 'email' | 'whatsapp', now = new Date()): Promise<string | null> {
  const since = new Date(now.getTime() - 15 * 60_000).toISOString()
  const recent = await payload.count({ collection: 'login-codes', overrideAccess: true, where: { and: [{ user: { equals: userId } }, { createdAt: { greater_than: since } }] } })
  if (recent.totalDocs >= CODES_PER_15_MIN) return null
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await payload.create({ collection: 'login-codes', overrideAccess: true, data: { user: userId, codeHash: hashCode(code, userId), channel, attempts: 0, expiresAt: new Date(now.getTime() + CODE_MINUTES * 60_000).toISOString() } })
  return code
}

/** Check a code: the newest unused, unexpired code for the user, with a limited number of tries. */
export async function checkLoginCode(payload: Payload, userId: number, code: string, now = new Date()): Promise<'ok' | 'wrong' | 'expired' | 'too_many'> {
  const row = (await payload.find({ collection: 'login-codes', overrideAccess: true, depth: 0, limit: 1, sort: '-createdAt', where: { and: [{ user: { equals: userId } }, { usedAt: { exists: false } }] } })).docs[0]
  if (!row || new Date(row.expiresAt) < now) return 'expired'
  if ((row.attempts ?? 0) >= CODE_ATTEMPTS) return 'too_many'
  const given = Buffer.from(hashCode(code.replace(/\D/g, ''), userId))
  const stored = Buffer.from(row.codeHash)
  if (given.length !== stored.length || !timingSafeEqual(given, stored)) {
    await payload.update({ collection: 'login-codes', id: row.id, overrideAccess: true, data: { attempts: (row.attempts ?? 0) + 1 } })
    return (row.attempts ?? 0) + 1 >= CODE_ATTEMPTS ? 'too_many' : 'wrong'
  }
  await payload.update({ collection: 'login-codes', id: row.id, overrideAccess: true, data: { usedAt: now.toISOString() } })
  return 'ok'
}

// ---------- Google ----------

export const googleConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
export const googleRedirectUri = () => `${siteUrl()}/api/users/google/callback`

export function googleAuthUrl(state: string, nonce: string): string {
  const q = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID ?? '', redirect_uri: googleRedirectUri(), response_type: 'code', scope: 'openid email profile', state, nonce, prompt: 'select_account' })
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`
}

export interface GoogleIdentity {
  sub: string
  email: string
  name?: string
}

/**
 * Exchange the authorization code for an ID token and check its claims. The token comes straight from
 * Google's token endpoint over HTTPS, so (as Google documents) its signature need not be checked again;
 * issuer, audience, expiry, nonce and verified email are checked here.
 */
export async function googleIdentity(code: string, nonce: string, fetchImpl: typeof fetch = fetch, now = Date.now()): Promise<GoogleIdentity> {
  const res = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID ?? '', client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '', redirect_uri: googleRedirectUri(), grant_type: 'authorization_code' }),
  })
  if (!res.ok) throw new Error(`token exchange failed (${res.status})`)
  const { id_token } = (await res.json()) as { id_token?: string }
  const part = id_token?.split('.')[1]
  if (!part) throw new Error('no id_token')
  const claims = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>
  if (!['https://accounts.google.com', 'accounts.google.com'].includes(String(claims.iss))) throw new Error('wrong issuer')
  if (claims.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error('wrong audience')
  if (Number(claims.exp) * 1000 < now) throw new Error('expired')
  if (claims.nonce !== nonce) throw new Error('nonce mismatch')
  if (claims.email_verified !== true || typeof claims.email !== 'string') throw new Error('email not verified')
  return { sub: String(claims.sub), email: claims.email.toLowerCase(), name: typeof claims.name === 'string' ? claims.name : undefined }
}
