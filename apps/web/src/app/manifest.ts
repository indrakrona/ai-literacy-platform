import type { MetadataRoute } from 'next'

/** Lets phones add the platform to the home screen and open it like an app (works with offline lessons). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI Literacy · Impact Thinklab',
    short_name: 'AI Literacy',
    description: 'Literasi AI untuk remaja Indonesia',
    start_url: '/beranda',
    display: 'standalone',
    background_color: '#faf7f2',
    theme_color: '#16130f',
    lang: 'id',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  }
}
