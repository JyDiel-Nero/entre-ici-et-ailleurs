/* ════════════════════════════════════════════════════════════════
   JyDiel In-Time — Service Worker v4
   Network-first, SPA routing, auto-purge old caches
   ════════════════════════════════════════════════════════════════ */
var CACHE_NAME = 'jit-v4';

/* Install — skip waiting immediately */
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

/* Activate — delete ALL old caches */
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

/* Fetch — network first, SPA routing */
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  /* Skip non-GET, API, admin */
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/admin')) return;

  /* SPA routes → serve /index.html */
  var spaRoutes = ['/heures','/secondes','/un-instant','/entretemps','/minutes','/saisons','/confidentialite','/blog','/univers','/apropos','/contact','/audio','/oeuvres'];
  var isSpaRoute = spaRoutes.indexOf(url.pathname.replace(/\/+$/,'')) !== -1 || url.pathname.startsWith('/article/') || url.pathname.startsWith('/custom-');

  var fetchReq = isSpaRoute ? new Request('/index.html') : event.request;

  event.respondWith(
    fetch(fetchReq).then(function(response) {
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(isSpaRoute ? '/index.html' : event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      /* Offline — serve from cache */
      if (isSpaRoute) {
        return caches.match('/index.html');
      }
      return caches.match(event.request).then(function(cached) {
        return cached || new Response('Hors ligne', {status: 503, headers: {'Content-Type':'text/plain;charset=utf-8'}});
      });
    })
  );
});
