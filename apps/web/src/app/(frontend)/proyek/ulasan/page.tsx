import Link from 'next/link'
import { redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../components/Shell'
import { Card, Notice } from '../../../../components/ui'
import { PeerReviewFlow } from '../../../../components/forms/EngagementForms'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser } from '../../../../lib/session'
import { PEER_RUBRIC } from '../../../../lib/engagement'

/** Peer review (spec F4): review classmates' projects with a mini rubric. */
export default async function PeerReviewPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/masuk')
  const { locale } = await getDict()
  const id = locale === 'id'
  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <Link href="/proyek" className="text-sm underline">{id ? '← Proyek' : '← Projects'}</Link>
        <Card>
          <h1 className="text-2xl font-bold">{id ? 'Ulas proyek teman' : 'Review a classmate’s project'}</h1>
          <p className="mt-1 mb-5 text-muted">{id ? 'Beri masukan yang jujur dan baik. Ulasan membantu temanmu memperbaiki proyeknya.' : 'Give honest, kind feedback. Reviews help classmates improve their projects.'}</p>
          {hasRole(user, 'student') ? <PeerReviewFlow rubric={PEER_RUBRIC.map((c) => ({ key: c.key, label: c[locale] }))} locale={locale} /> : <Notice title={id ? 'Khusus siswa' : 'For students'} />}
        </Card>
      </div>
    </Shell>
  )
}
