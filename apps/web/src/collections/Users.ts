import type { CollectionConfig } from 'payload'
import { ROLES, ROLE_LABELS, hasRole, needsGuardianConsent, normalizeIdPhone } from '@ailit/shared'
import { canAccessAdminPanel, fieldSuperAdminOnly, readUsers, selfOrSuperAdmin, superAdminOnly } from '../access'
import { signupEndpoint } from '../endpoints/accounts'
import { escapeHtml } from '../lib/emails'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 7 * 24 * 60 * 60,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
    forgotPassword: {
      generateEmailSubject: () => 'Atur ulang kata sandi AI Literacy',
      generateEmailHTML: (args) => {
        const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
        const link = `${base}/atur-sandi?token=${args?.token ?? ''}`
        const name = escapeHtml(String((args?.user as { name?: string } | undefined)?.name ?? ''))
        return `<p>Halo ${name},</p><p>Klik tautan ini untuk mengatur kata sandi Anda:</p><p><a href="${link}">${link}</a></p><p>Abaikan email ini jika Anda tidak memintanya.</p>`
      },
    },
  },
  endpoints: [signupEndpoint],
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles', 'school'],
    group: 'People',
  },
  access: {
    admin: canAccessAdminPanel,
    read: readUsers,
    update: selfOrSuperAdmin,
    delete: superAdminOnly,
    // Public sign-up is built in task B1; until then only super admins create accounts.
    create: superAdminOnly,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        // Under-18s never appear in public galleries (spec: Non-functional > Child safety).
        const dob = data?.dateOfBirth ?? originalDoc?.dateOfBirth
        if (dob && needsGuardianConsent(dob)) data.showInShowcase = false
        return data
      },
    ],
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
      // Locked after sign-up so a minor cannot change it to skip guardian consent.
      access: { update: fieldSuperAdminOnly },
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
    {
      name: 'phone',
      type: 'text',
      admin: { description: 'WhatsApp number, stored as 62…' },
      hooks: { beforeChange: [({ value }) => (value ? normalizeIdPhone(value) ?? value : value)] },
    },
    {
      type: 'collapsible',
      label: 'Preferences',
      admin: { initCollapsed: true },
      fields: [
        { name: 'notifyEmail', type: 'checkbox', defaultValue: true },
        { name: 'notifyWhatsApp', type: 'checkbox', defaultValue: false },
        {
          name: 'showInShowcase',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Always off for under-18s until gallery consent exists.' },
        },
      ],
    },
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
