// CoproSync Service Worker v4 PRO — Cache SPA & Push Notifications
const CACHE_NAME = 'coprosync-v4';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/app.css',
  '/icon-192.png',
  '/favicon-32.png'
];

self.addEventListener('install', e => {
  // Force l'installation immédiate du nouveau SW
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', e => {
  // Nettoie les anciens caches
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// ── STRATÉGIE DE CACHE & ROUTAGE SPA ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 1. Ignorer Supabase (Ne jamais mettre en cache les requêtes BDD)
  if (url.hostname.includes('supabase.co')) return;
  // Ignorer les requêtes d'extension Chrome
  if (url.protocol === 'chrome-extension:') return;

  // 2. Navigation SPA (Fix pour les URL du type /?p=map)
  // Si c'est une requête de navigation, on retourne TOUJOURS l'index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/index.html').then(cachedResponse => {
        return cachedResponse || fetch(e.request);
      }).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // 3. Stale-While-Revalidate pour les assets (CSS, JS, Images)
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      // S'il n'est pas dans le cache, on le télécharge
      return fetch(e.request).then(networkResponse => {
        // Ne mettre en cache que les vrais fichiers valides
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Clonage car on ne peut utiliser une response qu'une seule fois
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      }).catch(error => {
        console.warn('[SW] Fetch failed:', error);
      });
    })
  );
});

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', e => {
  let data = { title: 'CoproSync', body: 'Nouvelle notification', type: 'info', ticketId: null };
  try { 
    if (e.data) data = { ...data, ...e.data.json() }; 
  } catch(_) {}

  const icons = { critique:'🔴', mention:'🏷', commentaire:'💬', statut_change:'📋', nouveau_ticket:'🚨' };
  const icon = icons[data.type] || '🔔';

  e.waitUntil(
    self.registration.showNotification(`${icon} ${data.title}`, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/favicon-32.png',
      tag: data.ticketId || 'coprosync_general',
      data: { ticketId: data.ticketId },
      vibrate: [200, 100, 200],
      requireInteraction: data.type === 'critique' || data.type === 'mention',
    })
  );
});

// ── CLIC SUR NOTIF → Ouvre l'app ou focus l'onglet existant ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  
  const ticketId = e.notification.data?.ticketId;
  const url = ticketId ? `/?p=tickets&open=${ticketId}` : '/';
  
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Cherche si l'application est déjà ouverte dans un onglet
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (ticketId) {
            // Envoi un message au frontend pour qu'il ouvre la modale du ticket
            client.postMessage({ type: 'OPEN_TICKET', ticketId });
          }
          return;
        }
      }
      // Si aucun onglet ouvert, on ouvre une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});