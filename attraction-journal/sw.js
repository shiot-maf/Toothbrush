const CACHE = 'aj-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/home.html',
  '/today.html',
  '/gratitude.html',
  '/hard.html',
  '/history.html',
  '/report.html',
  '/vision.html',
  '/onboarding.html',
  '/style.css',
  '/utils.js',
  '/firebase.js',
  '/manifest.json',
  '/icon.svg',
];

// Firebase SDK CDN + 폰트 — 네트워크 우선, 캐시 폴백
const CDN_ORIGINS = [
  'https://www.gstatic.com',
  'https://cdn.jsdelivr.net',
  'https://firebasestorage.googleapis.com',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // CDN 파일: 캐시 우선 (한 번 받으면 재사용)
  if (CDN_ORIGINS.some(o => request.url.startsWith(o))) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // 앱 파일: 네트워크 우선, 실패 시 캐시
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      }).catch(() => caches.match(request))
    );
  }
});
