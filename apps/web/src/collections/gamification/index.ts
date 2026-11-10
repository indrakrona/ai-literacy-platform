import type { Access, CollectionConfig, Endpoint, GlobalConfig } from 'payload'
import { BIG_IDEAS, BIG_IDEA_LABELS, hasRole } from '@ailit/shared'
import { roles } from '../../access'
import { track, type Actor } from '../../lib/analytics'
import { challengeProgress, checkChallenges } from '../../lib/gamification'

const bigIdeaOptions = BIG_IDEAS.map((b) => ({ value: b, label: `${BIG_IDEA_LABELS[b].id} / ${BIG_IDEA_LABELS[b].en}` }))
const idOf = (v: unknown): number => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number))
const own: Access = ({ req }) => {
  if (!req.user) return false
  if (hasRole(req.user as { roles?: string[] }, 'super_admin')) return true
  return { user: { equals: req.user.id } }
}

/** XP ledger. Written only by the server; students read their own. */
export const XpEvents: CollectionConfig = {
  slug: 'xp-events',
  admin: { group: 'Gamification', defaultColumns: ['user', 'source', 'bigIdea', 'xp', 'createdAt'], hidden: ({ user }) => !hasRole(user as { roles?: string[] }, 'super_admin') },
  access: { read: own, create: () => false, update: () => false, delete: roles('super_admin') },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'source', type: 'select', required: true, index: true, options: ['lesson_complete', 'quiz_perfect', 'ai_lab_session', 'project_submitted', 'project_graded', 'challenge_complete'].map((v) => ({ value: v, label: v })) },
    { name: 'sourceId', type: 'text', required: true },
    { name: 'bigIdea', type: 'select', required: true, index: true, options: bigIdeaOptions },
    { name: 'xp', type: 'number', required: true, min: 0 },
    { name: 'key', type: 'text', required: true, unique: true, admin: { description: 'user:source:sourceId — prevents double awards' } },
  ],
}

/** Badges are defined in the CMS: name, icon and the rule that earns them. */
export const Badges: CollectionConfig = {
  slug: 'badges',
  admin: { group: 'Gamification', useAsTitle: 'name', defaultColumns: ['icon', 'name', 'criterion', 'target', 'active'] },
  access: { read: () => true, create: roles('content_editor', 'content_reviewer', 'super_admin'), update: roles('content_editor', 'content_reviewer', 'super_admin'), delete: roles('super_admin') },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true },
    { type: 'row', fields: [{ name: 'icon', type: 'text', required: true, admin: { description: 'One emoji, e.g. 🛡️' } }, { name: 'name', type: 'text', required: true, localized: true }] },
    { name: 'description', type: 'textarea', localized: true },
    {
      type: 'row',
      fields: [
        {
          name: 'criterion',
          type: 'select',
          required: true,
          options: [
            { value: 'lessons_total', label: 'Lessons completed (any)' },
            { value: 'lessons_in_big_idea', label: 'Lessons completed in a big idea' },
            { value: 'level_in_big_idea', label: 'Level reached in a big idea' },
            { value: 'all_big_ideas_level', label: 'Level reached in every big idea' },
            { value: 'projects_graded', label: 'Projects marked' },
            { value: 'ai_lab_sessions', label: 'AI Lab sessions' },
            { value: 'challenges_completed', label: 'Challenges completed' },
          ],
        },
        { name: 'target', type: 'number', required: true, min: 1, defaultValue: 1 },
        { name: 'bigIdea', type: 'select', options: bigIdeaOptions, admin: { condition: (d) => ['lessons_in_big_idea', 'level_in_big_idea'].includes(d?.criterion) } },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 10, admin: { position: 'sidebar' } },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}

export const UserBadges: CollectionConfig = {
  slug: 'user-badges',
  admin: { group: 'Gamification', defaultColumns: ['user', 'badge', 'createdAt'], hidden: ({ user }) => !hasRole(user as { roles?: string[] }, 'super_admin') },
  access: { read: own, create: () => false, update: () => false, delete: roles('super_admin') },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'badge', type: 'relationship', relationTo: 'badges', required: true },
    { name: 'key', type: 'text', required: true, unique: true },
  ],
}

const teacherOfChallengeClass: Access = async ({ req, data, id }) => {
  const u = req.user as { id: number; roles?: string[] } | null
  if (!u) return false
  if (hasRole(u, 'super_admin')) return true
  if (!hasRole(u, 'teacher')) return false
  let classId = data?.class ? idOf(data.class) : undefined
  if (!classId && id) {
    const ch = await req.payload.findByID({ collection: 'challenges', id, depth: 0, overrideAccess: true }).catch(() => null)
    classId = ch ? idOf(ch.class) : undefined
  }
  if (!classId) return false
  const klass = await req.payload.findByID({ collection: 'classes', id: classId, depth: 0, overrideAccess: true }).catch(() => null)
  return Boolean(klass?.teachers?.map(idOf).includes(u.id))
}

