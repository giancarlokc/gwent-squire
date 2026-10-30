/* App shell for /apps/gwent-squire/ only.
   Bump CACHE when the precached shell should be discarded. */
const CACHE = 'gwent-squire-v1';
const PREFIX = '/apps/gwent-squire';

const SHELL = [
  `${PREFIX}/`,
  `${PREFIX}/index.html`,
  `${PREFIX}/manifest.webmanifest`,
  `${PREFIX}/icon-180.png`,
  `${PREFIX}/icon-192.png`,
  `${PREFIX}/icon-512.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function underApp(url) {
  return url.origin === self.location.origin &&
    (url.pathname === PREFIX || url.pathname.startsWith(`${PREFIX}/`));
}

function isDocument(url) {
  return url.pathname === PREFIX ||
    url.pathname === `${PREFIX}/` ||
    url.pathname === `${PREFIX}/index.html`;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }
  if (!underApp(url)) return;

  if (isDocument(url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (SHELL.includes(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) ||
      (await caches.match(`${PREFIX}/index.html`)) ||
      (await caches.match(`${PREFIX}/`)) ||
      Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}
