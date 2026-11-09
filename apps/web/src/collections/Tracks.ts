import type { CollectionConfig } from 'payload'
import { TRACK_LEVELS } from '@ailit/shared'
import { publishedOrStaff, roles } from '../access'

export const Tracks: CollectionConfig = {
  slug: 'tracks',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'level', '_status'], group: 'Learning' },
  versions: { drafts: true },
  access: {
    read: publishedOrStaff,
    create: roles('content_editor', 'super_admin'),
    update: roles('content_editor', 'super_admin'),
    delete: roles('super_admin'),
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'level',
      type: 'select',
      required: true,
      options: TRACK_LEVELS.map((l) => ({ value: l, label: l === 'smp' ? 'SMP (12–15)' : 'SMA/SMK (15–18)' })),
    },
    { name: 'summary', type: 'textarea', localized: true },
    { name: 'units', type: 'join', collection: 'units', on: 'track', defaultSort: 'order' },
  ],
}
