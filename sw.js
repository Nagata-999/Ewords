const CACHE_NAME = "sushitan-v29-admin-sealed";
const APP_SHELL = [
  "/",
  "/index.html",
  "/sushi_blast",
  "/shared/player.js",
  "/manifest.json",
  "/shared/word-registry.js",
  "/shared/learning.js",
  "/shared/review-ui.js",
  "/shared/learning-home.js",
  "/sushigacha/achievement-ledger.js?v=20261010-1",
  "/sushigacha/achievement-events.js?v=20261010-1",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.hostname.endsWith('.supabase.co') ||
      requestUrl.hostname.endsWith('.supabase.in') ||
      (requestUrl.origin === self.location.origin && /\/writing(?:\/|$)/.test(requestUrl.pathname))) return;
  // Admin shell is online-only; never retain authenticated diagnostic pages.
  if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith('/admin/')) return;
  // Never resurrect a pre-seal collector from an offline cache (including old query versions).
  if (requestUrl.origin === self.location.origin && requestUrl.pathname === '/shared/usage-analytics.js') {
    event.respondWith(fetch(event.request, {cache:'no-store'}).catch(() =>
      new Response('/* Usage collection unavailable: fail closed. */', {
        headers:{'Content-Type':'application/javascript','Cache-Control':'no-store'}
      })
    ));
    return;
  }
  // Keep dictionary 404 responses intact and avoid caching thousands of word pages.
  if (new URL(event.request.url).pathname.startsWith('/dictionary/')) return;
  const criticalSyncAsset = requestUrl.origin === self.location.origin &&
    /\/(?:shared\/(?:sushi-profile|usage-analytics)|sushigacha\/(?:avatar|avatar-engine|avatar-personality|avatar-state|avatar-studio|avatar-widget|home-avatar-walker|site-layout|site-taskbar|site-taskbar-login-modal|login-bonus-model|achievement-[a-z-]+|achievements-ui))\.js$/.test(requestUrl.pathname);
  event.respondWith(
    fetch(event.request, criticalSyncAsset ? {cache:'no-cache'} : {})
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match("/index.html")))
  );
});


