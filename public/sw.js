const CACHE_NAME = 'anh-duc-trading-v2'; // Increment version on each deploy
const ASSETS = [
    '/',
    '/index.html',
    '/logo.png',
    '/manifest.json'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force immediate activation
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
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
        }).then(() => self.clients.claim()) // Take control immediately
    );
});

// Fetch event - Network First strategy for HTML/CSS/JS
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Network First for same-origin requests (HTML, CSS, JS)
    if (url.origin === location.origin) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone response before caching
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request);
                })
        );
    } else {
        // Cache First for external resources (fonts, APIs, etc.)
        event.respondWith(
            caches.match(request).then((response) => {
                return response || fetch(request);
            })
        );
    }
});
