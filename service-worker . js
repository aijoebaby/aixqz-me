// service-worker.js
// Bump this when you change assets
const CACHE_NAME = "aijoe-v4";

// List only stable, static files you actually serve
const ASSETS = [
  "/",                // optional, keep if you serve index.html at /
  "/index.html",
  "/style.css",
  "/script.js",
  "/joey.png",        // rename to your real image file name
  "/manifest.json",
];

// Install: pre-cache core assets (best-effort)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS.map((u) => u + "?v=4")).catch(() => null)
    )
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Never cache API calls to Netlify Functions (network-first, no cache)
// - For navigation and static GETs, use stale-while-revalidate
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 1) BYPASS caching for your function endpoint
  if (url.pathname.startsWith("/.netlify/functions/askAI")) {
    return; // let the browser hit the network directly
  }

  // 2) For HTML navigations: use network first (fallback to cache)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // 3) For other static GET requests: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
