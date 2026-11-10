import type { CollectionConfig } from 'payload'
import { readOwnSchool, superAdminOnly, updateOwnSchool } from '../access'

export const Schools: CollectionConfig = {
  slug: 'schools',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'level', 'city', 'npsn'], group: 'People' },
  access: {
    read: readOwnSchool,
    create: superAdminOnly,
    update: updateOwnSchool,
    delete: superAdminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'npsn', label: 'NPSN', type: 'text', unique: true, admin: { description: 'National school ID' } },
    {
      name: 'level',
      type: 'select',
      required: true,
      options: [
        { value: 'smp', label: 'SMP' },
        { value: 'sma', label: 'SMA' },
        { value: 'smk', label: 'SMK' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'province', type: 'text' },
        { name: 'city', type: 'text' },
      ],
    },
    {
      name: 'licence',
      type: 'group',
      fields: [
        { name: 'seats', type: 'number', min: 0, defaultValue: 0 },
        { name: 'startsAt', type: 'date' },
        { name: 'endsAt', type: 'date' },
      ],
    },
    { name: 'licenceReminders', type: 'text', admin: { hidden: true } },
    {
      name: 'classes',
      type: 'join',
      collection: 'classes',
      on: 'school',
    },
  ],
}
