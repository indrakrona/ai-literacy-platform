import type { Metadata } from 'next'
import { Shell } from '../../../components/Shell'
import { Card } from '../../../components/ui'
import { VerifyLookup } from '../../../components/forms/BookingForms'
import { getDict } from '../../../i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDict()
  return { title: locale === 'id' ? 'Verifikasi sertifikat AILIS · AI Literacy' : 'Verify an AILIS certificate · AI Literacy' }
}

/** Public: anyone (a school, university or employer) can check an AILIS certificate by its code (spec G12). */
export default async function VerifyPage() {
  const { locale } = await getDict()
  const id = locale === 'id'
  return (
    <Shell>
      <Card>
        <h1 className="text-2xl font-bold">{id ? 'Verifikasi sertifikat AILIS' : 'Verify an AILIS certificate'}</h1>
        <p className="mt-1 mb-5 text-muted">
          {id ? 'Masukkan kode yang tertera di sertifikat, atau pindai kode QR-nya.' : 'Enter the code printed on the certificate, or scan its QR code.'}
        </p>
        <VerifyLookup locale={locale} />
      </Card>
    </Shell>
  )
}
