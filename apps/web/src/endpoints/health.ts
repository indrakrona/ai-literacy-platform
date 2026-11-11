import type { Endpoint } from 'payload'

/**
 * GET /api/health: used by the Docker healthcheck, the reverse proxy and uptime monitors.
 * Returns 200 when the app can reach the database, 503 otherwise. Reveals nothing private.
 */
export const health: Endpoint = {
  path: '/health',
  method: 'get',
  handler: async (req) => {
    const started = Date.now()
    try {
      await req.payload.count({ collection: 'tracks', overrideAccess: true })
      return Response.json({ ok: true, db: 'up', ms: Date.now() - started, version: process.env.APP_VERSION || 'dev' }, { headers: { 'cache-control': 'no-store' } })
    } catch {
      return Response.json({ ok: false, db: 'down' }, { status: 503, headers: { 'cache-control': 'no-store' } })
    }
  },
}
