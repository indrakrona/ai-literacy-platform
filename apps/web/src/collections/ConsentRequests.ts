import type { CollectionConfig, Endpoint } from 'payload'
import { hasRole } from '@ailit/shared'
import { shareableConsentLink, whatsappConsentUrl } from '../lib/consent'
import { superAdminOnly } from '../access'
import { consentDecideEndpoint, consentLookupEndpoint } from '../endpoints/accounts'

/**
 * Proof of guardian consent for under-18 users (UU PDP): who asked, who decided, when, from where,
 * and which version of the privacy notice was shown.
 */
const idOf = (v: unknown): number => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number))

/** POST /api/consent-requests/link {studentId} — teachers of the student's class, the school admin or a super admin get a link to share. */
const linkEndpoint: Endpoint = {
  path: '/link',
  method: 'post',
  handler: async (req) => {
    const u = req.user as { id: number; roles?: string[]; school?: number | { id: number } | null } | null
    if (!u) return Response.json({ error: 'Sign in first' }, { status: 401 })
    let b: { studentId?: unknown } = {}
    try {
      b = ((req.json ? await req.json() : {}) ?? {}) as typeof b
    } catch {
      /* empty */
    }
    const studentId = Number(b.studentId)
    const student = await req.payload.findByID({ collection: 'users', id: studentId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!student || student.consentStatus !== 'pending') return Response.json({ error: 'This student is not waiting for consent' }, { status: 400 })
    let allowed = hasRole(u, 'super_admin')
    if (!allowed && hasRole(u, 'school_admin')) allowed = !!u.school && idOf(u.school) === idOf(student.school)
    if (!allowed && hasRole(u, 'teacher')) {
      const shared = await req.payload.count({ collection: 'classes', overrideAccess: true, where: { and: [{ teachers: { contains: u.id } }, { students: { contains: studentId } }] } })
      allowed = shared.totalDocs > 0
    }
    if (!allowed) return Response.json({ error: 'Not allowed' }, { status: 403 })
    const l = await shareableConsentLink(req.payload, studentId)
    return Response.json({ ...l, whatsapp: whatsappConsentUrl(l) })
  },
}

export const ConsentRequests: CollectionConfig = {
  slug: 'consent-requests',
  admin: {
    useAsTitle: 'guardianEmail',
    defaultColumns: ['student', 'guardianEmail', 'status', 'decidedAt'],
    group: 'People',
  },
  endpoints: [consentLookupEndpoint, consentDecideEndpoint, linkEndpoint],
  access: {
    read: superAdminOnly,
    create: superAdminOnly,
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  fields: [
    { name: 'student', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'guardianName', type: 'text' },
    { name: 'guardianEmail', type: 'email' },
    { name: 'guardianPhone', type: 'text' },
    {
      name: 'token',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { hidden: true },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: ['pending', 'granted', 'declined', 'expired'].map((v) => ({ value: v, label: v })),
    },
    { name: 'expiresAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'decidedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'consentVersion', type: 'text', required: true },
    { name: 'decisionIp', type: 'text' },
    { name: 'decisionUserAgent', type: 'text' },
  ],
}
