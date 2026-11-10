import type { Access, CollectionConfig, Endpoint } from 'payload'
import { hasRole } from '@ailit/shared'
import { certificatePdf, publicName, statusOf } from '../lib/certificates'
import { track, type Actor } from '../lib/analytics'
import { audit, ipOf } from '../lib/audit'

const bad = (error: string, status = 400) => Response.json({ error }, { status })
const idOf = (v: unknown): number => (v && typeof v === 'object' ? (v as { id: number }).id : (v as number))

/** Candidates read their own certificates; super admins read all. The public sees them only through /verifikasi. */
const readCertificates: Access = ({ req }) => {
  const u = req.user as { id: number; roles?: string[] } | null
  if (!u) return false
  if (hasRole(u, 'super_admin')) return true
  return { candidate: { equals: u.id } }
}

async function byCode(req: Parameters<Endpoint['handler']>[0]) {
  const code = String(req.routeParams?.code ?? '').toUpperCase()
  return (await req.payload.find({ collection: 'certificates', overrideAccess: true, depth: 0, limit: 1, where: { code: { equals: code } } })).docs[0]
}

/** GET /api/certificates/code/:code/pdf?lang=id|en — the owner (or a super admin) downloads the PDF. */
const pdf: Endpoint = {
  path: '/code/:code/pdf',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return bad('Sign in first', 401)
    const c = await byCode(req)
    if (!c) return bad('Not found', 404)
    if (idOf(c.candidate) !== req.user.id && !hasRole(req.user as { roles?: string[] }, 'super_admin')) return bad('Not your certificate', 403)
    if (statusOf(c) === 'revoked') return bad('This certificate has been revoked', 410)
    const owner = await req.payload.findByID({ collection: 'users', id: idOf(c.candidate), depth: 0, overrideAccess: true })
    const lang = new URL(req.url ?? 'http://x').searchParams.get('lang') === 'en' ? 'en' : 'id'
    const bytes = await certificatePdf(c as Parameters<typeof certificatePdf>[0], owner.name ?? '', lang)
    return new Response(Buffer.from(bytes), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${c.code}.pdf"`, 'Cache-Control': 'private, no-store' },
    })
  },
}

/** POST /api/certificates/code/:code/shared {channel} — record that the owner shared the verification link. */
const shared: Endpoint = {
  path: '/code/:code/shared',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return bad('Sign in first', 401)
    const c = await byCode(req)
    if (!c || idOf(c.candidate) !== req.user.id) return bad('Not found', 404)
    let channel = 'link'
    try {
      channel = String(((await req.json?.()) as { channel?: string } | undefined)?.channel ?? 'link').slice(0, 20)
    } catch {}
    await track(req.payload, { name: 'certificate_shared', user: req.user as unknown as Actor, headers: req.headers, props: { attemptId: idOf(c.attempt), channel } })
    return Response.json({ ok: true })
  },
}

/** POST /api/certificates/:id/revoke {reason} — super admin only; the verification page then shows "revoked". */
const revoke: Endpoint = {
  path: '/:id/revoke',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user as { roles?: string[] }, 'super_admin')) return bad('Not allowed', 403)
    let reason = ''
    try {
      reason = String(((await req.json?.()) as { reason?: string } | undefined)?.reason ?? '').trim()
    } catch {}
    if (reason.length < 5) return bad('Give a reason (at least 5 characters)')
    const id = Number(req.routeParams?.id)
    const c = await req.payload.findByID({ collection: 'certificates', id, depth: 0, overrideAccess: true }).catch(() => null)
    if (!c) return bad('Not found', 404)
    await req.payload.update({ collection: 'certificates', id, overrideAccess: true, data: { status: 'revoked', revokedReason: reason, revokedAt: new Date().toISOString() } })
    await audit(req.payload, { actor: Number(req.user!.id), action: 'revoke', collection: 'certificates', docId: id, summary: `${c.code}: ${reason}`, ip: ipOf(req) })
    return Response.json({ ok: true })
  },
}

/** Public, minimal view of a certificate for the verification page (no email, no birth date). */
export async function verifyCertificate(payload: import('payload').Payload, code: string) {
  const c = (await payload.find({ collection: 'certificates', overrideAccess: true, depth: 0, limit: 1, where: { code: { equals: code.trim().toUpperCase() } } })).docs[0]
  if (!c) return null
  const owner = await payload.findByID({ collection: 'users', id: idOf(c.candidate), depth: 0, overrideAccess: true }).catch(() => null)
  return {
    code: c.code,
    name: publicName(owner?.name ?? '—', (owner as { dateOfBirth?: string | null } | null)?.dateOfBirth),
    level: c.level ?? null,
    band: c.band,
    subScores: (c.subScores ?? {}) as Record<string, number>,
    provisional: Boolean(c.provisional),
    issuedAt: c.issuedAt,
    expiresAt: c.expiresAt,
    status: statusOf(c),
  }
}

export const Certificates: CollectionConfig = {
  slug: 'certificates',
  admin: { useAsTitle: 'code', defaultColumns: ['code', 'candidate', 'band', 'status', 'issuedAt'], group: 'Assessment' },
  access: {
    read: readCertificates,
    create: () => false, // issued only by the scoring code
    update: ({ req }) => hasRole(req.user as { roles?: string[] }, 'super_admin'),
    delete: () => false, // revoke instead, so the verification page can say so
  },
  endpoints: [pdf, shared, revoke],
  fields: [
    { name: 'code', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'candidate', type: 'relationship', relationTo: 'users', required: true, index: true, admin: { readOnly: true } },
    { name: 'attempt', type: 'relationship', relationTo: 'test-attempts', required: true, unique: true, admin: { readOnly: true } },
    { name: 'level', type: 'text', admin: { readOnly: true } },
    { name: 'band', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'overall', type: 'number', admin: { readOnly: true } },
    { name: 'subScores', type: 'json', admin: { readOnly: true } },
    { name: 'provisional', type: 'checkbox', admin: { readOnly: true, description: 'Cut scores were provisional when issued' } },
    { name: 'issuedAt', type: 'date', required: true, admin: { readOnly: true } },
    { name: 'expiresAt', type: 'date', required: true, admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'valid',
      options: [
        { value: 'valid', label: 'Valid' },
        { value: 'revoked', label: 'Revoked' },
      ],
    },
    { name: 'revokedReason', type: 'textarea', admin: { condition: (d) => d?.status === 'revoked' } },
    { name: 'revokedAt', type: 'date', admin: { readOnly: true, condition: (d) => d?.status === 'revoked' } },
  ],
}
