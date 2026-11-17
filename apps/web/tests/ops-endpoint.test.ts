import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import config from '@payload-config'
import { opsRun } from '../src/endpoints/ops'

let payload: Payload
const SECRET = 'x'.repeat(40)
const call = async (body: unknown, secret?: string) => {
  const headers = new Headers(secret === undefined ? {} : { 'x-ops-secret': secret })
  const res = await opsRun.handler({ payload, headers, json: async () => body } as unknown as PayloadRequest)
  return { status: res.status, data: (await res.json()) as Record<string, unknown> }
}
const read = (f: string) => readFileSync(path.resolve(__dirname, '../../..', f), 'utf8')

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  delete process.env.OPS_SECRET
  await payload.db.destroy?.()
})

describe('ops endpoint', () => {
  it('is switched off without a long OPS_SECRET and refuses a wrong one', async () => {
    delete process.env.OPS_SECRET
    expect((await call({ task: 'seed' }, SECRET)).status).toBe(404)
    process.env.OPS_SECRET = 'short'
    expect((await call({ task: 'seed' }, 'short')).status).toBe(404)
    process.env.OPS_SECRET = SECRET
    expect((await call({ task: 'seed' })).status).toBe(403)
    expect((await call({ task: 'seed' }, 'y'.repeat(40))).status).toBe(403)
    expect((await call({ task: 'nope' }, SECRET)).status).toBe(400)
  })

  it('creates a super admin without revealing a password, then promotes on repeat', async () => {
    process.env.OPS_SECRET = SECRET
    const email = `ops${Date.now()}@example.test`
    const first = await call({ task: 'create-admin', email, name: 'Ops Admin' }, SECRET)
    expect(first.data).toMatchObject({ ok: true, status: 'created', email, passwordSet: false })
    expect(JSON.stringify(first.data)).not.toMatch(/password"\s*:\s*"/)
    const user = (await payload.find({ collection: 'users', overrideAccess: true, where: { email: { equals: email } } })).docs[0]!
    expect(user.roles).toContain('super_admin')
    expect((await call({ task: 'create-admin', email }, SECRET)).data).toMatchObject({ status: 'promoted' })
    expect((await call({ task: 'create-admin', email: 'not-an-email' }, SECRET)).status).toBe(400)
    expect((await call({ task: 'create-admin', email, password: 'short' }, SECRET)).status).toBe(400)
  })

  it('ships a Hostinger compose file behind Traefik with the public app image only', () => {
    const compose = read('deploy/hostinger/docker-compose.yml')
    expect(compose).toContain('image: ghcr.io/indrakrona/ailit-web:${IMAGE_TAG:-main}')
    expect(compose).not.toContain('ailit-tools')
    expect(compose).toContain('traefik.http.routers.ailit.tls.certresolver: letsencrypt')
    expect(compose).not.toMatch(/^\s+ports:/m) // only Traefik faces the internet
    expect(read('deploy/hostinger/ops-runner.yml')).toContain('http://web:8080/api/ops/run')
  })
})
