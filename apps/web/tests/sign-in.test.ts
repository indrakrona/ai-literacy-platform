import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import config from '@payload-config'
import { createLoginCode, googleIdentity } from '../src/lib/sign-in'
import { googleCallback, googleStart, otpRequest, otpVerify } from '../src/endpoints/sign-in'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`
const mk = (extra: Record<string, unknown> = {}) =>
  payload.create({ collection: 'users', overrideAccess: true, data: { name: `U ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: ['student'], consentStatus: 'not_required', ...extra } as never })
type Ep = { handler: (r: PayloadRequest) => Promise<Response> }
const call = (ep: Ep | import('payload').Endpoint, body: unknown = {}, opts: { url?: string; cookie?: string } = {}) =>
  (ep as Ep).handler({ payload, user: null, url: opts.url ?? 'http://x/', json: async () => body, routeParams: {}, headers: new Headers(opts.cookie ? { cookie: opts.cookie } : {}) } as unknown as PayloadRequest)
const codesFor = async (userId: number) => (await payload.find({ collection: 'login-codes', overrideAccess: true, where: { user: { equals: userId } } })).totalDocs
const idToken = (claims: Record<string, unknown>) => `x.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.sig`

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.GOOGLE_CLIENT_ID
  delete process.env.GOOGLE_CLIENT_SECRET
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('one-time code sign-in', () => {
  it('answers the same for unknown accounts, limits requests, and signs in with a correct code', async () => {
    const u = await mk()
    expect((await call(otpRequest, { identifier: 'nobody@example.test' })).status).toBe(200)
    expect((await call(otpRequest, { identifier: u.email.toUpperCase() })).status).toBe(200)
    expect(await codesFor(u.id)).toBe(1)
    await call(otpRequest, { identifier: u.email })
    await call(otpRequest, { identifier: u.email })
    await call(otpRequest, { identifier: u.email }) // 4th within 15 minutes: not created
    expect(await codesFor(u.id)).toBe(3)

    const other = await mk()
    const code = (await createLoginCode(payload, other.id, 'email'))!
    expect((await call(otpVerify, { identifier: other.email, code: '000000' === code ? '111111' : '000000' })).status).toBe(400)
    const ok = await call(otpVerify, { identifier: other.email, code })
    expect(ok.status).toBe(200)
    const cookie = ok.headers.get('set-cookie')!
    expect(cookie).toMatch(/payload-token=/)
    const { user } = await payload.auth({ headers: new Headers({ cookie: cookie.split(';')[0]! }) })
    expect(user?.id).toBe(other.id)
    expect((await call(otpVerify, { identifier: other.email, code })).status).toBe(400) // used once
    const log = await payload.find({ collection: 'audit-logs', overrideAccess: true, where: { and: [{ action: { equals: 'login' } }, { docId: { equals: String(other.id) } }] } })
    expect(log.docs[0]?.summary).toBe('login code')
  })

  it('locks after five wrong tries, expires, refuses suspended accounts and uses WhatsApp for phone numbers', async () => {
    const u = await mk({ phone: '6281299990000' })
    const code = (await createLoginCode(payload, u.id, 'email'))!
    const wrong = code === '123456' ? '654321' : '123456'
    for (let i = 0; i < 4; i++) expect((await call(otpVerify, { identifier: u.email, code: wrong })).status).toBe(400)
    expect((await call(otpVerify, { identifier: u.email, code: wrong })).status).toBe(429)
    expect((await call(otpVerify, { identifier: u.email, code })).status).toBe(429) // even the right code now

    const v = await mk()
    const old = (await createLoginCode(payload, v.id, 'email', new Date(Date.now() - 11 * 60_000)))!
    expect(await (await call(otpVerify, { identifier: v.email, code: old })).json()).toMatchObject({ problem: 'expired' })

    const s = await mk({ suspended: true })
    const sc = (await createLoginCode(payload, s.id, 'email'))!
    expect((await call(otpVerify, { identifier: s.email, code: sc })).status).toBe(403)

    const w = await mk({ phone: '6281288880000' })
    await call(otpRequest, { identifier: '0812-8888-0000' })
    const row = (await payload.find({ collection: 'login-codes', overrideAccess: true, where: { user: { equals: w.id } } })).docs[0]
    expect(row?.channel).toBe('whatsapp')
  })
})

describe('Google sign-in', () => {
  const ok = { iss: 'https://accounts.google.com', aud: 'client-123', exp: Math.floor(Date.now() / 1000) + 600, nonce: 'n1', email_verified: true, email: 'Sari@Example.test', sub: 'g-1', name: 'Sari' }
  const tokenFetch = (claims: Record<string, unknown>) => vi.fn(async () => new Response(JSON.stringify({ id_token: idToken(claims) }), { status: 200 })) as unknown as typeof fetch

  it('checks the ID token’s issuer, audience, expiry, nonce and verified email', async () => {
    process.env.GOOGLE_CLIENT_ID = 'client-123'
    process.env.GOOGLE_CLIENT_SECRET = 'secret'
    expect(await googleIdentity('code', 'n1', tokenFetch(ok))).toEqual({ sub: 'g-1', email: 'sari@example.test', name: 'Sari' })
    await expect(googleIdentity('code', 'n1', tokenFetch({ ...ok, aud: 'other' }))).rejects.toThrow(/audience/)
    await expect(googleIdentity('code', 'n2', tokenFetch(ok))).rejects.toThrow(/nonce/)
    await expect(googleIdentity('code', 'n1', tokenFetch({ ...ok, email_verified: false }))).rejects.toThrow(/verified/)
    await expect(googleIdentity('code', 'n1', tokenFetch({ ...ok, exp: 1 }))).rejects.toThrow(/expired/)
    await expect(googleIdentity('code', 'n1', tokenFetch({ ...ok, iss: 'https://evil.example' }))).rejects.toThrow(/issuer/)
  })

  it('is off until configured, then signs in existing accounts only and binds the Google account', async () => {
    expect((await call(googleStart)).status).toBe(404)
    process.env.GOOGLE_CLIENT_ID = 'client-123'
    process.env.GOOGLE_CLIENT_SECRET = 'secret'
    const start = await call(googleStart)
    expect(start.status).toBe(302)
    expect(start.headers.get('location')).toContain('accounts.google.com')
    const [state, nonce] = start.headers.get('set-cookie')!.split(';')[0]!.split('=')[1]!.split('.')

    const email = `g${uniq()}@example.test`
    const back = (stateParam: string, claims: Record<string, unknown>) => {
      vi.stubGlobal('fetch', tokenFetch(claims))
      return call(googleCallback, {}, { url: `http://x/api/users/google/callback?code=abc&state=${stateParam}`, cookie: `ailit-google=${state}.${nonce}` })
    }
    expect((await back('tampered', { ...ok, nonce, email })).headers.get('location')).toContain('google=failed')
    expect((await back(state!, { ...ok, nonce, email })).headers.get('location')).toContain('google=no_account')

    const u = await mk({ email })
    const signed = await back(state!, { ...ok, nonce, email, sub: 'g-777' })
    expect(signed.headers.get('location')).toMatch(/\/beranda$/)
    expect(signed.headers.get('set-cookie')).toMatch(/payload-token=/)
    expect((await payload.findByID({ collection: 'users', id: u.id, overrideAccess: true })).googleSub).toBe('g-777')
    // A different Google account with the same email address is refused.
    expect((await back(state!, { ...ok, nonce, email, sub: 'g-other' })).headers.get('location')).toContain('google=failed')
  })
})
