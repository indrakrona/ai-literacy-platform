import type { Access, CollectionConfig, Payload, PayloadRequest, Where } from 'payload'
import { APIError } from 'payload'
import { hasRole } from '@ailit/shared'
import { notify } from '../lib/notify'

/**
 * Announcements (spec L4): platform-wide (super admin) or for one school (its school admin). Shown on
 * people's home pages while active; optionally also sent as an in-app notification.
 */
const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
type U = { id: number; roles?: string[]; school?: unknown } | null

export const ANNOUNCEMENT_AUDIENCES = ['student', 'teacher', 'parent', 'school_admin', 'candidate'] as const

const manage: Access = ({ req }) => {
  const u = req.user as U
  if (hasRole(u, 'super_admin')) return true
  const school = idOf(u?.school)
  if (hasRole(u, 'school_admin') && school) {
    const w: Where = { and: [{ scope: { equals: 'school' } }, { school: { equals: school } }] }
    return w
  }
  return false
}

/** Schools whose announcements a user sees: their own, and for parents their children's. */
async function schoolsFor(payload: Payload, user: { id: number; roles?: string[] | null; school?: unknown }): Promise<number[]> {
  const ids = new Set<number>()
  const own = idOf(user.school)
  if (own) ids.add(own)
  if (hasRole(user, 'parent')) {
    const kids = await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 20, where: { guardians: { contains: user.id } } })
    for (const k of kids.docs) {
      const s = idOf(k.school)
      if (s) ids.add(s)
    }
  }
  return [...ids]
}

const matchesRoles = (audience: string[] | null | undefined, roles: string[] | null | undefined) => !audience?.length || audience.some((r) => roles?.includes(r))

/** Active announcements for this user, newest first. */
export async function announcementsFor(payload: Payload, user: { id: number; roles?: string[] | null; school?: unknown }, locale: 'id' | 'en', now = new Date()) {
  const schools = await schoolsFor(payload, user)
  const scope: Where = schools.length ? { or: [{ scope: { equals: 'platform' } }, { school: { in: schools } }] } : { scope: { equals: 'platform' } }
  const res = await payload.find({
    collection: 'announcements',
    overrideAccess: true,
    depth: 0,
    locale,
    fallbackLocale: 'id',
    limit: 20,
    sort: '-startsAt',
    where: { and: [scope, { startsAt: { less_than_equal: now.toISOString() } }, { or: [{ endsAt: { exists: false } }, { endsAt: { greater_than: now.toISOString() } }] }] },
  })
  return res.docs.filter((a) => matchesRoles(a.audience as string[] | null, user.roles))
}

/** Everyone an announcement is for (used to send notifications). */
export async function audienceOf(payload: Payload, a: { scope: string; school?: unknown; audience?: string[] | null }, req?: PayloadRequest): Promise<number[]> {
  const roles = a.audience?.length ? a.audience : null
  const base: Where[] = [{ suspended: { not_equals: true } }]
  if (roles) base.push({ roles: { in: roles } })
  if (a.scope === 'platform') {
    const all = await payload.find({ collection: 'users', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { and: base }, req })
    return all.docs.map((u) => u.id)
  }
  const school = idOf(a.school)
  if (!school) return []
  const members = await payload.find({ collection: 'users', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { and: [...base, { school: { equals: school } }] }, req })
  const ids = new Set(members.docs.map((u) => u.id))
  if (!roles || roles.includes('parent')) {
    // Parents have no school of their own: reach them through their children at this school.
    const kids = await payload.find({ collection: 'users', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { and: [{ school: { equals: school } }, { guardians: { exists: true } }] }, req })
    for (const k of kids.docs) for (const g of k.guardians ?? []) if (idOf(g)) ids.add(idOf(g)!)
  }
  return [...ids]
}

async function sendNotifications(payload: Payload, a: { id: number; title?: string | null; body?: string | null; scope: string; school?: unknown; audience?: string[] | null }, now: Date, req?: PayloadRequest) {
  await payload.update({ collection: 'announcements', id: a.id, overrideAccess: true, data: { notifiedAt: now.toISOString() }, context: { skipNotify: true }, req })
  const ids = await audienceOf(payload, a, req)
  const excerpt = (a.body ?? '').replace(/\s+/g, ' ').slice(0, 160)
  for (let i = 0; i < ids.length; i += 200) {
    await notify(payload, { userIds: ids.slice(i, i + 200), kind: 'announcement', vars: { title: a.title ?? '', excerpt }, link: `/pengumuman#a${a.id}`, email: false })
  }
  return ids.length
}

/** Called by the hourly job: send notifications for announcements whose start time has come. */
export async function notifyDueAnnouncements(payload: Payload, now = new Date()): Promise<number> {
  const due = await payload.find({
    collection: 'announcements',
    overrideAccess: true,
    depth: 0,
    limit: 50,
    where: { and: [{ notify: { equals: true } }, { notifiedAt: { exists: false } }, { startsAt: { less_than_equal: now.toISOString() } }] },
  })
  let n = 0
  for (const a of due.docs) n += await sendNotifications(payload, a as never, now)
  return n
}

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'scope', 'school', 'startsAt', 'endsAt'], group: 'Communication' },
  access: {
    read: manage, // everyone else sees announcements through announcementsFor()
    create: ({ req }) => hasRole(req.user as U, 'super_admin', 'school_admin'),
    update: manage,
    delete: manage,
  },
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        const u = req.user as U
        if (operation === 'create' && u) data.createdBy = u.id
        if (u && !hasRole(u, 'super_admin')) {
          // School admins only announce to their own school.
          const own = idOf(u.school)
          if (!own) throw new APIError('Account not linked to a school', 403, undefined, true)
          data.scope = 'school'
          data.school = own
        }
        if (data.scope === 'school' && !data.school) throw new APIError('Choose the school for a school announcement', 400, undefined, true)
        if (data.scope === 'platform') data.school = null
        if (data.endsAt && data.startsAt && new Date(data.endsAt) <= new Date(data.startsAt)) throw new APIError('The end must be after the start', 400, undefined, true)
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, context }) => {
        if (context?.skipNotify) return doc
        if (doc.notify && !doc.notifiedAt && new Date(doc.startsAt) <= new Date()) await sendNotifications(req.payload, doc, new Date(), req)
        return doc
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, maxLength: 120 },
    { name: 'body', type: 'textarea', required: true, localized: true, maxLength: 2000 },
    {
      type: 'row',
      fields: [
        {
          name: 'scope',
          type: 'select',
          required: true,
          defaultValue: 'school',
          options: [
            { value: 'platform', label: 'Whole platform' },
            { value: 'school', label: 'One school' },
          ],
        },
        { name: 'school', type: 'relationship', relationTo: 'schools', index: true, admin: { condition: (d) => d?.scope === 'school' } },
      ],
    },
    {
      name: 'audience',
      type: 'select',
      hasMany: true,
      options: ANNOUNCEMENT_AUDIENCES.map((v) => ({ value: v, label: v.replace('_', ' ') })),
      admin: { description: 'Leave empty for everyone in scope' },
    },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', type: 'date', required: true, defaultValue: () => new Date().toISOString(), admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'endsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' }, description: 'Optional: hide after this time' } },
      ],
    },
    { name: 'notify', label: 'Also send as a notification', type: 'checkbox', defaultValue: false },
    { name: 'notifiedAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true, position: 'sidebar' } },
  ],
}
