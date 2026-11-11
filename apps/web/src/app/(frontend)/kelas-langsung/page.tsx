import { redirect } from 'next/navigation'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { JoinLive } from '../../../components/forms/LiveForms'
import { getDict } from '../../../i18n/server'
import { getCurrentUser } from '../../../lib/session'

/** Students join the teacher's live class with the code on the board (spec H4). */
export default async function JoinLivePage() {
  if (!(await getCurrentUser())) redirect('/masuk')
  const { locale } = await getDict()
  return (
    <Shell>
      <Card>
        <h1 className="mb-1 text-2xl font-bold">{locale === 'id' ? 'Kelas Langsung' : 'Live Class'}</h1>
        <p className="mb-5 text-muted">{locale === 'id' ? 'Masukkan kode 6 huruf dari layar gurumu.' : 'Enter the 6-letter code from your teacher’s screen.'}</p>
        <JoinLive locale={locale} />
      </Card>
    </Shell>
  )
}
