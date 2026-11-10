/**
 * Content approval workflow (CMS spec, WordPress parity: author → reviewer → publish).
 *
 *   draft ──submit──▶ in_review ──approve──▶ approved ──publish──▶ live
 *                         └──request changes──▶ changes_requested ──submit──▶ in_review
 *
 * - Content editors write and submit. Content reviewers (and super admins) approve, request changes and
 *   publish. Nobody approves their own submission, except a super admin.
 * - Publishing needs "approved". Editing the content of something approved sends it back to draft.
 * - Every step is kept in the item's review history and the audit log; reviewers and authors are notified.
 */
import type { CollectionBeforeChangeHook, CollectionConfig, Endpoint, Field, PayloadRequest } from 'payload'
import { APIError } from 'payload'
import { hasRole } from '@ailit/shared'
import { notify } from './notify'
import { audit, ipOf } from './audit'

export const WORKFLOW_STATES = ['draft', 'in_review', 'changes_requested', 'approved'] as const
export type WorkflowState = (typeof WORKFLOW_STATES)[number]
export const WORKFLOW_FIELDS = ['reviewState', 'reviewHistory', 'submittedBy', 'approvedBy', 'approvedAt', '_status', 'updatedAt', 'createdAt'] as const

type U = { id: number; name?: string; roles?: string[] } | null
const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))
export const isReviewer = (u: U) => hasRole(u, 'content_reviewer', 'super_admin')
export const isAuthor = (u: U) => hasRole(u, 'content_editor', 'content_reviewer', 'super_admin')

export const WORKFLOW_LABELS: Record<WorkflowState, { id: string; en: string }> = {
  draft: { id: 'Draf', en: 'Draft' },
  in_review: { id: 'Menunggu telaah', en: 'In review' },
  changes_requested: { id: 'Perlu perbaikan', en: 'Changes requested' },
  approved: { id: 'Disetujui', en: 'Approved' },
}

const workflowFields: Field[] = [
  {
    name: 'reviewState',
    label: 'Review state',
    type: 'select',
    defaultValue: 'draft',
    index: true,
    options: WORKFLOW_STATES.map((s) => ({ value: s, label: WORKFLOW_LABELS[s].en })),
    admin: { position: 'sidebar', description: 'Draft → In review → Approved, then publish. Use the review workspace (/konten) to submit and approve.' },
  },
  { name: 'submittedBy', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', readOnly: true } },
  { name: 'approvedBy', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', readOnly: true } },
  { name: 'approvedAt', type: 'date', admin: { position: 'sidebar', readOnly: true } },
  {
    name: 'reviewHistory',
    type: 'array',
    admin: { readOnly: true, initCollapsed: true },
    fields: [
      { name: 'action', type: 'text', required: true },
      { name: 'by', type: 'relationship', relationTo: 'users' },
      { name: 'note', type: 'textarea' },
      { name: 'at', type: 'date', required: true },
    ],
  },
]

/** Fields whose change counts as editing the content (everything except workflow bookkeeping). */
function contentChanged(data: Record<string, unknown>, original: Record<string, unknown> | undefined): boolean {
  if (!original) return true
  return Object.keys(data).some((k) => !(WORKFLOW_FIELDS as readonly string[]).includes(k) && JSON.stringify(data[k] ?? null) !== JSON.stringify(original[k] ?? null))
}

const guard =
  (hasDrafts: boolean): CollectionBeforeChangeHook =>
  ({ data, originalDoc, req, operation, context }) => {
    if (context?.workflow) return data // our own endpoint already checked
    const u = req.user as U
    if (!u) return data // system writes (seeds, migrations) are not part of the workflow
    const before = (originalDoc?.reviewState as WorkflowState | undefined) ?? 'draft'
    const asked = (data.reviewState as WorkflowState | undefined) ?? before
    // Only reviewers move items to approved / changes requested.
    if (asked !== before && (asked === 'approved' || asked === 'changes_requested') && !isReviewer(u)) {
      throw new APIError('Only a content reviewer can approve or request changes', 403, undefined, true)
    }
    if (asked === 'approved' && asked !== before && idOf(originalDoc?.submittedBy) === u.id && !hasRole(u, 'super_admin')) {
      throw new APIError('Someone else must approve your own submission', 403, undefined, true)
    }
    // Editing approved content (by anyone but a reviewer making a fix) needs a new review.
    if (operation === 'update' && before === 'approved' && asked === 'approved' && !isReviewer(u) && contentChanged(data, originalDoc)) {
      data.reviewState = 'draft'
    }
    const finalState = (data.reviewState as WorkflowState | undefined) ?? before
    // Publishing needs approval (super admins and reviewers may publish what is approved).
    if (hasDrafts && data._status === 'published' && originalDoc?._status !== 'published') {
      if (!isReviewer(u)) throw new APIError('Only a content reviewer can publish. Submit it for review first.', 403, undefined, true)
      if (finalState !== 'approved' && !hasRole(u, 'super_admin')) throw new APIError('Approve it before publishing', 403, undefined, true)
    }
    if (!hasDrafts && operation === 'update' && data.reviewState === undefined && before === 'approved' && contentChanged(data, originalDoc) && !isReviewer(u)) {
      data.reviewState = 'draft'
    }
    return data
  }

async function reviewers(req: PayloadRequest) {
  return (await req.payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 50, where: { roles: { in: ['content_reviewer'] } } })).docs.map((u) => u.id)
}

