import type { Access, CollectionConfig, Endpoint, PayloadRequest, Where } from 'payload'
import { hasFullAccess, hasRole } from '@ailit/shared'
import { track, type Actor } from '../lib/analytics'
import { notify } from '../lib/notify'

const idOf = (v: unknown) => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number))

/** Members read their own; teachers read submissions of classes they teach; staff read all. */
const readSubmissions: Access = async ({ req }) => {
  const u = req.user as { id: number; roles?: string[] } | null
  if (!u) return false
  if (hasRole(u, 'super_admin')) return true
  const or: Where[] = [{ members: { contains: u.id } }]
  if (hasRole(u, 'teacher')) {
    const classes = await req.payload.find({ collection: 'classes', overrideAccess: true, depth: 0, limit: 200, where: { teachers: { contains: u.id } } })
    if (classes.docs.length) or.push({ class: { in: classes.docs.map((c) => c.id) } })
  }
  const w: Where = { or }
  return w
}

async function readBody(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    return ((req.json ? await req.json() : {}) ?? {}) as Record<string, unknown>
  } catch {
    return {}
  }
}
const bad = (error: string, status = 400) => Response.json({ error }, { status })

/** POST /api/submissions/submit {brief, class, text, links?, teammates? (emails)} — create or update own submission. */
const submit: Endpoint = {
  path: '/submit',
  method: 'post',
  handler: async (req) => {
    const user = req.user as { id: number; roles?: string[]; consentStatus?: string } | null
    if (!user || !hasRole(user, 'student')) return bad('Students only', 403)
    if (!hasFullAccess(user)) return bad('Parent or guardian permission is needed to submit projects', 403)
    const b = await readBody(req)
    const text = typeof b.text === 'string' ? b.text.trim().slice(0, 20_000) : ''
    if (text.length < 20) return bad('Describe your work in at least 20 characters')
    const links = (Array.isArray(b.links) ? b.links : [])
      .map(String)
      .filter((l) => /^https?:\/\/\S+$/.test(l))
      .slice(0, 5)
    const brief = await req.payload.findByID({ collection: 'project-briefs', id: Number(b.brief), depth: 0, overrideAccess: true }).catch(() => null)
    if (!brief) return bad('Brief not found', 404)
    const klass = await req.payload.findByID({ collection: 'classes', id: Number(b.class), depth: 0, overrideAccess: true }).catch(() => null)
    const inClass = (klass?.students ?? []).map(idOf)
    if (!klass || !inClass.includes(user.id)) return bad('You are not in this class', 403)

    const members = new Set<number>([user.id])
    const emails = (Array.isArray(b.teammates) ? b.teammates : []).map((e) => String(e).trim().toLowerCase()).filter(Boolean)
    if (emails.length && !brief.allowTeams) return bad('This brief is for individual work')
    if (emails.length) {
      const mates = await req.payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 10, where: { email: { in: emails } } })
      for (const m of mates.docs) {
        if (!inClass.includes(m.id)) return bad(`${m.email} is not in this class`)
        members.add(m.id)
      }
      if (mates.docs.length !== emails.length) return bad('One or more teammate emails were not found')
    }

    const existing = await req.payload.find({
      collection: 'submissions',
      overrideAccess: true,
      depth: 0,
      limit: 1,
      where: { and: [{ brief: { equals: brief.id } }, { class: { equals: klass.id } }, { members: { contains: user.id } }] },
    })
    const prev = existing.docs[0]
    if (prev?.status === 'graded') return bad('Already graded', 409)
    // A teammate updating the work must not drop the others from the team.
    for (const m of prev?.members ?? []) members.add(idOf(m))
    if (members.size > 4) return bad('A team has at most 4 members')
    const data = { brief: brief.id, class: klass.id, members: [...members], text, links: links.map((url) => ({ url })), status: 'submitted' as const, submittedAt: new Date().toISOString() }
    const doc = prev
      ? await req.payload.update({ collection: 'submissions', id: prev.id, overrideAccess: true, data })
      : await req.payload.create({ collection: 'submissions', overrideAccess: true, data })
    if (!prev) {
      const names = (await req.payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 4, where: { id: { in: [...members] } } })).docs.map((m) => m.name.split(' ')[0]).join(', ')
      await notify(req.payload, {
        userIds: (klass.teachers ?? []).map(idOf),
        kind: 'submission_received',
        vars: { students: names, brief: brief.title, class: klass.name },
        link: `/guru/kelas/${klass.id}/nilai`,
      })
    }
    if (!prev) await track(req.payload, { name: 'project_submitted', user: user as unknown as Actor, headers: req.headers, props: { briefId: brief.id, competency: brief.competency } })
    return Response.json({ id: doc.id, status: doc.status })
  },
}

