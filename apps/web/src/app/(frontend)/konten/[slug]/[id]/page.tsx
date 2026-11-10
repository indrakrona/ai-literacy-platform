import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../../components/Shell'
import { Card, Notice } from '../../../../../components/ui'
import { WorkflowActions } from '../../../../../components/forms/WorkflowActions'
import { getDict } from '../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../lib/session'
import { CONTENT_TYPES, isContentSlug, loadBoth, plain, rowsOf, translationStatus, type Spec } from '../../../../../lib/content-review'
import { isAuthor, isReviewer, WORKFLOW_LABELS, type WorkflowState } from '../../../../../lib/workflow'

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === 'object' ? (v as { id: number }).id : (v as number))

/** One item: Bahasa and English side by side, translation gaps, preview, review history and next steps. */
export default async function ContentItem({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!isAuthor(user as never)) notFound()
  const { slug, id: rawId } = await params
  if (!isContentSlug(slug)) notFound()
  const { locale } = await getDict()
  const t = locale === 'id'
  const payload = await getPayloadClient()
  const type = CONTENT_TYPES[slug]
  const { idDoc, enDoc } = await loadBoth(payload, slug, Number(rawId))
  if (!idDoc || !enDoc) notFound()
  const state = ((idDoc.reviewState as WorkflowState) ?? 'draft') as WorkflowState
  const tr = translationStatus(type.fields, idDoc, enDoc)
  const history = ((idDoc.reviewHistory as { action: string; by?: unknown; note?: string; at: string }[] | null) ?? []).slice().reverse()
  const people = new Map(
    (await payload.find({ collection: 'users', overrideAccess: true, depth: 0, limit: 50, where: { id: { in: [...new Set(history.map((h) => idOf(h.by)).filter(Boolean))] as number[] } } })).docs.map((u) => [u.id, u.name]),
  )
  const fmt = (d: string) => new Date(d).toLocaleString(t ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })

  // Where to see it as students will (drafts are shown to content staff on these pages).
  let preview: string | null = null
  if (slug === 'lessons') {
    const unit = await payload.findByID({ collection: 'units', id: idOf(idDoc.unit)!, depth: 1, overrideAccess: true }).catch(() => null)
    const track = unit && typeof unit.track === 'object' ? unit.track : null
    if (track) preview = `/belajar/${track.slug}/${idDoc.order}`
  } else if (slug === 'ai-activities') preview = `/lab/${idDoc.slug}`
  else if (slug === 'project-briefs') preview = `/proyek/${idDoc.slug}`
  else if (slug === 'pages') preview = idDoc.slug === 'home' ? '/' : `/${idDoc.slug}`

  const actions: ('submit' | 'approve' | 'request_changes' | 'publish')[] = []
  if (['draft', 'changes_requested'].includes(state)) actions.push('submit')
  if (state === 'in_review' && isReviewer(user as never) && (idOf(idDoc.submittedBy) !== user.id || hasRole(user, 'super_admin'))) actions.push('approve', 'request_changes')
  if (state === 'approved' && type.drafts && isReviewer(user as never) && idDoc._status !== 'published') actions.push('publish')
  const ownSubmission = state === 'in_review' && idOf(idDoc.submittedBy) === user.id && !hasRole(user, 'super_admin')

  const cell = (spec: Spec, value: unknown, missing: boolean) =>
    spec.kind === 'rich' && value && typeof value === 'object' ? (
      <div className="prose-sm max-w-none [&_p]:my-1.5">
        <RichText data={value as never} />
      </div>
    ) : (
      <p className={`whitespace-pre-line ${missing ? 'rounded bg-brand/10 px-1' : ''}`}>{plain(value) || <span className="text-muted">—</span>}</p>
    )

  const actionLabel: Record<string, string> = t
    ? { submit: 'dikirim untuk telaah', approve: 'disetujui', request_changes: 'perbaikan diminta', publish: 'diterbitkan' }
    : { submit: 'submitted for review', approve: 'approved', request_changes: 'changes requested', publish: 'published' }

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-5">
        <div>
          <Link href={`/konten?status=${state}`} className="text-sm underline">{t ? '← Ruang telaah' : '← Content review'}</Link>
          <p className="mt-2 text-xs font-semibold tracking-wide text-muted uppercase">{type.label[locale]}</p>
          <h1 className="text-2xl font-bold">{String(idDoc[type.title] ?? '')}</h1>
          <p className="mt-1 text-sm">
            <span className="rounded-full border border-line bg-white px-2.5 py-0.5 font-semibold">{WORKFLOW_LABELS[state][locale]}</span>
            {type.drafts && <span className="ml-2 text-muted">{idDoc._status === 'published' ? (t ? 'Versi terbit tersedia' : 'A version is live') : t ? 'Belum terbit' : 'Not live yet'}</span>}
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <a href={`/admin/collections/${slug}/${rawId}`} className="font-semibold underline">{t ? 'Ubah di panel admin' : 'Edit in the admin panel'}</a>
            {preview && <a href={preview} className="font-semibold underline">{t ? 'Pratinjau seperti siswa' : 'Preview as students see it'}</a>}
          </div>
        </div>

        <Card>
          <h2 className="font-semibold">{t ? 'Langkah berikutnya' : 'Next step'}</h2>
          {ownSubmission && <p className="mt-1 text-sm text-muted">{t ? 'Anda yang mengirim ini; penelaah lain yang harus menyetujuinya.' : 'You submitted this; another reviewer must approve it.'}</p>}
          {actions.length ? <div className="mt-3"><WorkflowActions slug={slug} id={Number(rawId)} actions={actions} locale={locale} /></div> : !ownSubmission && <p className="mt-1 text-sm text-muted">{t ? 'Tidak ada langkah untuk Anda saat ini.' : 'Nothing for you to do right now.'}</p>}
        </Card>

        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">{t ? 'Bahasa Indonesia dan English' : 'Bahasa Indonesia and English'}</h2>
            <p className="text-sm">
              {t ? 'Terjemahan' : 'Translation'}: <strong>{tr.percent}%</strong> ({tr.done}/{tr.total})
            </p>
          </div>
          {tr.missing.length > 0 && (
            <div className="mt-3">
              <Notice tone="warn" title={t ? `${tr.missing.length} bagian belum diterjemahkan` : `${tr.missing.length} parts not yet translated`}>
                {t ? 'Bagian bertanda masih kosong atau sama dengan Bahasa Indonesia. Siswa akan melihat teks Bahasa Indonesia di sana.' : 'Highlighted parts are empty or the same as the Bahasa text. Students will see Bahasa there.'}
              </Notice>
            </div>
          )}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="w-36 py-1.5 pr-3 font-medium">{t ? 'Bagian' : 'Part'}</th>
                  <th className="py-1.5 pr-3 font-medium">Bahasa Indonesia</th>
                  <th className="py-1.5 font-medium">English</th>
                </tr>
              </thead>
              <tbody>
                {type.fields.flatMap((spec) => {
                  const a = rowsOf(spec, idDoc)
                  const b = new Map(rowsOf(spec, enDoc).map((r) => [r.key, r.value]))
                  return a.map((r) => (
                    <tr key={r.key} className="border-t border-line align-top">
                      <td className="py-2 pr-3 text-muted">{spec.label[locale]}{spec.kind === 'rows' ? <span className="block text-xs">{r.label}</span> : null}</td>
                      <td className="py-2 pr-3">{cell(spec, r.value, false)}</td>
                      <td className="py-2">{cell(spec, b.get(r.key), tr.missing.includes(r.key))}</td>
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">{t ? 'Riwayat telaah' : 'Review history'}</h2>
          {history.length === 0 ? (
            <p className="mt-1 text-sm text-muted">{t ? 'Belum ada.' : 'None yet.'}</p>
          ) : (
            <ul className="mt-2 text-sm">
              {history.map((h, i) => (
                <li key={i} className="border-b border-line py-2">
                  <span className="font-medium">{people.get(idOf(h.by) ?? -1) ?? '—'}</span> · {actionLabel[h.action] ?? h.action} · <span className="text-muted">{fmt(h.at)}</span>
                  {h.note && <p className="mt-0.5 text-muted">“{h.note}”</p>}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">
            {t ? 'Semua versi tersimpan dan dapat dipulihkan di panel admin (tab Versions).' : 'Every version is kept and can be restored in the admin panel (Versions tab).'}
          </p>
        </Card>
      </div>
    </Shell>
  )
}
