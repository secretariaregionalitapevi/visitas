// Temporary self-unregistering service worker to mitigate bad cached SW from extensions
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Attempt to immediately unregister ourselves and claim clients
  event.waitUntil((async () => {
    try {
      await self.clients.claim();
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        // reload client pages so they fetch from network instead of old SW
        try { client.navigate(client.url); } catch (e) {}
      }
    } catch (e) {
      // swallow errors
      console.error('sw self-unregister failed', e);
    }
  })());
});

// Basic fetch passthrough (should not be used long-term)
self.addEventListener('fetch', (event) => {
  // Let requests go to network
  event.respondWith(fetch(event.request).catch(() => new Response('{"ok":false}', { headers: { 'Content-Type': 'application/json' } })));
});
