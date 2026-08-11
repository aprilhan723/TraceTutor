const CACHE_VERSION = "tracetutor-shell-v6";
const SHELL_ROUTES = [
  "/",
  "/demo",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_ROUTES)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("tracetutor-") && key !== CACHE_VERSION,
            )
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

function isSafeGet(request, url) {
  return request.method === "GET" && url.origin === self.location.origin;
}

function canStore(response) {
  const cacheControl = response.headers.get("cache-control") || "";
  const cacheableDemo =
    response.headers.get("x-tracetutor-cacheable-demo") === "1";
  return (
    response.ok &&
    (cacheableDemo ||
      (!cacheControl.includes("private") && !cacheControl.includes("no-store")))
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    !isSafeGet(request, url) ||
    url.pathname.startsWith("/_next/webpack-hmr")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (canStore(response)) {
            const copy = response.clone();
            void caches
              .open(CACHE_VERSION)
              .then((cache) => cache.put(request, copy));
          } else {
            void caches
              .open(CACHE_VERSION)
              .then((cache) => cache.delete(request));
          }
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match(url.pathname)) ||
            (await caches.match("/offline"))
          );
        }),
    );
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (canStore(response)) {
              const copy = response.clone();
              void caches
                .open(CACHE_VERSION)
                .then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_URL" || typeof event.data.url !== "string") {
    return;
  }
  const url = new URL(event.data.url, self.location.origin);
  if (url.origin !== self.location.origin) return;
  event.waitUntil(
    fetch(url.toString(), { credentials: "same-origin" }).then((response) => {
      if (!canStore(response)) return undefined;
      return caches
        .open(CACHE_VERSION)
        .then((cache) => cache.put(url.toString(), response));
    }),
  );
});
