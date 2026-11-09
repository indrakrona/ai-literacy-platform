import { Shell } from '../../../../../../components/Shell'
import { Card } from '../../../../../../components/ui'
import { getDict } from '../../../../../../i18n/server'
import { requireClassTeacher } from '../../../../../../lib/teacher-guard'

export default async function AiReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const classId = Number((await params).id)
  const { payload, user, klass } = await requireClassTeacher(classId)
  const { locale } = await getDict()
  const id = locale === 'id'
  const studentIds = (klass.students ?? []).map((s) => (typeof s === 'object' ? s.id : s))
  const convos = studentIds.length
    ? await payload.find({ collection: 'ai-conversations', overrideAccess: false, user, where: { user: { in: studentIds } }, sort: '-flagged,-updatedAt', depth: 1, limit: 100 })
    : { docs: [] }
  return (
    <Shell narrow={false}>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{id ? 'Tinjauan AI Lab' : 'AI Lab review'} · {klass.name}</h1>
        {convos.docs.length === 0 && <p className="text-muted">{id ? 'Belum ada percakapan.' : 'No conversations yet.'}</p>}
        {convos.docs.map((c) => {
          const msgs = (c.messages as { role: string; content: string; status?: string }[]) ?? []
          return (
            <Card key={c.id}>
              <details>
                <summary className="cursor-pointer">
                  <span className="font-semibold">{typeof c.user === 'object' ? c.user.name : c.user}</span>
                  {' · '}{typeof c.activity === 'object' ? c.activity.title : ''}
                  {' · '}{msgs.filter((m) => m.role === 'user').length} {id ? 'pesan' : 'messages'}
                  {c.flagged && <span className="ml-2 rounded bg-brand/15 px-2 py-0.5 text-xs font-semibold">{id ? 'Ditandai' : 'Flagged'}: {((c.flags as string[]) ?? []).join(', ')}</span>}
                </summary>
                <ol className="mt-3 flex flex-col gap-2 text-sm">
                  {msgs.map((m, i) => (
                    <li key={i} className={m.role === 'user' ? 'font-medium' : 'text-muted'}>
                      <span className="mr-1 text-xs uppercase">{m.role === 'user' ? (id ? 'Siswa' : 'Student') : 'AI'}{m.status && m.status !== 'answered' ? ` · ${m.status}` : ''}:</span>
                      {m.content}
                    </li>
                  ))}
                </ol>
              </details>
            </Card>
          )
        })}
      </div>
    </Shell>
  )
}
