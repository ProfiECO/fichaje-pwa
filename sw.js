// Caches the app shell so it opens offline; API calls (other paths/origins) always go to the network.
const CACHE = "fichaje-v1";
const SHELL = ["./", "index.html", "app.css", "app.js", "api.js", "time.js", "manifest.webmanifest", "icons/icon-192.png"];

self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))));
self.addEventListener("activate", (e) =>
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
);
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || !SHELL.some((p) => url.pathname.endsWith(p.replace("./", "/"))))
    return;
  // Network first so updates show up, cache when offline.
  e.respondWith(
    fetch(e.request)
      .then((res) => (caches.open(CACHE).then((c) => c.put(e.request, res.clone())), res))
      .catch(() => caches.match(e.request))
  );
});
