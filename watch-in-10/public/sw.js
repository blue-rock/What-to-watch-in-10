const CACHE_NAME = 'watch10-v2';
const STATIC_ASSETS = ['/', '/index.html', '/favicon.svg'];
const API_CACHE = 'watch10-api-v1';
const IMG_CACHE = 'watch10-images-v1';
const MAX_IMG_CACHE = 200;
const API_TTL = 30 * 60 * 1000; // 30 minutes

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  const keep = [CACHE_NAME, API_CACHE, IMG_CACHE];
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Trim image cache to prevent unbounded growth
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    for (let i = 0; i < keys.length - maxItems; i++) {
      await cache.delete(keys[i]);
    }
  }
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API calls: network-first with cache fallback + TTL
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            const headers = new Headers(clone.headers);
            headers.set('sw-cached-at', Date.now().toString());
            caches.open(API_CACHE).then((cache) =>
              cache.put(e.request, new Response(clone.body, { status: clone.status, statusText: clone.statusText, headers }))
            );
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(e.request, { cacheName: API_CACHE });
          if (cached) {
            const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0', 10);
            if (Date.now() - cachedAt < API_TTL) return cached;
            // Stale but better than nothing when offline
            return cached;
          }
          return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // YouTube thumbnail images: cache-first, stale-while-revalidate
  if (url.hostname === 'i.ytimg.com' || url.hostname === 'yt3.ggpht.com' || url.hostname === 'yt3.googleusercontent.com') {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const fetchPromise = fetch(e.request).then((res) => {
          if (res.ok) {
            caches.open(IMG_CACHE).then((cache) => {
              cache.put(e.request, res.clone());
              trimCache(IMG_CACHE, MAX_IMG_CACHE);
            });
          }
          return res;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Google Fonts: cache-first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // App shell: cache-first for built assets, network-first for navigation
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (JS, CSS bundles): cache-first
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
