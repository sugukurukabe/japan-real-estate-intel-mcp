/**
 * Service Worker for Japan Real Estate Intel PWA
 * Caches core assets for offline / poor-signal use (field mode)
 */

const CACHE_VERSION = 'rei-v6.15.1';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DATA = `${CACHE_VERSION}-data`;

const STATIC_ASSETS = [
  '/dashboard.html',
  '/mcp-bridge.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const AICHI_DATA_ASSETS = [
  '/data/aichi/land_price.csv',
  '/data/aichi/transactions.csv',
  '/data/aichi/human_flow.csv',
  '/data/aichi/population.csv',
  '/data/aichi/zoning.csv',
  '/data/aichi/vacancy.csv',
  '/data/aichi/population_projection.csv',
];

// ── Install: pre-cache static assets ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore individual failures (assets may not exist yet)
      })
    )
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('rei-') && k !== CACHE_STATIC && k !== CACHE_DATA)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first for static, network-first for API ──────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Don't intercept MCP API calls or cross-origin requests
  if (url.pathname.startsWith('/mcp') || url.pathname.startsWith('/health')) return;
  if (url.origin !== self.location.origin) return;

  // Data files: cache-first with network fallback
  if (url.pathname.startsWith('/data/aichi/') || url.pathname.startsWith('/data/')) {
    event.respondWith(
      caches.open(CACHE_DATA).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const res = await fetch(event.request);
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        } catch {
          return cached ?? new Response('Offline', { status: 503 });
        }
      })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.open(CACHE_STATIC).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const res = await fetch(event.request);
        if (res.ok) cache.put(event.request, res.clone());
        return res;
      } catch {
        // If offline and not cached, return dashboard.html as fallback
        if (url.pathname.endsWith('.html') || url.pathname === '/') {
          return cache.match('/dashboard.html') ?? new Response('Offline', { status: 503 });
        }
        return new Response('Offline', { status: 503 });
      }
    })
  );
});

// ── Background sync: pre-cache Aichi data when online ─────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_AICHI_DATA') {
    caches.open(CACHE_DATA).then((cache) =>
      cache.addAll(AICHI_DATA_ASSETS).catch(() => {})
    );
  }
});
