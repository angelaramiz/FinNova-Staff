/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_VERSION = '1.0.0';
const CACHE_NAME = `finnova-cache-staff-v${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event - Pre-cache essential app shell files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`[Service Worker v${CACHE_VERSION}] Pre-caching shell assets`);
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache.startsWith('finnova-cache-staff-v')) {
            console.log(`[Service Worker] Cleaning stale cache: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first with Cache fallback strategy
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests, API calls, webhooks, or non-http protocols
  if (
    event.request.method !== 'GET' || 
    event.request.url.includes('/api/') || 
    event.request.url.includes('/webhooks/') ||
    !event.request.url.startsWith('http')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If completely offline and HTML is requested, return friendly offline response
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return new Response(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><title>FinNova Staff - Offline</title><style>body{background:#0a0f1d;color:#94a3b8;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0}h1{color:#2dd4bf;margin-bottom:8px}p{margin-top:0}</style></head><body><h1>Modo Offline</h1><p>Conéctate a internet para continuar gestionando.</p></body></html>',
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          }
        });
      })
  );
});

// Skip waiting message handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
