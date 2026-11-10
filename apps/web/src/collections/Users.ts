import { APIError, type CollectionConfig, type Endpoint } from 'payload'
import { audit, ipOf } from '../lib/audit'
import { ROLES, ROLE_LABELS, hasRole, needsGuardianConsent, normalizeIdPhone } from '@ailit/shared'
import { canAccessAdminPanel, fieldSuperAdminOnly, readUsers, selfOrSuperAdmin, superAdminOnly } from '../access'
import { signupEndpoint } from '../endpoints/accounts'
import { linkChild, makeParentCode, parentSignup, unlinkGuardian } from '../endpoints/parents'
import { parentApprove, portfolioSettings } from './Engagement'
import { escapeHtml } from '../lib/emails'

const VALID_ROLES = new Set<string>(ROLES)

/** POST /api/users/:id/manage {action, roles?} — super admin user management, every action audited (spec N1). */
const manageEndpoint: Endpoint = {
  path: '/:id/manage',
  method: 'post',
  handler: async (req) => {
    const admin = req.user as { id: number; roles?: string[] } | null
    if (!hasRole(admin as { roles?: string[] }, 'super_admin')) return Response.json({ error: 'Not allowed' }, { status: 403 })
    const target = await req.payload.findByID({ collection: 'users', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true }).catch(() => null)
    if (!target) return Response.json({ error: 'Not found' }, { status: 404 })
    let b: { action?: unknown; roles?: unknown } = {}
    try {
      b = ((req.json ? await req.json() : {}) ?? {}) as typeof b
    } catch {
      /* empty */
    }
    const log = (action: string, summary?: string) => audit(req.payload, { actor: admin!.id, action, collection: 'users', docId: target.id, summary, ip: ipOf(req) })
    if (b.action === 'suspend' || b.action === 'unsuspend') {
      if (target.id === admin!.id) return Response.json({ error: 'You cannot suspend yourself' }, { status: 400 })
      await req.payload.update({ collection: 'users', id: target.id, overrideAccess: true, data: { suspended: b.action === 'suspend' } })
      await log(b.action)
      return Response.json({ ok: true })
    }
    if (b.action === 'set_roles') {
      const roles = Array.isArray(b.roles) ? [...new Set(b.roles.map(String).filter((r) => VALID_ROLES.has(r)))] : []
      if (!roles.length) return Response.json({ error: 'Choose at least one role' }, { status: 400 })
      if (target.id === admin!.id && !roles.includes('super_admin')) return Response.json({ error: 'You cannot remove your own super admin role' }, { status: 400 })
      await req.payload.update({ collection: 'users', id: target.id, overrideAccess: true, data: { roles: roles as never } })
      await log('set_roles', `${(target.roles ?? []).join(',')} → ${roles.join(',')}`)
      return Response.json({ ok: true, roles })
    }
    if (b.action === 'reset_link') {
      // A link the admin passes on personally (WhatsApp, in person) while no email provider is set.
      const token = await req.payload.forgotPassword({ collection: 'users', data: { email: target.email }, disableEmail: true })
      await log('reset_link')
      const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
      return Response.json({ link: `${base}/atur-sandi?token=${token}` })
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 })
  },
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 7 * 24 * 60 * 60,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
    forgotPassword: {
      generateEmailSubject: () => 'Atur ulang kata sandi AI Literacy',
      generateEmailHTML: (args) => {
        const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
        const link = `${base}/atur-sandi?token=${args?.token ?? ''}`
        const name = escapeHtml(String((args?.user as { name?: string } | undefined)?.name ?? ''))
        return `<p>Halo ${name},</p><p>Klik tautan ini untuk mengatur kata sandi Anda:</p><p><a href="${link}">${link}</a></p><p>Abaikan email ini jika Anda tidak memintanya.</p>`
      },
    },
  },
  endpoints: [signupEndpoint, manageEndpoint, parentSignup, linkChild, makeParentCode, unlinkGuardian, parentApprove, portfolioSettings],
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles', 'school'],
    group: 'People',
  },
  access: {
    admin: canAccessAdminPanel,
    read: readUsers,
    update: selfOrSuperAdmin,
    delete: superAdminOnly,
    // Public sign-up is built in task B1; until then only super admins create accounts.
    create: superAdminOnly,
  },
  hooks: {
    // Suspended accounts cannot sign in (spec N1).
    beforeLogin: [
      ({ user }) => {
        if ((user as { suspended?: boolean }).suspended) throw new APIError('Akun ini ditangguhkan. Hubungi sekolah atau tim AI Literacy. / This account is suspended.', 403, undefined, true)
        return user
      },
    ],
    afterLogin: [
      async ({ req, user }) => {
        await audit(req.payload, { actor: Number(user.id), action: 'login', collection: 'users', docId: user.id, ip: ipOf(req) }, req)
        return user
      },
    ],
    beforeChange: [
      ({ data, originalDoc }) => {
        // Under-18s never appear in public galleries (spec: Non-functional > Child safety).
        const dob = data?.dateOfBirth ?? originalDoc?.dateOfBirth
        if (dob && needsGuardianConsent(dob)) data.showInShowcase = false
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['student'],
      options: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r].en })),
      access: { update: fieldSuperAdminOnly, create: fieldSuperAdminOnly },
      saveToJWT: true,
    },
    { name: 'school', type: 'relationship', relationTo: 'schools', saveToJWT: true },
    {
      name: 'dateOfBirth',
      type: 'date',
      // Locked after sign-up so a minor cannot change it to skip guardian consent.
      access: { update: fieldSuperAdminOnly },
      admin: { description: 'Used to decide whether parental consent is required (under 18).' },
    },
    {
      name: 'preferredLocale',
      type: 'select',
      defaultValue: 'id',
      options: [
        { value: 'id', label: 'Bahasa Indonesia' },
        { value: 'en', label: 'English' },
      ],
    },
    {
      name: 'phone',
      type: 'text',
      admin: { description: 'WhatsApp number, stored as 62…' },
      hooks: { beforeChange: [({ value }) => (value ? normalizeIdPhone(value) ?? value : value)] },
    },
    {
      type: 'collapsible',
      label: 'Preferences',
      admin: { initCollapsed: true },
      fields: [
        { name: 'notifyEmail', type: 'checkbox', defaultValue: true },
        { name: 'notifyWhatsApp', type: 'checkbox', defaultValue: false },
        {
          name: 'showInShowcase',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Always off for under-18s until gallery consent exists.' },
        },
      ],
    },
    {
      name: 'consentStatus',
      type: 'select',
      defaultValue: 'not_required',
      options: [
        { value: 'not_required', label: 'Not required (18+)' },
        { value: 'pending', label: 'Pending parent consent' },
        { value: 'granted', label: 'Granted' },
        { value: 'declined', label: 'Declined' },
      ],
      access: { update: fieldSuperAdminOnly },
      admin: { position: 'sidebar' },
    },
    {
      name: 'suspended',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      access: { update: fieldSuperAdminOnly },
      admin: { position: 'sidebar', description: 'Blocks sign-in. Set from Operations › Users.' },
    },
    {
      name: 'guardians',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      filterOptions: { roles: { contains: 'parent' } },
      // Payload would re-check the saved list with the editing user's own read access on every save, which
      // blocks a student's profile edits (students cannot read their parent's account). Only super admins and
      // the linking endpoints (which check the parent role) can change this list, so skip that check.
      validate: () => true,
      access: { update: fieldSuperAdminOnly },
      admin: { condition: (data) => hasRole(data as { roles?: string[] }, 'student'), description: 'Parent accounts that can see this student’s progress. Parents link themselves with the consent link or a code from the student.' },
    },
    // Code a student makes for a parent to connect (readable only by the student and super admins).
    {
      name: 'parentLinkCode',
      type: 'text',
      index: true,
      access: { read: ({ req, doc }) => Boolean(req.user && (req.user.id === doc?.id || hasRole(req.user as { roles?: string[] }, 'super_admin'))), update: fieldSuperAdminOnly },
      admin: { hidden: true },
    },
    { name: 'hideNameOnBoards', label: 'Hide my name on team boards', type: 'checkbox', defaultValue: false },
    { name: 'galleryParentApproved', type: 'checkbox', defaultValue: false, access: { update: fieldSuperAdminOnly }, admin: { position: 'sidebar', description: 'A parent allowed this under-18’s projects in the gallery' } },
    {
      name: 'portfolio',
      type: 'group',
      access: { update: fieldSuperAdminOnly },
      admin: { description: 'Public portfolio page (settings are changed by the user on their Account page)' },
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false },
        { name: 'handle', type: 'text', index: true },
        { name: 'headline', type: 'text' },
        { name: 'showProjects', type: 'checkbox', defaultValue: true },
        { name: 'showBadges', type: 'checkbox', defaultValue: true },
        { name: 'showCertificate', type: 'checkbox', defaultValue: false },
        { name: 'parentApproved', type: 'checkbox', defaultValue: false, admin: { description: 'Needed for under-18s' } },
      ],
    },
    { name: 'deletedAt', type: 'date', access: { update: fieldSuperAdminOnly }, admin: { readOnly: true, position: 'sidebar', condition: (d) => Boolean(d?.deletedAt), description: 'Erased at the person’s request' } },
    { name: 'parentLinkExpiresAt', type: 'date', access: { update: fieldSuperAdminOnly }, admin: { hidden: true } },
    { name: 'lastWeeklySummaryAt', type: 'date', access: { update: fieldSuperAdminOnly }, admin: { readOnly: true, position: 'sidebar', condition: (data) => hasRole(data as { roles?: string[] }, 'parent') } },
  ],
}
