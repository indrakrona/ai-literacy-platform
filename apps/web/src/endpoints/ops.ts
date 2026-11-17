import { timingSafeEqual } from 'node:crypto'
import type { Endpoint } from 'payload'
import { seedAll } from '../seed/all'
import { createOrPromoteAdmin } from '../lib/admin'
import { audit } from '../lib/audit'

/**
 * POST /api/ops/run — one-off server tasks for hosts that only run the app image (e.g. Hostinger's Docker
 * manager), so the private "tools" image is not needed there. Disabled unless OPS_SECRET (32+ characters) is set;
 * the caller sends it in the x-ops-secret header. Normally called from a one-shot container on the same Docker
 * network (deploy/hostinger/README.md), never exposed beyond the server.
 *   {"task":"seed"}                                   load curriculum and content
 *   {"task":"create-admin","email":"…","name":"…"}    create or promote a super admin (password optional)
 */
export const opsRun: Endpoint = {
  path: '/ops/run',
  method: 'post',
  handler: async (req) => {
    const secret = process.env.OPS_SECRET ?? ''
    if (secret.length < 32) return Response.json({ error: 'Not found' }, { status: 404 })
    const given = Buffer.from(req.headers.get('x-ops-secret') ?? '')
    const expected = Buffer.from(secret)
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return Response.json({ error: 'Not allowed' }, { status: 403 })
    let body: Record<string, unknown> = {}
    try {
      body = ((await req.json?.()) as Record<string, unknown>) ?? {}
    } catch {}
    try {
      if (body.task === 'seed') {
        const report = await seedAll(req.payload)
        await audit(req.payload, { action: 'ops_seed', summary: 'Loaded curriculum and content' })
        return Response.json({ ok: true, task: 'seed', report })
      }
      if (body.task === 'create-admin') {
        const result = await createOrPromoteAdmin(req.payload, {
          email: String(body.email ?? ''),
          password: typeof body.password === 'string' && body.password ? body.password : undefined,
          name: typeof body.name === 'string' ? body.name : undefined,
        })
        await audit(req.payload, { action: 'ops_create_admin', summary: `${result.status} ${result.email}` })
        return Response.json({ ok: true, task: 'create-admin', ...result })
      }
      return Response.json({ error: 'Unknown task' }, { status: 400 })
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 400 })
    }
  },
}
