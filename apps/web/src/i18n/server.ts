import { cookies } from 'next/headers'
import { dictionaries, type Locale } from './dict'

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get('lang')?.value
  return c === 'en' ? 'en' : 'id'
}

export async function getDict() {
  const locale = await getLocale()
  return { locale, t: dictionaries[locale] }
}
