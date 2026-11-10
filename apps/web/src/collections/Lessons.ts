import type { CollectionConfig } from 'payload'
import { COMPETENCIES, LESSON_TYPES, REVIEW_STATES } from '@ailit/shared'
import { publishedOrStaff, roles } from '../access'
import { SIMULATOR_OPTIONS } from '../simulators/options'

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
    defaultColumns: ['order', 'title', 'unit', 'competency', 'inCoreVersion', '_status'],
    group: 'Learning',
  },
  // Drafts, autosave, scheduled publishing and full revision history (WordPress parity).
  versions: { drafts: { autosave: true, schedulePublish: true }, maxPerDoc: 50 },
  defaultSort: 'order',
  access: {
    read: publishedOrStaff,
    create: roles('content_editor', 'content_reviewer', 'super_admin'),
    update: roles('content_editor', 'content_reviewer', 'super_admin'),
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
      name: 'competency',
      label: 'Can-do statement',
      type: 'select',
      required: true,
      options: COMPETENCIES.map((c) => ({ value: c, label: c })),
      admin: { position: 'sidebar', description: 'Framework tag, e.g. PRO-1' },
    },
    {
      name: 'alsoCovers',
      type: 'select',
      hasMany: true,
      options: COMPETENCIES.map((c) => ({ value: c, label: c })),
      admin: { position: 'sidebar', description: 'Extra statements folded in (12-session version)' },
    },
    {
      name: 'inCoreVersion',
      label: 'In 12-session version',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'reviewState',
      label: 'Review state',
      type: 'select',
      defaultValue: 'draft',
      options: REVIEW_STATES.map((s) => ({ value: s, label: s.replace('_', ' ') })),
      admin: { position: 'sidebar', description: 'Draft → In review → Approved, then publish.' },
    },
    { name: 'objective', type: 'textarea', localized: true },
    { name: 'activity', label: 'Main activity', type: 'textarea', localized: true },
    { name: 'content', type: 'richText', localized: true },
    {
      name: 'aiActivity',
      label: 'AI Lab activity',
      type: 'relationship',
      relationTo: 'ai-activities',
      admin: { condition: (d) => d?.type === 'ai_lab' },
    },
    {
      name: 'projectBrief',
      label: 'Project brief',
      type: 'relationship',
      relationTo: 'project-briefs',
      admin: { condition: (d) => d?.type === 'project' },
    },
    {
      name: 'simulator',
      type: 'select',
      options: SIMULATOR_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
      admin: { description: 'Interactive tool shown in the lesson' },
    },
    {
      name: 'quiz',
      label: 'Practice questions',
      type: 'array',
      admin: { description: 'Instant-feedback practice; not part of the AILIS item bank.' },
      fields: [
        { name: 'prompt', type: 'textarea', required: true, localized: true },
        {
          name: 'options',
          type: 'array',
          minRows: 2,
          maxRows: 5,
          required: true,
          fields: [
            { name: 'text', type: 'text', required: true, localized: true },
            { name: 'correct', type: 'checkbox', defaultValue: false },
          ],
        },
        { name: 'explanation', type: 'textarea', localized: true, admin: { description: 'Shown after answering' } },
      ],
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'media',
      admin: { condition: (data) => data?.type === 'video' },
    },
  ],
}
