import type { Access, FieldAccess, Where } from 'payload'
import { ADMIN_PANEL_ROLES, hasRole, type Role } from '@ailit/shared'

type UserLike = { id: string | number; roles?: string[] | null; school?: unknown }

const asUser = (u: unknown) => (u ?? null) as UserLike | null

/** Any role in the list may perform the operation. */
export const roles =
  (...allowed: Role[]): Access =>
  ({ req }) =>
    hasRole(asUser(req.user), ...allowed)

export const superAdminOnly: Access = roles('super_admin')

export const fieldSuperAdminOnly: FieldAccess = ({ req }) => hasRole(asUser(req.user), 'super_admin')

export const anyoneLoggedIn: Access = ({ req }) => Boolean(req.user)

/** Super admins see all; everyone else only themselves. */
export const selfOrSuperAdmin: Access = ({ req }) => {
  const user = asUser(req.user)
  if (!user) return false
  if (hasRole(user, 'super_admin')) return true
  return { id: { equals: user.id } }
}

/** Published content is public; drafts only for content staff. */
export const publishedOrStaff: Access = ({ req }) => {
  if (hasRole(asUser(req.user), 'content_editor', 'super_admin')) return true
  return { _status: { equals: 'published' } }
}

export const canAccessAdminPanel = ({ req }: { req: { user?: unknown } }) =>
  hasRole(asUser(req.user), ...ADMIN_PANEL_ROLES)

const idOf = (v: unknown): number | string | null =>
  v && typeof v === 'object' ? ((v as { id?: number | string }).id ?? null) : ((v as number | string | null) ?? null)

/**
 * Users: super admins see everyone; school admins see their school; teachers see students in
 * their classes; everyone sees themselves.
 */
export const readUsers: Access = async ({ req }) => {
  const user = asUser(req.user)
  if (!user) return false
  if (hasRole(user, 'super_admin')) return true
  const or: Where[] = [{ id: { equals: user.id } }]
  const schoolId = idOf(user.school)
  if (hasRole(user, 'school_admin') && schoolId) or.push({ school: { equals: schoolId } })
  if (hasRole(user, 'teacher')) {
    const classes = await req.payload.find({
      collection: 'classes',
      overrideAccess: true,
      depth: 0,
      limit: 200,
      where: { teachers: { contains: user.id } },
    })
    const ids = classes.docs.flatMap((c) => (c.students ?? []).map(idOf)).filter((x): x is number => x != null)
    if (ids.length) or.push({ id: { in: ids } })
  }
  return { or }
}

/** Classes: admins of the school, the class's own teachers and students. */
export const readClasses: Access = ({ req }) => {
  const user = asUser(req.user)
  if (!user) return false
  if (hasRole(user, 'super_admin')) return true
  const or: Where[] = [{ teachers: { contains: user.id } }, { students: { contains: user.id } }]
  const schoolId = idOf(user.school)
  if (hasRole(user, 'school_admin') && schoolId) or.push({ school: { equals: schoolId } })
  return { or }
}

export const updateClasses: Access = ({ req }) => {
  const user = asUser(req.user)
  if (!user) return false
  if (hasRole(user, 'super_admin')) return true
  const or: Where[] = []
  if (hasRole(user, 'teacher')) or.push({ teachers: { contains: user.id } })
  const schoolId = idOf(user.school)
  if (hasRole(user, 'school_admin') && schoolId) or.push({ school: { equals: schoolId } })
  return or.length ? { or } : false
}

/** Schools: staff of that school only. */
export const readOwnSchool: Access = ({ req }) => {
  const user = asUser(req.user)
  if (!user) return false
  if (hasRole(user, 'super_admin')) return true
  const schoolId = idOf(user.school)
  if (schoolId && hasRole(user, 'school_admin', 'teacher')) return { id: { equals: schoolId } }
  return false
}

export const updateOwnSchool: Access = ({ req }) => {
  const user = asUser(req.user)
  if (!user) return false
  if (hasRole(user, 'super_admin')) return true
  const schoolId = idOf(user.school)
  if (schoolId && hasRole(user, 'school_admin')) return { id: { equals: schoolId } }
  return false
}
