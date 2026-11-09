import type { CollectionConfig, Endpoint } from 'payload'
import { hasRole } from '@ailit/shared'
import { z } from 'zod'
import { escapeHtml } from '../lib/emails'
import { notify } from '../lib/notify'

const schema = z.object({
  schoolName: z.string().trim().min(3).max(160),
  npsn: z.string().trim().regex(/^\d{8}$/).optional().or(z.literal('').transform(() => undefined)),
  level: z.enum(['smp', 'sma', 'smk', 'other']),
  city: z.string().trim().min(2).max(80),
  province: z.string().trim().min(2).max(80),
  contactName: z.string().trim().min(2).max(120),
  contactRole: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{7,18}$/).optional().or(z.literal('').transform(() => undefined)),
  students: z.coerce.number().int().min(1).max(10000).optional(),
  message: z.string().trim().max(1500).optional(),
  locale: z.enum(['id', 'en']).default('id'),
  /** Honeypot: real people never fill this. */
  website: z.string().max(0).optional(),
})

const recentByIp = new Map<string, number[]>()

/** POST /api/pilot-requests/submit — public form on the website (spec A8). */
const submit: Endpoint = {
  path: '/submit',
  method: 'post',
  handler: async (req) => {
    let raw: unknown = {}
    try {
      raw = (req.json ? await req.json() : {}) ?? {}
    } catch {
      /* empty */
    }
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return Response.json({ error: `${first?.path.join('.')}: ${first?.message}`, field: first?.path[0] }, { status: 400 })
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const now = Date.now()
    const hits = (recentByIp.get(ip) ?? []).filter((t) => now - t < 3600_000)
    if (hits.length >= 5) return Response.json({ error: 'Too many requests, please try again later' }, { status: 429 })
    recentByIp.set(ip, [...hits, now])

    const { website: _hp, locale, ...data } = parsed.data
    const doc = await req.payload.create({ collection: 'pilot-requests', overrideAccess: true, data: { ...data, locale, status: 'new' } })

    // Tell the team: in-app for super admins, email to the addresses in Site settings.
    const admins = await req.payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 20, where: { roles: { contains: 'super_admin' } } })
    await notify(req.payload, {
      userIds: admins.docs.map((u) => u.id),
      kind: 'pilot_request',
      vars: { school: data.schoolName, city: data.city },
      link: `/admin/collections/pilot-requests/${doc.id}`,
      email: false,
    })
    const settings = await req.payload.findGlobal({ slug: 'site-settings', overrideAccess: true }).catch(() => null)
    const rows = Object.entries(data).map(([k, v]) => `<tr><td style="padding:2px 8px 2px 0;color:#6B655D">${k}</td><td>${escapeHtml(String(v ?? ''))}</td></tr>`).join('')
    for (const r of settings?.pilotNotifyEmails ?? []) {
      await req.payload
        .sendEmail({ to: r.email, subject: `Permintaan pilot baru: ${data.schoolName} (${data.city})`, html: `<div style="font-family:Arial,sans-serif"><p><b>Permintaan pilot baru</b></p><table>${rows}</table></div>` })
        .catch(() => undefined)
    }
    // Confirmation to the school.
    const confirm =
      locale === 'en'
        ? { subject: 'We received your pilot request', body: `Thank you, ${escapeHtml(data.contactName)}. We have received the request from ${escapeHtml(data.schoolName)} and will contact you within 5 working days.` }
        : { subject: 'Permintaan pilot Anda sudah kami terima', body: `Terima kasih, Bapak/Ibu ${escapeHtml(data.contactName)}. Permintaan dari ${escapeHtml(data.schoolName)} sudah kami terima. Tim kami akan menghubungi Anda dalam 5 hari kerja.` }
    await req.payload
      .sendEmail({ to: data.email, subject: confirm.subject, html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#16130F;max-width:560px"><p>${confirm.body}</p><p style="color:#6B655D;font-size:13px">Impact Thinklab · AI Literacy</p></div>` })
      .catch(() => undefined)
    return Response.json({ ok: true }, { status: 201 })
  },
}

export const PilotRequests: CollectionConfig = {
  slug: 'pilot-requests',
  admin: { group: 'Business', useAsTitle: 'schoolName', defaultColumns: ['schoolName', 'city', 'level', 'status', 'createdAt'], description: 'Schools that asked to join the pilot from the website.' },
  access: {
    read: ({ req }) => hasRole(req.user as { roles?: string[] }, 'super_admin'),
    create: () => false,
    update: ({ req }) => hasRole(req.user as { roles?: string[] }, 'super_admin'),
    delete: ({ req }) => hasRole(req.user as { roles?: string[] }, 'super_admin'),
  },
  endpoints: [submit],
  fields: [
    { type: 'row', fields: [{ name: 'schoolName', type: 'text', required: true }, { name: 'npsn', label: 'NPSN', type: 'text' }, { name: 'level', type: 'select', required: true, options: ['smp', 'sma', 'smk', 'other'].map((v) => ({ value: v, label: v.toUpperCase() })) }] },
    { type: 'row', fields: [{ name: 'city', type: 'text', required: true }, { name: 'province', type: 'text', required: true }, { name: 'students', label: 'Approx. students', type: 'number' }] },
    { type: 'row', fields: [{ name: 'contactName', type: 'text', required: true }, { name: 'contactRole', type: 'text', required: true }] },
    { type: 'row', fields: [{ name: 'email', type: 'email', required: true }, { name: 'phone', type: 'text' }] },
    { name: 'message', type: 'textarea' },
    { name: 'locale', type: 'text' },
    { name: 'status', type: 'select', required: true, defaultValue: 'new', index: true, options: ['new', 'contacted', 'meeting', 'accepted', 'declined'].map((v) => ({ value: v, label: v })) },
    { name: 'internalNotes', type: 'textarea' },
  ],
}
