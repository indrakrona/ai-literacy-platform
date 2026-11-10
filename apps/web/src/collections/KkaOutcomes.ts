import type { CollectionConfig } from 'payload'
import { COMPETENCIES, hasRole } from '@ailit/shared'

/**
 * KKA learning outcomes (Koding dan Kecerdasan Artifisial) and which of our can-do statements cover them
 * (spec I3). The seeded mapping is a DRAFT written from the programme's lesson list: a KKA teacher must check
 * each row against the official Capaian Pembelajaran and mark it as checked. School reports say "draft" until then.
 */
export const KKA_PHASES = [
  { value: 'D', label: 'Fase D (SMP kelas 7–9)' },
  { value: 'E', label: 'Fase E (SMA/SMK kelas 10)' },
  { value: 'F', label: 'Fase F (SMA/SMK kelas 11–12)' },
] as const

export const KKA_ELEMENTS = [
  { value: 'bk', id: 'Berpikir Komputasional', en: 'Computational thinking' },
  { value: 'ld', id: 'Literasi Digital', en: 'Digital literacy' },
  { value: 'leka', id: 'Literasi dan Etika Kecerdasan Artifisial', en: 'AI literacy and ethics' },
  { value: 'ppka', id: 'Pemanfaatan dan Pengembangan Kecerdasan Artifisial', en: 'Using and developing AI' },
  { value: 'ap', id: 'Algoritma Pemrograman', en: 'Algorithms and programming' },
  { value: 'ad', id: 'Analisis Data', en: 'Data analysis' },
] as const

const editors = ({ req }: { req: { user?: unknown } }) => hasRole(req.user as { roles?: string[] } | null, 'super_admin', 'content_editor')

export const KkaOutcomes: CollectionConfig = {
  slug: 'kka-outcomes',
  labels: { singular: 'KKA outcome', plural: 'KKA outcomes' },
  admin: { useAsTitle: 'code', defaultColumns: ['code', 'phase', 'element', 'status', 'checkedBy'], group: 'Learning' },
  access: { read: () => true, create: editors, update: editors, delete: editors },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'code', type: 'text', required: true, unique: true, admin: { description: 'e.g. D-LEKA-1' } },
        { name: 'phase', type: 'select', required: true, options: KKA_PHASES.map((p) => ({ value: p.value, label: p.label })) },
        { name: 'element', type: 'select', required: true, options: KKA_ELEMENTS.map((e) => ({ value: e.value, label: e.id })) },
      ],
    },
    { name: 'description', type: 'textarea', required: true, localized: true, admin: { description: 'The learning outcome, as worded in the official Capaian Pembelajaran' } },
    {
      name: 'competencies',
      label: 'Covered by our can-do statements',
      type: 'select',
      hasMany: true,
      options: COMPETENCIES.map((c) => ({ value: c, label: c })),
      admin: { description: 'Empty = this programme does not cover the outcome (shown as a gap in reports)' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'draft',
          options: [
            { value: 'draft', label: 'Draft (not yet checked)' },
            { value: 'checked', label: 'Checked by a KKA teacher' },
          ],
        },
        { name: 'checkedBy', type: 'text', admin: { description: 'Teacher name and school' } },
        { name: 'checkedAt', type: 'date' },
      ],
    },
    { name: 'note', type: 'textarea', admin: { description: 'Reviewer notes' } },
  ],
}
