import { cache } from 'react'
import { getPayloadClient } from './session'

type Locale = 'id' | 'en'

/** A published website page by slug, in the visitor's language. */
export const getPage = cache(async (slug: string, locale: Locale) => {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'pages', locale, fallbackLocale: 'id', limit: 1, depth: 1, overrideAccess: false, where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] } })
  return res.docs[0] ?? null
})

/** Menu and footer links, from the pages themselves. */
export const getSiteChrome = cache(async (locale: Locale) => {
  const payload = await getPayloadClient()
  const pages = await payload.find({ collection: 'pages', locale, fallbackLocale: 'id', depth: 0, limit: 50, overrideAccess: false, sort: 'navOrder', where: { _status: { equals: 'published' } }, select: { title: true, slug: true, showInNav: true, footerGroup: true, navOrder: true } }).catch(() => ({ docs: [] }))
  const settings = await payload.findGlobal({ slug: 'site-settings', locale, fallbackLocale: 'id' }).catch(() => null)
  const href = (slug: string) => (slug === 'home' ? '/' : `/${slug}`)
  return {
    nav: pages.docs.filter((p) => p.showInNav).map((p) => ({ label: p.title, href: href(p.slug) })),
    legal: pages.docs.filter((p) => p.footerGroup === 'legal').map((p) => ({ label: p.title, href: href(p.slug) })),
    about: pages.docs.filter((p) => p.footerGroup === 'about').map((p) => ({ label: p.title, href: href(p.slug) })),
    settings,
  }
})
