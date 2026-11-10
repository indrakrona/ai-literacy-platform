/**
 * WhatsApp template messages (spec L2). Outside a 24-hour reply window, WhatsApp Business only allows
 * pre-approved templates, so every message here is a named template with numbered parameters. Templates
 * must be registered under exactly these names and texts (see docs/whatsapp.md) before going live.
 *
 * Providers (WHATSAPP_PROVIDER):
 *   console — default: messages are written to the server log (development, pilot without a provider)
 *   meta    — WhatsApp Cloud API (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID)
 *   off     — nothing is sent
 * Sending never throws: a failed message is logged and the action that triggered it carries on.
 */
import type { Payload } from 'payload'
import { normalizeIdPhone } from '@ailit/shared'

type Locale = 'id' | 'en'

export const WA_TEMPLATES = {
  consent_request: {
    params: ['student', 'link'],
    id: 'Halo, {{1}} mendaftar di platform AI Literacy Impact Thinklab. Karena belum 18 tahun, kami memerlukan izin orang tua/wali. Tinjau dan putuskan di sini: {{2}}',
    en: 'Hello, {{1}} has registered on the Impact Thinklab AI Literacy platform. Because they are under 18, we need a parent or guardian’s permission. Review and decide here: {{2}}',
  },
  test_reminder: {
    params: ['name', 'session', 'when', 'place'],
    id: 'Halo {{1}}, pengingat: tes AILIS "{{2}}" dimulai {{3}} di {{4}}. Bawa perangkat yang terisi daya dan datang 15 menit lebih awal.',
    en: 'Hi {{1}}, a reminder: the AILIS test "{{2}}" starts {{3}} at {{4}}. Bring a charged device and arrive 15 minutes early.',
  },
  weekly_summary: {
    params: ['parent', 'summary', 'link'],
    id: 'Halo {{1}}, ringkasan minggu ini dari AI Literacy: {{2}} Lihat detailnya: {{3}}',
    en: 'Hello {{1}}, this week on AI Literacy: {{2}} See the details: {{3}}',
  },
  score_ready: {
    params: ['name', 'link'],
    id: 'Halo {{1}}, hasil tes AILIS-mu sudah keluar. Lihat di sini: {{2}}',
    en: 'Hi {{1}}, your AILIS test result is ready. See it here: {{2}}',
  },
} as const

export type WaTemplate = keyof typeof WA_TEMPLATES

/** The text a template produces, for previews, the console provider and tests. */
export function renderWa(template: WaTemplate, locale: Locale, params: string[]): string {
  return WA_TEMPLATES[template][locale].replace(/\{\{(\d+)\}\}/g, (_, n) => params[Number(n) - 1] ?? '')
}

/** WhatsApp limits parameters: no new lines or tabs, no more than 4 spaces in a row, at most 1024 characters. */
export function cleanParam(s: string): string {
  return s.replace(/[\n\t\r]+/g, ' ').replace(/ {4,}/g, '   ').trim().slice(0, 1024)
}

export function whatsappProvider(): 'console' | 'meta' | 'off' {
  const p = (process.env.WHATSAPP_PROVIDER || 'console').toLowerCase()
  return p === 'meta' || p === 'off' ? p : 'console'
}

export interface WaResult {
  sent: boolean
  provider: string
  reason?: string
}

export async function sendWhatsApp(payload: Payload, input: { to?: string | null; template: WaTemplate; locale: Locale; params: string[] }): Promise<WaResult> {
  const provider = whatsappProvider()
  const to = normalizeIdPhone(input.to ?? '')
  if (!to) return { sent: false, provider, reason: 'no valid number' }
  if (provider === 'off') return { sent: false, provider, reason: 'off' }
  const params = input.params.map(cleanParam)
  if (params.length !== WA_TEMPLATES[input.template].params.length) return { sent: false, provider, reason: 'wrong parameter count' }
  if (provider === 'console') {
    payload.logger.info(`[whatsapp:console] to ${to.slice(0, 5)}… ${input.template}/${input.locale}: ${renderWa(input.template, input.locale, params)}`)
    return { sent: true, provider }
  }
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneId) return { sent: false, provider, reason: 'WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing' }
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: `ailit_${input.template}`,
          language: { code: input.locale === 'id' ? 'id' : 'en' },
          components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
        },
      }),
    })
    if (!res.ok) {
      const reason = `HTTP ${res.status}`
      payload.logger.warn(`whatsapp: ${input.template} failed: ${reason}`)
      return { sent: false, provider, reason }
    }
    return { sent: true, provider }
  } catch (e) {
    payload.logger.warn(`whatsapp: ${input.template} failed: ${(e as Error).message}`)
    return { sent: false, provider, reason: (e as Error).message }
  }
}
