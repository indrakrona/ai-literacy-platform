import type { CollectionConfig } from 'payload'
import { ROLES, ROLE_LABELS, hasRole } from '@ailit/shared'
import { canAccessAdminPanel, fieldSuperAdminOnly, selfOrSuperAdmin, superAdminOnly } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles', 'school'],
    group: 'People',
  },
  access: {
    admin: canAccessAdminPanel,
    read: selfOrSuperAdmin,
    update: selfOrSuperAdmin,
    delete: superAdminOnly,
    // Public sign-up is built in task B1; until then only super admins create accounts.
    create: superAdminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['student'],
      options: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r].en })),
      access: { update: fieldSuperAdminOnly, create: fieldSuperAdminOnly },
      saveToJWT: true,
    },
    { name: 'school', type: 'relationship', relationTo: 'schools', saveToJWT: true },
    {
      name: 'dateOfBirth',
      type: 'date',
      admin: { description: 'Used to decide whether parental consent is required (under 18).' },
    },
    {
      name: 'preferredLocale',
      type: 'select',
      defaultValue: 'id',
      options: [
        { value: 'id', label: 'Bahasa Indonesia' },
        { value: 'en', label: 'English' },
      ],
    },
    { name: 'phone', type: 'text', admin: { description: 'WhatsApp number, normalised to 62…' } },
    {
      name: 'consentStatus',
      type: 'select',
      defaultValue: 'not_required',
      options: [
        { value: 'not_required', label: 'Not required (18+)' },
        { value: 'pending', label: 'Pending parent consent' },
        { value: 'granted', label: 'Granted' },
        { value: 'declined', label: 'Declined' },
      ],
      access: { update: fieldSuperAdminOnly },
      admin: { position: 'sidebar' },
    },
    {
      name: 'guardians',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      filterOptions: { roles: { contains: 'parent' } },
      admin: { condition: (data) => hasRole(data as { roles?: string[] }, 'student') },
    },
  ],
}
