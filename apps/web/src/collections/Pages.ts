import type { ArrayField, Block, CollectionConfig, Field } from 'payload'
import { publishedOrStaff, roles } from '../access'

const link = (name: string, label: string) => ({
  name,
  label,
  type: 'group' as const,
  fields: [
    { name: 'label', type: 'text' as const },
    { name: 'href', type: 'text' as const, admin: { description: 'e.g. /untuk-sekolah or /daftar' } },
  ],
})

const items = (fields: Field[]): ArrayField => ({ name: 'items', type: 'array', fields })

export const PAGE_BLOCKS: Block[] = [
  {
    slug: 'hero',
    labels: { singular: 'Hero', plural: 'Heroes' },
    fields: [
      { name: 'eyebrow', type: 'text' },
      { name: 'heading', type: 'text', required: true },
      { name: 'lead', type: 'textarea' },
      link('primary', 'Main button'),
      link('secondary', 'Second button'),
    ],
  },
  {
    slug: 'notice',
    labels: { singular: 'Notice', plural: 'Notices' },
    fields: [{ name: 'text', type: 'textarea', required: true }],
  },
  {
    slug: 'features',
    labels: { singular: 'Feature list', plural: 'Feature lists' },
    fields: [{ name: 'heading', type: 'text' }, { name: 'intro', type: 'textarea' }, items([{ name: 'title', type: 'text', required: true }, { name: 'body', type: 'textarea' }])],
  },
  {
    slug: 'steps',
    labels: { singular: 'Steps', plural: 'Steps' },
    fields: [{ name: 'heading', type: 'text' }, items([{ name: 'title', type: 'text', required: true }, { name: 'body', type: 'textarea' }])],
  },
  {
    slug: 'text',
    labels: { singular: 'Text', plural: 'Text' },
    fields: [{ name: 'heading', type: 'text' }, { name: 'body', type: 'richText', required: true }],
  },
  {
    slug: 'faq',
    labels: { singular: 'FAQ', plural: 'FAQs' },
    fields: [{ name: 'heading', type: 'text' }, items([{ name: 'question', type: 'text', required: true }, { name: 'answer', type: 'textarea', required: true }])],
  },
  {
    slug: 'cta',
    labels: { singular: 'Call to action', plural: 'Calls to action' },
    fields: [{ name: 'heading', type: 'text', required: true }, { name: 'body', type: 'textarea' }, link('button', 'Button')],
  },
  {
    slug: 'pilotForm',
    labels: { singular: 'Pilot sign-up form', plural: 'Pilot sign-up forms' },
    fields: [{ name: 'heading', type: 'text' }, { name: 'intro', type: 'textarea' }],
  },
]

/** Public website pages built from blocks (spec A1, A2, A7, A8). Each language has its own block list. */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', '_status', 'updatedAt'], group: 'Website' },
  versions: { drafts: true, maxPerDoc: 30 },
  access: {
    read: publishedOrStaff,
    create: roles('content_editor', 'content_reviewer', 'super_admin'),
    update: roles('content_editor', 'content_reviewer', 'super_admin'),
    delete: roles('super_admin'),
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { position: 'sidebar', description: '"home" is the front page' } },
    { name: 'description', label: 'Search description', type: 'textarea', localized: true, admin: { description: 'Shown by Google; about 150 characters' } },
    { name: 'showInNav', label: 'Show in top menu', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'navOrder', type: 'number', defaultValue: 10, admin: { position: 'sidebar' } },
    { name: 'footerGroup', type: 'select', options: [{ value: 'legal', label: 'Legal' }, { value: 'about', label: 'About' }], admin: { position: 'sidebar' } },
    { name: 'layout', type: 'blocks', blocks: PAGE_BLOCKS, localized: true },
  ],
}
