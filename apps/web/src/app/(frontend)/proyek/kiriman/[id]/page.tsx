import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Shell } from '../../../../../components/Shell'
import { Card, Notice } from '../../../../../components/ui'
import { EnterEvent, HideReview, NominateButton, ShowcaseConsent } from '../../../../../components/forms/EngagementForms'
import { getDict } from '../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../lib/session'
import { PEER_RUBRIC, showcaseStatus } from '../../../../../lib/engagement'
import { rubricTotal } from '../../../../../lib/projects'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

/** One submission: marks, classmates' reviews, gallery consent and event entry (members); nominate and moderate (teacher). */
export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const sub = await payload.findByID({ collection: 'submissions', id: Number((await params).id), depth: 0, overrideAccess: false, user }).catch(() => null)
  if (!sub) notFound()
  const members = (sub.members ?? []).map(idOf) as number[]
  const isMember = members.includes(user.id)
  const isTeacher = !isMember
  const brief = await payload.findByID({ collection: 'project-briefs', id: idOf(sub.brief)!, depth: 0, locale, overrideAccess: true }).catch(() => null)
  const total = sub.status === 'graded' ? rubricTotal(sub.scores) : null
  const reviews = (await payload.find({ collection: 'peer-reviews', overrideAccess: true, depth: 1, limit: 50, sort: '-createdAt', where: { submission: { equals: sub.id } } })).docs.filter((r) => isTeacher || !r.hidden)
  const sc = await showcaseStatus(payload, sub)
  const agreedMe = (sub.showcaseAgreed ?? []).map(idOf).includes(user.id)
  const events = isMember ? (await payload.find({ collection: 'events', overrideAccess: true, depth: 0, locale, limit: 10, where: { status: { equals: 'open' } } })).docs : []
  const entered = sub.event ? await payload.findByID({ collection: 'events', id: idOf(sub.event)!, depth: 0, locale, overrideAccess: true }).catch(() => null) : null
  const stateText: Record<string, string> = id
    ? { ok: 'setuju', needs_member: 'belum setuju', needs_parent: 'menunggu izin orang tua' }
    : { ok: 'agreed', needs_member: 'not yet agreed', needs_parent: 'waiting for a parent' }
  const avg = (k: string) => (reviews.length ? Math.round((reviews.reduce((a, r) => a + Number((r.ratings as Record<string, number>)[k] ?? 0), 0) / reviews.length) * 10) / 10 : null)

  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <Link href={brief ? `/proyek/${brief.slug}` : '/proyek'} className="text-sm underline">← {brief?.title ?? (id ? 'Proyek' : 'Projects')}</Link>
        <Card>
          <h1 className="text-2xl font-bold">{brief?.title}</h1>
          <p className="mt-3 whitespace-pre-line">{sub.text}</p>
          {(sub.links ?? []).map((l) => <a key={l.id ?? l.url} href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 block text-sm break-all underline">{l.url}</a>)}
          {total && <p className="mt-4 font-semibold">{id ? 'Nilai' : 'Mark'}: {total.total}/{total.max}</p>}
          {sub.feedback && <p className="mt-1 text-sm text-muted">{sub.feedback}</p>}
        </Card>

        <Card>
          <h2 className="font-semibold">{id ? 'Galeri' : 'Gallery'}</h2>
          {sub.showcase === 'published' ? (
            <p className="mt-1 text-sm">{id ? 'Proyek ini tampil di ' : 'This project is in the '}<Link className="underline" href={`/galeri/${sub.id}`}>{id ? 'galeri' : 'gallery'}</Link> · ♥ {sub.votes ?? 0}</p>
          ) : sub.showcase === 'nominated' ? (
            <div className="mt-1 text-sm">
              <p>{id ? 'Dipilih guru untuk galeri. Tampil setelah semua setuju:' : 'Picked by the teacher. It appears once everyone agrees:'}</p>
              <ul className="mt-1 list-disc pl-5">{sc.members.map((m) => <li key={m.id}>{m.name.split(' ')[0]}: {stateText[m.state]}</li>)}</ul>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted">{id ? 'Belum dipilih untuk galeri.' : 'Not nominated for the gallery.'}</p>
          )}
          <div className="mt-3">
            {isMember && (sub.showcase === 'nominated' || sub.showcase === 'published') && <ShowcaseConsent submissionId={sub.id} agreed={agreedMe} published={sub.showcase === 'published'} locale={locale} />}
            {isTeacher && sub.status === 'graded' && (!sub.showcase || sub.showcase === 'none') && <NominateButton submissionId={sub.id} locale={locale} />}
          </div>
        </Card>

        {isMember && (
          <Card>
            <h2 className="font-semibold">{id ? 'Acara' : 'Events'}</h2>
            {entered ? <p className="mt-1 text-sm">{id ? 'Diikutkan di ' : 'Entered in '}<Link href={`/acara/${entered.slug}`} className="underline">{entered.title}</Link></p> : events.length ? (
              <div className="mt-2 flex flex-col gap-3">
                {events.map((e) => (
                  <div key={e.id}>
                    <p className="text-sm font-medium"><Link href={`/acara/${e.slug}`} className="underline">{e.title}</Link></p>
                    <div className="mt-1"><EnterEvent eventId={e.id} projects={[{ id: sub.id, label: brief?.title ?? `#${sub.id}` }]} locale={locale} /></div>
                  </div>
                ))}
              </div>
            ) : <p className="mt-1 text-sm text-muted">{id ? 'Tidak ada acara yang sedang menerima peserta.' : 'No events are taking entries right now.'}</p>}
          </Card>
        )}

        <Card>
          <h2 className="font-semibold">{id ? `Ulasan teman sekelas (${reviews.length})` : `Classmates’ reviews (${reviews.length})`}</h2>
          {reviews.length === 0 ? <p className="mt-1 text-sm text-muted">{id ? 'Belum ada ulasan.' : 'No reviews yet.'}</p> : (
            <>
              <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-3">
                {PEER_RUBRIC.map((c) => <div key={c.key} className="rounded-xl bg-paper p-2"><dt className="text-muted">{c[locale]}</dt><dd className="font-semibold">{avg(c.key)} / 3</dd></div>)}
              </dl>
              <ul className="mt-3 flex flex-col gap-3">
                {reviews.map((r) => (
                  <li key={r.id} className={`rounded-xl border p-3 text-sm ${r.hidden ? 'border-dashed opacity-60' : 'border-line'}`}>
                    {isTeacher && <p className="mb-1 text-xs text-muted">{typeof r.reviewer === 'object' ? r.reviewer.name : ''}{r.hidden ? (id ? ' · disembunyikan' : ' · hidden') : ''} · <HideReview reviewId={r.id} hidden={Boolean(r.hidden)} locale={locale} /></p>}
                    <p><span className="font-semibold">👍 </span>{r.praise}</p>
                    <p className="mt-1"><span className="font-semibold">💡 </span>{r.suggestion}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
          {isMember && <Notice title={id ? 'Mau memberi ulasan juga?' : 'Want to review too?'}><Link className="underline" href="/proyek/ulasan">{id ? 'Ulas proyek teman sekelas' : 'Review a classmate’s project'}</Link></Notice>}
        </Card>
      </div>
    </Shell>
  )
}
