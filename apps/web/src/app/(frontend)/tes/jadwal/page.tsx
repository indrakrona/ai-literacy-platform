import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Where } from 'payload'
import { Shell } from '../../../../components/Shell'
import { Card, Notice } from '../../../../components/ui'
import { BookingAction, BookSeat } from '../../../../components/forms/BookingForms'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../lib/session'
import { HOLDS_SEAT, PROBLEM_TEXT, seatsTaken } from '../../../../lib/booking'
import { formatIdr } from '../../../../lib/payments'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

/** Candidates see upcoming AILIS sessions for their school (and open ones), book a seat and manage bookings (spec A4). */
export default async function TestSchedulePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const school = idOf(user.school)
  const now = new Date()
  const fmt = (d: string) => new Date(d).toLocaleString(id ? 'id-ID' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', timeZoneName: 'short' })

  const mine = (
    await payload.find({ collection: 'bookings', overrideAccess: true, depth: 1, limit: 50, sort: '-createdAt', where: { and: [{ candidate: { equals: user.id } }, { status: { in: [...HOLDS_SEAT] } }] } })
  ).docs
  const booked = new Set(mine.map((b) => idOf(b.session)))

  const scope: Where = school ? { or: [{ school: { exists: false } }, { school: { equals: school } }] } : { school: { exists: false } }
  const sessions = (
    await payload.find({ collection: 'test-sessions', overrideAccess: true, depth: 0, limit: 50, sort: 'startsAt', where: { and: [{ status: { equals: 'open' } }, { startsAt: { greater_than: now.toISOString() } }, scope] } })
  ).docs.filter((s) => !booked.has(s.id))
  const taken = await Promise.all(sessions.map((s) => seatsTaken(payload, s.id)))
  const problems = Object.fromEntries(Object.entries(PROBLEM_TEXT).map(([k, v]) => [k, v[locale]]))
  const statusText: Record<string, string> = id
    ? { booked: 'Terdaftar', awaiting_payment: 'Menunggu konfirmasi pembayaran', attended: 'Sudah mengikuti' }
    : { booked: 'Booked', awaiting_payment: 'Awaiting payment confirmation', attended: 'Attended' }

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">{id ? 'Jadwal Tes AILIS' : 'AILIS test dates'}</h1>
          <p className="mt-1 text-muted">
            {id ? 'Daftar ke salah satu sesi. Pada hari tes, pengawas memberikan kode untuk memulai.' : 'Book a seat on a session. On the day, the proctor gives you the code to start.'}{' '}
            <Link href="/tes" className="underline">{id ? 'Sudah punya kode?' : 'Have a code already?'}</Link>
          </p>
        </div>

        {mine.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{id ? 'Pendaftaran saya' : 'My bookings'}</h2>
            {mine.map((b) => {
              const s = typeof b.session === 'object' ? b.session : null
              if (!s) return null
              const upcoming = new Date(s.startsAt) > now
              return (
                <Card key={b.id}>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted">{fmt(s.startsAt)}{s.location ? ` · ${s.location}` : ''}</p>
                  <p className="mt-2 text-sm font-medium">
                    {statusText[b.status] ?? b.status}
                    {b.status === 'awaiting_payment' ? ` · ${formatIdr(b.priceIdr ?? 0)}` : ''}
                  </p>
                  {b.status === 'awaiting_payment' && (
                    <p className="mt-1 text-sm text-muted">
                      {id
                        ? 'Kursimu sudah disimpan. Pembayaran dikonfirmasi oleh sekolah atau tim AI Literacy; setelah itu kamu bisa mengikuti tes.'
                        : 'Your seat is held. Payment is confirmed by your school or the AI Literacy team; after that you can sit the test.'}
                    </p>
                  )}
                  {upcoming && b.status !== 'attended' && (
                    <div className="mt-3">
                      <BookingAction bookingId={b.id} action="cancel" locale={locale} />
                    </div>
                  )}
                </Card>
              )
            })}
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{id ? 'Sesi yang akan datang' : 'Upcoming sessions'}</h2>
          {sessions.length === 0 && <Notice title={id ? 'Belum ada sesi terbuka' : 'No open sessions yet'}>{id ? 'Sekolahmu akan mengumumkan jadwal tes.' : 'Your school will announce test dates.'}</Notice>}
          {sessions.map((s, i) => {
            const left = Math.max(0, s.seats - (taken[i] ?? 0))
            const price = s.priceIdr ?? 0
            return (
              <Card key={s.id}>
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm text-muted">{fmt(s.startsAt)}{s.location ? ` · ${s.location}` : ''}</p>
                <p className="mt-1 text-sm">{left > 0 ? (id ? `${left} kursi tersisa` : `${left} seats left`) : id ? 'Penuh' : 'Full'}</p>
                {left > 0 && (
                  <div className="mt-3">
                    <BookSeat sessionId={s.id} locale={locale} problems={problems} priceLabel={price === 0 ? (id ? 'Gratis' : 'Free') : formatIdr(price)} />
                  </div>
                )}
              </Card>
            )
          })}
        </section>
      </div>
    </Shell>
  )
}