/** POST /api/submissions/:id/grade {scores: number[] (1–4 per criterion), feedback} — teacher of the class only. */
const grade: Endpoint = {
  path: '/:id/grade',
  method: 'post',
  handler: async (req) => {
    const user = req.user as { id: number; roles?: string[] } | null
    if (!user || !hasRole(user, 'teacher', 'super_admin')) return bad('Teachers only', 403)
    const sub = await req.payload.findByID({ collection: 'submissions', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!sub) return bad('Not found', 404)
    const klass = await req.payload.findByID({ collection: 'classes', id: idOf(sub.class), depth: 0, overrideAccess: true })
    if (!hasRole(user, 'super_admin') && !(klass.teachers ?? []).map(idOf).includes(user.id)) return bad('Not your class', 403)
    const brief = await req.payload.findByID({ collection: 'project-briefs', id: idOf(sub.brief), depth: 0, overrideAccess: true })
    const b = await readBody(req)
    const scores = Array.isArray(b.scores) ? b.scores.map(Number) : []
    if (scores.length !== (brief.rubric ?? []).length || scores.some((s) => !Number.isInteger(s) || s < 1 || s > 4)) {
      return bad(`Give one score from 1 to 4 for each of the ${(brief.rubric ?? []).length} criteria`)
    }
    const feedback = typeof b.feedback === 'string' ? b.feedback.trim().slice(0, 5000) : ''
    const doc = await req.payload.update({
      collection: 'submissions',
      id: sub.id,
      overrideAccess: true,
      data: { scores, feedback, status: 'graded', gradedBy: user.id, gradedAt: new Date().toISOString() },
    })
    const firstGrade = sub.status !== 'graded'
    await notify(req.payload, {
      userIds: firstGrade ? (sub.members ?? []).map(idOf) : [],
      kind: 'project_graded',
      vars: { brief: brief.title, total: scores.reduce((a, c) => a + c, 0), max: scores.length * 4 },
      link: `/proyek/${brief.slug}`,
    })
    await track(req.payload, { name: 'project_graded', user: user as unknown as Actor, headers: req.headers, props: { briefId: brief.id, score: scores.reduce((a, c) => a + c, 0), max: scores.length * 4 } })
    return Response.json({ id: doc.id, status: doc.status, total: scores.reduce((a, c) => a + c, 0), max: scores.length * 4 })
  },
}

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  admin: { defaultColumns: ['brief', 'class', 'status', 'submittedAt'], group: 'Learning' },
  access: { read: readSubmissions, create: () => false, update: () => false, delete: ({ req }) => hasRole(req.user as { roles?: string[] }, 'super_admin') },
  endpoints: [submit, grade],
  fields: [
    { name: 'brief', type: 'relationship', relationTo: 'project-briefs', required: true, index: true },
    { name: 'class', type: 'relationship', relationTo: 'classes', required: true, index: true },
    { name: 'members', type: 'relationship', relationTo: 'users', hasMany: true, required: true },
    { name: 'text', type: 'textarea', required: true },
    { name: 'links', type: 'array', fields: [{ name: 'url', type: 'text', required: true }] },
    { name: 'status', type: 'select', required: true, defaultValue: 'submitted', options: ['submitted', 'graded'].map((v) => ({ value: v, label: v })) },
    { name: 'submittedAt', type: 'date' },
    { name: 'scores', type: 'json' },
    { name: 'feedback', type: 'textarea' },
    { name: 'gradedBy', type: 'relationship', relationTo: 'users' },
    { name: 'gradedAt', type: 'date' },
  ],
}
