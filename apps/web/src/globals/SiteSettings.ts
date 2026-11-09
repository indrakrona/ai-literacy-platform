import type { GlobalConfig } from 'payload'
import { hasRole } from '@ailit/shared'

/** Contact details shown on the public site, and who is told about new pilot requests. */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Website' },
  access: {
    read: () => true,
    update: ({ req }) => hasRole(req.user as { roles?: string[] }, 'super_admin', 'content_editor'),
  },
  fields: [
    { name: 'tagline', type: 'text', localized: true },
    { name: 'contactEmail', type: 'email' },
    { name: 'whatsapp', label: 'WhatsApp number', type: 'text', admin: { description: 'e.g. 62812xxxxxxx; leave empty to hide' } },
    { name: 'address', type: 'textarea' },
    {
      name: 'pilotNotifyEmails',
      label: 'Email new pilot requests to',
      type: 'array',
      admin: { description: 'Super admins are always notified in the platform as well.' },
      fields: [{ name: 'email', type: 'email', required: true }],
    },
  ],
}
