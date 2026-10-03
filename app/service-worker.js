// Nut Sort service worker — cache-first, fully offline after the first load.
// PRECACHE + VERSION are rewritten by `node tools/stamp-sw.js` (run before every deploy).
// Update flow: a new version installs in the background and waits; it activates the next time
// the app is launched (all old pages closed). Progress lives in localStorage and is untouched.
const VERSION = 'dev';
const PRECACHE = [
  './',
  'css/app.css',
  'css/themes.css',
  'data/daily.json',
  'data/levels-easy.json',
  'data/levels-hard.json',
  'data/levels-medium.json',
  'fonts/poppins-500.woff2',
  'fonts/poppins-700.woff2',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'index.html',
  'js/art.js',
  'js/audio.js',
  'js/birthday-fx.js',
  'js/birthday.js',
  'js/colors.js',
  'js/confetti.js',
  'js/config.js',
  'js/dates.js',
  'js/engine.js',
  'js/fx.js',
  'js/game.js',
  'js/hint-core.js',
  'js/hint-worker.js',
  'js/hints.js',
  'js/icons.js',
  'js/layout.js',
  'js/levels.js',
  'js/main.js',
  'js/renderer.js',
  'js/rng.js',
  'js/save.js',
  'js/screens/common.js',
  'js/screens/daily.js',
  'js/screens/difficulty.js',
  'js/screens/greeting.js',
  'js/screens/home.js',
  'js/screens/play.js',
  'js/screens/result.js',
  'js/screens/select.js',
  'js/screens/settings.js',
  'js/screens/stats.js',
  'js/screens/themes.js',
  'js/solver.js',
  'js/stars.js',
  'js/storage.js',
  'js/streak.js',
  'js/theme-apply.js',
  'js/themes.js',
  'js/ui.js',
  'manifest.webmanifest',
];
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
