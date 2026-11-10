import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../components/Shell'
import { Card, inputClass } from '../../../components/ui'
import { AutoRefresh, IncidentForm } from '../../../components/forms/ProctorForms'
import { incidentLabel } from '../../../lib/incidents'
import { canProctor } from '../../../lib/ailis'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'

type Integrity = { tabHidden?: number; pastes?: number; fullscreenExits?: number }
type Incident = { at: string; type: string; note?: string }

/** Proctor view of one test session (spec G6): who is taking it, how far they are, integrity signals and incidents. */
export default async function ProctorPage({ searchParams }: { searchParams: Promise<{ kode?: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'proctor', 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const code = String((await searchParams).kode ?? '').trim().toUpperCase()
  const payload = await getPayloadClient()
  const found = code ? (await payload.find({ collection: 'test-forms', overrideAccess: true, depth: 0, limit: 1, where: { accessCode: { equals: code } } })).docs[0] : undefined
  const form = canProctor(found, user) ? found : undefined
  const assigned = (await payload.find({ collection: 'test-forms', overrideAccess: false, user, depth: 1, limit: 50, sort: '-updatedAt', where: { status: { equals: 'active' } } })).docs
  const attempts = form
    ? (await payload.find({ collection: 'test-attempts', overrideAccess: true, depth: 1, limit: 300, sort: 'startedAt', where: { form: { equals: form.id } } })).docs
    : []
  const now = Date.now()
  const time = (d: string) => new Date(d).toLocaleTimeString(id ? 'id-ID' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
  const statusLabel: Record<string, string> = id ? { in_progress: 'Mengerjakan', awaiting_rating: 'Selesai (menunggu penilai)', scored: 'Selesai' } : { in_progress: 'In progress', awaiting_rating: 'Submitted (awaiting rater)', scored: 'Submitted' }

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{id ? 'Pengawasan tes AILIS' : 'AILIS test proctoring'}</h1>
        <form className="flex flex-wrap items-end gap-3" method="get">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {id ? 'Kode akses sesi' : 'Session access code'}
            <input name="kode" defaultValue={code} required className={`${inputClass} w-40 font-mono uppercase tracking-widest`} />
          </label>
          <button className="rounded-xl bg-ink px-5 py-3 font-semibold text-paper">{id ? 'Buka' : 'Open'}</button>
        </form>
        {!form && assigned.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold">{id ? 'Sesi yang Anda awasi' : 'Your sessions'}</h2>
            <ul className="mt-2 divide-y divide-line text-sm">
              {assigned.map((f) => (
                <li key={f.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <a className="font-medium underline" href={`/pengawas?kode=${f.accessCode}`}>{f.name}</a>
                  <span className="text-muted">{typeof f.school === 'object' && f.school ? f.school.name : ''} · <span className="font-mono">{f.accessCode}</span></span>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {code && !form && <Card><p className="text-muted">{found ? (id ? 'Anda tidak ditugaskan sebagai pengawas sesi ini.' : 'You are not assigned to proctor this session.') : id ? 'Tidak ada tes dengan kode ini.' : 'No test with this code.'}</p></Card>}
        {form && (
          <>
            <AutoRefresh />
            <p className="text-sm text-muted">
              {form.name} · {attempts.length} {id ? 'peserta' : 'candidates'} · {attempts.filter((a) => a.status === 'in_progress').length} {id ? 'sedang mengerjakan' : 'in progress'} · {id ? 'diperbarui otomatis setiap 30 detik' : 'refreshes every 30 seconds'}
            </p>
            {attempts.length === 0 && <Card><p className="text-muted">{id ? 'Belum ada peserta yang mulai.' : 'No one has started yet.'}</p></Card>}
            <ul className="flex flex-col gap-3">
              {attempts.map((a) => {
                const ig = (a.integrity ?? {}) as Integrity
                const flags = (ig.tabHidden ?? 0) + (ig.pastes ?? 0) + (ig.fullscreenExits ?? 0)
                const incidents = (a.incidents ?? []) as Incident[]
                const answered = Object.keys((a.responses ?? {}) as object).length
                const total = ((a.itemOrder ?? []) as number[]).length
                const left = Math.max(0, new Date(a.deadline).getTime() - now)
                const candidate = typeof a.candidate === 'object' ? a.candidate : null
                return (
                  <li key={a.id} className={`rounded-2xl border bg-white p-4 ${flags >= 3 || incidents.length ? 'border-danger/40' : 'border-line'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{candidate?.name ?? `#${a.id}`}</p>
                        <p className="text-sm text-muted">
                          {statusLabel[a.status] ?? a.status} · {id ? 'mulai' : 'started'} {time(a.startedAt)}
                          {a.status === 'in_progress' && ` · ${Math.ceil(left / 60000)} ${id ? 'menit tersisa' : 'min left'}`} · {answered}/{total} {id ? 'dijawab' : 'answered'}
                        </p>
                      </div>
                      <p className="text-sm tabular-nums">
                        <span title={id ? 'Berpindah tab' : 'Tab switches'}>🗂 {ig.tabHidden ?? 0}</span>{' · '}
                        <span title={id ? 'Menempel teks' : 'Pastes'}>📋 {ig.pastes ?? 0}</span>{' · '}
                        <span title={id ? 'Keluar layar penuh' : 'Left full screen'}>⛶ {ig.fullscreenExits ?? 0}</span>
                      </p>
                    </div>
                    {incidents.length > 0 && (
                      <ul className="mt-2 text-sm">
                        {incidents.map((inc, n) => <li key={n} className="text-danger">{time(inc.at)} · {incidentLabel(inc.type, locale)}{inc.note ? ` — ${inc.note}` : ''}</li>)}
                      </ul>
                    )}
                    <div className="mt-2"><IncidentForm attemptId={a.id} locale={locale} /></div>
                  </li>
                )
              })}
            </ul>
            <p className="text-xs text-muted">{id ? '🗂 berpindah tab · 📋 menempel teks · ⛶ keluar layar penuh. Angka ini adalah sinyal, bukan bukti; gunakan bersama pengamatan langsung.' : '🗂 tab switches · 📋 pastes · ⛶ left full screen. These are signals, not proof; use them alongside what you observe.'}</p>
          </>
        )}
      </div>
    </Shell>
  )
}
