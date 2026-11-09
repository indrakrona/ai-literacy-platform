import type { Payload } from 'payload'

const idOf = (v: unknown): number => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number))

export interface ClassSummary {
  id: number
  name: string
  academicYear: string
  joinCode: string
  track: string | null
  teachers: string[]
  students: number
  pendingConsent: number
}

/** Everything the school admin screen shows (spec I1–I2). */
export async function schoolOverview(payload: Payload, schoolId: number) {
  const school = await payload.findByID({ collection: 'schools', id: schoolId, depth: 0, overrideAccess: true })
  const classes = (await payload.find({ collection: 'classes', overrideAccess: true, depth: 1, limit: 500, sort: 'name', where: { school: { equals: schoolId } } })).docs
  const users = (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 5000, pagination: false, where: { school: { equals: schoolId } } })).docs
  const byId = new Map(users.map((u) => [u.id, u]))
  const studentIds = new Set<number>()
  const summaries: ClassSummary[] = classes.map((c) => {
    const ids = (c.students ?? []).map(idOf)
    ids.forEach((i) => studentIds.add(i))
    return {
      id: c.id,
      name: c.name,
      academicYear: c.academicYear,
      joinCode: c.joinCode ?? '',
      track: c.track && typeof c.track === 'object' ? c.track.title : null,
      teachers: (c.teachers ?? []).map((t) => (typeof t === 'object' ? t.name : byId.get(t)?.name ?? `#${t}`)),
      students: ids.length,
      pendingConsent: ids.filter((i) => byId.get(i)?.consentStatus === 'pending').length,
    }
  })
  const students = users.filter((u) => u.roles?.includes('student'))
  const pending = students.filter((u) => u.consentStatus === 'pending')
  const completed = studentIds.size
    ? (await payload.count({ collection: 'lesson-progress', overrideAccess: true, where: { and: [{ user: { in: [...studentIds] } }, { status: { equals: 'completed' } }] } })).totalDocs
    : 0
  return {
    school,
    classes: summaries,
    totals: {
      classes: classes.length,
      students: students.length,
      teachers: users.filter((u) => u.roles?.includes('teacher')).length,
      pendingConsent: pending.length,
      declinedConsent: students.filter((u) => u.consentStatus === 'declined').length,
      lessonsCompleted: completed,
    },
    pending: pending.map((u) => ({ id: u.id, name: u.name, email: u.email })),
  }
}
