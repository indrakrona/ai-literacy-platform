/**
 * The five big ideas. Each is a curriculum unit theme AND an AILIS sub-score domain.
 */
export const BIG_IDEAS = ['discover', 'understand', 'create', 'protect', 'thrive'] as const
export type BigIdea = (typeof BIG_IDEAS)[number]

export const BIG_IDEA_LABELS: Record<BigIdea, { en: string; id: string }> = {
  discover: { en: 'Discover', id: 'Mengenal' },
  understand: { en: 'Understand', id: 'Memahami' },
  create: { en: 'Create', id: 'Berkarya' },
  protect: { en: 'Protect', id: 'Melindungi' },
  thrive: { en: 'Thrive', id: 'Berkembang' },
}

/**
 * AILIS sub-score domains (deck: "One band score, five sub-scores").
 * How lessons map to domains is set by the curriculum framework (ClickUp: "Write AI literacy framework").
 */
export const SCORE_DOMAINS = ['understand', 'use_create', 'evaluate', 'protect', 'apply'] as const
export type ScoreDomain = (typeof SCORE_DOMAINS)[number]

export const SCORE_DOMAIN_LABELS: Record<ScoreDomain, { en: string; id: string }> = {
  understand: { en: 'Understand', id: 'Memahami' },
  use_create: { en: 'Use & Create', id: 'Menggunakan & Berkarya' },
  evaluate: { en: 'Evaluate', id: 'Mengevaluasi' },
  protect: { en: 'Protect', id: 'Melindungi' },
  apply: { en: 'Apply', id: 'Menerapkan' },
}

export const TRACK_LEVELS = ['smp', 'sma_smk'] as const
export type TrackLevel = (typeof TRACK_LEVELS)[number]

export const LESSON_TYPES = [
  'video',
  'reading',
  'interactive',
  'quiz',
  'ai_lab',
  'project',
  'discussion',
] as const
export type LessonType = (typeof LESSON_TYPES)[number]

/** Editorial workflow for lessons (spec: CMS > Approval workflow). */
export const REVIEW_STATES = ['draft', 'in_review', 'approved'] as const
export type ReviewState = (typeof REVIEW_STATES)[number]
