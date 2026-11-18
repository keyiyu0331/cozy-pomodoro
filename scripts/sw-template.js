// The service worker: a script the browser keeps running for this site, which
// can answer the page's network requests itself. It is what makes Cozy
// Pomodoro work offline.
//
// `npm run build` copies this file to dist/sw.js and puts two lines above it:
//   VERSION — a fingerprint of the build (changes whenever any file changes)
//   FILES   — the list of every file in the build
//
// On install it downloads all FILES into a cache. After that, every request
// is answered from the cache, so no network is needed. A new build has a new
// VERSION, which makes the browser install the new worker and drop the old cache.

const CACHE = `cozy-pomodoro-${VERSION}`;
// Caches made by older builds, including ones from when the app was called "hearth".
const OLD_PREFIXES = ['cozy-pomodoro-', 'hearth-'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()), // take over without waiting for old tabs to close
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE && OLD_PREFIXES.some((prefix) => name.startsWith(prefix)))
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const sameSite = new URL(request.url).origin === self.location.origin;
  if (request.method !== 'GET' || !sameSite) return; // let the browser handle it

  const isPage = request.mode === 'navigate';
  // ignoreVary: match on the address alone. Without it, a server that marks
  // files "Vary: Origin" makes the cached copy invisible to <script> requests.
  event.respondWith(
    caches
      .match(request, { ignoreSearch: isPage, ignoreVary: true })
      .then((hit) => hit || (isPage ? caches.match('./') : undefined))
      .then((hit) => hit || fetch(request)),
  );
});
