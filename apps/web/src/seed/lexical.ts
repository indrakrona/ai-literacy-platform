/** Tiny builders for Lexical rich-text JSON, so lesson content can be written as code in seeds. */

const text = (t: string) => ({ type: 'text', text: t, format: 0, detail: 0, mode: 'normal', style: '', version: 1 })

const block = (type: string, children: unknown[], extra: Record<string, unknown> = {}) => ({
  type,
  children,
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  version: 1,
  ...extra,
})

export const p = (t: string) => block('paragraph', [text(t)], { textFormat: 0, textStyle: '' })
export const h2 = (t: string) => block('heading', [text(t)], { tag: 'h2' })
export const ul = (...items: string[]) =>
  block(
    'list',
    items.map((t, i) => block('listitem', [text(t)], { value: i + 1 })),
    { listType: 'bullet', start: 1, tag: 'ul' },
  )

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const doc = (...children: unknown[]): any => ({ root: block('root', children) })
