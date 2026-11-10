/**
 * What the review workspace (/konten) shows for each content type: the bilingual text fields side by side,
 * how complete the English translation is, and where to preview and edit.
 */
import type { Payload } from 'payload'
import { WORKFLOW_STATES, type WorkflowState } from './workflow'

export type Spec = { key: string; label: { id: string; en: string }; kind: 'text' | 'rich' | 'rows'; sub?: string[] }

export const CONTENT_TYPES = {
  lessons: {
    label: { id: 'Pelajaran', en: 'Lesson' },
    title: 'title',
    drafts: true,
    fields: [
      { key: 'title', label: { id: 'Judul', en: 'Title' }, kind: 'text' },
      { key: 'objective', label: { id: 'Tujuan', en: 'Objective' }, kind: 'text' },
      { key: 'activity', label: { id: 'Kegiatan utama', en: 'Main activity' }, kind: 'text' },
      { key: 'content', label: { id: 'Isi', en: 'Content' }, kind: 'rich' },
      { key: 'quiz', label: { id: 'Kuis', en: 'Quiz' }, kind: 'rows', sub: ['prompt', 'options', 'explanation'] },
    ],
  },
  'ai-activities': {
    label: { id: 'Aktivitas AI Lab', en: 'AI Lab activity' },
    title: 'title',
    drafts: true,
    fields: [
      { key: 'title', label: { id: 'Judul', en: 'Title' }, kind: 'text' },
      { key: 'goal', label: { id: 'Tujuan untuk siswa', en: 'Goal shown to students' }, kind: 'text' },
      { key: 'starterPrompts', label: { id: 'Contoh perintah', en: 'Starter prompts' }, kind: 'rows', sub: ['text'] },
      { key: 'reflection', label: { id: 'Pertanyaan refleksi', en: 'Reflection questions' }, kind: 'rows', sub: ['text'] },
    ],
  },
  'project-briefs': {
    label: { id: 'Brief proyek', en: 'Project brief' },
    title: 'title',
    drafts: true,
    fields: [
      { key: 'title', label: { id: 'Judul', en: 'Title' }, kind: 'text' },
      { key: 'client', label: { id: 'Pemilik brief', en: 'Brief owner' }, kind: 'text' },
      { key: 'problem', label: { id: 'Masalah', en: 'Problem' }, kind: 'text' },
      { key: 'deliverables', label: { id: 'Hasil yang diminta', en: 'Deliverables' }, kind: 'text' },
      { key: 'rubric', label: { id: 'Rubrik', en: 'Rubric' }, kind: 'rows', sub: ['criterion', 'description'] },
    ],
  },
  badges: {
    label: { id: 'Lencana', en: 'Badge' },
    title: 'name',
    drafts: false,
    fields: [
      { key: 'name', label: { id: 'Nama', en: 'Name' }, kind: 'text' },
      { key: 'description', label: { id: 'Deskripsi', en: 'Description' }, kind: 'text' },
    ],
  },
  pages: {
    label: { id: 'Halaman situs', en: 'Website page' },
    title: 'title',
    drafts: true,
    fields: [
      { key: 'title', label: { id: 'Judul', en: 'Title' }, kind: 'text' },
      { key: 'description', label: { id: 'Deskripsi', en: 'Description' }, kind: 'text' },
    ],
  },
} as const satisfies Record<string, { label: { id: string; en: string }; title: string; drafts: boolean; fields: readonly Spec[] }>

export type ContentSlug = keyof typeof CONTENT_TYPES
export const isContentSlug = (s: string): s is ContentSlug => s in CONTENT_TYPES

/** Plain text of a field value, for comparison (rich text and option lists flattened). */
export function plain(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v.trim()
  if (Array.isArray(v)) return v.map(plain).filter(Boolean).join(' · ')
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (o.root) return plain(o.root)
    if (typeof o.text === 'string') return o.text.trim()
    if (Array.isArray(o.children)) return o.children.map(plain).filter(Boolean).join(' ')
  }
  return ''
}

/** The rows a field produces: one for a text field, one per array row and sub-field. */
export function rowsOf(spec: Spec, doc: Record<string, unknown>): { key: string; label: string; value: unknown }[] {
  if (spec.kind !== 'rows') return [{ key: spec.key, label: spec.key, value: doc[spec.key] }]
  const items = (doc[spec.key] as Record<string, unknown>[] | null) ?? []
  return items.flatMap((row, i) => (spec.sub ?? []).map((s) => ({ key: `${spec.key}.${i}.${s}`, label: `${i + 1}. ${s}`, value: row[s] })))
}

/**
 * English completeness: the share of Bahasa text rows that have their own English text (not empty and not
 * a copy of the Bahasa).
 */
export function translationStatus(spec: readonly Spec[], idDoc: Record<string, unknown>, enDoc: Record<string, unknown>) {
  let total = 0
  let done = 0
  const missing: string[] = []
  for (const f of spec) {
    const a = rowsOf(f, idDoc)
    const b = new Map(rowsOf(f, enDoc).map((r) => [r.key, plain(r.value)]))
    for (const r of a) {
      const src = plain(r.value)
      if (!src) continue
      total++
      const en = b.get(r.key) ?? ''
      if (en && en !== src) done++
      else missing.push(r.key)
    }
  }
  return { total, done, percent: total ? Math.round((done / total) * 100) : 100, missing }
}

export async function loadBoth(payload: Payload, slug: ContentSlug, id: number) {
  const drafts = CONTENT_TYPES[slug].drafts
  const get = (locale: 'id' | 'en') =>
    payload.findByID({ collection: slug, id, depth: 0, draft: drafts, locale, fallbackLocale: false as never, overrideAccess: true }).catch(() => null) as Promise<Record<string, unknown> | null>
  const [idDoc, enDoc] = await Promise.all([get('id'), get('en')])
  return { idDoc, enDoc }
}

/** Items in each review state across all content types (latest drafts). */
export async function reviewQueue(payload: Payload, state: WorkflowState | 'all') {
  const out: { slug: ContentSlug; id: number; title: string; state: WorkflowState; status?: string; updatedAt: string }[] = []
  for (const slug of Object.keys(CONTENT_TYPES) as ContentSlug[]) {
    const t = CONTENT_TYPES[slug]
    const res = await payload.find({
      collection: slug,
      overrideAccess: true,
      depth: 0,
      draft: t.drafts,
      locale: 'id',
      limit: 200,
      sort: '-updatedAt',
      where: state === 'all' ? {} : { reviewState: { equals: state } },
    })
    for (const d of res.docs as unknown as Record<string, unknown>[]) {
      out.push({ slug, id: d.id as number, title: String(d[t.title] ?? `#${d.id}`), state: ((d.reviewState as WorkflowState) ?? 'draft'), status: d._status as string | undefined, updatedAt: d.updatedAt as string })
    }
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function queueCounts(payload: Payload) {
  const counts = Object.fromEntries(WORKFLOW_STATES.map((s) => [s, 0])) as Record<WorkflowState, number>
  for (const slug of Object.keys(CONTENT_TYPES) as ContentSlug[]) {
    for (const s of WORKFLOW_STATES) {
      counts[s] += (await payload.count({ collection: slug, overrideAccess: true, where: { reviewState: { equals: s } } })).totalDocs
    }
  }
  return counts
}
