/**
 * Data rights (spec B8, N5 — UU PDP): download my data, ask for it to be deleted, withdraw consent.
 * A download is immediate. A deletion is a request the AI Literacy team carries out before its due date;
 * erasing replaces the account with an anonymous placeholder so aggregate statistics and audit records stay
 * consistent while nothing identifies the person any more.
 */
import type { Payload } from 'payload'
import { randomBytes } from 'node:crypto'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
const SECRET_FIELDS = ['hash', 'salt', 'resetPasswordToken', 'resetPasswordExpiration', 'loginAttempts', 'lockUntil', 'sessions', 'parentLinkCode', '_verificationToken']

async function all(payload: Payload, collection: string, where: Record<string, unknown>) {
  return (await payload.find({ collection: collection as never, overrideAccess: true, depth: 0, pagination: false, limit: 0, where: where as never })).docs as unknown as Record<string, unknown>[]
}

/** Everything the platform holds about one person, as plain JSON (spec B8 "download my data"). */
export async function exportUserData(payload: Payload, userId: number) {
  const user = (await payload.findByID({ collection: 'users', id: userId, depth: 0, overrideAccess: true })) as unknown as Record<string, unknown>
  const profile = Object.fromEntries(Object.entries(user).filter(([k]) => !SECRET_FIELDS.includes(k)))
  const [classes, progress, xp, badges, conversations, submissions, attempts, certificates, bookings, consent, notifications, dataRequests] = await Promise.all([
    all(payload, 'classes', { or: [{ students: { contains: userId } }, { teachers: { contains: userId } }] }),
    all(payload, 'lesson-progress', { user: { equals: userId } }),
    all(payload, 'xp-events', { user: { equals: userId } }),
    all(payload, 'user-badges', { user: { equals: userId } }),
    all(payload, 'ai-conversations', { user: { equals: userId } }),
    all(payload, 'submissions', { members: { contains: userId } }),
    all(payload, 'test-attempts', { candidate: { equals: userId } }),
    all(payload, 'certificates', { candidate: { equals: userId } }),
    all(payload, 'bookings', { candidate: { equals: userId } }),
    all(payload, 'consent-requests', { student: { equals: userId } }),
    all(payload, 'notifications', { user: { equals: userId } }),
    all(payload, 'data-requests', { user: { equals: userId } }),
  ])
  const pick = (rows: Record<string, unknown>[], keys: string[]) => rows.map((r) => Object.fromEntries(keys.map((k) => [k, r[k]])))
  return {
    exportedAt: new Date().toISOString(),
    about: 'Data held by Impact Thinklab AI Literacy (ailearning.impact.id) about this account. Questions: indra@impact.id',
    profile,
    classes: pick(classes, ['id', 'name', 'academicYear']),
    lessonProgress: pick(progress, ['lesson', 'status', 'quizScore', 'completedAt', 'createdAt']),
    xpEvents: pick(xp, ['source', 'bigIdea', 'xp', 'createdAt']),
    badges: pick(badges, ['badge', 'createdAt']),
    aiConversations: pick(conversations, ['id', 'activity', 'messages', 'tokens', 'createdAt', 'updatedAt']),
    projectSubmissions: pick(submissions, ['id', 'brief', 'text', 'links', 'status', 'scores', 'feedback', 'submittedAt', 'gradedAt']),
    // Answer keys are not part of a person's data; their own answers and results are.
    testAttempts: pick(attempts, ['id', 'form', 'status', 'startedAt', 'submittedAt', 'responses', 'report', 'integrity']),
    certificates: pick(certificates, ['code', 'band', 'subScores', 'issuedAt', 'expiresAt', 'status']),
    testBookings: pick(bookings, ['session', 'status', 'priceIdr', 'createdAt']),
    parentConsent: pick(consent, ['guardianName', 'guardianEmail', 'guardianPhone', 'status', 'decidedAt', 'consentVersion', 'createdAt']),
    notifications: pick(notifications, ['kind', 'title', 'body', 'readAt', 'createdAt']),
    dataRequests: pick(dataRequests, ['type', 'status', 'createdAt', 'dueAt', 'resolvedAt']),
    note: 'Usage analytics are stored under a pseudonymous ID and are not included.',
  }
}

