// Nut Sort service worker — cache-first, fully offline after the first load.
// PRECACHE + VERSION are rewritten by `node tools/stamp-sw.js` (run before every deploy).
// Update flow: a new version installs in the background and waits; it activates the next time
// the app is launched (all old pages closed). Progress lives in localStorage and is untouched.
const VERSION = 'dev';
const PRECACHE = ['./', 'index.html'];
const CACHE = `nutsort-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('nutsort-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (VERSION === 'dev') { // unstamped dev build: network first so edits show up immediately
      try { const res = await fetch(req); if (res.ok) cache.put(req, res.clone()); return res; } catch (e) { /* offline: fall back to cache */ }
    }
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const shell = await cache.match('index.html');
      if (shell) return shell;
    }
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch (e) {
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});
