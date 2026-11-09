import type { CollectionConfig, Endpoint } from 'payload'
import { hasRole } from '@ailit/shared'
import { redactPersonalData } from '@ailit/ai-gateway'
import { notify } from '../lib/notify'

export const REPORT_TARGETS = ['lesson', 'ai_reply', 'project_brief', 'test_item', 'page'] as const
export const REPORT_REASONS = ['wrong', 'harmful', 'inappropriate', 'broken', 'other'] as const
const REASON_LABEL: Record<(typeof REPORT_REASONS)[number], string> = {
  wrong: 'informasi keliru',
  harmful: 'berbahaya',
  inappropriate: 'tidak pantas',
  broken: 'tidak berfungsi',
  other: 'lainnya',
}
const STAFF = ['super_admin', 'content_editor'] as const

/** POST /api/reports/submit {targetType, targetId?, url?, reason, details?} — anyone signed in can report a problem (spec M3). */
const submit: Endpoint = {
  path: '/submit',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Sign in first' }, { status: 401 })
    let b: Record<string, unknown> = {}
    try {
      b = ((req.json ? await req.json() : {}) ?? {}) as Record<string, unknown>
    } catch {
      /* empty */
    }
    const targetType = REPORT_TARGETS.find((t) => t === b.targetType)
    const reason = REPORT_REASONS.find((r) => r === b.reason)
    if (!targetType || !reason) return Response.json({ error: 'targetType and reason are required' }, { status: 400 })
    // Students may type personal data into the box; store it redacted, like AI Lab messages.
    const details = typeof b.details === 'string' ? redactPersonalData(b.details.trim().slice(0, 1000)) : ''
    const url = typeof b.url === 'string' && b.url.startsWith('/') ? b.url.slice(0, 300) : undefined
    const recent = await req.payload.count({
      collection: 'reports',
      overrideAccess: true,
      where: { and: [{ reporter: { equals: req.user.id } }, { createdAt: { greater_than: new Date(Date.now() - 3600_000).toISOString() } }] },
    })
    if (recent.totalDocs >= 10) return Response.json({ error: 'Too many reports in the last hour' }, { status: 429 })
    const doc = await req.payload.create({
      collection: 'reports',
      overrideAccess: true,
      data: { reporter: req.user.id, targetType, targetId: b.targetId ? String(b.targetId).slice(0, 40) : undefined, url, reason, details, status: 'open' },
    })
    const staff = await req.payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 50, where: { roles: { in: [...STAFF] } } })
    await notify(req.payload, {
      userIds: staff.docs.map((u) => u.id),
      kind: 'report_received',
      vars: { reason: REASON_LABEL[reason], target: url ?? targetType },
      link: `/admin/collections/reports/${doc.id}`,
      email: reason === 'harmful',
    })
    return Response.json({ id: doc.id }, { status: 201 })
  },
}

export const Reports: CollectionConfig = {
  slug: 'reports',
  admin: { group: 'Content', defaultColumns: ['reason', 'targetType', 'url', 'status', 'createdAt'], description: 'Problems reported by users about content and AI replies.' },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (hasRole(req.user as { roles?: string[] }, ...STAFF)) return true
      return { reporter: { equals: req.user.id } }
    },
    create: () => false,
    update: ({ req }) => hasRole(req.user as { roles?: string[] }, ...STAFF),
    delete: ({ req }) => hasRole(req.user as { roles?: string[] }, 'super_admin'),
  },
  endpoints: [submit],
  fields: [
    { name: 'reporter', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
    { type: 'row', fields: [
      { name: 'targetType', type: 'select', required: true, options: REPORT_TARGETS.map((v) => ({ value: v, label: v.replace('_', ' ') })), admin: { readOnly: true } },
      { name: 'targetId', type: 'text', admin: { readOnly: true } },
      { name: 'reason', type: 'select', required: true, options: REPORT_REASONS.map((v) => ({ value: v, label: v })), admin: { readOnly: true } },
    ] },
    { name: 'url', label: 'Page', type: 'text', admin: { readOnly: true } },
    { name: 'details', type: 'textarea', admin: { readOnly: true, description: 'Personal data is redacted automatically.' } },
    { name: 'status', type: 'select', required: true, defaultValue: 'open', index: true, options: ['open', 'reviewing', 'resolved', 'dismissed'].map((v) => ({ value: v, label: v })) },
    { name: 'resolution', type: 'textarea' },
  ],
}
