/*
  Baccarim Systems - Service Worker
  Suporte a PWA: cache offline + push notifications
*/

const CACHE_NAME = 'baccarim-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// ── Instalação: pré-cache dos assets estáticos ──
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignora erros de cache individual (assets externos, etc)
      });
    })
  );
});

// ── Ativação: limpa caches antigos ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Network-first com fallback para cache ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Não intercepta requests para Supabase, APIs externas ou outros origins
  if (
    url.origin !== self.location.origin ||
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Salva no cache somente respostas válidas
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: tenta servir do cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback para a página principal (SPA)
          return caches.match('/index.html');
        });
      })
  );
});

// ── Push Notifications ──
self.addEventListener('push', (event) => {
  let data = { title: 'Baccarim Systems', body: 'Nova notificação de prazo fatal.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Baccarim Systems', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/api/app-icon.png',
    badge: '/api/app-icon.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Notification Click ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  const urlToOpen = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (let client of clients) {
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      for (let client of clients) {
        if ('focus' in client) {
          return client.focus().then((c) => {
            if ('navigate' in c) return c.navigate(urlToOpen);
          });
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
    })
  );
});
