/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = 'fin-micro-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Cleaning stale caches');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first with Cache fallback strategy
self.addEventListener('fetch', (event) => {
  // Ignore external videos API, non-GET requests, or non-http protocols
  if (
    event.request.method !== 'GET' || 
    event.request.url.includes('/api/') || 
    !event.request.url.startsWith('http')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response and cache it
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseCopy);
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If completely offline and asset not cached
          return new Response('<h1>Offline Mode</h1><p>Conéctate a internet para continuar aprendiendo.</p>', {
            headers: { 'Content-Type': 'text/html' }
          });
        });
      })
  );
});
