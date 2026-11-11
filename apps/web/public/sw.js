/* AI Literacy service worker (spec C7): lessons saved for offline reading.
 * - Pages: network first; when offline, the copy saved by "Save for offline" (or seen before) is shown.
 * - Built assets (/_next/static): cache first; they never change for a given build.
 * - API calls and the admin panel are never cached.
 */
const PAGES = 'ailit-pages-v1'
const ASSETS = 'ailit-assets-v1'
const OFFLINE_URL = '/offline'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.add(OFFLINE_URL)).catch(() => undefined).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => ![PAGES, ASSETS].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) return

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok) cache.put(req, res.clone())
        return res
      }),
    )
    return
  }

  // Client-side navigations fetch a data payload (RSC); offline, let them fail so the browser loads the full page.
  if (req.headers.get('RSC') === '1') return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Keep lesson pages fresh in the cache for next time.
          if (res.ok && url.pathname.startsWith('/belajar/')) caches.open(PAGES).then((c) => c.put(req, res.clone()))
          return res
        })
        .catch(async () => (await caches.match(req, { ignoreVary: true })) || (await caches.match(OFFLINE_URL)) || new Response('Offline', { status: 503 })),
    )
  }
})

// The page asks to save a list of URLs (a whole track) for offline reading.
self.addEventListener('message', (event) => {
  const data = event.data || {}
  if (data.type !== 'save-pages' || !Array.isArray(data.urls)) return
  event.waitUntil(
    caches.open(PAGES).then(async (cache) => {
      let done = 0
      for (const u of data.urls) {
        try {
          const res = await fetch(u, { credentials: 'same-origin' })
          if (res.ok) await cache.put(u, res)
        } catch (e) {
          /* skip */
        }
        done++
        event.source && event.source.postMessage({ type: 'save-progress', done, total: data.urls.length })
      }
    }),
  )
})
