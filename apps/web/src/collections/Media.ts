import type { CollectionConfig } from 'payload'
import { anyoneLoggedIn, roles } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: {
    read: () => true,
    create: anyoneLoggedIn,
    update: roles('content_editor', 'super_admin'),
    delete: roles('content_editor', 'super_admin'),
  },
  upload: {
    // Phone-first sizes; originals kept for print.
    imageSizes: [
      { name: 'thumb', width: 320 },
      { name: 'card', width: 768 },
      { name: 'wide', width: 1440 },
    ],
    mimeTypes: ['image/*', 'application/pdf', 'video/mp4'],
  },
  fields: [{ name: 'alt', type: 'text', required: true, localized: true }],
}
