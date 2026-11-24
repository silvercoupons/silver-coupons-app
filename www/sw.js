const CACHE_NAME = 'silver-coupons-offline-v15';

// استثناء خدمات الإشعارات والروابط الخارجية حتى لا تتأثر نهائياً
const IGNORED_DOMAINS = [
  'onesignal.com',
  'firebase',
  'googleapis.com',
  'google-analytics.com'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// استراتيجية الشبكة أولاً: يجلب الأحدث دائماً، ويعود للكاش فقط عند انقطاع الإنترنت
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  if (IGNORED_DOMAINS.some((domain) => url.includes(domain))) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
