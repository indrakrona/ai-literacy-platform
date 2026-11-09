/**
 * AILIS test engine — kept as its own package so the independent test body can later
 * run it separately from Impact Thinklab (spec: Code organisation).
 * Sprint 0 defines the item and score contracts; the engine is built in ClickUp tasks G1–G8.
 */
import type { ScoreDomain } from '@ailit/shared'

export const ITEM_TYPES = [
  'single_choice',
  'multiple_choice',
  'scenario_judgment',
  'ordering',
  'short_answer',
  'performance_task',
] as const
export type ItemType = (typeof ITEM_TYPES)[number]

export const ITEM_STATES = ['draft', 'review', 'approved', 'piloted', 'live', 'retired'] as const
export type ItemState = (typeof ITEM_STATES)[number]

/** Overall band 0–9 plus one sub-score per domain. Cut-scores are set by the expert panel. */
export interface ScoreReport {
  band: number
  subScores: Record<ScoreDomain, number>
  formId: string
  issuedAt: string
}
