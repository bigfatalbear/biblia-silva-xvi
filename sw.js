// ============================================================
// SERVICE WORKER - BÍBLIA SILVA XVI
// ============================================================
const VERSION = "v1";
const CACHE_NAME = `biblia-silva-xvi-${VERSION}`;

// Arquivos essenciais para funcionamento offline
const APP_STATIC_RESOURCES = [
  "./",
  "./index.html"
];

// Instala o Service Worker e faz o cache dos arquivos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_STATIC_RESOURCES);
    })
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercepta requisições e serve do cache quando offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Se encontrou no cache, retorna
      if (response) {
        return response;
      }
      // Senão, busca da rede
      return fetch(event.request).then((networkResponse) => {
        // Se a resposta for válida, guarda no cache
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Se falhar (offline), retorna o index.html como fallback
        return caches.match("./index.html");
      });
    })
  );
});