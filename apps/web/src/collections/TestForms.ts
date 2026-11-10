import type { CollectionConfig, Endpoint } from 'payload'
import { hasRole } from '@ailit/shared'
import { roles } from '../access'
import { assembleTestForm } from '../lib/ailis'
import { generateJoinCode } from './Classes'

/** POST /api/test-forms/:id/assemble — fill the form from the item bank using its blueprint. */
const assembleEndpoint: Endpoint = {
  path: '/:id/assemble',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user as { roles?: string[] }, 'assessment_author', 'super_admin')) {
      return Response.json({ error: 'Not allowed' }, { status: 403 })
    }
    const result = await assembleTestForm(req.payload, Number(req.routeParams?.id))
    return Response.json(result)
  },
}

export const TestForms: CollectionConfig = {
  slug: 'test-forms',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'level', 'status', 'accessCode'],
    group: 'AILIS',
    hidden: ({ user }) => !hasRole(user as { roles?: string[] }, 'assessment_author', 'proctor', 'super_admin'),
  },
  access: {
    // Proctors see only the sessions they are assigned to.
    read: ({ req }) => {
      const u = req.user as { id: number; roles?: string[] } | null
      if (!u) return false
      if (hasRole(u, 'assessment_author', 'rater', 'super_admin')) return true
      if (hasRole(u, 'proctor')) return { proctors: { contains: u.id } }
      return false
    },
    create: roles('assessment_author', 'super_admin'),
    update: roles('assessment_author', 'super_admin'),
    delete: roles('super_admin'),
  },
  endpoints: [assembleEndpoint],
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'e.g. AILIS Pilot Form A · SMA' } },
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
            { value: 'adult', label: 'Adult' },
          ],
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'draft',
          options: ['draft', 'active', 'closed'].map((v) => ({ value: v, label: v })),
        },
        { name: 'timeLimitMinutes', type: 'number', required: true, defaultValue: 60, min: 5 },
        { name: 'school', type: 'relationship', relationTo: 'schools', admin: { description: 'Where this session takes place (optional)' } },
        { name: 'doubleMarking', label: 'Double marking of written tasks', type: 'checkbox', defaultValue: true, admin: { description: 'Two raters mark each answer blind; a third adjudicates gaps of 2+ points. Turn off only if one rater is available.' } },
      ],
    },
    {
      name: 'blueprint',
      type: 'group',
      fields: [
        { name: 'itemsPerDomain', type: 'number', required: true, defaultValue: 6, min: 1 },
        { name: 'performanceTasks', type: 'number', required: true, defaultValue: 1, min: 0 },
      ],
    },
    {
      name: 'itemStates',
      type: 'select',
      hasMany: true,
      defaultValue: ['live'],
      options: ['approved', 'piloted', 'live'].map((v) => ({ value: v, label: v })),
      admin: { description: 'Which item states may be used. Pilot forms may include approved items.' },
    },
    {
      name: 'accessCode',
      type: 'text',
      unique: true,
      admin: { readOnly: true, position: 'sidebar', description: 'Proctor gives this code to candidates in the room.' },
      hooks: { beforeValidate: [({ value }) => value || generateJoinCode()] },
    },
    {
      name: 'proctors',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      filterOptions: { roles: { contains: 'proctor' } },
      admin: { position: 'sidebar', description: 'Only these proctors can supervise this session and log incidents.' },
    },
    { name: 'seed', type: 'number', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'items', type: 'relationship', relationTo: 'test-items', hasMany: true, admin: { description: 'Filled by Assemble' } },
    { name: 'shortfall', type: 'json', admin: { readOnly: true, description: 'Domains where the bank had too few items' } },
  ],
}
