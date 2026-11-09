import type { CollectionConfig, Endpoint, Where } from 'payload'
import { hasRole } from '@ailit/shared'
import { NOTIFICATION_KINDS } from '../lib/notify'

/** POST /api/notifications/read {id?} — mark one (or, without id, all) of my notifications read. */
const markRead: Endpoint = {
  path: '/read',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Sign in first' }, { status: 401 })
    let b: { id?: unknown } = {}
    try {
      b = ((req.json ? await req.json() : {}) ?? {}) as typeof b
    } catch {
      /* empty */
    }
    const where: Where = {
      and: [
        { user: { equals: req.user.id } },
        { readAt: { exists: false } },
        ...(b.id ? [{ id: { equals: Number(b.id) } }] : []),
      ],
    }
    const res = await req.payload.update({ collection: 'notifications', overrideAccess: true, where, data: { readAt: new Date().toISOString() } })
    return Response.json({ updated: res.docs.length })
  },
}

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: { group: 'People', defaultColumns: ['user', 'kind', 'title', 'readAt', 'createdAt'], hidden: ({ user }) => !hasRole(user as { roles?: string[] }, 'super_admin') },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (hasRole(req.user as { roles?: string[] }, 'super_admin')) return true
      return { user: { equals: req.user.id } }
    },
    create: () => false,
    update: () => false,
    delete: ({ req }) => hasRole(req.user as { roles?: string[] }, 'super_admin'),
  },
  endpoints: [markRead],
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'kind', type: 'select', required: true, options: NOTIFICATION_KINDS.map((v) => ({ value: v, label: v })) },
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    { name: 'link', type: 'text' },
    { name: 'readAt', type: 'date', index: true },
  ],
}
