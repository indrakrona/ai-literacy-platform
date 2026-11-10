import type { CollectionConfig } from 'payload'
import { COMPETENCIES } from '@ailit/shared'
import { roles, signedInPublishedOrStaff } from '../access'

/** AI Lab activity settings, edited in the CMS (spec D1). */
export const AiActivities: CollectionConfig = {
  slug: 'ai-activities',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'competency', 'tier', 'messageLimit'], group: 'Learning' },
  versions: { drafts: { autosave: true, schedulePublish: true }, maxPerDoc: 30 },
  access: {
    read: signedInPublishedOrStaff,
    create: roles('content_editor', 'content_reviewer', 'super_admin'),
    update: roles('content_editor', 'content_reviewer', 'super_admin'),
    delete: roles('super_admin'),
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'competency', type: 'select', required: true, options: COMPETENCIES.map((c) => ({ value: c, label: c })) },
    { name: 'goal', label: 'Goal shown to students', type: 'textarea', required: true, localized: true },
    {
      name: 'instructions',
      label: 'Instructions for the AI',
      type: 'textarea',
      required: true,
      admin: { description: 'Added after the platform safety rules. Students do not see this.' },
    },
    { name: 'starterPrompts', type: 'array', localized: true, maxRows: 4, fields: [{ name: 'text', type: 'text', required: true }] },
    {
      type: 'row',
      fields: [
        {
          name: 'tier',
          type: 'select',
          required: true,
          defaultValue: 'standard',
          options: [
            { value: 'fast', label: 'Fast (Haiku)' },
            { value: 'standard', label: 'Standard (Sonnet)' },
          ],
        },
        { name: 'messageLimit', type: 'number', required: true, defaultValue: 12, min: 1, max: 40 },
      ],
    },
    { name: 'reflection', label: 'Reflection questions', type: 'array', localized: true, fields: [{ name: 'text', type: 'text', required: true }] },
  ],
}
