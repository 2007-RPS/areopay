const CACHE_NAME = "aeropay-elite-v1";
const CORE_ASSETS = ["/", "/index.html", "/src/main.jsx"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return null;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const cacheableApi = url.pathname.includes("/api/wallet") || url.pathname.includes("/api/boarding-pass");

  if (cacheableApi) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const fresh = await fetch(event.request);
          cache.put(event.request, fresh.clone());
          return fresh;
        } catch {
          const cached = await cache.match(event.request);
          if (cached) return cached;
          return new Response(JSON.stringify({ ok: false, offline: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
          });
        }
      })
    );
  }
});
