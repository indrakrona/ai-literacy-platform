import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { CONTENT_TYPES, reviewQueue } from '../../../lib/content-review'
import { isAuthor, WORKFLOW_LABELS, WORKFLOW_STATES, type WorkflowState } from '../../../lib/workflow'

/** Content review workspace (CMS approval workflow): what is waiting, for whom, in both languages. */
export default async function ContentWorkspace({ searchParams }: { searchParams: Promise<{ status?: string; jenis?: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  if (!isAuthor(user as never)) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const sp = await searchParams
  const state = (WORKFLOW_STATES as readonly string[]).includes(sp.status ?? '') ? (sp.status as WorkflowState) : 'in_review'
  const all = await reviewQueue(await getPayloadClient(), 'all')
  const counts = Object.fromEntries(WORKFLOW_STATES.map((s) => [s, all.filter((x) => x.state === s).length])) as Record<WorkflowState, number>
  const items = all.filter((x) => x.state === state && (!sp.jenis || x.slug === sp.jenis))
  const fmt = (d: string) => new Date(d).toLocaleString(id ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
  const pill = (active: boolean) => `rounded-full border px-3 py-1 text-sm ${active ? 'border-ink bg-ink text-paper' : 'border-line bg-white'}`

  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand-deep uppercase">CMS</p>
          <h1 className="text-3xl font-bold">{id ? 'Ruang telaah konten' : 'Content review'}</h1>
          <p className="mt-1 text-muted">
            {id
              ? 'Editor menulis dan mengirim; penelaah menyetujui atau meminta perbaikan, lalu menerbitkan. Tulis dan ubah konten di '
              : 'Editors write and submit; reviewers approve or request changes, then publish. Write and edit content in the '}
            <a href="/admin" className="underline">{id ? 'panel admin' : 'admin panel'}</a>.
          </p>
        </div>
        <nav aria-label={id ? 'Status' : 'Status'} className="flex flex-wrap gap-2">
          {WORKFLOW_STATES.map((s) => (
            <Link key={s} href={`/konten?status=${s}${sp.jenis ? `&jenis=${sp.jenis}` : ''}`} aria-current={s === state ? 'page' : undefined} className={pill(s === state)}>
              {WORKFLOW_LABELS[s][locale]} ({counts[s]})
            </Link>
          ))}
        </nav>
        <nav aria-label={id ? 'Jenis konten' : 'Content type'} className="flex flex-wrap gap-2">
          <Link href={`/konten?status=${state}`} className={pill(!sp.jenis)}>{id ? 'Semua jenis' : 'All types'}</Link>
          {Object.entries(CONTENT_TYPES).map(([slug, t]) => (
            <Link key={slug} href={`/konten?status=${state}&jenis=${slug}`} className={pill(sp.jenis === slug)}>{t.label[locale]}</Link>
          ))}
        </nav>
        <Card>
          {items.length === 0 ? (
            <p className="text-muted">{id ? 'Tidak ada konten di sini.' : 'Nothing here.'}</p>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((x) => (
                <li key={`${x.slug}-${x.id}`} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                  <span>
                    <span className="mr-2 text-xs font-semibold tracking-wide text-muted uppercase">{CONTENT_TYPES[x.slug].label[locale]}</span>
                    <Link href={`/konten/${x.slug}/${x.id}`} className="font-medium underline">{x.title}</Link>
                  </span>
                  <span className="text-sm text-muted">
                    {x.status === 'published' ? (id ? 'terbit · ' : 'live · ') : x.status === 'draft' ? (id ? 'belum terbit · ' : 'not live · ') : ''}
                    {fmt(x.updatedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Shell>
  )
}
