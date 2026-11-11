/** Server helpers for the teacher training pages. */
import type { Payload } from 'payload'
import { statusOf } from './certificates'
import { COURSE_MODULES, RETRY_AFTER_MINUTES } from './teacher-course'

export async function trainingState(payload: Payload, userId: number) {
  const rec = (await payload.find({ collection: 'teacher-certifications', overrideAccess: true, depth: 0, limit: 1, where: { user: { equals: userId } } })).docs[0]
  const done = new Set(((rec?.modulesDone as string[] | null) ?? []).filter((k) => COURSE_MODULES.some((m) => m.key === k)))
  const attempts = rec?.attempts ?? []
  const last = attempts.at(-1)
  const retryAt = last && !last.passed ? new Date(new Date(last.at).getTime() + RETRY_AFTER_MINUTES * 60_000) : null
  const cert = rec?.code && rec.expiresAt && rec.issuedAt ? { code: rec.code, issuedAt: rec.issuedAt, expiresAt: rec.expiresAt, status: statusOf({ status: rec.status, expiresAt: rec.expiresAt }) } : null
  return {
    done,
    allDone: COURSE_MODULES.every((m) => done.has(m.key)),
    attempts: attempts.length,
    best: attempts.reduce((b, a) => Math.max(b, a.correct / (a.total || 1)), 0),
    retryAt: retryAt && retryAt > new Date() ? retryAt : null,
    cert: cert && cert.status !== 'revoked' ? cert : null,
  }
}
