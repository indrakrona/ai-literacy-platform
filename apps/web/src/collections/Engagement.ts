import type { Access, CollectionConfig, Endpoint, PayloadRequest, Where } from 'payload'
import { hasRole } from '@ailit/shared'
import { roles } from '../access'
import { notify } from '../lib/notify'
import { audit, ipOf } from '../lib/audit'
import { isGuardianOf } from '../lib/parents'
import { nextToReview, PEER_RUBRIC, showcaseStatus, splitTeams } from '../lib/engagement'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
const bad = (error: string, status = 400) => Response.json({ error }, { status })
type U = { id: number; name?: string; roles?: string[]; school?: unknown } | null

async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    return ((req.json ? await req.json() : {}) ?? {}) as Record<string, unknown>
  } catch {
    return {}
  }
}

async function teachesClass(req: PayloadRequest, classId: number | null): Promise<boolean> {
  const u = req.user as unknown as U
  if (!u || !classId) return false
  if (hasRole(u, 'super_admin')) return true
  const klass = await req.payload.findByID({ collection: 'classes', id: classId, depth: 0, overrideAccess: true }).catch(() => null)
  return Boolean(klass && hasRole(u, 'teacher', 'school_admin') && (klass.teachers ?? []).map(idOf).includes(u.id))
}

// ---------- Team challenges (endpoint added to Challenges) ----------

