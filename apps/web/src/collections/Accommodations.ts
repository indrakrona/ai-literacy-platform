import type { Access, CollectionConfig, Payload, Where } from 'payload'
import { APIError } from 'payload'
import { hasRole } from '@ailit/shared'

/**
 * Test accommodations (spec G13): extra time, larger text, high contrast and screen-reader mode for a
 * candidate. Granted by the candidate's school admin or a super admin; applied when the candidate starts a
 * test and recorded on the attempt (exports mark accommodated attempts).
 */
const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
type U = { id: number; roles?: string[]; school?: unknown } | null

export const EXTRA_TIME_OPTIONS = [0, 25, 50, 100] as const

const manage: Access = ({ req }) => {
  const u = req.user as U
  if (hasRole(u, 'super_admin')) return true
  const school = idOf(u?.school)
  if (hasRole(u, 'school_admin') && school) {
    const w: Where = { school: { equals: school } }
    return w
  }
  return false
}

export interface AccommodationSet {
  extraTimePercent: number
  largeText: boolean
  highContrast: boolean
  screenReader: boolean
}

export const NO_ACCOMMODATIONS: AccommodationSet = { extraTimePercent: 0, largeText: false, highContrast: false, screenReader: false }

/** The candidate's current accommodations (none if absent or expired). */
export async function accommodationsFor(payload: Payload, candidateId: number, now = new Date()): Promise<AccommodationSet> {
  const a = (await payload.find({ collection: 'accommodations', overrideAccess: true, depth: 0, limit: 1, where: { candidate: { equals: candidateId } } })).docs[0]
  if (!a || (a.validUntil && new Date(a.validUntil) < now)) return NO_ACCOMMODATIONS
  return { extraTimePercent: Number(a.extraTimePercent ?? 0), largeText: Boolean(a.largeText), highContrast: Boolean(a.highContrast), screenReader: Boolean(a.screenReader) }
}

/** Minutes the candidate gets, rounded up. */
export function effectiveMinutes(limit: number, extraPercent: number): number {
  return Math.ceil(limit * (1 + Math.max(0, extraPercent) / 100))
}

export const Accommodations: CollectionConfig = {
  slug: 'accommodations',
  admin: { useAsTitle: 'id', defaultColumns: ['candidate', 'extraTimePercent', 'largeText', 'screenReader', 'validUntil'], group: 'Assessment' },
  access: {
    read: ({ req }) => {
      const u = req.user as U
      if (!u) return false
      if (hasRole(u, 'super_admin')) return true
      const school = idOf(u.school)
      const w: Where = hasRole(u, 'school_admin') && school ? { or: [{ school: { equals: school } }, { candidate: { equals: u.id } }] } : { candidate: { equals: u.id } }
      return w
    },
    create: ({ req }) => hasRole(req.user as U, 'super_admin', 'school_admin'),
    update: manage,
    delete: manage,
  },
  hooks: {
    beforeChange: [
      async ({ req, data, originalDoc }) => {
        const u = req.user as U
        const candidateId = idOf(data.candidate ?? originalDoc?.candidate)
        if (!candidateId) return data
        const candidate = await req.payload.findByID({ collection: 'users', id: candidateId, depth: 0, overrideAccess: true, req }).catch(() => null)
        if (!candidate) throw new APIError('Candidate not found', 400, undefined, true)
        data.school = idOf(candidate.school) ?? undefined
        if (u && !hasRole(u, 'super_admin') && (!data.school || data.school !== idOf(u.school))) throw new APIError('This student is not at your school', 403, undefined, true)
        if (u) data.grantedBy = u.id
        return data
      },
    ],
  },
  fields: [
    { name: 'candidate', type: 'relationship', relationTo: 'users', required: true, unique: true, index: true },
    { name: 'school', type: 'relationship', relationTo: 'schools', index: true, admin: { readOnly: true } },
    {
      type: 'row',
      fields: [
        { name: 'extraTimePercent', label: 'Extra time', type: 'select', defaultValue: '0', options: EXTRA_TIME_OPTIONS.map((p) => ({ value: String(p), label: p ? `+${p}%` : 'None' })) },
        { name: 'largeText', type: 'checkbox' },
        { name: 'highContrast', type: 'checkbox' },
        { name: 'screenReader', label: 'Screen-reader mode', type: 'checkbox', admin: { description: 'Full screen is not required and leaving it is not logged' } },
      ],
    },
    { name: 'reason', type: 'textarea', admin: { description: 'Private: why it was granted (e.g. letter from the school counsellor). Never shown in reports.' } },
    { name: 'validUntil', type: 'date' },
    { name: 'grantedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
  ],
}
