const CACHE_NAME = 'ucl-slot-v1'
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/bg.png',
  '/bottle.png',
  '/trophy.png',
  '/star.png',
  '/try_again.png',
  '/heineken.png',
  '/ucl.png',
  '/favicon.svg',
  '/assets/Heinken-Bag.png',
  '/assets/Laptop-case.png',
  '/assets/Laptop-Sleeve.png',
  '/assets/Screen-01.png',
  '/assets/HeinekenSerif-Regular.ttf'
]

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  )
})