/** POST /api/challenges/:id/teams {count} — the class teacher splits the class into teams (team challenge). */
export const makeTeams: Endpoint = {
  path: '/:id/teams',
  method: 'post',
  handler: async (req) => {
    const ch = await req.payload.findByID({ collection: 'challenges', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!ch) return bad('Not found', 404)
    if (!(await teachesClass(req, idOf(ch.class)))) return bad('Not allowed', 403)
    const klass = await req.payload.findByID({ collection: 'classes', id: idOf(ch.class)!, depth: 0, overrideAccess: true })
    const students = (klass.students ?? []).map(idOf).filter((x): x is number => Boolean(x))
    if (students.length < 2) return bad('The class needs at least 2 students')
    const { count } = await body(req)
    const teams = splitTeams(students, Math.floor(Number(count) || 4))
    // Everyone in a team takes part.
    await req.payload.update({ collection: 'challenges', id: ch.id, overrideAccess: true, data: { mode: 'team', teams: teams as never, participants: students } })
    return Response.json({ teams: teams.map((t) => ({ name: t.name, members: t.members.length })) })
  },
}

// ---------- Showcase (endpoints added to Submissions) ----------

async function publishIfReady(req: PayloadRequest, subId: number) {
  const sub = await req.payload.findByID({ collection: 'submissions', id: subId, depth: 0, overrideAccess: true })
  if (sub.showcase !== 'nominated') return sub.showcase
  const st = await showcaseStatus(req.payload, sub)
  if (!st.ready) return 'nominated'
  await req.payload.update({ collection: 'submissions', id: subId, overrideAccess: true, data: { showcase: 'published', showcaseAt: new Date().toISOString() } })
  await notify(req.payload, { userIds: st.members.map((m) => m.id), kind: 'showcase_published', link: `/galeri/${subId}`, email: false })
  return 'published'
}

/** POST /api/submissions/:id/nominate — the teacher puts a marked project forward for the gallery. */
export const nominate: Endpoint = {
  path: '/:id/nominate',
  method: 'post',
  handler: async (req) => {
    const sub = await req.payload.findByID({ collection: 'submissions', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!sub) return bad('Not found', 404)
    if (!(await teachesClass(req, idOf(sub.class)))) return bad('Not allowed', 403)
    if (sub.status !== 'graded') return bad('Mark the project first', 409)
    if (sub.showcase && sub.showcase !== 'none') return bad('Already nominated', 409)
    await req.payload.update({ collection: 'submissions', id: sub.id, overrideAccess: true, data: { showcase: 'nominated', showcaseAgreed: [] } })
    await notify(req.payload, { userIds: (sub.members ?? []).map(idOf), kind: 'showcase_nominated', link: `/proyek/kiriman/${sub.id}` })
    await audit(req.payload, { actor: (req.user as unknown as U)!.id, action: 'showcase_nominate', collection: 'submissions', docId: sub.id, ip: ipOf(req) })
    return Response.json({ ok: true })
  },
}

/** POST /api/submissions/:id/showcase {agree} — a member agrees (or withdraws). Any member can withdraw at any time. */
export const showcaseConsent: Endpoint = {
  path: '/:id/showcase',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    const sub = await req.payload.findByID({ collection: 'submissions', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!sub || !(sub.members ?? []).map(idOf).includes(u.id)) return bad('Not found', 404)
    const { agree } = await body(req)
    const agreed = new Set((sub.showcaseAgreed ?? []).map(idOf))
    if (agree === true) {
      if (sub.showcase !== 'nominated') return bad('This project is not nominated', 409)
      agreed.add(u.id)
      await req.payload.update({ collection: 'submissions', id: sub.id, overrideAccess: true, data: { showcaseAgreed: [...agreed] as number[] } })
      return Response.json({ showcase: await publishIfReady(req, sub.id) })
    }
    agreed.delete(u.id)
    await req.payload.update({ collection: 'submissions', id: sub.id, overrideAccess: true, data: { showcaseAgreed: [...agreed] as number[], showcase: sub.showcase === 'published' || sub.showcase === 'nominated' ? 'none' : sub.showcase } })
    return Response.json({ showcase: 'none' })
  },
}

/** POST /api/submissions/:id/vote — one vote per signed-in person for a published project (not your own). */
export const vote: Endpoint = {
  path: '/:id/vote',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in to vote', 401)
    const sub = await req.payload.findByID({ collection: 'submissions', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!sub || sub.showcase !== 'published') return bad('Not found', 404)
    if ((sub.members ?? []).map(idOf).includes(u.id)) return bad('You cannot vote for your own project', 409)
    try {
      await req.payload.create({ collection: 'showcase-votes', overrideAccess: true, data: { submission: sub.id, voter: u.id, key: `${sub.id}:${u.id}` } })
    } catch {
      return bad('You already voted for this project', 409)
    }
    const votes = (await req.payload.count({ collection: 'showcase-votes', overrideAccess: true, where: { submission: { equals: sub.id } } })).totalDocs
    await req.payload.update({ collection: 'submissions', id: sub.id, overrideAccess: true, data: { votes } })
    return Response.json({ votes })
  },
}

export const ShowcaseVotes: CollectionConfig = {
  slug: 'showcase-votes',
  admin: { group: 'Gamification', hidden: ({ user }) => !hasRole(user as { roles?: string[] }, 'super_admin') },
  access: { read: roles('super_admin'), create: () => false, update: () => false, delete: roles('super_admin') },
  fields: [
    { name: 'submission', type: 'relationship', relationTo: 'submissions', required: true, index: true },
    { name: 'voter', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'key', type: 'text', required: true, unique: true },
  ],
}

// ---------- Parent approvals and portfolio (endpoints added to Users) ----------

/** POST /api/users/parent-approve {childId, what: 'gallery' | 'portfolio', value} — a linked parent decides. */
export const parentApprove: Endpoint = {
  path: '/parent-approve',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u || !hasRole(u, 'parent')) return bad('Not allowed', 403)
    const b = await body(req)
    const childId = Number(b.childId)
    if (!(await isGuardianOf(req.payload, u.id, childId))) return bad('Not your child', 403)
    const value = b.value === true
    const child = await req.payload.findByID({ collection: 'users', id: childId, depth: 0, overrideAccess: true })
    if (b.what === 'gallery') {
      await req.payload.update({ collection: 'users', id: childId, overrideAccess: true, data: { galleryParentApproved: value } as never })
      if (value) {
        const nominated = (await req.payload.find({ collection: 'submissions', overrideAccess: true, depth: 0, limit: 50, where: { and: [{ members: { contains: childId } }, { showcase: { equals: 'nominated' } }] } })).docs
        for (const s of nominated) await publishIfReady(req, s.id)
      } else {
        // Take the child's work out of the gallery.
        const live = (await req.payload.find({ collection: 'submissions', overrideAccess: true, depth: 0, limit: 50, where: { and: [{ members: { contains: childId } }, { showcase: { equals: 'published' } }] } })).docs
        for (const s of live) await req.payload.update({ collection: 'submissions', id: s.id, overrideAccess: true, data: { showcase: 'none' } })
      }
    } else if (b.what === 'portfolio') {
      await req.payload.update({ collection: 'users', id: childId, overrideAccess: true, data: { portfolio: { ...(child.portfolio ?? {}), parentApproved: value } } as never })
    } else return bad('what must be gallery or portfolio')
    await audit(req.payload, { actor: u.id, action: `parent_${b.what}_${value ? 'approve' : 'withdraw'}`, collection: 'users', docId: childId, ip: ipOf(req) })
    return Response.json({ ok: true })
  },
}

