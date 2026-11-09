import type { CollectionConfig } from 'payload'
import { roles } from '../access'

const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid misreading

export function generateJoinCode(length = 6): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)]
  }
  return out
}

export const Classes: CollectionConfig = {
  slug: 'classes',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'school', 'academicYear', 'joinCode'], group: 'People' },
  access: {
    read: roles('super_admin', 'school_admin', 'teacher'),
    create: roles('super_admin', 'school_admin'),
    update: roles('super_admin', 'school_admin', 'teacher'),
    delete: roles('super_admin', 'school_admin'),
  },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'e.g. 8B or XI IPA 2' } },
    { name: 'school', type: 'relationship', relationTo: 'schools', required: true, index: true },
    {
      name: 'academicYear',
      type: 'text',
      required: true,
      defaultValue: '2026/2027',
      validate: (v: unknown) => (typeof v === 'string' && /^\d{4}\/\d{4}$/.test(v)) || 'Use the form 2026/2027',
    },
    { name: 'track', type: 'relationship', relationTo: 'tracks' },
    {
      name: 'joinCode',
      type: 'text',
      unique: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar', description: 'Students enter this code to join.' },
      hooks: {
        beforeValidate: [({ value }) => value || generateJoinCode()],
      },
    },
    {
      name: 'teachers',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      filterOptions: { roles: { contains: 'teacher' } },
    },
    {
      name: 'students',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      filterOptions: { roles: { contains: 'student' } },
    },
  ],
}
