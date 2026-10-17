const CACHE = 'atlas-infoade-v13';
const CORE = ['./', './index.html', './manifest.webmanifest', './chart.umd.min.js', './atlas-icon-192.png', './atlas-icon-512.png', './dm-sans-400.ttf', './dm-sans-500.ttf', './dm-sans-600.ttf', './dm-sans-700.ttf', './dm-serif-400.ttf', './dm-serif-italic.ttf'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (!response || response.status !== 200) return response;
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : undefined)));
});