/** POST /api/users/portfolio {enabled, handle, headline, showProjects, showBadges, showCertificate} — own settings. */
export const portfolioSettings: Endpoint = {
  path: '/portfolio',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    const b = await body(req)
    const handle = String(b.handle ?? '').trim().toLowerCase()
    if (b.enabled && !/^[a-z0-9-]{3,30}$/.test(handle)) return bad('handle: 3–30 letters, numbers or dashes')
    if (handle) {
      const taken = await req.payload.count({ collection: 'users', overrideAccess: true, where: { and: [{ 'portfolio.handle': { equals: handle } }, { id: { not_equals: u.id } }] } })
      if (taken.totalDocs) return bad('handle: already taken', 409)
    }
    const me = await req.payload.findByID({ collection: 'users', id: u.id, depth: 0, overrideAccess: true })
    await req.payload.update({
      collection: 'users',
      id: u.id,
      overrideAccess: true,
      data: {
        portfolio: {
          ...(me.portfolio ?? {}),
          enabled: Boolean(b.enabled),
          handle: handle || undefined,
          headline: String(b.headline ?? '').slice(0, 140) || undefined,
          showProjects: b.showProjects !== false,
          showBadges: b.showBadges !== false,
          showCertificate: b.showCertificate === true,
        },
      } as never,
    })
    return Response.json({ ok: true })
  },
}

// ---------- Peer review ----------

/** GET /api/peer-reviews/next — a classmate's project to review (authors are not shown). */
const next: Endpoint = {
  path: '/next',
  method: 'get',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u || !hasRole(u, 'student')) return bad('Students only', 403)
    const s = await nextToReview(req.payload, u.id)
    if (!s) return Response.json({ submission: null })
    const brief = await req.payload.findByID({ collection: 'project-briefs', id: idOf(s.brief)!, depth: 0, overrideAccess: true }).catch(() => null)
    return Response.json({ submission: { id: s.id, brief: brief?.title ?? '', text: s.text, links: (s.links ?? []).map((l) => l.url) } })
  },
}

/** POST /api/peer-reviews/submit {submission, ratings: {clear, thoughtful, responsible} 1–3, praise, suggestion} */
const submitReview: Endpoint = {
  path: '/submit',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u || !hasRole(u, 'student')) return bad('Students only', 403)
    const b = await body(req)
    const sub = await req.payload.findByID({ collection: 'submissions', id: Number(b.submission), depth: 0, overrideAccess: true }).catch(() => null)
    if (!sub) return bad('Not found', 404)
    if ((sub.members ?? []).map(idOf).includes(u.id)) return bad('You cannot review your own project', 409)
    const klass = await req.payload.findByID({ collection: 'classes', id: idOf(sub.class)!, depth: 0, overrideAccess: true }).catch(() => null)
    if (!(klass?.students ?? []).map(idOf).includes(u.id)) return bad('Only classmates can review', 403)
    const r = (b.ratings ?? {}) as Record<string, unknown>
    const ratings = Object.fromEntries(PEER_RUBRIC.map((c) => [c.key, Math.max(1, Math.min(3, Math.round(Number(r[c.key]) || 0)))]))
    if (PEER_RUBRIC.some((c) => !Number(r[c.key]))) return bad('Rate all three points')
    const praise = String(b.praise ?? '').trim().slice(0, 500)
    const suggestion = String(b.suggestion ?? '').trim().slice(0, 500)
    if (praise.length < 5 || suggestion.length < 5) return bad('Write one thing that is good and one suggestion')
    try {
      const doc = await req.payload.create({ collection: 'peer-reviews', overrideAccess: true, data: { submission: sub.id, reviewer: u.id, class: idOf(sub.class), ratings, praise, suggestion, key: `${sub.id}:${u.id}` } })
      await notify(req.payload, { userIds: (sub.members ?? []).map(idOf), kind: 'peer_review', link: `/proyek/kiriman/${sub.id}`, email: false })
      return Response.json({ id: doc.id }, { status: 201 })
    } catch {
      return bad('You already reviewed this project', 409)
    }
  },
}

