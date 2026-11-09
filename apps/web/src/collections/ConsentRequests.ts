import type { CollectionConfig } from 'payload'
import { superAdminOnly } from '../access'
import { consentDecideEndpoint, consentLookupEndpoint } from '../endpoints/accounts'

/**
 * Proof of guardian consent for under-18 users (UU PDP): who asked, who decided, when, from where,
 * and which version of the privacy notice was shown.
 */
export const ConsentRequests: CollectionConfig = {
  slug: 'consent-requests',
  admin: {
    useAsTitle: 'guardianEmail',
    defaultColumns: ['student', 'guardianEmail', 'status', 'decidedAt'],
    group: 'People',
  },
  endpoints: [consentLookupEndpoint, consentDecideEndpoint],
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
