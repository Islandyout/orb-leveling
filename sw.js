/* ============================================================
   Solo Leveling: Rebuild — Service Worker v6
   GitHub Pages PWA — cache-first for assets, network-first for game
   ============================================================ */

const CACHE = 'sl-rebuild-v6';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Install: precache all core assets
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .catch(() => {}) // don't block on failure
  );
});

// Activate: wipe old caches, claim clients immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Skip cross-origin requests (fonts, APIs)
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request)
          .then(cached => cached || caches.match('./index.html'))
      )
  );
});

// Message handler: force-cache a specific URL
self.addEventListener('message', e => {
  if (e.data?.type === 'CACHE_NOW' && e.data.url) {
    caches.open(CACHE).then(c =>
      fetch(e.data.url, { cache: 'reload' })
        .then(r => { if (r.ok) c.put(e.data.url, r); })
        .catch(() => {})
    );
  }
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
