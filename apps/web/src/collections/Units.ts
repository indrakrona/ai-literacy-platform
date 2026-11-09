import type { CollectionConfig } from 'payload'
import { BIG_IDEAS, BIG_IDEA_LABELS } from '@ailit/shared'
import { publishedOrStaff, roles } from '../access'

export const Units: CollectionConfig = {
  slug: 'units',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'track', 'bigIdea', 'order'], group: 'Learning' },
  versions: { drafts: true },
  defaultSort: 'order',
  access: {
    read: publishedOrStaff,
    create: roles('content_editor', 'super_admin'),
    update: roles('content_editor', 'super_admin'),
    delete: roles('super_admin'),
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'track', type: 'relationship', relationTo: 'tracks', required: true, index: true },
    {
      name: 'bigIdea',
      type: 'select',
      required: true,
      options: BIG_IDEAS.map((b) => ({ value: b, label: BIG_IDEA_LABELS[b].en })),
    },
    { name: 'order', type: 'number', required: true, defaultValue: 1, admin: { position: 'sidebar' } },
    { name: 'summary', type: 'textarea', localized: true },
    { name: 'lessons', type: 'join', collection: 'lessons', on: 'unit', defaultSort: 'order' },
  ],
}