/** POST /api/peer-reviews/:id/hide {hidden} — the teacher hides an unkind or unhelpful review. */
const hide: Endpoint = {
  path: '/:id/hide',
  method: 'post',
  handler: async (req) => {
    const r = await req.payload.findByID({ collection: 'peer-reviews', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!r) return bad('Not found', 404)
    if (!(await teachesClass(req, idOf(r.class)))) return bad('Not allowed', 403)
    const { hidden } = await body(req)
    await req.payload.update({ collection: 'peer-reviews', id: r.id, overrideAccess: true, data: { hidden: hidden !== false } })
    await audit(req.payload, { actor: (req.user as unknown as U)!.id, action: 'peer_review_hide', collection: 'peer-reviews', docId: r.id, ip: ipOf(req) })
    return Response.json({ ok: true })
  },
}

const readReviews: Access = async ({ req }) => {
  const u = req.user as U
  if (!u) return false
  if (hasRole(u, 'super_admin')) return true
  const taught = (await req.payload.find({ collection: 'classes', overrideAccess: true, depth: 0, limit: 200, where: { teachers: { contains: u.id } } })).docs.map((c) => c.id)
  const w: Where = { or: [{ reviewer: { equals: u.id } }, ...(taught.length ? [{ class: { in: taught } }] : [])] }
  return w
}

export const PeerReviews: CollectionConfig = {
  slug: 'peer-reviews',
  admin: { group: 'Learning', defaultColumns: ['submission', 'reviewer', 'hidden', 'createdAt'] },
  access: { read: readReviews, create: () => false, update: () => false, delete: roles('super_admin') },
  endpoints: [next, submitReview, hide],
  fields: [
    { name: 'submission', type: 'relationship', relationTo: 'submissions', required: true, index: true },
    { name: 'reviewer', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'class', type: 'relationship', relationTo: 'classes', index: true },
    { name: 'ratings', type: 'json', required: true },
    { name: 'praise', type: 'textarea', required: true },
    { name: 'suggestion', type: 'textarea', required: true },
    { name: 'hidden', type: 'checkbox', defaultValue: false, admin: { description: 'Hidden by the teacher' } },
    { name: 'key', type: 'text', required: true, unique: true },
  ],
}

// ---------- Seasons and events ----------

/** POST /api/events/:id/enter {submission} — a member enters a project while the event is open. */
const enter: Endpoint = {
  path: '/:id/enter',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    const ev = await req.payload.findByID({ collection: 'events', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!ev) return bad('Not found', 404)
    if (ev.status !== 'open') return bad('Entries are closed', 409)
    const b = await body(req)
    const sub = await req.payload.findByID({ collection: 'submissions', id: Number(b.submission), depth: 0, overrideAccess: true }).catch(() => null)
    if (!sub || !(sub.members ?? []).map(idOf).includes(u.id)) return bad('Not your project', 403)
    if (ev.brief && idOf(ev.brief) !== idOf(sub.brief)) return bad('This event is for a different brief', 409)
    if (ev.scope === 'school') {
      const klass = await req.payload.findByID({ collection: 'classes', id: idOf(sub.class)!, depth: 0, overrideAccess: true })
      if (idOf(klass.school) !== idOf(ev.school)) return bad('This event is for another school', 403)
    }
    await req.payload.update({ collection: 'submissions', id: sub.id, overrideAccess: true, data: { event: ev.id } })
    return Response.json({ ok: true })
  },
}

/** POST /api/events/:id/score {submission, scores: number[], comment} — a judge scores an entry while judging. */
const score: Endpoint = {
  path: '/:id/score',
  method: 'post',
  handler: async (req) => {
    const u = req.user as unknown as U
    if (!u) return bad('Sign in first', 401)
    const ev = await req.payload.findByID({ collection: 'events', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!ev) return bad('Not found', 404)
    if (!(ev.judges ?? []).map(idOf).includes(u.id)) return bad('Only this event’s judges can score', 403)
    if (ev.status !== 'judging') return bad('Judging is not open', 409)
    const b = await body(req)
    const sub = await req.payload.findByID({ collection: 'submissions', id: Number(b.submission), depth: 0, overrideAccess: true }).catch(() => null)
    if (!sub || idOf(sub.event) !== ev.id) return bad('Not an entry of this event', 404)
    if ((sub.members ?? []).map(idOf).includes(u.id)) return bad('You cannot judge your own project', 409)
    const criteria = ev.criteria ?? []
    const raw = Array.isArray(b.scores) ? b.scores : []
    if (raw.length !== criteria.length) return bad('Score every criterion')
    const scores = criteria.map((c, i) => Math.max(0, Math.min(c.max ?? 5, Math.round(Number(raw[i]) || 0))))
    const all = { ...((sub.judgeScores ?? {}) as Record<string, unknown>), [String(u.id)]: { scores, comment: String(b.comment ?? '').slice(0, 1000), at: new Date().toISOString() } }
    await req.payload.update({ collection: 'submissions', id: sub.id, overrideAccess: true, data: { judgeScores: all } })
    return Response.json({ ok: true })
  },
}

export const Events: CollectionConfig = {
  slug: 'events',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'type', 'status', 'startsAt', 'endsAt'], group: 'Gamification' },
  access: {
    read: () => true,
    create: ({ req }) => hasRole(req.user as U, 'super_admin', 'content_editor', 'content_reviewer'),
    update: ({ req }) => hasRole(req.user as U, 'super_admin', 'content_editor', 'content_reviewer'),
    delete: roles('super_admin'),
  },
  endpoints: [enter, score],
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'type', type: 'select', required: true, defaultValue: 'challenge_week', options: [{ value: 'hackathon', label: 'Hackathon' }, { value: 'challenge_week', label: 'Challenge week' }, { value: 'demo_day', label: 'Demo day' }] },
        { name: 'status', type: 'select', required: true, defaultValue: 'upcoming', options: [{ value: 'upcoming', label: 'Upcoming' }, { value: 'open', label: 'Open for entries' }, { value: 'judging', label: 'Judging' }, { value: 'closed', label: 'Closed (results shown)' }] },
      ],
    },
    { name: 'description', type: 'textarea', localized: true },
    { type: 'row', fields: [{ name: 'startsAt', type: 'date', required: true }, { name: 'endsAt', type: 'date', required: true }] },
    { type: 'row', fields: [{ name: 'scope', type: 'select', defaultValue: 'platform', options: [{ value: 'platform', label: 'Everyone' }, { value: 'school', label: 'One school' }] }, { name: 'school', type: 'relationship', relationTo: 'schools' }] },
    { name: 'brief', type: 'relationship', relationTo: 'project-briefs', admin: { description: 'Optional: entries must answer this brief' } },
    { name: 'criteria', type: 'array', minRows: 1, defaultValue: [{ name: 'Dampak / Impact', max: 5 }, { name: 'Kreativitas / Creativity', max: 5 }, { name: 'AI yang bertanggung jawab / Responsible AI', max: 5 }], fields: [{ name: 'name', type: 'text', required: true }, { name: 'max', type: 'number', required: true, min: 1, max: 10, defaultValue: 5 }] },
    { name: 'judges', type: 'relationship', relationTo: 'users', hasMany: true },
  ],
}

/** Average judge total per entry (judges who scored), highest first. */
export function eventResults(entries: { id: number; judgeScores?: unknown }[], criteriaMax: number[]) {
  const max = criteriaMax.reduce((a, c) => a + c, 0)
  return entries
    .map((e) => {
      const s = Object.values((e.judgeScores ?? {}) as Record<string, { scores: number[] }>)
      const totals = s.map((x) => (x.scores ?? []).reduce((a, c) => a + c, 0))
      return { id: e.id, judges: totals.length, average: totals.length ? Math.round((totals.reduce((a, c) => a + c, 0) / totals.length) * 10) / 10 : null, max }
    })
    .sort((a, b) => (b.average ?? -1) - (a.average ?? -1))
}
