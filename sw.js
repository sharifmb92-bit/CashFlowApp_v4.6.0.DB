/* ===========================================================
   CashFlowApp_v 4.6.0 - Service Worker
   Sello: medbasha
   Estrategia: Cache-First con actualización limpia para PWA
   =========================================================== */

const CACHE_NAME = 'cashflowapp-v4-6-0';

// Archivos estáticos principales con rutas relativas puras (./)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalar Service Worker y guardar recursos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activar Service Worker y borrar cachés antiguas de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Estrategia de respuesta: Servir desde caché o buscar en la red
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones no GET o de extensiones/Firebase para la sincronización en tiempo real
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Opcional: Cachear llamadas estáticas dinámicas si no son de Firebase/RTDB
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          networkResponse.type === 'basic' &&
          !event.request.url.includes('firebase') &&
          !event.request.url.includes('firebasedatabase')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback básico si falla la red y no está en caché
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
