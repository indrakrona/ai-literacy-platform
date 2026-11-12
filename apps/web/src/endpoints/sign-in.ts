import type { CollectionConfig, Endpoint, PayloadRequest } from 'payload'
import { randomBytes } from 'node:crypto'
import { checkLoginCode, createLoginCode, CODE_MINUTES, findByIdentifier, googleAuthUrl, googleConfigured, googleIdentity, issueSession } from '../lib/sign-in'
import { sendWhatsApp } from '../lib/whatsapp'
import { escapeHtml } from '../lib/emails'
import { siteUrl } from '../lib/site-url'

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } })

async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    return ((req.json ? await req.json() : {}) ?? {}) as Record<string, unknown>
  } catch {
    return {}
  }
}

/**
 * POST /api/users/otp/request {identifier} — send a 6-digit code to the account's email (or WhatsApp when a
 * phone number is given). Always answers the same way, so it does not reveal whether an account exists.
 */
export const otpRequest: Endpoint = {
  path: '/otp/request',
  method: 'post',
  handler: async (req) => {
    const identifier = String((await body(req)).identifier ?? '').slice(0, 200)
    const user = await findByIdentifier(req.payload, identifier)
    if (user && !user.suspended) {
      const viaWhatsApp = !identifier.includes('@') && Boolean(user.phone)
      const code = await createLoginCode(req.payload, user.id, viaWhatsApp ? 'whatsapp' : 'email')
      if (code) {
        const locale = user.preferredLocale === 'en' ? 'en' : 'id'
        if (viaWhatsApp) {
          await sendWhatsApp(req.payload, { to: user.phone, template: 'login_code', locale, params: [code] })
        } else {
          const id = locale === 'id'
          await req.payload
            .sendEmail({
              to: user.email,
              subject: id ? `Kode masuk AI Literacy: ${code}` : `AI Literacy sign-in code: ${code}`,
              html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#16130F"><p>${id ? 'Kode masuk Anda' : 'Your sign-in code'}:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${escapeHtml(code)}</p><p style="color:#6B655D;font-size:13px">${id ? `Berlaku ${CODE_MINUTES} menit. Jangan bagikan kode ini kepada siapa pun. Abaikan email ini jika Anda tidak memintanya.` : `Valid for ${CODE_MINUTES} minutes. Never share this code. Ignore this email if you did not ask for it.`}</p></div>`,
            })
            .catch((e: Error) => req.payload.logger.warn(`login code email failed: ${e.message}`))
        }
      }
    }
    return json({ sent: true })
  },
}

/** POST /api/users/otp/verify {identifier, code} — sign in with the code; sets the session cookie. */
export const otpVerify: Endpoint = {
  path: '/otp/verify',
  method: 'post',
  handler: async (req) => {
    const b = await body(req)
    const user = await findByIdentifier(req.payload, String(b.identifier ?? ''))
    if (!user) return json({ error: 'wrong', problem: 'wrong' }, 400)
    if (user.suspended) return json({ error: 'suspended', problem: 'suspended' }, 403)
    const result = await checkLoginCode(req.payload, user.id, String(b.code ?? ''))
    if (result !== 'ok') return json({ error: result, problem: result }, result === 'too_many' ? 429 : 400)
    const cookie = await issueSession(req, user, 'login code')
    return json({ ok: true }, 200, { 'Set-Cookie': cookie })
  },
}

const STATE_COOKIE = 'ailit-google'

/** GET /api/users/google/start — send the browser to Google (only when Google sign-in is configured). */
export const googleStart: Endpoint = {
  path: '/google/start',
  method: 'get',
  handler: async () => {
    if (!googleConfigured()) return json({ error: 'Google sign-in is not set up yet' }, 404)
    const state = randomBytes(16).toString('hex')
    const nonce = randomBytes(16).toString('hex')
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
    return new Response(null, { status: 302, headers: { Location: googleAuthUrl(state, nonce), 'Set-Cookie': `${STATE_COOKIE}=${state}.${nonce}; Path=/api/users/google; HttpOnly; SameSite=Lax; Max-Age=600${secure}` } })
  },
}

/**
 * GET /api/users/google/callback — Google returns here. Signs in the account with that verified email
 * (accounts are created through sign-up first, because under-18s need a birth date and parent consent).
 */
export const googleCallback: Endpoint = {
  path: '/google/callback',
  method: 'get',
  handler: async (req) => {
    const base = siteUrl()
    const back = (problem: string) => new Response(null, { status: 302, headers: { Location: `${base}/masuk?google=${problem}`, 'Set-Cookie': `${STATE_COOKIE}=; Path=/api/users/google; Max-Age=0` } })
    if (!googleConfigured()) return back('off')
    const url = new URL(req.url ?? base)
    const cookie = (req.headers.get('cookie') ?? '').split(/;\s*/).find((c) => c.startsWith(`${STATE_COOKIE}=`))?.slice(STATE_COOKIE.length + 1) ?? ''
    const [state, nonce] = cookie.split('.')
    if (!state || state !== url.searchParams.get('state') || !url.searchParams.get('code')) return back('failed')
    let who
    try {
      who = await googleIdentity(url.searchParams.get('code')!, nonce ?? '')
    } catch (e) {
      req.payload.logger.warn(`google sign-in failed: ${(e as Error).message}`)
      return back('failed')
    }
    const user = (await req.payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 1, where: { email: { equals: who.email } } })).docs[0] as { id: number; email: string; suspended?: boolean; googleSub?: string | null } | undefined
    if (!user) return back('no_account')
    if (user.suspended) return back('suspended')
    if (user.googleSub && user.googleSub !== who.sub) return back('failed')
    if (!user.googleSub) {
      await req.payload.update({ collection: 'users', id: user.id, overrideAccess: true, data: { googleSub: who.sub } as never })
      // Adding the session saves the user record it is given, so give it the updated one.
      user.googleSub = who.sub
    }
    const session = await issueSession(req, user, 'google')
    const headers = new Headers({ Location: `${base}/beranda` })
    headers.append('Set-Cookie', session)
    headers.append('Set-Cookie', `${STATE_COOKIE}=; Path=/api/users/google; Max-Age=0`)
    return new Response(null, { status: 302, headers })
  },
}

export const LoginCodes: CollectionConfig = {
  slug: 'login-codes',
  admin: { hidden: true },
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'codeHash', type: 'text', required: true },
    { name: 'channel', type: 'select', options: ['email', 'whatsapp'].map((v) => ({ value: v, label: v })) },
    { name: 'attempts', type: 'number', defaultValue: 0 },
    { name: 'expiresAt', type: 'date', required: true },
    { name: 'usedAt', type: 'date' },
  ],
}
