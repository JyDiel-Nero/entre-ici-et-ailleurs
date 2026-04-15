/* ════════════════════════════════════════════════════════════════
   EIA Service Worker — Cache poems for offline reading
   ════════════════════════════════════════════════════════════════ */
var CACHE_NAME = 'eia-v1';
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/data/posts.json',
  '/data/settings.json',
  '/data/gallery.json',
  '/data/audio.json',
  '/manifest.json'
];

/* Install — cache static assets */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/* Activate — clean old caches */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
             .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

/* Fetch — network first, fall back to cache */
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  /* Skip non-GET and API/function calls */
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/.netlify/')) return;
  if (url.pathname.startsWith('/functions/')) return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      /* Cache successful responses */
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      /* Offline — try cache */
      return caches.match(event.request).then(function(cached) {
        return cached || new Response('Hors ligne — rechargez quand vous aurez une connexion.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});
