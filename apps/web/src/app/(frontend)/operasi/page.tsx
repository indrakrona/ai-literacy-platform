import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Where } from 'payload'
import { hasRole, ROLES, ROLE_LABELS } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card, inputClass } from '../../../components/ui'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { getSwitches } from '../../../lib/settings'
import { AI_COST_PER_MTOK_USD } from '../../../lib/metrics'
import { ProcessDataRequest } from '../../../components/forms/DataRightsForms'
import { TICKET_STATUS } from '../../../collections/Support'
import { PaymentActions } from '../../../components/forms/CommerceForms'
import { ORDER_STATUS } from '../../../lib/commerce'
import { formatIdr } from '../../../lib/payments'

const TABS = [
  { key: 'pengguna', id: 'Pengguna', en: 'Users' },
  { key: 'ai', id: 'Monitor AI', en: 'AI monitor' },
  { key: 'audit', id: 'Log audit', en: 'Audit log' },
  { key: 'pembayaran', id: 'Pembayaran', en: 'Payments' },
  { key: 'tiket', id: 'Tiket bantuan', en: 'Support tickets' },
  { key: 'data', id: 'Permintaan data', en: 'Data requests' },
  { key: 'cadangan', id: 'Cadangan', en: 'Backups' },
] as const

const idOfReq = (v: unknown) => (v && typeof v === 'object' ? (v as { id: number }).id : v)

type Search = { tab?: string; q?: string; peran?: string; aksi?: string }

