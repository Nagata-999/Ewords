const CACHE_NAME = "sushitan-v19-login-wallet";
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
  // Keep dictionary 404 responses intact and avoid caching thousands of word pages.
  if (new URL(event.request.url).pathname.startsWith('/dictionary/')) return;
  const criticalSyncAsset = requestUrl.origin === self.location.origin &&
    /\/(?:shared\/sushi-profile|sushigacha\/(?:avatar|avatar-engine|avatar-personality|avatar-state|avatar-studio|avatar-widget|home-avatar-walker|site-taskbar|site-taskbar-login-modal|login-bonus-model|achievement-[a-z-]+|achievements-ui))\.js$/.test(requestUrl.pathname);
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


