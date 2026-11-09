import { Shell } from '../../../components/Shell'
import { Card, Notice } from '../../../components/ui'
import { ResetForm } from '../../../components/forms/ResetForm'
import { getDict } from '../../../i18n/server'

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { t } = await getDict()
  const { token } = await searchParams
  return (
    <Shell>
      <Card>{token ? <ResetForm t={t} token={token} /> : <Notice tone="warn" title={t.reset.invalid} />}</Card>
    </Shell>
  )
}
