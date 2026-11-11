import { describe, expect, it } from 'vitest'
import { sizeLabel, withoutImages } from '../src/lib/lite'

describe('data saver', () => {
  it('replaces images in lesson text with a short note and leaves everything else', () => {
    const doc = { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Halo' }] }, { type: 'upload', value: { alt: 'Diagram jaringan saraf' } }] } }
    const out = withoutImages(doc, 'Gambar tidak dimuat')
    expect(out.root.children[0]).toEqual(doc.root.children[0])
    expect(JSON.stringify(out.root.children[1])).toContain('Gambar tidak dimuat: Diagram jaringan saraf')
    expect(JSON.stringify(doc)).toContain('"upload"') // original untouched
    expect(withoutImages(null, 'x')).toBeNull()
  })
  it('labels file sizes', () => {
    expect(sizeLabel(4_404_019, 'en')).toBe('4.2 MB')
    expect(sizeLabel(4_404_019, 'id')).toBe('4,2 MB')
    expect(sizeLabel(2048)).toBe('2 KB')
    expect(sizeLabel(null)).toBe('')
  })
})
