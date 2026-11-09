import type { Access, FieldAccess } from 'payload'
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
