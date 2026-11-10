import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@payload-config'
import { changedFields } from '../src/lib/audit'
import { Users } from '../src/collections/Users'
import { Submissions } from '../src/collections/Submissions'
import { TestAttempts } from '../src/collections/TestAttempts'

let payload: Payload
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`
const mk = (roles: string[], extra: Record<string, unknown> = {}) =>
  payload.create({ collection: 'users', overrideAccess: true, data: { name: `U ${uniq()}`, email: `u${uniq()}@example.test`, password: 'Passw0rd!', roles: roles as never, consentStatus: 'not_required', ...extra } })
const ep = (c: { endpoints?: unknown }, path: string) => ((c.endpoints as { path: string; handler: (r: PayloadRequest) => Promise<Response> }[]) ?? []).find((e) => e.path === path)!
const call = async (c: { endpoints?: unknown }, path: string, user: unknown, body: unknown = {}, routeParams: Record<string, unknown> = {}) => {
  const res = await ep(c, path).handler({ payload, user, json: async () => body, routeParams, headers: new Headers() } as unknown as PayloadRequest)
  return { status: res.status, data: (await res.json()) as Record<string, unknown> }
}
const logsFor = async (action: string, docId?: number) =>
  (await payload.find({ collection: 'audit-logs', overrideAccess: true, depth: 0, limit: 50, sort: '-createdAt', where: { and: [{ action: { equals: action } }, ...(docId ? [{ docId: { equals: String(docId) } }] : [])] } })).docs

beforeAll(async () => {
  payload = await getPayload({ config })
})
afterAll(async () => {
  await payload.updateGlobal({ slug: 'platform-settings', data: { signupsOpen: true, aiLabEnabled: true, testsEnabled: true, projectsEnabled: true, maintenanceMessage: '' } })
  await payload.db.destroy?.()
})

describe('audit log', () => {
  it('lists changed fields without values and ignores bookkeeping fields', () => {
    expect(changedFields({ name: 'a', updatedAt: '1', hash: 'x' }, { name: 'b', updatedAt: '2', hash: 'y' })).toEqual(['name'])
    expect(changedFields(undefined, { name: 'b' })).toEqual([])
  })

  it('records changes people make, never system writes, and cannot be edited', async () => {
    const admin = await mk(['super_admin'])
    const school = await payload.create({ collection: 'schools', overrideAccess: true, data: { name: `S ${uniq()}`, npsn: uniq(), level: 'sma' } as never })
    expect(await logsFor('create', school.id)).toHaveLength(0) // seeded by the system
    await payload.update({ collection: 'schools', id: school.id, user: admin, overrideAccess: false, data: { name: 'Renamed' } })
    const entry = (await logsFor('update', school.id)).find((l) => l.targetCollection === 'schools')!
    expect(entry.summary).toBe('fields: name')
    expect(entry.summary).not.toContain('Renamed')
    await expect(payload.update({ collection: 'audit-logs', id: entry.id, user: admin, overrideAccess: false, data: { summary: 'x' } })).rejects.toThrow()
    await expect(payload.delete({ collection: 'audit-logs', id: entry.id, user: admin, overrideAccess: false })).rejects.toThrow()
  })
})

describe('user management', () => {
  it('lets only super admins suspend, change roles and create reset links, all audited; suspended users cannot sign in', async () => {
    const [admin, teacher, target] = await Promise.all([mk(['super_admin']), mk(['teacher']), mk(['student'])])
    expect((await call(Users, '/:id/manage', teacher, { action: 'suspend' }, { id: target.id })).status).toBe(403)
    expect((await call(Users, '/:id/manage', admin, { action: 'suspend' }, { id: admin.id })).status).toBe(400)
    expect((await call(Users, '/:id/manage', admin, { action: 'suspend' }, { id: target.id })).status).toBe(200)
    await expect(payload.login({ collection: 'users', data: { email: target.email, password: 'Passw0rd!' } })).rejects.toThrow(/suspended/)
    await call(Users, '/:id/manage', admin, { action: 'unsuspend' }, { id: target.id })
    expect((await payload.login({ collection: 'users', data: { email: target.email, password: 'Passw0rd!' } })).user?.id).toBe(target.id)
    expect((await call(Users, '/:id/manage', admin, { action: 'set_roles', roles: ['teacher', 'bogus'] }, { id: target.id })).data.roles).toEqual(['teacher'])
    expect(String((await call(Users, '/:id/manage', admin, { action: 'reset_link' }, { id: target.id })).data.link)).toMatch(/\/atur-sandi\?token=/)
    const actions = (await payload.find({ collection: 'audit-logs', overrideAccess: true, depth: 0, limit: 20, where: { docId: { equals: String(target.id) } } })).docs.map((l) => l.action)
    expect(actions).toEqual(expect.arrayContaining(['suspend', 'unsuspend', 'set_roles', 'reset_link', 'login']))
  })
})

describe('feature switches', () => {
  it('closes sign-up, projects and tests when switched off', async () => {
    await payload.updateGlobal({ slug: 'platform-settings', data: { signupsOpen: false, projectsEnabled: false, testsEnabled: false } })
    const signup = ep(Users, '/signup')
    const res = await signup.handler({ payload, user: null, json: async () => ({ name: 'X', email: `x${uniq()}@example.test`, password: 'Passw0rd!x', dateOfBirth: '2000-01-01', accountType: 'student' }), headers: new Headers() } as unknown as PayloadRequest)
    expect(res.status).toBe(403)
    const student = await mk(['student'])
    expect((await call(Submissions, '/submit', student, { text: 'x'.repeat(30) })).status).toBe(503)
    expect((await call(TestAttempts, '/start', student, { accessCode: 'ZZZZZZ' })).status).toBe(503)
    await payload.updateGlobal({ slug: 'platform-settings', data: { signupsOpen: true, projectsEnabled: true, testsEnabled: true } })
    expect((await call(TestAttempts, '/start', student, { accessCode: 'ZZZZZZ' })).status).toBe(404) // open again: just no such code
  })
})
