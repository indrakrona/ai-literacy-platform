import type { CollectionConfig } from 'payload'
import { COMPETENCIES, hasRole } from '@ailit/shared'
import { canTransition, ITEM_STATES, ITEM_TYPES, type ItemState } from '@ailit/test-engine'
import { roles } from '../access'

/**
 * AILIS item bank (spec G1–G2). Visible only to assessment staff; raters can read performance tasks.
 * Kept apart from lesson practice questions so live items stay secure.
 */
export const TestItems: CollectionConfig = {
  slug: 'test-items',
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'type', 'competency', 'level', 'difficulty', 'state'],
    group: 'AILIS',
    hidden: ({ user }) => !hasRole(user as { roles?: string[] }, 'assessment_author', 'rater', 'super_admin'),
  },
  versions: { maxPerDoc: 30 },
  access: {
    read: ({ req }) => {
      const u = req.user as { roles?: string[] } | null
      if (hasRole(u, 'assessment_author', 'super_admin')) return true
      if (hasRole(u, 'rater')) return { type: { equals: 'performance_task' } }
      return false
    },
    create: roles('assessment_author', 'super_admin'),
    update: roles('assessment_author', 'super_admin'),
    delete: roles('super_admin'),
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const from = (originalDoc?.state ?? 'draft') as ItemState
        const to = (data.state ?? from) as ItemState
        if (!canTransition(from, to)) throw new Error(`Item state cannot move from ${from} to ${to}`)
        if (data.type && data.type !== 'performance_task') {
          const opts = (data.options ?? []) as { correct?: boolean }[]
          const right = opts.filter((o) => o.correct).length
          if (opts.length < 2) throw new Error('Choice items need at least 2 options')
          if (right < 1) throw new Error('Mark at least one correct option')
          if (data.type !== 'multiple_choice' && right !== 1) throw new Error('Single-answer items need exactly one correct option')
        } else if (data.type === 'performance_task' && !(data.rubric ?? []).length) {
          throw new Error('Performance tasks need a rubric')
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'code', type: 'text', required: true, unique: true, admin: { description: 'e.g. AIL-UND-0001' } },
    {
      type: 'row',
      fields: [
        { name: 'type', type: 'select', required: true, options: ITEM_TYPES.map((v) => ({ value: v, label: v.replace('_', ' ') })) },
        { name: 'competency', type: 'select', required: true, options: COMPETENCIES.map((c) => ({ value: c, label: c })) },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'level',
          type: 'select',
          required: true,
          defaultValue: 'sma_smk',
          options: [
            { value: 'smp', label: 'SMP' },
            { value: 'sma_smk', label: 'SMA/SMK' },
            { value: 'adult', label: 'Adult (Phase 2)' },
          ],
        },
        {
          name: 'difficulty',
          type: 'select',
          required: true,
          defaultValue: '2',
          options: [
            { value: '1', label: '1 · easier' },
            { value: '2', label: '2 · medium' },
            { value: '3', label: '3 · harder' },
          ],
        },
        {
          name: 'state',
          type: 'select',
          required: true,
          defaultValue: 'draft',
          options: ITEM_STATES.map((v) => ({ value: v, label: v })),
          admin: { description: 'draft → review → approved → piloted → live → retired' },
        },
      ],
    },
    { name: 'scenario', type: 'textarea', localized: true, admin: { description: 'Optional situation shown before the question' } },
    { name: 'stem', label: 'Question / task', type: 'textarea', required: true, localized: true },
    {
      name: 'options',
      type: 'array',
      maxRows: 6,
      admin: { condition: (d) => d?.type !== 'performance_task' },
      fields: [
        { name: 'text', type: 'text', required: true, localized: true },
        { name: 'correct', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'rubric',
      type: 'array',
      admin: { condition: (d) => d?.type === 'performance_task', description: 'One row per score level, from 0 up' },
      fields: [
        { name: 'points', type: 'number', required: true, min: 0, max: 10 },
        { name: 'descriptor', type: 'textarea', required: true, localized: true },
      ],
    },
    { name: 'reviewerNotes', type: 'textarea', admin: { description: 'Internal only' } },
  ],
}
