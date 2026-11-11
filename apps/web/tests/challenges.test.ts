import { describe, expect, it } from 'vitest'
import { feedFor, scoreHunt, variety, watchTopic } from '../src/simulators/logic'
import { AI_OR_HUMAN, BIAS_FIX, FEED_TOPICS, HALLUCINATION_HUNT, PROMPT_BATTLE } from '../src/simulators/challenges'
import { SIMULATOR_OPTIONS } from '../src/simulators/options'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { chooseNext, type Lite } from '../src/lib/learning-path'
import { PROMPT_LIBRARY } from '../src/lib/prompt-library'

const filled = (x: { id: string; en: string }) => x.id.trim().length > 0 && x.en.trim().length > 0 && x.id !== x.en

describe('challenge simulators', () => {
  it('narrows the feed as one topic is watched, and can be broken out of', () => {
    let w = Object.fromEntries(FEED_TOPICS.map((t) => [t.key, 1])) as Record<string, number>
    expect(feedFor(w, 6)).toHaveLength(6)
    expect(variety(feedFor(w, 6), 6)).toBe(1)
    for (let i = 0; i < 5; i++) w = watchTopic(w, 'game')
    const feed = feedFor(w, 6)
    expect(feed.filter((k) => k === 'game').length).toBeGreaterThanOrEqual(4)
    expect(variety(feed, 6)).toBeLessThanOrEqual(0.34)
    expect(feed[0]).toBe('game')
    w = watchTopic(w, 'science', 6)
    expect(feedFor(w, 6)).toContain('science')
  })

  it('scores the hallucination hunt', () => {
    expect(scoreHunt([true, false, true, false], [true, true, false, false])).toEqual({ found: 1, missed: 1, falseAlarms: 1 })
  })

  it('has complete bilingual content with exactly one best answer per round', () => {
    expect(AI_OR_HUMAN.cards.some((c) => c.bin === 'a') && AI_OR_HUMAN.cards.some((c) => c.bin === 'b')).toBe(true)
    expect(AI_OR_HUMAN.cards.every((c) => filled(c.text) && filled(c.why))).toBe(true)
    for (const r of HALLUCINATION_HUNT) {
      expect(r.sentences.some((s) => s.wrong) && r.sentences.some((s) => !s.wrong)).toBe(true)
      expect(r.sentences.filter((s) => s.wrong).every((s) => s.why && filled(s.why))).toBe(true)
    }
    for (const r of [...PROMPT_BATTLE, ...BIAS_FIX]) {
      expect(r.options.filter((o) => o.best)).toHaveLength(1)
      expect(filled(r.situation) && r.options.every((o) => filled(o.text) && filled(o.why))).toBe(true)
    }
    expect(PROMPT_LIBRARY.every((p) => filled(p.title) && filled(p.template) && filled(p.weak) && filled(p.strong))).toBe(true)
  })

  it('handles every simulator the CMS offers', () => {
    const src = readFileSync(path.resolve(__dirname, '../src/simulators/Simulator.tsx'), 'utf8')
    for (const o of SIMULATOR_OPTIONS) expect(src.includes(`case '${o.value}'`), o.value).toBe(true)
  })
})

describe('learning path', () => {
  const lessons: Lite[] = [
    { id: 1, order: 1, title: 'A', bigIdea: 'discover', track: 't' },
    { id: 2, order: 2, title: 'B', bigIdea: 'protect', track: 't' },
    { id: 3, order: 3, title: 'C', bigIdea: 'understand', track: 't' },
  ]
  it('suggests the weakest AILIS domain first, otherwise the next unfinished lesson', () => {
    expect(chooseNext(lessons, new Set([1]), null)).toMatchObject({ lesson: { id: 2 }, reason: 'next' })
    // evaluate is fed by "understand"; protect by "protect"
    expect(chooseNext(lessons, new Set(), { understand: 80, evaluate: 30, use_create: 60, protect: 50, apply: 70 })).toMatchObject({ lesson: { id: 3 }, reason: 'weak_domain', domain: 'evaluate' })
    // A strong profile (all ≥ 70) just continues in order.
    expect(chooseNext(lessons, new Set(), { understand: 90, evaluate: 80, use_create: 75, protect: 85, apply: 95 })).toMatchObject({ lesson: { id: 1 }, reason: 'next' })
    expect(chooseNext(lessons, new Set([1, 2, 3]), null)).toBeNull()
  })
})
