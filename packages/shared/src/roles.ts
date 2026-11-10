/**
 * Platform roles (spec: "Users and roles"). One person can hold several roles.
 * Phase 2 adds `org_admin` and `verifier`.
 */
export const ROLES = [
  'student',
  'parent',
  'teacher',
  'school_admin',
  'candidate',
  'content_editor',
  'content_reviewer',
  'assessment_author',
  'rater',
  'proctor',
  'super_admin',
] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, { en: string; id: string }> = {
  student: { en: 'Student', id: 'Siswa' },
  parent: { en: 'Parent / guardian', id: 'Orang tua / wali' },
  teacher: { en: 'Teacher', id: 'Guru' },
  school_admin: { en: 'School admin', id: 'Admin sekolah' },
  candidate: { en: 'Test candidate', id: 'Peserta tes' },
  content_editor: { en: 'Content editor', id: 'Editor konten' },
  content_reviewer: { en: 'Content reviewer', id: 'Penelaah konten' },
  assessment_author: { en: 'Assessment author / reviewer', id: 'Penulis / penelaah soal' },
  rater: { en: 'Rater / moderator', id: 'Penilai / moderator' },
  proctor: { en: 'Proctor', id: 'Pengawas' },
  super_admin: { en: 'Super admin', id: 'Super admin' },
}

/** Roles allowed into the Payload admin panel at all. */
export const ADMIN_PANEL_ROLES: readonly Role[] = [
  'content_editor',
  'content_reviewer',
  'assessment_author',
  'rater',
  'super_admin',
]

export function hasRole(
  user: { roles?: readonly string[] | null } | null | undefined,
  ...roles: Role[]
): boolean {
  if (!user?.roles?.length) return false
  return user.roles.some((r) => (roles as string[]).includes(r))
}

export function isSuperAdmin(user: { roles?: readonly string[] | null } | null | undefined): boolean {
  return hasRole(user, 'super_admin')
}