/** POST /api/challenges/:id/join — a student in the class joins a challenge. */
const join: Endpoint = {
  path: '/:id/join',
  method: 'post',
  handler: async (req) => {
    const u = req.user as { id: number; roles?: string[] } | null
    if (!u || !hasRole(u, 'student')) return Response.json({ error: 'Students only' }, { status: 403 })
    const ch = await req.payload.findByID({ collection: 'challenges', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!ch) return Response.json({ error: 'Not found' }, { status: 404 })
    const klass = await req.payload.findByID({ collection: 'classes', id: idOf(ch.class), depth: 0, overrideAccess: true }).catch(() => null)
    if (!klass?.students?.map(idOf).includes(u.id)) return Response.json({ error: 'You are not in this class' }, { status: 403 })
    if (ch.endsAt && new Date(ch.endsAt) < new Date()) return Response.json({ error: 'This challenge has ended' }, { status: 409 })
    const participants = (ch.participants ?? []).map(idOf)
    if (!participants.includes(u.id)) {
      await req.payload.update({ collection: 'challenges', id: ch.id, overrideAccess: true, data: { participants: [...participants, u.id] } })
      await track(req.payload, { name: 'challenge_joined', user: u as unknown as Actor, headers: req.headers, props: { classId: klass.id } })
      await checkChallenges(req.payload, u.id)
    }
    return Response.json({ joined: true, progress: await challengeProgress(req.payload, u.id, ch), target: ch.target })
  },
}

/** Class challenges set by a teacher, e.g. "complete 3 Protect lessons this week". Progress is private. */
export const Challenges: CollectionConfig = {
  slug: 'challenges',
  admin: { group: 'Gamification', useAsTitle: 'title', defaultColumns: ['title', 'class', 'bigIdea', 'target', 'endsAt'] },
  access: {
    read: async ({ req }) => {
      const u = req.user as { id: number; roles?: string[] } | null
      if (!u) return false
      if (hasRole(u, 'super_admin')) return true
      const classes = await req.payload.find({ collection: 'classes', overrideAccess: true, depth: 0, limit: 200, where: { or: [{ teachers: { contains: u.id } }, { students: { contains: u.id } }] } })
      return { class: { in: classes.docs.length ? classes.docs.map((c) => c.id) : [-1] } }
    },
    create: teacherOfChallengeClass,
    update: teacherOfChallengeClass,
    delete: teacherOfChallengeClass,
  },
  endpoints: [join],
  hooks: {
    beforeChange: [({ req, data, operation }) => {
      if (operation === 'create' && req.user) data.createdBy = req.user.id
      return data
    }],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'class', type: 'relationship', relationTo: 'classes', required: true, index: true },
    { type: 'row', fields: [
      { name: 'bigIdea', type: 'select', options: bigIdeaOptions, admin: { description: 'Leave empty for any lesson' } },
      { name: 'target', label: 'Lessons to complete', type: 'number', required: true, min: 1, max: 18, defaultValue: 3 },
    ] },
    { type: 'row', fields: [{ name: 'startsAt', type: 'date', required: true }, { name: 'endsAt', type: 'date', required: true }] },
    { name: 'participants', type: 'relationship', relationTo: 'users', hasMany: true, admin: { readOnly: true } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
  ],
}

/** XP rules and level thresholds, editable in the CMS (spec E1). */
export const GamificationSettings: GlobalConfig = {
  slug: 'gamification',
  label: 'Gamification rules',
  admin: { group: 'Gamification' },
  access: { read: () => true, update: ({ req }) => hasRole(req.user as { roles?: string[] }, 'super_admin', 'content_editor') },
  fields: [
    { type: 'row', fields: [
      { name: 'lessonComplete', label: 'XP: lesson completed', type: 'number', min: 0, defaultValue: 10 },
      { name: 'quizPerfect', label: 'XP: quiz all correct', type: 'number', min: 0, defaultValue: 5 },
      { name: 'aiLabSession', label: 'XP: AI Lab session', type: 'number', min: 0, defaultValue: 5 },
    ] },
    { type: 'row', fields: [
      { name: 'projectSubmitted', label: 'XP: project sent', type: 'number', min: 0, defaultValue: 15 },
      { name: 'projectGradedPerPoint', label: 'XP per rubric point when marked', type: 'number', min: 0, defaultValue: 2 },
      { name: 'challengeComplete', label: 'XP: challenge completed', type: 'number', min: 0, defaultValue: 20 },
    ] },
    {
      name: 'levelThresholds',
      label: 'XP needed for each level (per big idea)',
      type: 'array',
      admin: { description: 'First row is level 1 (0 XP). Applies to new awards; earned XP is kept.' },
      fields: [{ type: 'row', fields: [{ name: 'xp', type: 'number', required: true, min: 0 }, { name: 'name', type: 'text', localized: true }] }],
    },
  ],
}
