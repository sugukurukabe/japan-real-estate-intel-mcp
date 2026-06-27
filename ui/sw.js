/**
 * Service Worker for Japan Real Estate Intel PWA
 * Caches core assets for offline / poor-signal use (field mode)
 */

const CACHE_VERSION = 'rei-v6.15.4';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DATA = `${CACHE_VERSION}-data`;

const STATIC_ASSETS = [
  '/dashboard.html',
  '/dashboard-3d.html',
  '/dashboard.css',
  '/dashboard.js',
  '/mcp-bridge.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/assets/fonts/ipaexg.ttf',
  '/assets/logo.svg',
];

// ── Install: pre-cache static assets ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some static assets failed to pre-cache during install:', err);
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
  if (url.pathname.startsWith('/data/')) {
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

// ── Background sync: dynamic caching of selected prefecture data ──────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_PREFECTURE_DATA') {
    const pref = event.data.prefecture;
    if (!pref) return;
    const assets = [
      `/data/${pref}/land_price.csv`,
      `/data/${pref}/transactions.csv`,
      `/data/${pref}/human_flow.csv`,
      `/data/${pref}/population.csv`,
      `/data/${pref}/zoning.csv`,
      `/data/${pref}/vacancy.csv`,
      `/data/${pref}/population_projection.csv`,
    ];
    caches.open(CACHE_DATA).then((cache) => {
      Promise.all(
        assets.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`Failed to cache ${asset}:`, err);
          })
        )
      ).then(() => {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'PREFECTURE_SYNC_COMPLETE', prefecture: pref });
          });
        });
      });
    });
  }
});
