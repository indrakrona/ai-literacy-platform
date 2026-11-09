/**
 * First-party product analytics (spec: Analytics). Events go to our own `analytics-events` table and,
 * when POSTHOG_KEY is set, are forwarded server-side to PostHog. There is no browser SDK, so there are
 * no session replays at all, which is stricter than the spec's "no replays for under-18s".
 *
 * Privacy rules enforced here:
 * - no name, email, exact age or free text in events: only a pseudonymous analytics ID, role, school ID,
 *   track, age band and device type, plus a short allow-list of numeric/enum properties;
 * - tracking never breaks the feature that triggered it.
 */
import { createHmac } from 'crypto'
import type { Payload } from 'payload'

export const EVENT_NAMES = [
  'signed_up',
  'consent_requested',
  'consent_given',
  'class_joined',
  'lesson_started',
  'lesson_completed',
  'quiz_submitted',
  'ai_message_sent',
  'ai_message_flagged',
  'shield_blocked',
  'project_submitted',
  'project_graded',
  'badge_earned',
  'challenge_joined',
  'test_started',
  'test_submitted',
  'score_released',
  'certificate_shared',
  'checkout_started',
  'payment_completed',
] as const
export type EventName = (typeof EVENT_NAMES)[number]

/** Events the browser may send; everything else is recorded only by the server. */
export const CLIENT_EVENTS: EventName[] = ['lesson_started', 'quiz_submitted', 'certificate_shared']

const PROP_KEYS = ['lessonId', 'activityId', 'classId', 'briefId', 'attemptId', 'orderId', 'status', 'score', 'max', 'category', 'plan', 'seats', 'amountIdr', 'competency', 'bigIdea', 'decision', 'tokens'] as const
type Props = Partial<Record<(typeof PROP_KEYS)[number], string | number | boolean>>

export type AgeBand = 'under_13' | '13_15' | '16_17' | '18_plus' | 'unknown'
export type Device = 'mobile' | 'tablet' | 'desktop' | 'unknown'

export interface Actor {
  id: number | string
  roles?: string[] | null
  school?: number | { id: number } | null
  dateOfBirth?: string | null
}

/** Pseudonymous, stable per user, not reversible without the server secret. */
export function analyticsId(userId: number | string): string {
  return createHmac('sha256', process.env.PAYLOAD_SECRET || 'dev').update(`aid:${userId}`).digest('hex').slice(0, 20)
}

export function ageBand(dob?: string | null, now = new Date()): AgeBand {
  if (!dob) return 'unknown'
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return 'unknown'
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  if (age < 13) return 'under_13'
  if (age <= 15) return '13_15'
  if (age <= 17) return '16_17'
  return '18_plus'
}

export function deviceOf(userAgent?: string | null): Device {
  if (!userAgent) return 'unknown'
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(userAgent)) return 'tablet'
  if (/Mobi|iPhone|Android/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

/** Keep only allow-listed keys with short scalar values. */
export function sanitizeProps(input: Record<string, unknown> | undefined): Props {
  const out: Props = {}
  if (!input) return out
  for (const k of PROP_KEYS) {
    const v = input[k]
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v
    else if (typeof v === 'boolean') out[k] = v
    else if (typeof v === 'string' && v.length <= 40 && /^[\w .:-]*$/.test(v)) out[k] = v
  }
  return out
}

const primaryRole = (roles?: string[] | null) => {
  const order = ['super_admin', 'school_admin', 'teacher', 'rater', 'content_editor', 'assessment_author', 'proctor', 'parent', 'candidate', 'student']
  return order.find((r) => roles?.includes(r)) ?? roles?.[0] ?? 'unknown'
}

export interface TrackInput {
  name: EventName
  user: Actor | null | undefined
  headers?: Headers
  track?: string | null
  props?: Record<string, unknown>
}

/** Record an event. Never throws. */
export async function track(payload: Payload, input: TrackInput): Promise<void> {
  try {
    if (!input.user) return
    const u = input.user
    const school = u.school && typeof u.school === 'object' ? u.school.id : (u.school ?? null)
    const data = {
      name: input.name,
      aid: analyticsId(u.id),
      role: primaryRole(u.roles),
      school: school ?? undefined,
      track: input.track ?? undefined,
      ageBand: ageBand(u.dateOfBirth),
      device: deviceOf(input.headers?.get('user-agent')),
      props: sanitizeProps(input.props),
    }
    await payload.create({ collection: 'analytics-events', overrideAccess: true, data })
    forwardToPostHog(data)
  } catch (e) {
    payload.logger.warn(`analytics: could not record ${input.name}: ${(e as Error).message}`)
  }
}

function forwardToPostHog(data: { name: string; aid: string } & Record<string, unknown>) {
  const key = process.env.POSTHOG_KEY
  if (!key) return
  const host = process.env.POSTHOG_HOST || 'https://eu.i.posthog.com'
  const { name, aid, ...properties } = data
  void fetch(`${host}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: key, event: name, distinct_id: aid, properties: { ...properties, $process_person_profile: false } }),
  }).catch(() => undefined)
}
