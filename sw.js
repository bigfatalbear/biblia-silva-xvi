// ============================================================
// SERVICE WORKER - BÍBLIA SILVA XVI
// ============================================================
const VERSION = "v4";
const CACHE_NAME = "biblia-silva-xvi-" + VERSION;

// Só cacheia imagens e o manifest (NUNCA o HTML)
const APP_STATIC_RESOURCES = [
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_STATIC_RESOURCES).catch(() => {});
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignora esquemas não suportados
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // NUNCA intercepta chamadas para API (Apps Script, Supabase, Gemini, Imgur, Bible-API)
  if (
    url.hostname.includes("script.google.com") ||
    url.hostname.includes("googleusercontent.com") ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("imgur.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("bible-api.com")
  ) {
    return; // navegador lida direto, sem cache
  }

  // Para HTML → sempre da rede (network-only)
  if (
    event.request.destination === "document" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith("/")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para o resto → cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        const copia = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia)).catch(() => {});
        return response;
      });
    })
  );
});