/** Operations (spec N1–N4, N6): users, AI cost and flagged conversations, audit log, backups. Super admins only. */
export default async function OpsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const sp = await searchParams
  const tab = TABS.find((t) => t.key === sp.tab)?.key ?? 'pengguna'
  const payload = await getPayloadClient()
  const fmtTime = (d: string) => new Date(d).toLocaleString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  let body: React.ReactNode = null

  if (tab === 'pengguna') {
    const and: Where[] = []
    const q = (sp.q ?? '').trim()
    if (q) and.push({ or: [{ name: { like: q } }, { email: { like: q } }] })
    if (sp.peran && (ROLES as readonly string[]).includes(sp.peran)) and.push({ roles: { contains: sp.peran } })
    const users = await payload.find({ collection: 'users', overrideAccess: true, depth: 1, limit: 50, sort: '-createdAt', where: and.length ? { and } : {} })
    body = (
      <Card>
        <form className="flex flex-wrap items-end gap-3" method="get">
          <input type="hidden" name="tab" value="pengguna" />
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {id ? 'Cari nama atau email' : 'Search name or email'}
            <input name="q" defaultValue={q} className={`${inputClass} w-64`} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {id ? 'Peran' : 'Role'}
            <select name="peran" defaultValue={sp.peran ?? ''} className={inputClass}>
              <option value="">{id ? 'Semua' : 'All'}</option>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r][locale]}</option>)}
            </select>
          </label>
          <button className="rounded-xl bg-ink px-5 py-3 font-semibold text-paper">{id ? 'Cari' : 'Search'}</button>
        </form>
        <p className="mt-3 text-sm text-muted">{users.totalDocs} {id ? 'pengguna' : 'users'}{users.totalDocs > 50 ? (id ? ' (50 terbaru ditampilkan)' : ' (latest 50 shown)') : ''}</p>
        <div className="mt-2 overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-muted"><th>{id ? 'Nama' : 'Name'}</th><th>Email</th><th>{id ? 'Peran' : 'Roles'}</th><th>{id ? 'Sekolah' : 'School'}</th><th>Status</th></tr></thead>
          <tbody>{users.docs.map((u) => (
            <tr key={u.id} className="border-b border-line">
              <td className="py-1.5"><Link className="underline" href={`/operasi/pengguna/${u.id}`}>{u.name}</Link></td>
              <td className="break-all">{u.email}</td>
              <td>{(u.roles ?? []).map((r) => ROLE_LABELS[r as keyof typeof ROLE_LABELS]?.[locale] ?? r).join(', ')}</td>
              <td>{typeof u.school === 'object' && u.school ? u.school.name : '—'}</td>
              <td>{u.suspended ? <span className="font-semibold text-danger">{id ? 'Ditangguhkan' : 'Suspended'}</span> : u.consentStatus === 'pending' ? (id ? 'Menunggu izin' : 'Awaiting consent') : (id ? 'Aktif' : 'Active')}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </Card>
    )
  } else if (tab === 'ai') {
    const switches = await getSwitches(payload)
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const month = new Date(start.getFullYear(), start.getMonth(), 1)
    const events = (await payload.find({ collection: 'analytics-events', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { and: [{ name: { equals: 'ai_message_sent' } }, { createdAt: { greater_than_equal: month.toISOString() } }] } })).docs
    const tokens = (e: (typeof events)[number]) => Number((e.props as { tokens?: number } | null)?.tokens ?? 0)
    const today = events.filter((e) => Date.parse(e.createdAt) >= start.getTime())
    const costToday = (today.reduce((a, e) => a + tokens(e), 0) / 1e6) * AI_COST_PER_MTOK_USD
    const costMonth = (events.reduce((a, e) => a + tokens(e), 0) / 1e6) * AI_COST_PER_MTOK_USD
    const bySchool = new Map<number, { today: number; month: number }>()
    for (const e of events) {
      const s = e.school ?? 0
      const r = bySchool.get(s) ?? { today: 0, month: 0 }
      r.month += tokens(e)
      if (Date.parse(e.createdAt) >= start.getTime()) r.today += tokens(e)
      bySchool.set(s, r)
    }
    const schoolIds = [...bySchool.keys()].filter(Boolean)
    const schools = schoolIds.length ? (await payload.find({ collection: 'schools', overrideAccess: true, depth: 0, limit: schoolIds.length, where: { id: { in: schoolIds } } })).docs : []
    const flagged = await payload.find({ collection: 'ai-conversations', overrideAccess: true, depth: 1, limit: 30, sort: '-updatedAt', where: { flagged: { equals: true } } })
    const over = costToday > switches.dailyAiBudgetUsd
    body = (
      <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className={`rounded-2xl border p-4 ${over ? 'border-danger bg-danger/10' : 'border-line bg-white'}`}>
            <p className="text-3xl font-bold tabular-nums">${costToday.toFixed(2)}</p>
            <p className="text-sm text-muted">{id ? 'Biaya AI hari ini (perkiraan)' : 'AI cost today (estimate)'}</p>
            <p className="mt-1 text-xs">{id ? 'Anggaran' : 'Budget'} ${switches.dailyAiBudgetUsd}{over ? (id ? ' — terlampaui' : ' — exceeded') : ''}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4"><p className="text-3xl font-bold tabular-nums">${costMonth.toFixed(2)}</p><p className="text-sm text-muted">{id ? 'Bulan ini' : 'This month'}</p></div>
          <div className="rounded-2xl border border-line bg-white p-4"><p className="text-3xl font-bold tabular-nums">{today.length}</p><p className="text-sm text-muted">{id ? 'Pesan AI hari ini' : 'AI messages today'}</p></div>
          <div className="rounded-2xl border border-line bg-white p-4"><p className="text-3xl font-bold tabular-nums">{flagged.totalDocs}</p><p className="text-sm text-muted">{id ? 'Percakapan ditandai' : 'Flagged conversations'}</p></div>
        </div>
        <p className="text-sm text-muted">{id ? `Batas saat ini: ${switches.studentDailyMessages} pesan per siswa per hari, ${switches.schoolDailyTokens.toLocaleString('id-ID')} token per sekolah per hari. Ubah di Platform settings.` : `Current limits: ${switches.studentDailyMessages} messages per student per day, ${switches.schoolDailyTokens.toLocaleString('en-GB')} tokens per school per day. Change them in Platform settings.`} <a className="underline" href="/admin/globals/platform-settings">{id ? 'Buka pengaturan' : 'Open settings'}</a></p>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Pemakaian per sekolah' : 'Usage by school'}</h2>
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-left text-muted"><th>{id ? 'Sekolah' : 'School'}</th><th className="text-right">{id ? 'Token hari ini' : 'Tokens today'}</th><th className="text-right">{id ? 'dari batas' : 'of limit'}</th><th className="text-right">{id ? 'Bulan ini' : 'This month'}</th></tr></thead>
            <tbody>{[...bySchool.entries()].sort((a, b) => b[1].month - a[1].month).map(([sid, r]) => (
              <tr key={sid} className="border-b border-line"><td className="py-1.5">{schools.find((s) => s.id === sid)?.name ?? (id ? 'Tanpa sekolah' : 'No school')}</td><td className="text-right tabular-nums">{r.today.toLocaleString('id-ID')}</td><td className={`text-right tabular-nums ${switches.schoolDailyTokens && r.today / switches.schoolDailyTokens > 0.8 ? 'text-danger' : ''}`}>{switches.schoolDailyTokens ? `${Math.round((r.today / switches.schoolDailyTokens) * 100)}%` : '—'}</td><td className="text-right tabular-nums">{r.month.toLocaleString('id-ID')}</td></tr>
            ))}</tbody>
          </table>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{id ? 'Percakapan yang ditandai' : 'Flagged conversations'}</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {flagged.docs.map((c) => (
              <li key={c.id} className="flex flex-wrap justify-between gap-2 py-2">
                <Link className="underline" href={`/operasi/percakapan/${c.id}`}>{typeof c.user === 'object' ? c.user.name : `#${c.user}`} · {typeof c.activity === 'object' ? c.activity.title : ''}</Link>
                <span className="text-muted">{((c.flags as string[]) ?? []).join(', ')} · {fmtTime(c.updatedAt)}</span>
              </li>
            ))}
            {!flagged.docs.length && <li className="py-2 text-muted">{id ? 'Tidak ada.' : 'None.'}</li>}
          </ul>
        </Card>
      </>
    )
  } else if (tab === 'audit') {
    const and: Where[] = []
    if (sp.aksi) and.push({ action: { equals: sp.aksi } })
    const logs = await payload.find({ collection: 'audit-logs', overrideAccess: true, depth: 1, limit: 100, sort: '-createdAt', where: and.length ? { and } : {} })
    const actions = ['login', 'create', 'update', 'delete', 'view_as', 'suspend', 'unsuspend', 'set_roles', 'reset_link', 'rate', 'grade', 'regrade', 'incident', 'consent_granted', 'consent_declined', 'consent_withdrawn', 'data_export', 'data_deletion_requested', 'data_erased', 'data_deletion_rejected', 'payment_confirm', 'payment_reject', 'payment_refund']
    body = (
      <Card>
        <div className="flex flex-wrap gap-2">
          <Link href="/operasi?tab=audit" className={`rounded-full border px-3 py-1 text-sm ${!sp.aksi ? 'border-ink bg-ink text-paper' : 'border-line'}`}>{id ? 'Semua' : 'All'}</Link>
          {actions.map((a) => <Link key={a} href={`/operasi?tab=audit&aksi=${a}`} className={`rounded-full border px-3 py-1 text-sm ${sp.aksi === a ? 'border-ink bg-ink text-paper' : 'border-line'}`}>{a}</Link>)}
        </div>
        <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-muted"><th>{id ? 'Waktu' : 'Time'}</th><th>{id ? 'Pelaku' : 'Actor'}</th><th>{id ? 'Aksi' : 'Action'}</th><th>{id ? 'Data' : 'Record'}</th><th>{id ? 'Keterangan' : 'Details'}</th></tr></thead>
          <tbody>{logs.docs.map((l) => (
            <tr key={l.id} className="border-b border-line align-top">
              <td className="py-1.5 whitespace-nowrap">{fmtTime(l.createdAt)}</td>
              <td>{typeof l.actor === 'object' && l.actor ? l.actor.name : id ? 'sistem / tamu' : 'system / guest'}</td>
              <td className="font-mono text-xs">{l.action}</td>
              <td className="font-mono text-xs">{l.targetCollection}{l.docId ? ` #${l.docId}` : ''}</td>
              <td className="text-muted">{l.summary}</td>
            </tr>
          ))}</tbody>
        </table></div>
        <p className="mt-2 text-xs text-muted">{id ? 'Log hanya bisa ditambah, tidak bisa diubah atau dihapus. Nilai data tidak disimpan, hanya nama kolom yang berubah.' : 'The log is append-only. Values are not stored, only which fields changed.'}</p>
      </Card>
    )
  } else if (tab === 'pembayaran') {
    const orders = await payload.find({ collection: 'orders', overrideAccess: true, depth: 1, locale, limit: 100, sort: '-updatedAt' })
    const rank = { awaiting_confirmation: 0, pending: 1, paid: 2 } as Record<string, number>
    const rows = [...orders.docs].sort((a, b) => (rank[a.status] ?? 3) - (rank[b.status] ?? 3))
    const waiting = rows.filter((o) => o.status === 'awaiting_confirmation').length
    body = (
      <Card>
        <h2 className="text-lg font-semibold">{id ? `Menunggu konfirmasi (${waiting})` : `Waiting for confirmation (${waiting})`}</h2>
        <p className="mt-1 text-sm text-muted">{id ? 'Cocokkan transfer di rekening dengan jumlah persis (termasuk kode unik 3 digit), lalu konfirmasi. Rekening, PPN dan batas waktu diatur di Pengaturan platform.' : 'Match the transfer in the bank account by the exact amount (including the 3-digit code), then confirm. Bank account, PPN and deadline are in Platform settings.'}</p>
        <ul className="mt-3 divide-y divide-line">
          {rows.map((o) => (
            <li key={o.id} className="flex flex-col gap-2 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  <a href={`/pesanan/${o.id}`} className="font-medium underline">#{o.id}</a> · {typeof o.product === 'object' && o.product ? o.product.name : o.plan} · {o.quantity ?? o.seats}×
                  <span className="text-sm text-muted"> · {typeof o.createdBy === 'object' && o.createdBy ? o.createdBy.name : ''}{typeof o.school === 'object' && o.school ? ` (${o.school.name})` : ''}</span>
                </span>
                <span className={`text-sm ${o.status === 'awaiting_confirmation' ? 'font-semibold' : 'text-muted'}`}>{formatIdr(o.amountIdr)} · {ORDER_STATUS[o.status]?.[locale] ?? o.status} · {o.method === 'bank_transfer' ? (id ? 'transfer' : 'transfer') : o.provider}</span>
              </div>
              {o.transferNote && <p className="text-sm text-muted">{id ? 'Kata pembeli' : 'Buyer says'}: “{o.transferNote}”</p>}
              {o.method === 'bank_transfer' && ['pending', 'awaiting_confirmation', 'paid'].includes(o.status) && <PaymentActions orderId={o.id} status={o.status} amountIdr={o.amountIdr} locale={locale} />}
            </li>
          ))}
        </ul>
      </Card>
    )
  } else if (tab === 'tiket') {
    const tickets = await payload.find({ collection: 'support-tickets', overrideAccess: true, depth: 1, limit: 100, sort: '-lastActivityAt' })
    const order = { open: 0, waiting: 1, resolved: 2 } as Record<string, number>
    const rows = [...tickets.docs].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3))
    body = (
      <Card>
        <h2 className="text-lg font-semibold">{id ? `Tiket menunggu tim (${rows.filter((t) => t.status === 'open').length})` : `Tickets waiting for the team (${rows.filter((t) => t.status === 'open').length})`}</h2>
        <p className="mt-1 text-sm text-muted">{id ? 'Janji balasan: 2 hari kerja. Artikel bantuan dikelola di panel admin (Communication › Help articles).' : 'Reply promise: 2 working days. Help articles are managed in the admin panel (Communication › Help articles).'}</p>
        {rows.length === 0 ? <p className="mt-3 text-sm text-muted">{id ? 'Belum ada tiket.' : 'No tickets yet.'}</p> : (
          <ul className="mt-3 divide-y divide-line">
            {rows.map((t) => (
              <li key={t.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <span>
                  <Link href={`/bantuan/tiket/${t.id}`} className="font-medium underline">{t.subject}</Link>
                  <span className="text-sm text-muted"> · {typeof t.requester === 'object' && t.requester ? t.requester.name : t.guestEmail} · {t.category}</span>
                </span>
                <span className={`text-sm ${t.status === 'open' ? 'font-semibold' : 'text-muted'}`}>{TICKET_STATUS[t.status]?.[locale] ?? t.status} · {t.lastActivityAt ? fmtTime(t.lastActivityAt) : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    )
  } else if (tab === 'data') {
    const reqs = await payload.find({ collection: 'data-requests', overrideAccess: true, depth: 1, limit: 100, sort: 'dueAt', where: { type: { equals: 'deletion' } } })
    const open = reqs.docs.filter((r) => r.status === 'open')
    const closed = reqs.docs.filter((r) => r.status !== 'open').slice(0, 30)
    const now = Date.now()
    const name = (v: unknown) => (v && typeof v === 'object' ? (v as { name: string; email?: string }).name : '—')
    body = (
      <div className="flex flex-col gap-4">
        <Card>
          <h2 className="text-lg font-semibold">{id ? `Permintaan penghapusan terbuka (${open.length})` : `Open deletion requests (${open.length})`}</h2>
          <p className="mt-1 text-sm text-muted">
            {id
              ? 'Menghapus: isi pribadi dihapus (percakapan AI, kemajuan, proyek pribadi, pemberitahuan), sertifikat dicabut, hasil tes disimpan tanpa identitas untuk statistik, akun diganti "Pengguna dihapus". Tidak dapat dibatalkan.'
              : 'Erasing deletes personal content (AI chats, progress, solo projects, notifications), revokes certificates, keeps test results without identity for statistics, and replaces the account with "Deleted user". It cannot be undone.'}
          </p>
          {open.length === 0 ? <p className="mt-3 text-sm text-muted">{id ? 'Tidak ada.' : 'None.'}</p> : (
            <ul className="mt-3 divide-y divide-line">
              {open.map((r) => {
                const late = new Date(r.dueAt).getTime() < now
                return (
                  <li key={r.id} className="flex flex-col gap-2 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{name(r.user)}{idOfReq(r.requestedBy) !== idOfReq(r.user) ? <span className="text-muted">{id ? ` · diminta oleh ${name(r.requestedBy)}` : ` · asked by ${name(r.requestedBy)}`}</span> : null}</span>
                      <span className={`text-sm ${late ? 'font-semibold text-danger' : 'text-muted'}`}>{late ? (id ? 'Lewat tenggat · ' : 'Overdue · ') : ''}{id ? 'tenggat' : 'due'} {fmtTime(r.dueAt)}</span>
                    </div>
                    {r.reason && <p className="text-sm text-muted">“{r.reason}”</p>}
                    <ProcessDataRequest requestId={r.id} locale={locale} />
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
        {closed.length > 0 && (
          <Card>
            <h2 className="font-semibold">{id ? 'Selesai' : 'Closed'}</h2>
            <ul className="mt-2 text-sm">
              {closed.map((r) => <li key={r.id} className="flex justify-between gap-2 border-b border-line py-1.5"><span>{name(r.user)}</span><span className="text-muted">{r.status} · {r.resolvedAt ? fmtTime(r.resolvedAt) : ''}</span></li>)}
            </ul>
          </Card>
        )}
      </div>
    )
  } else {
    body = (
      <Card>
        <h2 className="text-lg font-semibold">{id ? 'Cadangan dan pemulihan' : 'Backups and restore'}</h2>
        <ul className="mt-3 list-disc pl-5 text-sm">
          <li>{id ? 'Basis data dicadangkan otomatis setiap malam oleh layanan "backup" di docker-compose.selfhost.yml (disimpan 14 hari).' : 'The database is backed up nightly by the "backup" service in docker-compose.selfhost.yml (kept 14 days).'}</li>
          <li>{id ? 'Cadangan manual: ' : 'Manual backup: '}<code className="font-mono">scripts/backup.sh</code></li>
          <li>{id ? 'Pemulihan: ' : 'Restore: '}<code className="font-mono">scripts/restore.sh &lt;file.sql.gz&gt; &lt;target-db&gt;</code>{id ? ' — selalu pulihkan ke basis data baru dulu, periksa, baru dialihkan.' : ' — always restore into a new database first, check it, then switch.'}</li>
          <li>{id ? 'Berkas media (MinIO/S3) dicadangkan terpisah; lihat docs/backup.md.' : 'Media files (MinIO/S3) are backed up separately; see docs/backup.md.'}</li>
        </ul>
      </Card>
    )
  }

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">{id ? 'Operasional platform' : 'Platform operations'}</p>
          <h1 className="text-3xl font-bold">{id ? 'Operasi' : 'Operations'}</h1>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label={id ? 'Bagian operasi' : 'Operations sections'}>
          {TABS.map((t) => <Link key={t.key} href={`/operasi?tab=${t.key}`} aria-current={t.key === tab ? 'page' : undefined} className={`rounded-full border px-3 py-1 text-sm ${t.key === tab ? 'border-ink bg-ink text-paper' : 'border-line bg-white'}`}>{id ? t.id : t.en}</Link>)}
          <a href="/admin/globals/platform-settings" className="rounded-full border border-line bg-white px-3 py-1 text-sm">{id ? 'Pengaturan & sakelar fitur ↗' : 'Settings & feature switches ↗'}</a>
        </nav>
        {body}
      </div>
    </Shell>
  )
}
