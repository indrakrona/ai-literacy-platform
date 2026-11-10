import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../../components/Shell'
import { Card } from '../../../../../components/ui'
import { getDict } from '../../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../../lib/session'
import { audit } from '../../../../../lib/audit'

/** Full AI Lab transcript for the safety team; each opening is audited. */
export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser()
  if (!admin) redirect('/masuk')
  if (!hasRole(admin, 'super_admin')) notFound()
  const { locale } = await getDict()
  const id = locale === 'id'
  const payload = await getPayloadClient()
  const c = await payload.findByID({ collection: 'ai-conversations', id: Number((await params).id), depth: 1, overrideAccess: true }).catch(() => null)
  if (!c) notFound()
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  await audit(payload, { actor: admin.id, action: 'view_conversation', collection: 'ai-conversations', docId: c.id, ip })
  const msgs = (c.messages as { role: string; content: string; status?: string; at?: string }[]) ?? []
  const student = typeof c.user === 'object' ? c.user : null
  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <Link href="/operasi?tab=ai" className="text-sm underline">← {id ? 'Monitor AI' : 'AI monitor'}</Link>
        <Card>
          <h1 className="text-xl font-bold">{typeof c.activity === 'object' ? c.activity.title : 'AI Lab'}</h1>
          <p className="text-sm text-muted">
            {student ? <Link className="underline" href={`/operasi/pengguna/${student.id}`}>{student.name}</Link> : ''} · {msgs.filter((m) => m.role === 'user').length} {id ? 'pesan' : 'messages'} · {c.provider}
            {c.flagged && <span className="ml-2 font-semibold text-danger">{((c.flags as string[]) ?? []).join(', ')}</span>}
          </p>
          <ol className="mt-4 flex flex-col gap-2 text-sm">
            {msgs.map((m, i) => (
              <li key={i} className={`rounded-xl p-3 ${m.role === 'user' ? 'bg-paper font-medium' : 'border border-line'}`}>
                <span className="mr-1 text-xs uppercase text-muted">{m.role === 'user' ? (id ? 'Siswa' : 'Student') : 'AI'}{m.status && m.status !== 'answered' ? ` · ${m.status}` : ''}</span>
                <span className="whitespace-pre-line">{m.content}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </Shell>
  )
}
