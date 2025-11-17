const CACHE_NAME = "help-me-decide-v1";

// List the core assets you want available offline
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/presets-restaurants.js",
  "./js/presets-baby-names.js",
  "./js/presets-travel.js",
  "./js/presets-ghibli.js",
  "./manifest.json"
];

// Install: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Activate immediately on install (silent)
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: try cache first, then network, then fallback if both fail
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET requests from same origin
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background
        event.waitUntil(
          fetch(request)
            .then((networkResponse) => {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse.clone());
              });
            })
            .catch(() => {})
        );
        return cachedResponse;
      }

      // No cache, go to network, then cache it
      return fetch(request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // As a simple fallback, if offline and not cached, just fail gracefully.
          return new Response("You are offline and this resource is not cached yet.", {
            status: 503,
            headers: { "Content-Type": "text/plain" }
          });
        });
    })
  );
});
