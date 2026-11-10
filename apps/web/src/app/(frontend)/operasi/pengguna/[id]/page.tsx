import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { hasRole, ROLES, ROLE_LABELS } from '@ailit/shared'
import { Shell } from '../../../../../components/Shell'
import { Card, Notice } from '../../../../../components/ui'
import { ManageUser } from '../../../../../components/forms/ManageUser'
import { ProgressPanel } from '../../../../../components/ProgressPanel'
import { getDict } from '../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../lib/session'
import { audit } from '../../../../../lib/audit'

/**
 * Audited "view as" (spec N1): a read-only picture of what this person sees and has done, for support.
 * It never signs in as them, so it cannot act on their behalf; each opening is written to the audit log.
 */
export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser()
  if (!admin) redirect('/masuk')
  if (!hasRole(admin, 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const u = await payload.findByID({ collection: 'users', id: Number((await params).id), depth: 1, overrideAccess: true }).catch(() => null)
  if (!u) notFound()
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  await audit(payload, { actor: admin.id, action: 'view_as', collection: 'users', docId: u.id, summary: 'read-only support view', ip })

  const classes = (await payload.find({ collection: 'classes', overrideAccess: true, depth: 0, limit: 20, where: { or: [{ students: { contains: u.id } }, { teachers: { contains: u.id } }] } })).docs
  const lessons = await payload.count({ collection: 'lesson-progress', overrideAccess: true, where: { and: [{ user: { equals: u.id } }, { status: { equals: 'completed' } }] } })
  const attempts = (await payload.find({ collection: 'test-attempts', overrideAccess: true, depth: 0, limit: 10, sort: '-startedAt', where: { candidate: { equals: u.id } } })).docs
  const convos = (await payload.find({ collection: 'ai-conversations', overrideAccess: true, depth: 1, limit: 10, sort: '-updatedAt', where: { user: { equals: u.id } } })).docs
  const recent = (await payload.find({ collection: 'audit-logs', overrideAccess: true, depth: 1, limit: 15, sort: '-createdAt', where: { or: [{ actor: { equals: u.id } }, { and: [{ targetCollection: { equals: 'users' } }, { docId: { equals: String(u.id) } }] }] } })).docs
  const when = (d?: string | null) => (d ? new Date(d).toLocaleString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-4">
        <Link href="/operasi?tab=pengguna" className="text-sm underline">← {id ? 'Semua pengguna' : 'All users'}</Link>
        <Notice title={id ? 'Tampilan dukungan (hanya baca)' : 'Support view (read-only)'}>
          {id ? 'Anda melihat data pengguna ini untuk keperluan dukungan. Pembukaan halaman ini tercatat di log audit.' : 'You are viewing this person’s data for support. Opening this page is recorded in the audit log.'}
        </Notice>
        <Card>
          <h1 className="text-2xl font-bold">{u.name}</h1>
          <p className="text-muted">{u.email}</p>
          <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div><dt className="inline text-muted">{id ? 'Peran' : 'Roles'}: </dt><dd className="inline">{(u.roles ?? []).map((r) => ROLE_LABELS[r as keyof typeof ROLE_LABELS]?.[locale] ?? r).join(', ')}</dd></div>
            <div><dt className="inline text-muted">{id ? 'Sekolah' : 'School'}: </dt><dd className="inline">{typeof u.school === 'object' && u.school ? u.school.name : '—'}</dd></div>
            <div><dt className="inline text-muted">{id ? 'Izin orang tua' : 'Parent consent'}: </dt><dd className="inline">{u.consentStatus}</dd></div>
            <div><dt className="inline text-muted">Status: </dt><dd className="inline">{u.suspended ? (id ? 'Ditangguhkan' : 'Suspended') : (id ? 'Aktif' : 'Active')}</dd></div>
            <div><dt className="inline text-muted">{id ? 'Terdaftar' : 'Joined'}: </dt><dd className="inline">{when(u.createdAt)}</dd></div>
            <div><dt className="inline text-muted">{id ? 'Kelas' : 'Classes'}: </dt><dd className="inline">{classes.map((c) => c.name).join(', ') || '—'}</dd></div>
            <div><dt className="inline text-muted">{id ? 'Pelajaran selesai' : 'Lessons completed'}: </dt><dd className="inline">{lessons.totalDocs}</dd></div>
          </dl>
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-semibold">{id ? 'Kelola akun' : 'Manage account'}</h2>
          <ManageUser userId={u.id} suspended={Boolean(u.suspended)} roles={u.roles ?? []} allRoles={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r][locale] }))} locale={locale} />
        </Card>
        {u.roles?.includes('student') && (
          <ProgressPanel payload={payload} userId={u.id} classIds={classes.map((c) => c.id)} locale={locale} title={id ? 'Kemajuan siswa' : 'Student progress'} />
        )}
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Tes AILIS' : 'AILIS tests'}</h2>
          <ul className="mt-2 text-sm">{attempts.map((a) => <li key={a.id} className="border-b border-line py-1.5">#{a.id} · {a.status} · {when(a.startedAt)}{a.report ? ` · band ${(a.report as { band?: number }).band}` : ''}</li>)}{!attempts.length && <li className="text-muted">—</li>}</ul>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Percakapan AI Lab' : 'AI Lab conversations'}</h2>
          <ul className="mt-2 text-sm">{convos.map((c) => <li key={c.id} className="border-b border-line py-1.5"><Link className="underline" href={`/operasi/percakapan/${c.id}`}>{typeof c.activity === 'object' ? c.activity.title : `#${c.id}`}</Link>{c.flagged ? <span className="ml-2 text-danger">{((c.flags as string[]) ?? []).join(', ')}</span> : null} · {when(c.updatedAt)}</li>)}{!convos.length && <li className="text-muted">—</li>}</ul>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Aktivitas tercatat' : 'Recorded activity'}</h2>
          <ul className="mt-2 text-sm">{recent.map((l) => <li key={l.id} className="border-b border-line py-1.5">{when(l.createdAt)} · <span className="font-mono text-xs">{l.action}</span> · {typeof l.actor === 'object' && l.actor ? l.actor.name : '—'}{l.summary ? ` · ${l.summary}` : ''}</li>)}</ul>
        </Card>
      </div>
    </Shell>
  )
}
