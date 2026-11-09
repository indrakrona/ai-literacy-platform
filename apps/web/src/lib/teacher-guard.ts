import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { getCurrentUser, getPayloadClient } from './session'

/** Signed-in teacher (or admin) who teaches this class; otherwise redirect / 404. */
export async function requireClassTeacher(classId: number) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'teacher', 'school_admin', 'super_admin')) notFound()
  const payload = await getPayloadClient()
  const klass = await payload.findByID({ collection: 'classes', id: classId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!klass) notFound()
  const teaches = (klass.teachers ?? []).some((t) => (typeof t === 'object' ? t.id : t) === user.id)
  const schoolAdmin = hasRole(user, 'school_admin') && (typeof user.school === 'object' ? user.school?.id : user.school) === (typeof klass.school === 'object' ? klass.school.id : klass.school)
  if (!teaches && !schoolAdmin && !hasRole(user, 'super_admin')) notFound()
  return { user, payload, klass }
}