/**
 * Erase a person (deletion request approved). Personal content is deleted; records others depend on are kept
 * without anything that identifies the person: test results stay in anonymous statistics, certificates are
 * revoked (so a shared link says "revoked"), parent-consent proof keeps only the decision and its date.
 */
export async function eraseUser(payload: Payload, userId: number): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  const del = async (collection: string, where: Record<string, unknown>) => {
    const r = await payload.delete({ collection: collection as never, overrideAccess: true, where: where as never })
    counts[collection] = (r.docs ?? []).length
  }
  await del('ai-conversations', { user: { equals: userId } })
  await del('notifications', { user: { equals: userId } })
  await del('lesson-progress', { user: { equals: userId } })
  await del('xp-events', { user: { equals: userId } })
  await del('user-badges', { user: { equals: userId } })
  await del('bookings', { candidate: { equals: userId } })

  // Team projects stay for teammates without this person; solo projects go.
  const subs = await all(payload, 'submissions', { members: { contains: userId } })
  for (const s of subs) {
    const members = ((s.members as unknown[]) ?? []).map(idOf).filter((m): m is number => Boolean(m) && m !== userId)
    if (members.length) await payload.update({ collection: 'submissions', id: s.id as number, overrideAccess: true, data: { members } })
    else await payload.delete({ collection: 'submissions', id: s.id as number, overrideAccess: true })
  }
  counts.submissions = subs.length

  for (const a of await all(payload, 'test-attempts', { candidate: { equals: userId } })) {
    await payload.update({ collection: 'test-attempts', id: a.id as number, overrideAccess: true, data: { responses: {}, integrity: null, incidents: null, aiSuggestions: null } })
  }
  for (const c of await all(payload, 'certificates', { candidate: { equals: userId } })) {
    await payload.update({ collection: 'certificates', id: c.id as number, overrideAccess: true, data: { status: 'revoked', revokedReason: 'Deleted at the holder’s request', revokedAt: new Date().toISOString() } })
  }
  for (const r of await all(payload, 'consent-requests', { student: { equals: userId } })) {
    await payload.update({ collection: 'consent-requests', id: r.id as number, overrideAccess: true, data: { guardianName: null, guardianEmail: null, guardianPhone: null, decisionIp: null, decisionUserAgent: null } as never })
  }
  for (const c of await all(payload, 'classes', { or: [{ students: { contains: userId } }, { teachers: { contains: userId } }] })) {
    const without = (v: unknown) => ((v as unknown[]) ?? []).map(idOf).filter((x) => x && x !== userId)
    await payload.update({ collection: 'classes', id: c.id as number, overrideAccess: true, data: { students: without(c.students), teachers: without(c.teachers) } as never })
  }
  // As a parent: stop following any children.
  for (const k of await all(payload, 'users', { guardians: { contains: userId } })) {
    await payload.update({ collection: 'users', id: k.id as number, overrideAccess: true, data: { guardians: ((k.guardians as unknown[]) ?? []).map(idOf).filter((x) => x !== userId) } as never })
  }

  await payload.update({
    collection: 'users',
    id: userId,
    overrideAccess: true,
    data: {
      name: 'Pengguna dihapus',
      email: `deleted-${userId}@deleted.invalid`,
      password: randomBytes(24).toString('hex'),
      phone: null,
      dateOfBirth: null,
      guardians: [],
      parentLinkCode: null,
      parentLinkExpiresAt: null,
      notifyEmail: false,
      notifyWhatsApp: false,
      showInShowcase: false,
      suspended: true,
      deletedAt: new Date().toISOString(),
    } as never,
  })
  return counts
}

/** Due date for a request, from the platform setting (days). */
export function dueDate(from: Date, days: number): Date {
  return new Date(from.getTime() + Math.max(1, days) * 86_400_000)
}
