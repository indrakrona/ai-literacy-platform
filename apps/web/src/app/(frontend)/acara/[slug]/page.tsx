import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '../../../../components/Shell'
import { Card, Notice } from '../../../../components/ui'
import { JudgeForm } from '../../../../components/forms/EngagementForms'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../lib/session'
import { eventResults } from '../../../../collections/Engagement'
import { EVENT_STATUS, EVENT_TYPE, shownName } from '../../../../lib/engagement'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const user = await getCurrentUser()
  const ev = (await payload.find({ collection: 'events', overrideAccess: true, depth: 0, locale, fallbackLocale: 'id', limit: 1, where: { slug: { equals: (await params).slug } } })).docs[0]
  if (!ev) notFound()
  const entries = (await payload.find({ collection: 'submissions', overrideAccess: true, depth: 0, pagination: false, limit: 0, where: { event: { equals: ev.id } } })).docs
  const memberIds = [...new Set(entries.flatMap((s) => (s.members ?? []).map(idOf)))].filter(Boolean) as number[]
  const people = new Map((memberIds.length ? (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: memberIds.length, where: { id: { in: memberIds } } })).docs : []).map((u) => [u.id, u]))
  const briefs = new Map((await payload.find({ collection: 'project-briefs', overrideAccess: true, depth: 0, locale, limit: 200, where: { id: { in: [...new Set(entries.map((s) => idOf(s.brief)))] as number[] } } })).docs.map((b) => [b.id, b.title]))
  const label = (s: (typeof entries)[number]) => `${briefs.get(idOf(s.brief)!) ?? ''} · ${(s.members ?? []).map((m) => (people.get(idOf(m)!) ? shownName(people.get(idOf(m)!)!) : '')).filter(Boolean).join(', ')}`
  const criteria = (ev.criteria ?? []).map((c) => ({ name: c.name, max: c.max ?? 5 }))
  const isJudge = Boolean(user && (ev.judges ?? []).map(idOf).includes(user.id))
  const results = ev.status === 'closed' ? eventResults(entries, criteria.map((c) => c.max)) : []
  const crowd = ev.status === 'closed' ? [...entries].filter((e) => e.showcase === 'published').sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))[0] : undefined
  const byId = new Map(entries.map((e) => [e.id, e]))
  const fmt = (d: string) => new Date(d).toLocaleDateString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-4">
        <Link href="/acara" className="text-sm underline">{id ? '← Semua acara' : '← All events'}</Link>
        <Card>
          <p className="text-xs font-semibold tracking-wide text-brand-deep uppercase">{EVENT_TYPE[ev.type]?.[locale]} · {EVENT_STATUS[ev.status]?.[locale]}</p>
          <h1 className="mt-1 text-2xl font-bold">{ev.title}</h1>
          <p className="text-sm text-muted">{fmt(ev.startsAt)} – {fmt(ev.endsAt)}</p>
          {ev.description && <p className="mt-3 whitespace-pre-line">{ev.description}</p>}
          <h2 className="mt-4 text-sm font-semibold">{id ? 'Kriteria penilaian' : 'Judging criteria'}</h2>
          <ul className="mt-1 list-disc pl-5 text-sm">{criteria.map((c) => <li key={c.name}>{c.name} (0–{c.max})</li>)}</ul>
          {ev.status === 'open' && <p className="mt-3 text-sm">{id ? 'Ikutkan proyekmu dari halaman kiriman proyek (Proyek › kirimanmu).' : 'Enter your project from its submission page (Projects › your submission).'}</p>}
        </Card>

        {ev.status === 'closed' && (
          <Card>
            <h2 className="text-lg font-semibold">{id ? 'Hasil penjurian' : 'Judging results'}</h2>
            {results.length === 0 ? <p className="mt-1 text-sm text-muted">{id ? 'Belum ada peserta.' : 'No entries.'}</p> : (
              <ol className="mt-3 flex flex-col gap-2">
                {results.map((r, i) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                    <span className="w-6 text-center font-bold">{i + 1}</span>
                    <span className="flex-1">{label(byId.get(r.id)!)}</span>
                    <span className="tabular-nums">{r.average ?? '—'} / {r.max}</span>
                  </li>
                ))}
              </ol>
            )}
            {crowd && (crowd.votes ?? 0) > 0 && <p className="mt-4 text-sm">{id ? 'Pilihan penonton' : 'Audience favourite'}: <Link href={`/galeri/${crowd.id}`} className="font-semibold underline">{label(crowd)}</Link> · ♥ {crowd.votes}</p>}
          </Card>
        )}

        {isJudge && ev.status === 'judging' && (
          <Card>
            <h2 className="text-lg font-semibold">{id ? `Penjurian (${entries.length} peserta)` : `Judging (${entries.length} entries)`}</h2>
            <ul className="mt-3 flex flex-col gap-5">
              {entries.map((s) => (
                <li key={s.id} className="border-t border-line pt-3">
                  <p className="font-medium">{briefs.get(idOf(s.brief)!)}</p>
                  <p className="mt-1 line-clamp-6 text-sm whitespace-pre-line">{s.text}</p>
                  {(s.links ?? []).map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="block text-sm break-all underline">{l.url}</a>)}
                  <div className="mt-2"><JudgeForm eventId={ev.id} submissionId={s.id} criteria={criteria} current={((s.judgeScores ?? {}) as Record<string, { scores: number[]; comment?: string }>)[String(user!.id)]} locale={locale} /></div>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {ev.status !== 'closed' && !isJudge && <Notice title={id ? `${entries.length} proyek sudah ikut` : `${entries.length} projects entered`} />}
      </div>
    </Shell>
  )
}
