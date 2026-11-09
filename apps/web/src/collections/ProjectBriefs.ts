import type { CollectionConfig } from 'payload'
import { COMPETENCIES } from '@ailit/shared'
import { roles } from '../access'

export const SMK_MAJORS = [
  { value: 'akuntansi', label: 'Akuntansi dan Keuangan Lembaga' },
  { value: 'pemasaran', label: 'Pemasaran / Bisnis Digital' },
  { value: 'tjkt', label: 'Teknik Jaringan Komputer dan Telekomunikasi' },
  { value: 'pplg', label: 'Pengembangan Perangkat Lunak dan Gim' },
  { value: 'perhotelan', label: 'Perhotelan dan Usaha Layanan Pariwisata' },
  { value: 'kuliner', label: 'Kuliner' },
  { value: 'otomotif', label: 'Teknik Otomotif / Teknik Mesin' },
  { value: 'dkv', label: 'Desain Komunikasi Visual' },
  { value: 'kesehatan', label: 'Layanan Kesehatan / Farmasi' },
] as const

/** Real problems for students to solve, each with a rubric (spec F1). */
export const ProjectBriefs: CollectionConfig = {
  slug: 'project-briefs',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'level', 'smkMajor', 'competency'], group: 'Learning' },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: roles('content_editor', 'teacher', 'super_admin'),
    update: roles('content_editor', 'super_admin'),
    delete: roles('super_admin'),
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'level', type: 'select', required: true, options: [{ value: 'smp', label: 'SMP' }, { value: 'sma_smk', label: 'SMA/SMK' }] },
        { name: 'competency', type: 'select', required: true, options: COMPETENCIES.map((c) => ({ value: c, label: c })) },
        { name: 'smkMajor', label: 'SMK major (optional)', type: 'select', options: SMK_MAJORS.map((m) => ({ ...m })) },
      ],
    },
    { name: 'client', label: 'Brief owner', type: 'text', localized: true, admin: { description: 'e.g. kantin sekolah, UMKM warung makan' } },
    { name: 'problem', type: 'textarea', required: true, localized: true },
    { name: 'deliverables', type: 'textarea', required: true, localized: true },
    { name: 'allowTeams', type: 'checkbox', defaultValue: true },
    {
      name: 'rubric',
      type: 'array',
      required: true,
      minRows: 2,
      admin: { description: 'Each criterion is scored 1–4' },
      fields: [
        { name: 'criterion', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', localized: true, admin: { description: 'What a level-4 answer looks like' } },
      ],
    },
  ],
}
