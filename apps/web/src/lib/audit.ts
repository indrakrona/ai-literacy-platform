/**
 * Audit log (spec N4): who did what, when, to which record. Values are not stored, only which fields
 * changed, so the log never becomes a second copy of personal data. Writing to it never breaks the action.
 */
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig, GlobalAfterChangeHook, GlobalConfig, Payload, PayloadRequest } from 'payload'

export interface AuditEntry {
  actor?: number | null
  action: string
  collection?: string
  docId?: string | number | null
  summary?: string
  ip?: string | null
}

const IGNORED_FIELDS = new Set(['updatedAt', 'createdAt', 'hash', 'salt', 'loginAttempts', 'lockUntil', 'resetPasswordToken', 'resetPasswordExpiration', 'sessions', '_verificationToken', 'id', 'globalType'])

export function ipOf(req?: PayloadRequest | null): string | null {
  return req?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || null
}

/** Top-level fields whose value changed between two versions of a document. */
export function changedFields(before: Record<string, unknown> | undefined | null, after: Record<string, unknown>): string[] {
  if (!before) return []
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  // Join fields (lists of linked records, shaped {docs: [...]}) are computed, not edited: skip them.
  const isJoin = (v: unknown) => !!v && typeof v === 'object' && Array.isArray((v as { docs?: unknown }).docs)
  return [...keys]
    .filter((k) => !IGNORED_FIELDS.has(k) && !isJoin(before[k]) && !isJoin(after[k]) && JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))
    .sort()
}

/** Pass `req` from hooks so the entry joins the same database transaction (avoids lock waits). */
export async function audit(payload: Payload, entry: AuditEntry, req?: PayloadRequest): Promise<void> {
  try {
    await payload.create({
      collection: 'audit-logs',
      overrideAccess: true,
      ...(req ? { req } : {}),
      data: {
        actor: entry.actor ?? undefined,
        action: entry.action.slice(0, 60),
        targetCollection: entry.collection,
        docId: entry.docId !== undefined && entry.docId !== null ? String(entry.docId) : undefined,
        summary: entry.summary?.slice(0, 500),
        ip: entry.ip ?? undefined,
      },
    })
  } catch (e) {
    payload.logger.warn(`audit: could not record ${entry.action}: ${(e as Error).message}`)
  }
}

const afterChange: CollectionAfterChangeHook = async ({ req, doc, previousDoc, operation, collection }) => {
  if (!req.user) return doc // seeds and system jobs are not human actions
  const fields = operation === 'update' ? changedFields(previousDoc as Record<string, unknown>, doc as Record<string, unknown>) : []
  if (operation === 'update' && !fields.length) return doc
  await audit(req.payload, {
    actor: Number(req.user.id),
    action: operation === 'create' ? 'create' : 'update',
    collection: collection.slug,
    docId: doc.id,
    summary: fields.length ? `fields: ${fields.join(', ')}` : undefined,
    ip: ipOf(req),
  }, req)
  return doc
}

const afterDelete: CollectionAfterDeleteHook = async ({ req, id, collection }) => {
  if (!req.user) return
  await audit(req.payload, { actor: Number(req.user.id), action: 'delete', collection: collection.slug, docId: id, ip: ipOf(req) }, req)
}

const globalAfterChange: GlobalAfterChangeHook = async ({ req, doc, previousDoc, global }) => {
  if (!req.user) return doc
  const fields = changedFields(previousDoc as Record<string, unknown>, doc as Record<string, unknown>)
  if (fields.length) await audit(req.payload, { actor: Number(req.user.id), action: 'update', collection: `global:${global.slug}`, summary: `fields: ${fields.join(', ')}`, ip: ipOf(req) }, req)
  return doc
}

/** Add audit hooks to a collection (keeps its own hooks). */
export function withAudit(c: CollectionConfig): CollectionConfig {
  return { ...c, hooks: { ...c.hooks, afterChange: [...(c.hooks?.afterChange ?? []), afterChange], afterDelete: [...(c.hooks?.afterDelete ?? []), afterDelete] } }
}

export function withAuditGlobal(g: GlobalConfig): GlobalConfig {
  return { ...g, hooks: { ...g.hooks, afterChange: [...(g.hooks?.afterChange ?? []), globalAfterChange] } }
}
