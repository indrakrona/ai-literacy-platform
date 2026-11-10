import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../components/Shell'
import { Card, Notice } from '../../../../components/ui'
import { AccommodationForm, RemoveAccommodation } from '../../../../components/forms/AccommodationForms'
import { BookingAction, CreateSessionForm, SessionStatusToggle, VoucherBatchForm } from '../../../../components/forms/BookingForms'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../lib/session'
import { HOLDS_SEAT, voucherUses } from '../../../../lib/booking'
import { formatIdr } from '../../../../lib/payments'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

/** School admin: AILIS sessions with who booked, seats held for payment, and voucher batches (spec A4). */
export default async function SchoolTestsPage({ searchParams }: { searchParams: Promise<{ sekolah?: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!hasRole(user, 'school_admin', 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const requested = Number((await searchParams).sekolah) || undefined
  const schoolId = hasRole(user, 'super_admin') ? (requested ?? idOf(user.school)) : idOf(user.school)
  if (!schoolId) return <Shell><Notice tone="warn" title={id ? 'Akun belum terhubung ke sekolah' : 'Account not linked to a school'} /></Shell>

  const fmt = (d: string) => new Date(d).toLocaleString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', timeZoneName: 'short' })
  const forms = (
    await payload.find({ collection: 'test-forms', overrideAccess: true, depth: 0, limit: 100, sort: '-createdAt', where: { and: [{ status: { not_equals: 'closed' } }, { or: [{ school: { exists: false } }, { school: { equals: schoolId } }] }] } })
  ).docs.map((f) => ({ id: f.id, name: f.name }))
  const sessions = (await payload.find({ collection: 'test-sessions', overrideAccess: true, depth: 0, limit: 50, sort: '-startsAt', where: { school: { equals: schoolId } } })).docs
  const bookings = sessions.length
    ? (await payload.find({ collection: 'bookings', overrideAccess: true, depth: 1, limit: 2000, sort: 'createdAt', where: { and: [{ session: { in: sessions.map((s) => s.id) } }, { status: { in: [...HOLDS_SEAT] } }] } })).docs
    : []
  const students = (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 2000, sort: 'name', where: { and: [{ school: { equals: schoolId } }, { roles: { in: ['student', 'candidate'] } }] } })).docs.map((u) => ({ id: u.id, name: u.name }))
  const studentName = new Map(students.map((s) => [s.id, s.name]))
  const accs = (await payload.find({ collection: 'accommodations', overrideAccess: true, depth: 0, limit: 500, where: { school: { equals: schoolId } } })).docs
  const vouchers = (await payload.find({ collection: 'vouchers', overrideAccess: true, depth: 0, limit: 500, sort: '-createdAt', where: { school: { equals: schoolId } } })).docs
  const uses = await Promise.all(vouchers.map((v) => voucherUses(payload, v.id)))
  const batches = new Map<string, { codes: number; used: number; capacity: number; pct: number; expiresAt?: string | null }>()
  vouchers.forEach((v, i) => {
    const b = batches.get(v.batch) ?? { codes: 0, used: 0, capacity: 0, pct: v.discountPercent, expiresAt: v.expiresAt }
    b.codes += 1
    b.used += uses[i] ?? 0
    b.capacity += v.maxUses ?? 1
    batches.set(v.batch, b)
  })
  const statusText: Record<string, string> = id
    ? { booked: 'terdaftar', awaiting_payment: 'menunggu pembayaran', attended: 'hadir' }
    : { booked: 'booked', awaiting_payment: 'awaiting payment', attended: 'attended' }

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/sekolah" className="text-sm underline">{id ? '← Ruang Sekolah' : '← School space'}</Link>
          <h1 className="mt-1 text-3xl font-bold">{id ? 'Tes AILIS: jadwal dan voucher' : 'AILIS tests: dates and vouchers'}</h1>
          <p className="mt-1 text-muted">
            {id
              ? 'Setelah sebuah formulir tes punya sesi, siswa harus terdaftar (dan pembayarannya dikonfirmasi bila berbayar) untuk memulai tes.'
              : 'Once a test form has sessions, students need a booking (with payment confirmed, if there is a fee) to start it.'}
          </p>
        </div>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">{id ? 'Jadwalkan sesi' : 'Schedule a session'}</h2>
          <CreateSessionForm forms={forms} locale={locale} />
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{id ? 'Sesi tes' : 'Test sessions'}</h2>
          {sessions.length === 0 && <Notice title={id ? 'Belum ada sesi' : 'No sessions yet'} />}
          {sessions.map((s) => {
            const list = bookings.filter((b) => idOf(b.session) === s.id)
            return (
              <Card key={s.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted">{list.length}/{s.seats} {id ? 'kursi' : 'seats'} · {s.status === 'open' ? (id ? 'terbuka' : 'open') : id ? 'ditutup' : 'closed'}</p>
                </div>
                <p className="text-sm text-muted">{fmt(s.startsAt)}{s.location ? ` · ${s.location}` : ''} · {(s.priceIdr ?? 0) === 0 ? (id ? 'gratis' : 'free') : formatIdr(s.priceIdr ?? 0)}</p>
                <div className="mt-1"><SessionStatusToggle sessionId={s.id} open={s.status === 'open'} locale={locale} /></div>
                {list.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted">
                          <th className="py-1 pr-3 font-medium">{id ? 'Siswa' : 'Student'}</th>
                          <th className="py-1 pr-3 font-medium">Status</th>
                          <th className="py-1 pr-3 font-medium">{id ? 'Biaya' : 'Fee'}</th>
                          <th className="py-1 font-medium"><span className="sr-only">{id ? 'Tindakan' : 'Actions'}</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((b) => (
                          <tr key={b.id} className="border-t border-line">
                            <td className="py-1.5 pr-3">{typeof b.candidate === 'object' ? b.candidate.name : '—'}</td>
                            <td className="py-1.5 pr-3">{statusText[b.status] ?? b.status}</td>
                            <td className="py-1.5 pr-3">{formatIdr(b.priceIdr ?? 0)}</td>
                            <td className="py-1.5 text-right whitespace-nowrap">
                              {b.status === 'awaiting_payment' && <BookingAction bookingId={b.id} action="confirm" locale={locale} />}{' '}
                              {b.status !== 'attended' && <BookingAction bookingId={b.id} action="cancel" locale={locale} />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )
          })}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{id ? 'Akomodasi tes' : 'Test accommodations'}</h2>
          <Card>
            <p className="mb-4 text-sm text-muted">
              {id
                ? 'Untuk siswa yang membutuhkan waktu tambahan atau tampilan khusus. Berlaku otomatis saat siswa memulai tes; pengawas melihatnya di layar pengawasan.'
                : 'For students who need extra time or a special display. Applied automatically when the student starts a test; proctors see it on their screen.'}
            </p>
            <AccommodationForm students={students} existing={accs.map((x) => ({ id: x.id, candidate: idOf(x.candidate)!, extraTimePercent: String(x.extraTimePercent ?? '0'), largeText: Boolean(x.largeText), highContrast: Boolean(x.highContrast), screenReader: Boolean(x.screenReader), validUntil: x.validUntil }))} locale={locale} />
            {accs.length > 0 && (
              <ul className="mt-5 divide-y divide-line text-sm">
                {accs.map((x) => (
                  <li key={x.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                    <span>
                      <span className="font-medium">{studentName.get(idOf(x.candidate)!) ?? '—'}</span>
                      <span className="text-muted"> · {[Number(x.extraTimePercent) ? `+${x.extraTimePercent}%` : '', x.largeText ? (id ? 'teks besar' : 'large text') : '', x.highContrast ? (id ? 'kontras tinggi' : 'high contrast') : '', x.screenReader ? (id ? 'pembaca layar' : 'screen reader') : ''].filter(Boolean).join(', ') || '—'}{x.validUntil ? ` · ${id ? 's.d.' : 'until'} ${new Date(x.validUntil).toLocaleDateString(id ? 'id-ID' : 'en-GB')}` : ''}</span>
                    </span>
                    <RemoveAccommodation accId={x.id} locale={locale} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{id ? 'Voucher' : 'Vouchers'}</h2>
          <Card>
            <p className="mb-4 text-sm text-muted">
              {id
                ? 'Voucher memotong biaya tes (100% = gratis). Bagikan kodenya ke siswa; mereka memasukkannya saat mendaftar.'
                : 'Vouchers reduce the test fee (100% = free). Give the codes to students; they enter one when booking.'}
            </p>
            <VoucherBatchForm locale={locale} />
          </Card>
          {batches.size > 0 && (
            <Card>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="py-1 pr-3 font-medium">Batch</th>
                    <th className="py-1 pr-3 font-medium">{id ? 'Kode' : 'Codes'}</th>
                    <th className="py-1 pr-3 font-medium">{id ? 'Terpakai' : 'Used'}</th>
                    <th className="py-1 pr-3 font-medium">{id ? 'Potongan' : 'Discount'}</th>
                    <th className="py-1 font-medium">{id ? 'Berlaku sampai' : 'Valid until'}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...batches.entries()].map(([name, b]) => (
                    <tr key={name} className="border-t border-line">
                      <td className="py-1.5 pr-3">{name}</td>
                      <td className="py-1.5 pr-3">{b.codes}</td>
                      <td className="py-1.5 pr-3">{b.used}/{b.capacity}</td>
                      <td className="py-1.5 pr-3">{b.pct}%</td>
                      <td className="py-1.5">{b.expiresAt ? new Date(b.expiresAt).toLocaleDateString(id ? 'id-ID' : 'en-GB') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted">
                <a href="/admin/collections/vouchers" className="underline">{id ? 'Lihat semua kode di panel admin' : 'See every code in the admin panel'}</a>
              </p>
            </Card>
          )}
        </section>
      </div>
    </Shell>
  )
}
