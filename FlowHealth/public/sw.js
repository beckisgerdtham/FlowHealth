/*
 * Becky Boost service worker: lets the app start without a network connection.
 *
 * - The page itself (index.html): network first, so new versions show up right away;
 *   falls back to the saved copy when offline.
 * - App files (JS, CSS, icons, fonts): served from the saved copy, refreshed in the background.
 * - Supabase requests are never cached here: the app handles offline data itself.
 *
 * Bump VERSION to force every device to drop the old saved files.
 */
const VERSION = 'v2'
const CACHE = `flowhealth-${VERSION}`
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png', '/icons/apple-touch-icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await cache.addAll(SHELL)
      // Also save the JS/CSS files that the current index.html points to.
      const html = await (await fetch('/', { cache: 'no-store' })).text()
      const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
      await cache.addAll(assets)
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  const sameOrigin = url.origin === self.location.origin
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
  if (!sameOrigin && !isFont) return // e.g. Supabase

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          const cache = await caches.open(CACHE)
          cache.put('/', fresh.clone())
          return fresh
        } catch {
          return (await caches.match('/', { ignoreVary: true })) ?? Response.error()
        }
      })(),
    )
    return
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(request, { ignoreVary: true })
      const refresh = fetch(request)
        .then((response) => {
          if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
          return response
        })
        .catch(() => undefined)
      return cached ?? (await refresh) ?? Response.error()
    })(),
  )
})
