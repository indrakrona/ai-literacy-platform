/**
 * Teaching materials generated from the lesson content (spec H3): slide decks and student worksheets (LKPD).
 * They stay in step with the CMS automatically: an editor changes the lesson, and the slides and worksheet follow.
 */
import type { Payload } from 'payload'

type LexNode = { type: string; tag?: string; children?: LexNode[]; text?: string }
type LexState = { root: LexNode & { children: LexNode[] } }

const plain = (n: LexNode): string => (n.text ?? '') + (n.children ?? []).map(plain).join('')

/** Split rich text into sections at each heading; content before the first heading becomes an untitled section. */
export function splitSections(content: unknown): { heading: string | null; body: LexState }[] {
  const state = content as LexState | null
  if (!state?.root?.children?.length) return []
  const out: { heading: string | null; nodes: LexNode[] }[] = []
  for (const node of state.root.children) {
    if (node.type === 'heading') out.push({ heading: plain(node).trim(), nodes: [] })
    else {
      if (!out.length) out.push({ heading: null, nodes: [] })
      out[out.length - 1]!.nodes.push(node)
    }
  }
  return out
    .filter((s) => s.heading || s.nodes.some((n) => plain(n).trim()))
    .map((s) => ({ heading: s.heading, body: { ...state, root: { ...state.root, children: s.nodes } } }))
}

/** Minutes shown in a heading such as "Pembuka (10 menit)" or "Opening (10 minutes)". */
export const minutesIn = (heading: string | null) => Number(heading?.match(/\((\d+)\s*(menit|minutes?|min)\)/i)?.[1] ?? 0) || null

/** A published session of a track, with its track, for teacher materials. */
export async function loadSession(payload: Payload, slug: string, order: number, locale: 'id' | 'en') {
  const track = (await payload.find({ collection: 'tracks', overrideAccess: true, locale, limit: 1, where: { slug: { equals: slug } } })).docs[0]
  if (!track || !Number.isInteger(order)) return null
  const units = (await payload.find({ collection: 'units', overrideAccess: true, depth: 0, limit: 20, where: { track: { equals: track.id } } })).docs.map((u) => u.id)
  const lesson = (await payload.find({ collection: 'lessons', overrideAccess: true, depth: 1, locale, limit: 1, where: { and: [{ unit: { in: units } }, { order: { equals: order } }, { _status: { equals: 'published' } }] } })).docs[0]
  if (!lesson) return null
  const total = (await payload.count({ collection: 'lessons', overrideAccess: true, where: { and: [{ unit: { in: units } }, { _status: { equals: 'published' } }] } })).totalDocs
  return { track, lesson, total }
}

/** Reflection prompts printed on every worksheet, chosen by big idea where it helps. */
export const REFLECTION_PROMPTS = {
  id: ['Apa satu hal baru yang kamu pelajari hari ini?', 'Kapan kamu akan memakai pelajaran ini di luar kelas? Berikan satu contoh.'],
  en: ['What is one new thing you learned today?', 'When will you use this outside class? Give one example.'],
} as const
