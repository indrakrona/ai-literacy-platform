import type { Access, CollectionConfig, Where } from 'payload'
import { hasRole } from '@ailit/shared'
import { notify } from '../lib/notify'

/** Teachers see assignments for classes they teach; students for classes they are in. */
const readAssignments: Access = async ({ req }) => {
  const u = req.user as { id: number; roles?: string[]; school?: number | { id: number } | null } | null
  if (!u) return false
  if (hasRole(u, 'super_admin')) return true
  const or: Where[] = [{ teachers: { contains: u.id } }, { students: { contains: u.id } }]
  const school = typeof u.school === 'object' ? u.school?.id : u.school
  if (hasRole(u, 'school_admin') && school) or.push({ school: { equals: school } })
  const classes = await req.payload.find({ collection: 'classes', overrideAccess: true, depth: 0, limit: 500, where: { or } })
  // An empty result (not `false`) so pages listing assignments show none instead of failing.
  const w: Where = classes.docs.length ? { class: { in: classes.docs.map((c) => c.id) } } : { id: { equals: -1 } }
  return w
}

/** Only a teacher of the class (or a super admin) can create or change its assignments. */
const teacherOfClass: Access = async ({ req, data, id }) => {
  const u = req.user as { id: number; roles?: string[] } | null
  if (!u) return false
  if (hasRole(u, 'super_admin')) return true
  if (!hasRole(u, 'teacher')) return false
  const classId = data?.class ?? (id ? (await req.payload.findByID({ collection: 'assignments', id, depth: 0, overrideAccess: true })).class : null)
  if (!classId) return false
  const klass = await req.payload.findByID({ collection: 'classes', id: typeof classId === 'object' ? classId.id : classId, depth: 0, overrideAccess: true })
  return (klass.teachers ?? []).some((t) => (typeof t === 'object' ? t.id : t) === u.id)
}

export const Assignments: CollectionConfig = {
  slug: 'assignments',
  admin: { defaultColumns: ['lesson', 'class', 'dueDate'], group: 'People' },
  access: { read: readAssignments, create: teacherOfClass, update: teacherOfClass, delete: teacherOfClass },
  fields: [
    { name: 'class', type: 'relationship', relationTo: 'classes', required: true, index: true },
    { name: 'lesson', type: 'relationship', relationTo: 'lessons', required: true },
    { name: 'dueDate', type: 'date', required: true },
    { name: 'note', type: 'textarea' },
    { name: 'assignedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
  ],
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        if (operation === 'create' && req.user) data.assignedBy = req.user.id
        return data
      },
    ],
    afterChange: [
      async ({ req, doc, operation }) => {
        if (operation !== 'create') return doc
        const klass = await req.payload.findByID({ collection: 'classes', id: typeof doc.class === 'object' ? doc.class.id : doc.class, depth: 0, overrideAccess: true }).catch(() => null)
        const lesson = await req.payload.findByID({ collection: 'lessons', id: typeof doc.lesson === 'object' ? doc.lesson.id : doc.lesson, depth: 2, overrideAccess: true, draft: true }).catch(() => null)
        if (!klass || !lesson) return doc
        const unit = typeof lesson.unit === 'object' ? lesson.unit : null
        const track = unit && typeof unit.track === 'object' ? unit.track : null
        await notify(req.payload, {
          userIds: (klass.students ?? []).map((s) => (typeof s === 'object' ? s.id : s)),
          kind: 'assignment_new',
          vars: { lesson: lesson.title, class: klass.name, due: new Date(doc.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) },
          link: track ? `/belajar/${track.slug}/${lesson.order}` : '/beranda',
        })
        return doc
      },
    ],
  },
}
