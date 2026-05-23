const CACHE_NAME = "taskease-static-v1";
const STATIC_ASSETS = [
  "/",
  "/favicon.svg",
  "/icons.svg",
  "/taskease-logo-light.png",
  "/taskease-logo-dark.jpg",
  "/pomodoro-alarm.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

const shouldCache = (request) => {
  if (request.method !== "GET") return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/auth/") || url.pathname.startsWith("/rest/")) return false;

  return true;
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response?.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
};

self.addEventListener("fetch", (event) => {
  if (!shouldCache(event.request)) return;

  event.respondWith(staleWhileRevalidate(event.request));
});
