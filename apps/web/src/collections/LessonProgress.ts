import type { Access, CollectionConfig, Endpoint } from 'payload'
import { hasRole } from '@ailit/shared'
import { track, type Actor } from '../lib/analytics'

const ownOrAdmin: Access = ({ req }) => {
  if (!req.user) return false
  if (hasRole(req.user as { roles?: string[] }, 'super_admin')) return true
  return { user: { equals: req.user.id } }
}

/** POST /api/lesson-progress/complete — mark a published lesson complete for the signed-in user. */
const completeEndpoint: Endpoint = {
  path: '/complete',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Sign in first' }, { status: 401 })
    let body: { lessonId?: unknown } = {}
    try {
      body = (req.json ? await req.json() : {}) as typeof body
    } catch {
      /* invalid json */
    }
    const lessonId = Number(body.lessonId)
    if (!Number.isInteger(lessonId) || lessonId <= 0) return Response.json({ error: 'lessonId is required' }, { status: 400 })
    const lesson = await req.payload.find({
      collection: 'lessons',
      where: { and: [{ id: { equals: lessonId } }, { _status: { equals: 'published' } }] },
      limit: 1,
      depth: 0,
    })
    if (!lesson.docs[0]) return Response.json({ error: 'Lesson not found' }, { status: 404 })

    const userId = Number(req.user.id)
    const existing = await req.payload.find({
      collection: 'lesson-progress',
      overrideAccess: true,
      where: { and: [{ user: { equals: userId } }, { lesson: { equals: lessonId } }] },
      limit: 1,
    })
    const data = { user: userId, lesson: lessonId, status: 'completed' as const, completedAt: new Date().toISOString() }
    const doc = existing.docs[0]
      ? await req.payload.update({ collection: 'lesson-progress', id: existing.docs[0].id, overrideAccess: true, data })
      : await req.payload.create({ collection: 'lesson-progress', overrideAccess: true, data })
    if (!existing.docs[0] || existing.docs[0].status !== 'completed') {
      await track(req.payload, { name: 'lesson_completed', user: req.user as unknown as Actor, headers: req.headers, props: { lessonId } })
    }
    return Response.json({ id: doc.id, status: doc.status })
  },
}

export const LessonProgress: CollectionConfig = {
  slug: 'lesson-progress',
  admin: { defaultColumns: ['user', 'lesson', 'status', 'completedAt'], group: 'Learning' },
  access: { read: ownOrAdmin, create: () => false, update: () => false, delete: ownOrAdmin },
  endpoints: [completeEndpoint],
  indexes: [{ fields: ['user', 'lesson'], unique: true }],
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'lesson', type: 'relationship', relationTo: 'lessons', required: true, index: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'completed',
      options: [
        { value: 'started', label: 'Started' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    { name: 'completedAt', type: 'date' },
  ],
}
