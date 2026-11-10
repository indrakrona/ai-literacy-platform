import Link from 'next/link'
import { redirect } from 'next/navigation'
import { hasRole } from '@ailit/shared'
import { Shell } from '../../../../components/Shell'
import { Card, Notice } from '../../../../components/ui'
import { LinkChildForm, ParentSignupForm } from '../../../../components/forms/ParentForms'
import { getDict } from '../../../../i18n/server'
import { getCurrentUser, getPayloadClient } from '../../../../lib/session'
import { LINK_PROBLEMS, resolveChildLink } from '../../../../lib/parents'

export const dynamic = 'force-dynamic'

/** Parent sign-up: from the consent page (?token=) or with a code from the child (?kode=). */
export default async function ParentSignupPage({ searchParams }: { searchParams: Promise<{ token?: string; kode?: string }> }) {
  const { token, kode } = await searchParams
  const { locale } = await getDict()
  const id = locale === 'id'
  const problems = Object.fromEntries(Object.entries(LINK_PROBLEMS).map(([k, v]) => [k, v[locale]]))
  const user = await getCurrentUser()
  if (user && hasRole(user, 'parent')) {
    if (!token) redirect('/orang-tua')
  }
  const payload = await getPayloadClient()
  let childName: string | null = null
  let email: string | undefined
  if (token) {
    const link = await resolveChildLink(payload, { token })
    if ('problem' in link) {
      return (
        <Shell>
          <Notice tone="warn" title={problems[link.problem]}>
            <Link href="/daftar/orang-tua" className="underline">{id ? 'Daftar dengan kode dari anak' : 'Sign up with a code from your child'}</Link>
          </Notice>
        </Shell>
      )
    }
    const child = await payload.findByID({ collection: 'users', id: link.childId, depth: 0, overrideAccess: true })
    childName = child.name.split(' ')[0] ?? child.name
    const req = (await payload.find({ collection: 'consent-requests', overrideAccess: true, depth: 0, limit: 1, where: { token: { equals: token } } })).docs[0]
    email = req?.guardianEmail ?? undefined
  }

  return (
    <Shell>
      <Card>
        <h1 className="text-2xl font-bold">{id ? 'Akun orang tua' : 'Parent account'}</h1>
        <p className="mt-1 mb-5 text-muted">
          {childName
            ? id
              ? `Pantau kemajuan belajar ${childName}: pelajaran, lencana, hasil tes dan sertifikat, plus ringkasan setiap minggu. Isi percakapan dengan AI tidak ditampilkan.`
              : `Follow ${childName}’s learning: lessons, badges, test results and certificates, plus a summary every week. Conversations with the AI are not shown.`
            : id
              ? 'Pantau kemajuan belajar anak Anda. Anda memerlukan kode 8 karakter yang dibuat anak di halaman Akun miliknya.'
              : 'Follow your child’s learning. You need the 8-character code your child makes on their Account page.'}
        </p>
        {user && hasRole(user, 'parent') && token ? (
          <LinkChildForm problems={problems} locale={locale} token={token} />
        ) : (
          <ParentSignupForm token={token} code={kode} email={email} problems={problems} locale={locale} />
        )}
        <p className="mt-4 text-sm text-muted">
          {id ? 'Sudah punya akun orang tua? ' : 'Already have a parent account? '}
          <Link href="/masuk" className="underline">{id ? 'Masuk' : 'Sign in'}</Link>
        </p>
      </Card>
    </Shell>
  )
}
