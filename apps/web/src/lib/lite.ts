/**
 * Low-bandwidth mode (spec C7): a per-device cookie. When on, lesson images and videos are not loaded
 * until asked for, and optional third-party scripts (analytics) are skipped.
 */
import { cookies } from 'next/headers'

export const LITE_COOKIE = 'hemat'

export async function isLite(): Promise<boolean> {
  try {
    return (await cookies()).get(LITE_COOKIE)?.value === '1'
  } catch {
    return false
  }
}

type Node = { type?: string; children?: Node[]; [k: string]: unknown }

/**
 * Replace image/upload nodes in Lexical rich text with a short text note, so the page loads without them.
 * Returns a copy; the original is unchanged.
 */
export function withoutImages<T>(data: T, note: string): T {
  if (!data || typeof data !== 'object') return data
  const walk = (n: Node): Node => {
    if (n.type === 'upload') {
      const value = n.value as { alt?: string; filename?: string } | undefined
      const label = value?.alt || value?.filename || ''
      return { type: 'paragraph', version: 1, direction: null, format: '', indent: 0, children: [{ type: 'text', version: 1, text: `[${note}${label ? `: ${label}` : ''}]`, format: 2, detail: 0, mode: 'normal', style: '' }] }
    }
    return Array.isArray(n.children) ? { ...n, children: n.children.map(walk) } : n
  }
  const root = (data as { root?: Node }).root
  return root ? ({ ...(data as object), root: walk(root) } as T) : data
}

/** Human-readable size, e.g. "4,2 MB". */
export function sizeLabel(bytes?: number | null, locale: 'id' | 'en' = 'id'): string {
  if (!bytes) return ''
  const mb = bytes / 1_048_576
  return mb >= 1 ? `${mb.toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB', { maximumFractionDigits: 1 })} MB` : `${Math.ceil(bytes / 1024)} KB`
}
