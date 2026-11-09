import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Where } from 'payload'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { getDict } from '../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../lib/session'
import { SMK_MAJORS } from '../../../collections/ProjectBriefs'

export default async function ProjectsIndex({ searchParams }: { searchParams: Promise<{ jenjang?: string; jurusan?: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { jenjang, jurusan } = await searchParams
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const and: Where[] = [
    ...(jenjang === 'smp' || jenjang === 'sma_smk' ? [{ level: { equals: jenjang } }] : []),
    ...(jurusan ? [{ smkMajor: { equals: jurusan } }] : []),
  ]
  const briefs = await payload.find({ collection: 'project-briefs', locale, user, overrideAccess: false, limit: 100, sort: 'title', where: and.length ? { and } : {} })
  const general = briefs.docs.filter((b) => !b.smkMajor)
  const smk = briefs.docs.filter((b) => b.smkMajor)
  const chip = (href: string, label: string, active: boolean) => (
    <Link key={href} href={href} className={`rounded-full border px-3 py-1 text-sm ${active ? 'border-ink bg-ink text-paper' : 'border-line'}`}>{label}</Link>
  )
  const List = ({ docs }: { docs: typeof briefs.docs }) => (
    <ul className="mt-3 divide-y divide-line">
      {docs.map((b) => (
        <li key={b.id} className="py-3">
          <Link href={`/proyek/${b.slug}`} className="font-medium underline">{b.title}</Link>
          <p className="text-sm text-muted">
            {b.level === 'smp' ? 'SMP' : 'SMA/SMK'} · {b.competency}
            {b.smkMajor ? ` · ${SMK_MAJORS.find((m) => m.value === b.smkMajor)?.label ?? b.smkMajor}` : ''}
          </p>
        </li>
      ))}
    </ul>
  )
  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-bold">{id ? 'Proyek nyata' : 'Real-world projects'}</h1>
        <div className="flex flex-wrap gap-2">
          {chip('/proyek', id ? 'Semua' : 'All', !jenjang && !jurusan)}
          {chip('/proyek?jenjang=smp', 'SMP', jenjang === 'smp')}
          {chip('/proyek?jenjang=sma_smk', 'SMA/SMK', jenjang === 'sma_smk' && !jurusan)}
        </div>
        {general.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold">{id ? 'Proyek umum' : 'General projects'}</h2>
            <List docs={general} />
          </Card>
        )}
        {(smk.length > 0 || jurusan) && (
          <Card>
            <h2 className="text-lg font-semibold">{id ? 'Proyek sesuai jurusan SMK' : 'SMK projects by major'}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {SMK_MAJORS.map((m) => chip(`/proyek?jenjang=sma_smk&jurusan=${m.value}`, m.label, jurusan === m.value))}
            </div>
            <List docs={smk} />
          </Card>
        )}
        {briefs.docs.length === 0 && <p className="text-muted">{id ? 'Belum ada proyek.' : 'No projects yet.'}</p>}
      </div>
    </Shell>
  )
}
