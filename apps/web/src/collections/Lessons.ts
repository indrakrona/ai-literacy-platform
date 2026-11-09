import type { CollectionConfig } from 'payload'
import { LESSON_TYPES, REVIEW_STATES } from '@ailit/shared'
import { publishedOrStaff, roles } from '../access'

const LESSON_TYPE_LABELS: Record<(typeof LESSON_TYPES)[number], string> = {
  video: 'Video',
  reading: 'Reading',
  interactive: 'Interactive simulator',
  quiz: 'Quiz',
  ai_lab: 'AI Lab activity',
  project: 'Project',
  discussion: 'Discussion',
}

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'unit', 'type', 'reviewState', '_status'],
    group: 'Learning',
  },
  // Drafts, autosave, scheduled publishing and full revision history (WordPress parity).
  versions: { drafts: { autosave: true, schedulePublish: true }, maxPerDoc: 50 },
  defaultSort: 'order',
  access: {
    read: publishedOrStaff,
    create: roles('content_editor', 'super_admin'),
    update: roles('content_editor', 'super_admin'),
    delete: roles('super_admin'),
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'unit', type: 'relationship', relationTo: 'units', required: true, index: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: LESSON_TYPES.map((t) => ({ value: t, label: LESSON_TYPE_LABELS[t] })),
    },
    { name: 'order', type: 'number', required: true, defaultValue: 1, admin: { position: 'sidebar' } },
    { name: 'estimatedMinutes', type: 'number', min: 1, admin: { position: 'sidebar' } },
    {
      name: 'reviewState',
      label: 'Review state',
      type: 'select',
      defaultValue: 'draft',
      options: REVIEW_STATES.map((s) => ({ value: s, label: s.replace('_', ' ') })),
      admin: { position: 'sidebar', description: 'Draft → In review → Approved, then publish.' },
    },
    { name: 'objective', type: 'textarea', localized: true },
    { name: 'content', type: 'richText', localized: true },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'media',
      admin: { condition: (data) => data?.type === 'video' },
    },
  ],
}