function endpoint(slug: string, hasDrafts: boolean, titleField: string): Endpoint {
  return {
    path: '/:id/workflow',
    method: 'post',
    handler: async (req) => {
      const u = req.user as unknown as U
      if (!isAuthor(u)) return Response.json({ error: 'Not allowed' }, { status: 403 })
      let b: Record<string, unknown> = {}
      try {
        b = ((await req.json?.()) ?? {}) as Record<string, unknown>
      } catch {}
      const action = String(b.action ?? '')
      const note = String(b.note ?? '').trim().slice(0, 2000)
      const id = Number(req.routeParams?.id)
      const doc = (await req.payload.findByID({ collection: slug as never, id, depth: 0, draft: hasDrafts, overrideAccess: true }).catch(() => null)) as Record<string, unknown> | null
      if (!doc) return Response.json({ error: 'Not found' }, { status: 404 })
      const state = (doc.reviewState as WorkflowState) ?? 'draft'
      const bad = (error: string, status = 409) => Response.json({ error }, { status })
      const history = [...((doc.reviewHistory as unknown[]) ?? []), { action, by: u!.id, note: note || undefined, at: new Date().toISOString() }]
      let data: Record<string, unknown>
      let tell: { to: (number | null)[]; kind: 'content_review' | 'content_decision'; decision?: string } | null = null
      switch (action) {
        case 'submit':
          if (!['draft', 'changes_requested'].includes(state)) return bad('Only a draft or an item with requested changes can be submitted')
          data = { reviewState: 'in_review', submittedBy: u!.id, reviewHistory: history }
          tell = { to: await reviewers(req), kind: 'content_review' }
          break
        case 'approve':
        case 'request_changes':
          if (!isReviewer(u)) return bad('Only a content reviewer can do this', 403)
          if (state !== 'in_review') return bad('Only items in review can be decided')
          if (action === 'approve' && idOf(doc.submittedBy) === u!.id && !hasRole(u, 'super_admin')) return bad('Someone else must approve your own submission', 403)
          if (action === 'request_changes' && note.length < 5) return bad('Say what needs to change (at least 5 characters)', 400)
          data = action === 'approve' ? { reviewState: 'approved', approvedBy: u!.id, approvedAt: new Date().toISOString(), reviewHistory: history } : { reviewState: 'changes_requested', reviewHistory: history }
          tell = { to: [idOf(doc.submittedBy)], kind: 'content_decision', decision: action }
          break
        case 'publish':
          if (!hasDrafts) return bad('This content type has no separate publishing step')
          if (!isReviewer(u)) return bad('Only a content reviewer can publish', 403)
          if (state !== 'approved') return bad('Approve it before publishing')
          data = { _status: 'published', reviewHistory: history }
          break
        default:
          return bad('Unknown action', 400)
      }
      // Work on the latest draft so unpublished edits are what gets reviewed and published.
      await req.payload.update({ collection: slug as never, id, overrideAccess: true, draft: hasDrafts && action !== 'publish', data: data as never, context: { workflow: true } })
      await audit(req.payload, { actor: u!.id, action: `content_${action}`, collection: slug, docId: id, summary: note || undefined, ip: ipOf(req) })
      if (tell) {
        const title = String(doc[titleField] ?? `#${id}`)
        await notify(req.payload, {
          userIds: tell.to.filter((x) => x && x !== u!.id),
          kind: tell.kind,
          vars: { title, decision: tell.decision === 'approve' ? 'disetujui / approved' : 'perlu perbaikan / changes requested', note: note || '—' },
          link: `/konten/${slug}/${id}`,
          email: tell.kind === 'content_decision',
        })
      }
      return Response.json({ ok: true, reviewState: data.reviewState ?? state })
    },
  }
}

/** Add the approval workflow to a CMS collection. */
export function withApprovalWorkflow(config: CollectionConfig, opts: { titleField?: string } = {}): CollectionConfig {
  const hasDrafts = Boolean(typeof config.versions === 'object' && config.versions?.drafts)
  const fields = config.fields.filter((f) => !('name' in f && f.name === 'reviewState'))
  return {
    ...config,
    fields: [...fields, ...workflowFields],
    hooks: { ...config.hooks, beforeChange: [...(config.hooks?.beforeChange ?? []), guard(hasDrafts)] },
    endpoints: [...(config.endpoints || []), endpoint(config.slug, hasDrafts, opts.titleField ?? 'title')],
  }
}
