import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { translationStatus, CONTENT_TYPES } from '../src/lib/content-review'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`
const mk = (roles: string[]) => payload.create({ collection: 'users', overrideAccess: true, data: { name: `U ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required' } })
type Ep = { path: string; handler: (r: PayloadRequest) => Promise<Response> }
const workflow = async (slug: string, id: number, user: unknown, body: Record<string, unknown>) => {
  const cfg = payload.config.collections.find((c) => c.slug === slug)!
  const ep = (cfg.endpoints as Ep[]).find((e) => e.path === '/:id/workflow')!
  const res = await ep.handler({ payload, user, json: async () => body, routeParams: { id }, headers: new Headers() } as unknown as PayloadRequest)
  return { status: res.status, data: (await res.json()) as Record<string, unknown> }
}

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('translation status', () => {
  it('counts English parts that are missing or copied from Bahasa', () => {
    const spec = CONTENT_TYPES['project-briefs'].fields
    const id = { title: 'Kantin', problem: 'Antrean panjang', deliverables: 'Poster', rubric: [{ criterion: 'Ide', description: 'Jelas' }] }
    const en = { title: 'Canteen', problem: 'Antrean panjang', deliverables: '', rubric: [{ criterion: 'Idea', description: '' }] }
    const s = translationStatus(spec, id, en)
    expect(s.total).toBe(5)
    expect(s.done).toBe(2)
    expect(s.missing).toEqual(['problem', 'deliverables', 'rubric.0.description'])
  })
})

describe('approval workflow', () => {
  it('takes a lesson from draft to live only through review by someone else', async () => {
    const [editor, reviewer, both, student] = await Promise.all([mk(['content_editor']), mk(['content_reviewer']), mk(['content_editor', 'content_reviewer']), mk(['student'])])
    const track = await payload.create({ collection: 'tracks', overrideAccess: true, data: { title: 'T', slug: `wf-${uniq()}`, level: 'smp', _status: 'published' } as never })
    const unit = await payload.create({ collection: 'units', overrideAccess: true, data: { title: 'U', track: track.id, bigIdea: 'discover', order: 1, _status: 'published' } as never })
    const lesson = await payload.create({ collection: 'lessons', overrideAccess: false, user: editor, draft: true, data: { title: 'Mengenal AI', unit: unit.id, competency: 'DIS-1', order: 1, type: 'reading' } as never })
    expect(lesson.reviewState).toBe('draft')

    // Editors can neither approve nor publish directly.
    await expect(payload.update({ collection: 'lessons', id: lesson.id, overrideAccess: false, user: editor, data: { reviewState: 'approved' } as never })).rejects.toThrow(/reviewer/)
    await expect(payload.update({ collection: 'lessons', id: lesson.id, overrideAccess: false, user: editor, data: { _status: 'published' } as never })).rejects.toThrow(/reviewer/)
    expect((await workflow('lessons', lesson.id, student, { action: 'submit' })).status).toBe(403)
    expect((await workflow('lessons', lesson.id, editor, { action: 'approve' })).status).toBe(403)

    // Submit → reviewers hear about it.
    expect((await workflow('lessons', lesson.id, editor, { action: 'submit' })).data.reviewState).toBe('in_review')
    const told = await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: reviewer.id } }, { kind: { equals: 'content_review' } }] } })
    expect(told.totalDocs).toBeGreaterThanOrEqual(1)
    // A reviewer can't publish before approving; changes need a reason.
    expect((await workflow('lessons', lesson.id, reviewer, { action: 'publish' })).status).toBe(409)
    expect((await workflow('lessons', lesson.id, reviewer, { action: 'request_changes', note: 'x' })).status).toBe(400)
    expect((await workflow('lessons', lesson.id, reviewer, { action: 'request_changes', note: 'Tambahkan contoh lokal' })).data.reviewState).toBe('changes_requested')
    const decision = await payload.find({ collection: 'notifications', overrideAccess: true, where: { and: [{ user: { equals: editor.id } }, { kind: { equals: 'content_decision' } }] } })
    expect(decision.docs[0]?.body).toContain('Tambahkan contoh lokal')

    // Fix, resubmit, approve, publish.
    await payload.update({ collection: 'lessons', id: lesson.id, overrideAccess: false, user: editor, draft: true, data: { objective: 'Contoh: aplikasi ojek online' } as never })
    expect((await workflow('lessons', lesson.id, editor, { action: 'submit' })).status).toBe(200)
    expect((await workflow('lessons', lesson.id, reviewer, { action: 'approve' })).data.reviewState).toBe('approved')
    expect((await payload.find({ collection: 'lessons', overrideAccess: false, user: student, where: { id: { equals: lesson.id } } })).totalDocs).toBe(0)
    expect((await workflow('lessons', lesson.id, reviewer, { action: 'publish' })).status).toBe(200)
    const live = await payload.find({ collection: 'lessons', overrideAccess: false, user: student, where: { id: { equals: lesson.id } } })
    expect(live.docs[0]?.objective).toBe('Contoh: aplikasi ojek online') // the reviewed draft is what went live

    // Editing approved content sends it back to draft; the live version stays until re-approved.
    await payload.update({ collection: 'lessons', id: lesson.id, overrideAccess: false, user: editor, draft: true, data: { title: 'Mengenal AI (revisi)' } as never })
    const latest = await payload.findByID({ collection: 'lessons', id: lesson.id, draft: true, overrideAccess: true })
    expect(latest.reviewState).toBe('draft')
    expect((await payload.find({ collection: 'lessons', overrideAccess: false, user: student, where: { id: { equals: lesson.id } } })).docs[0]?.title).toBe('Mengenal AI')

    // Nobody approves their own submission.
    await workflow('lessons', lesson.id, both, { action: 'submit' })
    expect((await workflow('lessons', lesson.id, both, { action: 'approve' })).status).toBe(403)
    const history = (await payload.findByID({ collection: 'lessons', id: lesson.id, draft: true, overrideAccess: true })).reviewHistory ?? []
    expect(history.map((h) => h.action)).toEqual(['submit', 'request_changes', 'submit', 'approve', 'publish', 'submit'])
    const audits = await payload.find({ collection: 'audit-logs', overrideAccess: true, where: { and: [{ action: { equals: 'content_approve' } }, { docId: { equals: String(lesson.id) } }] } })
    expect(audits.totalDocs).toBe(1)
  })

  it('keeps unpublished AI Lab activities away from students', async () => {
    const [editor, student] = await Promise.all([mk(['content_editor']), mk(['student'])])
    const a = await payload.create({ collection: 'ai-activities', overrideAccess: false, user: editor, draft: true, data: { title: 'Draf', slug: `d-${uniq()}`, competency: 'DIS-1', goal: 'g', instructions: 'i', tier: 'standard', messageLimit: 10 } as never })
    expect((await payload.find({ collection: 'ai-activities', overrideAccess: false, user: student, where: { id: { equals: a.id } } })).totalDocs).toBe(0)
    expect((await payload.find({ collection: 'ai-activities', overrideAccess: false, user: editor, draft: true, where: { id: { equals: a.id } } })).totalDocs).toBe(1)
  })
})
