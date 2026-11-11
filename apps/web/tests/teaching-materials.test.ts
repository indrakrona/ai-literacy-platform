import { describe, expect, it } from 'vitest'
import { CAN_DO, COMPETENCIES, canDo } from '@ailit/shared'
import { minutesIn, splitSections } from '../src/lib/teaching-materials'
import { BRIEF_SEEDS } from '../src/seed/project-briefs'
import { BRIEFS_EN } from '../src/seed/project-briefs-en'
import { ACTIVITIES_ID } from '../src/seed/activities-id'
import { APPLIED_RUBRIC_LEVELS, BRIEF_TEMPLATE_FIELDS } from '../src/lib/brief-template'
import { TRACKS } from '../src/seed/curriculum-data'

const filled = (s: string | undefined) => Boolean(s && s.trim().length > 3)

describe('teaching materials', () => {
  it('splits lesson content into one section per heading', () => {
    const t = (text: string) => ({ type: 'text', text })
    const content = {
      root: {
        type: 'root',
        children: [
          { type: 'paragraph', children: [t('Intro')] },
          { type: 'heading', tag: 'h2', children: [t('Pembuka (10 menit)')] },
          { type: 'paragraph', children: [t('Tanya siswa')] },
          { type: 'heading', tag: 'h2', children: [t('Konsep (15 menit)')] },
          { type: 'list', children: [{ type: 'listitem', children: [t('A')] }] },
          { type: 'heading', tag: 'h2', children: [t('Kosong')] },
        ],
      },
    }
    const s = splitSections(content)
    expect(s.map((x) => x.heading)).toEqual([null, 'Pembuka (10 menit)', 'Konsep (15 menit)', 'Kosong'])
    expect(s[1]!.body.root.children).toHaveLength(1)
    expect(minutesIn(s[1]!.heading)).toBe(10)
    expect(minutesIn('Opening (5 minutes)')).toBe(5)
    expect(minutesIn('Kosong')).toBeNull()
    expect(splitSections(null)).toEqual([])
  })

  it('has every can-do statement in both languages and levels', () => {
    for (const c of COMPETENCIES) {
      for (const lvl of ['smp', 'sma'] as const) {
        expect(filled(CAN_DO[c][lvl].id) && filled(CAN_DO[c][lvl].en), `${c} ${lvl}`).toBe(true)
        expect(CAN_DO[c][lvl].id).not.toBe(CAN_DO[c][lvl].en)
      }
    }
    expect(canDo('PRO-1', 'smp', 'id')).toMatch(/^Saya bisa .+\.$/)
    expect(canDo('PRO-1', 'sma_smk', 'en')).toMatch(/^I can manage my data/)
    expect(canDo('XYZ-9', 'smp', 'en')).toBeNull()
  })

  it('has a Bahasa main activity for every session of both tracks', () => {
    for (const t of TRACKS) for (const l of t.lessons) expect(filled(ACTIVITIES_ID[`${t.slug}:${l.n}`]), `${t.slug}:${l.n}`).toBe(true)
  })

  it('has a complete English version of every project brief, rubric row for row', () => {
    for (const b of BRIEF_SEEDS) {
      const en = BRIEFS_EN[b.slug]
      expect(en, b.slug).toBeDefined()
      expect(filled(en!.client) && filled(en!.problem) && filled(en!.deliverables)).toBe(true)
      expect(en!.rubric, b.slug).toHaveLength(b.rubric)
      expect(en!.rubric.every(([c, d]) => filled(c) && filled(d))).toBe(true)
    }
    expect(Object.keys(BRIEFS_EN).sort()).toEqual(BRIEF_SEEDS.map((b) => b.slug).sort())
  })

  it('brief template rubric has four bilingual levels per criterion', () => {
    expect(APPLIED_RUBRIC_LEVELS).toHaveLength(4)
    for (const r of APPLIED_RUBRIC_LEVELS) for (const l of r.levels) expect(filled(l.id) && filled(l.en) && l.id !== l.en).toBe(true)
    expect(BRIEF_TEMPLATE_FIELDS.every((f) => filled(f.label.id) && filled(f.label.en) && f.lines > 0)).toBe(true)
  })
})
