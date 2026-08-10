// This service worker previously cached the old Vite build's app shell.
// After the Next.js migration, any browser that still has the old version
// installed keeps serving that stale, now-broken shell forever (it
// references a hashed JS bundle path that no longer exists post-migration).
// This version self-destructs: it wipes all caches, unregisters itself,
// and forces every open tab to reload straight from the network.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      })
  );
});
