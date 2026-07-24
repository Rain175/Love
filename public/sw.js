// Orbit - Service Worker
// Minimal service worker with a fetch handler for PWA installability on Android.
//
// Caching strategy notes:
// - Navigations (HTML): network-first, so the app shell is always fresh when online.
// - Everything else (images, manifest, JS/CSS, etc.): stale-while-revalidate.
//   This serves instantly from cache, but ALWAYS re-fetches from the network in the
//   background and overwrites the cache entry. This means updated assets (changed
//   images, manifest tweaks, etc.) show up automatically on the *next* load without
//   needing to bump CACHE_NAME or manually clear site data.

const CACHE_NAME = 'orbit-cache-v1';
const PRECACHE_URLS = ['/', '/index.html', '/manifest.json', '/icon-512.png'];

// Install: pre-cache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean up any old-named caches from previous versions of this file
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (e.g., API calls, CDN assets)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML navigations (always get fresh app shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Stale-while-revalidate for everything else (images, manifest, JS/CSS, etc.)
  // Serve cached copy immediately if we have one, but always kick off a network
  // fetch in the background to refresh the cache for next time.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          // Only cache valid, same-origin, basic responses
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached); // offline fallback to whatever we had cached, if anything

      // Return cached immediately if present, otherwise wait on the network
      return cached || networkFetch;
    })
  );
});
