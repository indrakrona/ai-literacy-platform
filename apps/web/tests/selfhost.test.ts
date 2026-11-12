import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import config from '@payload-config'
import { health } from '../src/endpoints/health'
import { siteUrl } from '../src/lib/site-url'

const root = path.resolve(__dirname, '../../..')
const read = (f: string) => readFileSync(path.join(root, f), 'utf8')
let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.db.destroy?.()
})

describe('self-host package', () => {
  it('reports health with the database up, and is registered on the API', async () => {
    const res = await health.handler({ payload } as unknown as PayloadRequest)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, db: 'up' })
    expect(res.headers.get('cache-control')).toBe('no-store')
    const cfg = await config
    expect(cfg.endpoints?.some((e) => e.path === '/health' && e.method === 'get')).toBe(true)
  })

  it('reports 503 when the database cannot be reached', async () => {
    const broken = { count: async () => { throw new Error('ECONNREFUSED') } }
    const res = await health.handler({ payload: broken } as unknown as PayloadRequest)
    expect(res.status).toBe(503)
  })

  it('documents every required compose variable in .env.selfhost.example', () => {
    const compose = read('docker-compose.selfhost.yml')
    const example = read('.env.selfhost.example')
    // ${VAR} without a default must be set; ${VAR:-x} is optional. $${VAR} is resolved inside the container.
    const required = [...compose.matchAll(/(?<!\$)\$\{([A-Z0-9_]+)\}/g)].map((m) => m[1]!)
    expect(required.length).toBeGreaterThan(3)
    for (const v of new Set(required)) expect(example, v).toMatch(new RegExp(`^${v}=`, 'm'))
  })

  it('keeps the app port private by default and wires the healthcheck', () => {
    const compose = read('docker-compose.selfhost.yml')
    expect(compose).toContain('${WEB_BIND:-127.0.0.1:8080}:8080')
    expect(compose).toContain('/api/health')
    expect(read('apps/web/Dockerfile')).toContain('HEALTHCHECK')
    expect(read('infra/selfhost/Caddyfile')).toContain('reverse_proxy web:8080')
  })

  it('reads the site address at run time, preferring SERVER_URL', () => {
    const saved = { s: process.env.SERVER_URL, n: process.env.NEXT_PUBLIC_SERVER_URL }
    process.env.SERVER_URL = 'https://staging.example.test/'
    process.env.NEXT_PUBLIC_SERVER_URL = 'http://localhost:3000'
    expect(siteUrl()).toBe('https://staging.example.test')
    delete process.env.SERVER_URL
    expect(siteUrl()).toBe('http://localhost:3000')
    process.env.SERVER_URL = saved.s ?? ''
    if (saved.s === undefined) delete process.env.SERVER_URL
    process.env.NEXT_PUBLIC_SERVER_URL = saved.n ?? ''
    if (saved.n === undefined) delete process.env.NEXT_PUBLIC_SERVER_URL
    expect(read('docker-compose.selfhost.yml')).toContain('SERVER_URL: ${PUBLIC_URL}')
  })
})
