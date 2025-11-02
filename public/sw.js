// Service Worker - umożliwia działanie offline i instalację PWA
const CACHE_NAME = 'messu-bouw-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Instalacja Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('[SW] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Aktywacja Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Przechwytywanie requestów - strategia Cache First dla offline (priorytet: cache)
self.addEventListener('fetch', (event) => {
  // Ignoruj chrome-extension i inne nietypowe requesty
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Jeśli mamy w cache, zwróć natychmiast
        if (cachedResponse) {
          // W tle pobierz świeżą wersję i zaktualizuj cache
          fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response.clone());
              });
            }
          }).catch(() => {
            // Offline - ignoruj błąd
          });
          return cachedResponse;
        }

        // Jeśli nie ma w cache, pobierz z sieci
        return fetch(event.request)
          .then((response) => {
            // Zapisz w cache dla przyszłych użyć
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Fallback dla HTML gdy offline i nie ma w cache
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/');
            }
          });
      })
  );
});

// Obsługa wiadomości z aplikacji
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

