import { Shell } from '../../../../components/Shell'
import { Card, Notice } from '../../../../components/ui'
import { ConsentForm } from '../../../../components/forms/ConsentForm'
import { getDict } from '../../../../i18n/server'
import { fmt } from '../../../../i18n/dict'
import { getPayloadClient } from '../../../../lib/session'

export const dynamic = 'force-dynamic'

export default async function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { t } = await getDict()
  const payload = await getPayloadClient()
  const found = await payload.find({
    collection: 'consent-requests',
    overrideAccess: true,
    where: { token: { equals: token } },
    depth: 1,
    limit: 1,
  })
  const r = found.docs[0]
  const student = r && typeof r.student === 'object' ? r.student : null
  const expired = r?.status === 'pending' && r.expiresAt && new Date(r.expiresAt) < new Date()

  let body: React.ReactNode
  if (!r || !student) body = <Notice tone="warn" title={t.consent.invalid} />
  else if (expired) body = <Notice tone="warn" title={t.consent.expired} />
  else if (r.status !== 'pending') body = <Notice title={t.consent.already} />
  else
    body = (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">{t.consent.title}</h1>
          <p className="mt-2 text-lg">{fmt(t.consent.lead, { name: student.name.split(' ')[0] ?? student.name })}</p>
        </div>
        {[
          [t.consent.whatTitle, t.consent.what],
          [t.consent.whyTitle, t.consent.why],
        ].map(([title, items]) => (
          <section key={title as string}>
            <h2 className="font-semibold">{title as string}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              {(items as string[]).map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </section>
        ))}
        <section>
          <h2 className="font-semibold">{t.consent.rightsTitle}</h2>
          <p className="mt-2 text-muted">{t.consent.rights}</p>
        </section>
        <ConsentForm t={t} token={token} />
        <p className="text-xs text-muted">v{r.consentVersion}</p>
      </div>
    )

  return (
    <Shell>
      <Card>{body}</Card>
    </Shell>
  )
}
