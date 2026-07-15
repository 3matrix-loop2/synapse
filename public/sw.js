// Minimal service worker — runtime caching only, no build-time precache list
// needed (Vite's hashed filenames change every build, so we cache
// opportunistically as things are actually requested instead).

const CACHE_NAME = 'synapse-cache-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Only cache same-origin app assets — never intercept API calls
  // (Firebase, Groq, OpenWeatherMap, Spotify, map tiles) so live data,
  // auth, and cloud sync always hit the real network.
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      const network = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone())
        return response
      }).catch(() => cached)
      // Stale-while-revalidate: serve from cache instantly if we have it,
      // update the cache in the background either way.
      return cached || network
    })
  )
})
