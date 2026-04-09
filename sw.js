// CoproSync Service Worker v5 PRO — Cache SPA & Push Notifications
const CACHE_NAME = 'coprosync-v5'; // <-- BUMP VERSION POUR PURGER L'ANCIEN CACHE
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
  // Nettoie TOUS les anciens caches (ex: v4)
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

  // 2. Navigation SPA (index.html) -> NETWORK FIRST (Toujours avoir la dernière version de l'app)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // Si hors-ligne, on fallback sur le cache
        return caches.match('/index.html');
      })
    );
    return;
  }

  // 3. Assets (JS, CSS, Images) -> VRAI Stale-While-Revalidate
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cachedResponse => {
      // On lance la requête réseau en tâche de fond pour mettre à jour le cache
      const fetchPromise = fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(error => {
        console.warn('[SW] Fetch failed:', error);
      });

      // On retourne le cache DIRECTEMENT s'il existe (hyper rapide)
      // ET la requête en fond (fetchPromise) va mettre à jour le cache pour le coup d'après !
      // S'il n'y a pas de cache, on attend le fetch (premier chargement).
      return cachedResponse || fetchPromise;
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
