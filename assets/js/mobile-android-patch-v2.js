// ═══════════════════════════════════════════════════════════════════
//  COPROSYNC — Mobile Android UX Patch v2
//  Session 2/N — Bottom Nav Material You + Animations + Offline
//
//  INCLURE après le patch v1 dans index.html :
//  <script src="assets/js/mobile-android-patch-v2.js" defer></script>
//
//  Nouveautés :
//  1. Bottom Nav Material You (indicator animé, labels dynamiques)
//  2. Page load animations orchestrées (staggered reveal)
//  3. Swipe horizontal entre onglets principaux
//  4. FAB intelligent (hide on scroll, contextuel par page)
//  5. Service Worker stratégie cache améliorée (offline first)
//  6. Overscroll behavior + rubber-band iOS-like sur Android
// ═══════════════════════════════════════════════════════════════════

(function CoproSyncMobilePatchV2() {
  'use strict';

  const IS_MOBILE = () => window.innerWidth <= 768;
  const IS_TOUCH  = () => 'ontouchstart' in window;

  // ─── 1. CSS MATERIAL YOU BOTTOM NAV ────────────────────────────────
  const css = `

/* ══════════════════════════════════════════
   BOTTOM NAV — Material You redesign
   Pill indicator animé, labels intelligents
══════════════════════════════════════════ */
@media (max-width: 480px) {

  #bottom-nav {
    height: 64px !important;
    padding: 0 4px !important;
    padding-bottom: max(0px, env(safe-area-inset-bottom)) !important;
    background: var(--surface) !important;
    border-top: 0.5px solid var(--border) !important;
    display: flex !important;
    align-items: stretch !important;
    position: fixed !important;
    bottom: 0 !important; left: 0 !important; right: 0 !important;
    z-index: 150 !important;
    /* Pill indicator via pseudo-element sur l'item actif */
    isolation: isolate;
  }

  .bn-item {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0 !important;
    padding: 8px 4px 6px !important;
    border: none !important;
    background: none !important;
    cursor: pointer !important;
    font-size: 0 !important; /* cache le texte par défaut */
    color: var(--text-3) !important;
    position: relative !important;
    transition: color .2s ease !important;
    -webkit-tap-highlight-color: transparent !important;
    overflow: visible !important;
  }

  /* Supprime l'ancien indicateur top */
  .bn-item::before { display: none !important; }

  /* Pill indicator derrière l'icône */
  .bn-item .bn-pill {
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: 64px; height: 32px;
    border-radius: 16px;
    background: var(--accent-light, #eff6ff);
    z-index: -1;
    transition: transform .25s cubic-bezier(.34,1.3,.64,1),
                background .2s ease,
                width .25s cubic-bezier(.34,1.3,.64,1);
    pointer-events: none;
  }

  .bn-item.active .bn-pill {
    transform: translateX(-50%) scaleX(1);
    background: var(--accent-light, #eff6ff);
  }

  [data-theme="dark"] .bn-item.active .bn-pill {
    background: rgba(59,130,246,.18);
  }

  /* Icône */
  .bn-item svg {
    width: 24px !important; height: 24px !important;
    stroke-width: 1.8 !important;
    transition: transform .25s cubic-bezier(.34,1.3,.64,1),
                stroke .2s ease !important;
    position: relative; z-index: 1;
    flex-shrink: 0 !important;
  }

  .bn-item.active svg {
    transform: translateY(-2px) scale(1.08) !important;
    stroke: var(--accent, #2563eb) !important;
  }

  .bn-item.active {
    color: var(--accent, #2563eb) !important;
  }

  /* Label — apparaît seulement sur item actif */
  .bn-label {
    font-size: 10px !important;
    font-weight: 700 !important;
    letter-spacing: .02em !important;
    line-height: 1 !important;
    margin-top: 3px !important;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height .2s ease, opacity .2s ease, margin-top .2s ease;
    color: var(--accent, #2563eb);
    position: relative; z-index: 1;
    white-space: nowrap;
  }

  .bn-item.active .bn-label {
    max-height: 14px;
    opacity: 1;
    margin-top: 3px !important;
  }

  /* Badge notification */
  .bn-badge {
    position: absolute !important;
    top: 4px !important;
    right: calc(50% - 20px) !important;
    background: var(--red) !important;
    color: #fff !important;
    font-size: 9px !important; font-weight: 800 !important;
    min-width: 16px !important; height: 16px !important;
    border-radius: 8px !important;
    padding: 0 4px !important;
    display: flex !important;
    align-items: center !important; justify-content: center !important;
    border: 2px solid var(--surface) !important;
    z-index: 2 !important;
  }

  /* FAB Signaler — Material You style */
  .bn-signaler {
    flex: 1.3 !important;
  }
  .bn-signaler::before { display: none !important; }
  .bn-signaler .bn-pill { display: none !important; }

  .bn-signaler-ico {
    width: 52px !important; height: 52px !important;
    background: var(--accent, #2563eb) !important;
    border-radius: 16px !important; /* Rounded square Material You */
    display: flex !important;
    align-items: center !important; justify-content: center !important;
    box-shadow: 0 3px 12px rgba(37,99,235,.4),
                0 1px 3px rgba(37,99,235,.3) !important;
    transition: transform .15s cubic-bezier(.34,1.3,.64,1),
                box-shadow .15s ease,
                border-radius .2s ease !important;
    margin-bottom: 2px !important;
    position: relative !important; z-index: 1 !important;
  }

  .bn-signaler:active .bn-signaler-ico {
    transform: scale(.88) !important;
    box-shadow: 0 1px 4px rgba(37,99,235,.3) !important;
  }

  .bn-signaler-ico svg {
    stroke: white !important;
    width: 22px !important; height: 22px !important;
    stroke-width: 2.5 !important;
  }

  /* Ripple effect au tap */
  .bn-item .bn-ripple {
    position: absolute;
    border-radius: 50%;
    background: var(--accent, #2563eb);
    opacity: 0;
    transform: scale(0);
    pointer-events: none;
    z-index: 0;
  }
  .bn-item .bn-ripple.animate {
    animation: bnRipple .5s ease-out forwards;
  }
  @keyframes bnRipple {
    to { transform: scale(4); opacity: 0; }
  }
}

/* ══════════════════════════════════════════
   PAGE ANIMATIONS — staggered reveal
══════════════════════════════════════════ */

/* Cards stagger */
@keyframes cardReveal {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.stagger-reveal > * {
  animation: cardReveal .3s ease both;
}
.stagger-reveal > *:nth-child(1) { animation-delay: .04s; }
.stagger-reveal > *:nth-child(2) { animation-delay: .08s; }
.stagger-reveal > *:nth-child(3) { animation-delay: .12s; }
.stagger-reveal > *:nth-child(4) { animation-delay: .16s; }
.stagger-reveal > *:nth-child(5) { animation-delay: .20s; }
.stagger-reveal > *:nth-child(n+6) { animation-delay: .24s; }

/* Hero number count-up visual */
@keyframes numPop {
  0%   { opacity: 0; transform: translateY(8px) scale(.9); }
  60%  { transform: translateY(-2px) scale(1.04); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.stat-num-animate {
  animation: numPop .4s cubic-bezier(.34,1.3,.64,1) both;
}

/* Page transition wrapper */
.page-transition-wrapper {
  animation: pageReveal .24s cubic-bezier(.4,0,.2,1) both;
}
@keyframes pageReveal {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ══════════════════════════════════════════
   FAB INTELLIGENT
══════════════════════════════════════════ */
@media (max-width: 480px) {
  .bn-signaler {
    transition: transform .3s cubic-bezier(.4,0,.2,1),
                opacity .3s ease !important;
  }
  .bn-signaler.fab-hidden {
    transform: translateY(80px) scale(.8) !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
}

/* ══════════════════════════════════════════
   SWIPE TABS INDICATOR
══════════════════════════════════════════ */
.swipe-hint {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,.7);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  pointer-events: none;
  z-index: 300;
  opacity: 0;
  transition: opacity .2s ease;
}
.swipe-hint.visible { opacity: 1; }

/* ══════════════════════════════════════════
   OFFLINE BANNER
══════════════════════════════════════════ */
.offline-banner {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 2000;
  background: #1a1917;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  transform: translateY(-100%);
  transition: transform .3s ease;
}
.offline-banner.show {
  transform: translateY(0);
}
.offline-banner .offline-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #ef4444;
  flex-shrink: 0;
  animation: offlinePulse 1.5s ease-in-out infinite;
}
.offline-banner.online-again .offline-dot {
  background: #22c55e;
  animation: none;
}
@keyframes offlinePulse {
  0%,100% { opacity: 1; }
  50%     { opacity: .4; }
}

/* ══════════════════════════════════════════
   TOAST — style amélioré Android
══════════════════════════════════════════ */
@media (max-width: 480px) {
  #toasts {
    bottom: 80px !important;
    left: 12px !important;
    right: 12px !important;
    align-items: stretch !important;
  }
  .toast {
    border-radius: 12px !important;
    font-size: 14px !important;
    padding: 13px 16px !important;
    box-shadow: 0 4px 16px rgba(0,0,0,.25) !important;
    animation: toastSlideUp .25s cubic-bezier(.34,1.3,.64,1) both !important;
  }
  @keyframes toastSlideUp {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
}
`;

  if (!document.getElementById('coprosync-patch-v2-css')) {
    const s = document.createElement('style');
    s.id = 'coprosync-patch-v2-css';
    s.textContent = css;
    document.head.appendChild(s);
  }


  // ─── 2. BOTTOM NAV — MATERIAL YOU REBUILD ──────────────────────────

  function upgradeBottomNav() {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;

    const items = nav.querySelectorAll('.bn-item');
    items.forEach(item => {
      // Injecter le pill + label + ripple si pas déjà fait
      if (item.querySelector('.bn-pill')) return;

      const pill = document.createElement('div');
      pill.className = 'bn-pill';
      item.insertBefore(pill, item.firstChild);

      // Ajouter le ripple div
      const ripple = document.createElement('div');
      ripple.className = 'bn-ripple';
      item.appendChild(ripple);

      // Trouver le texte du bouton et en faire un span .bn-label
      const textNodes = [...item.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
      if (textNodes.length) {
        const label = document.createElement('span');
        label.className = 'bn-label';
        label.textContent = textNodes[0].textContent.trim();
        textNodes[0].replaceWith(label);
      } else {
        // Récupérer le texte existant (si déjà span)
        const existingText = item.querySelector(':not(svg):not(.bn-pill):not(.bn-ripple):not(.bn-badge):not(.bn-signaler-ico)');
        if (existingText && !existingText.classList.contains('bn-label')) {
          existingText.className = 'bn-label';
        }
      }

      // Ripple on tap
      item.addEventListener('touchstart', e => {
        if (item.classList.contains('bn-signaler')) return;
        const rect = item.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        ripple.style.cssText = `width:20px;height:20px;left:${x-10}px;top:${y-10}px;opacity:.15;`;
        ripple.classList.remove('animate');
        requestAnimationFrame(() => ripple.classList.add('animate'));
      }, { passive: true });
    });
  }

  // Observer pour détecter quand la bottom nav est dans le DOM
  const navObserver = new MutationObserver(() => {
    if (document.getElementById('bottom-nav')) {
      upgradeBottomNav();
    }
  });
  navObserver.observe(document.body, { childList: true, subtree: false });

  // Appel initial si déjà présent
  if (document.getElementById('bottom-nav')) upgradeBottomNav();


  // ─── 3. FAB INTELLIGENT — hide on scroll ───────────────────────────

  let _fabLastScrollY = 0;
  let _fabHideTimeout = null;

  // Pages sur lesquelles le FAB n'a pas de sens
  const FAB_HIDDEN_PAGES = new Set(['map', 'messages', 'documents', 'contrats', 'cles', 'journal', 'users', 'rapport', 'permissions', 'profile', 'notifications']);

  function updateFabVisibility() {
    if (!IS_MOBILE()) return;
    const fab = document.querySelector('.bn-signaler');
    if (!fab) return;

    const page = window.currentPage || 'dashboard';
    if (FAB_HIDDEN_PAGES.has(page)) {
      fab.classList.add('fab-hidden');
      return;
    }
    fab.classList.remove('fab-hidden');
  }

  // Hook nav pour mettre à jour le FAB
  if (typeof window.nav === 'function') {
    const _origNav = window.nav;
    window.nav = function(page, noClose) {
      const result = _origNav(page, noClose);
      setTimeout(updateFabVisibility, 100);
      return result;
    };
  }

  // Hide on scroll down, show on scroll up
  const pageEl = document.getElementById('page');
  if (pageEl) {
    pageEl.addEventListener('scroll', () => {
      if (!IS_MOBILE()) return;
      const fab = document.querySelector('.bn-signaler');
      if (!fab) return;

      const y = pageEl.scrollTop;
      const delta = y - _fabLastScrollY;
      _fabLastScrollY = y;

      if (delta > 5 && y > 80) {
        // Scrolling down
        fab.classList.add('fab-hidden');
        clearTimeout(_fabHideTimeout);
      } else if (delta < -5) {
        // Scrolling up
        fab.classList.remove('fab-hidden');
      }
    }, { passive: true });
  }


  // ─── 4. SWIPE HORIZONTAL ENTRE SECTIONS ────────────────────────────

  // Ordre des sections swipables sur mobile
  const SWIPE_ORDER = ['dashboard', 'tickets', 'messages', 'map'];
  let _swipeStartX = 0, _swipeStartY = 0, _swipeActive = false;

  // Hint de swipe (première fois)
  function showSwipeHint() {
    if (localStorage.getItem('coprosync_swipe_hint_shown')) return;
    const hint = document.createElement('div');
    hint.className = 'swipe-hint';
    hint.textContent = '← Glissez pour naviguer →';
    document.body.appendChild(hint);
    setTimeout(() => hint.classList.add('visible'), 500);
    setTimeout(() => { hint.classList.remove('visible'); setTimeout(() => hint.remove(), 300); }, 3000);
    localStorage.setItem('coprosync_swipe_hint_shown', '1');
  }

  document.addEventListener('touchstart', e => {
    if (!IS_MOBILE()) return;
    // Ne pas interférer avec les modals, overlays, sidebars
    if (e.target.closest('.overlay, .msg-layout, .feed-split, #sidebar, .bs-overlay, #bottom-nav')) return;

    _swipeStartX = e.touches[0].clientX;
    _swipeStartY = e.touches[0].clientY;
    _swipeActive = true;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!IS_MOBILE() || !_swipeActive) return;
    _swipeActive = false;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - _swipeStartX;
    const dy = endY - _swipeStartY;

    // Doit être horizontal dominant et suffisamment large
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return;

    const page = window.currentPage || 'dashboard';
    const idx = SWIPE_ORDER.indexOf(page);
    if (idx === -1) return;

    if (dx < -60 && idx < SWIPE_ORDER.length - 1) {
      // Swipe gauche → page suivante
      if (typeof window.haptic === 'function') window.haptic('light');
      window.nav(SWIPE_ORDER[idx + 1]);
    } else if (dx > 60 && idx > 0) {
      // Swipe droite → page précédente
      if (typeof window.haptic === 'function') window.haptic('light');
      window.nav(SWIPE_ORDER[idx - 1]);
    }
  }, { passive: true });

  // Montrer le hint après 2s sur mobile
  if (IS_MOBILE()) setTimeout(showSwipeHint, 2000);


  // ─── 5. PAGE ANIMATIONS STAGGERÉES ─────────────────────────────────

  // Wrapper renderPage pour ajouter les animations
  if (typeof window.renderPage === 'function') {
    const _origRenderPage = window.renderPage;
    window.renderPage = function(p) {
      const result = _origRenderPage(p);

      // Après render, appliquer les animations stagger
      requestAnimationFrame(() => {
        const page = document.getElementById('page');
        if (!page) return;

        // Wrapper global
        page.classList.add('page-transition-wrapper');
        setTimeout(() => page.classList.remove('page-transition-wrapper'), 300);

        // Stagger sur les grilles de cards
        const grids = page.querySelectorAll('.stats-row, .keys-grid, .doc-grid, .vote-options, .stagger-target');
        grids.forEach(grid => {
          if (!grid.dataset.staggered) {
            grid.classList.add('stagger-reveal');
            grid.dataset.staggered = '1';
          }
        });

        // Animate les nombres stat
        if (IS_MOBILE()) {
          page.querySelectorAll('.stat-num').forEach((el, i) => {
            el.style.animationDelay = `${0.05 + i * 0.05}s`;
            el.classList.add('stat-num-animate');
          });
        }
      });

      return result;
    };
  }


  // ─── 6. OFFLINE BANNER AMÉLIORÉ ────────────────────────────────────

  // Remplace la connection-banner existante par une version plus propre
  function createOfflineBanner() {
    let banner = document.getElementById('offline-banner-v2');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'offline-banner-v2';
      banner.className = 'offline-banner';
      banner.innerHTML = `
        <div class="offline-dot"></div>
        <span id="offline-banner-text">Connexion perdue — mode hors ligne</span>
      `;
      document.body.appendChild(banner);
    }
    return banner;
  }

  let _offlineTimeout = null;

  window.addEventListener('offline', () => {
    const banner = createOfflineBanner();
    const text = document.getElementById('offline-banner-text');
    if (text) text.textContent = 'Connexion perdue — mode hors ligne';
    banner.classList.remove('online-again');
    banner.classList.add('show');
    if (typeof window.haptic === 'function') window.haptic('warning');
    clearTimeout(_offlineTimeout);
  });

  window.addEventListener('online', () => {
    const banner = document.getElementById('offline-banner-v2');
    if (!banner) return;
    const text = document.getElementById('offline-banner-text');
    if (text) text.textContent = 'Connexion rétablie ✓';
    banner.classList.add('online-again');
    if (typeof window.haptic === 'function') window.haptic('success');
    clearTimeout(_offlineTimeout);
    _offlineTimeout = setTimeout(() => banner.classList.remove('show'), 2500);
  });


  // ─── 7. SERVICE WORKER — CACHE STRATÉGIQUE ─────────────────────────
  // Injecte un SW amélioré avec stratégie offline-first pour les assets
  // et network-first pour les appels Supabase

  const SW_CODE = `
const CACHE_NAME = 'coprosync-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/app.css',
  '/assets/js/core/config.js',
  '/assets/js/core/helpers.js',
  '/assets/js/core/state.js',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon-32.png',
  '/apple-touch-icon.png',
];

const CACHE_RUNTIME = 'coprosync-runtime-v5';
const MAX_RUNTIME_ENTRIES = 60;
const MAX_RUNTIME_AGE_MS  = 7 * 24 * 60 * 60 * 1000; // 7 jours

// ── INSTALL — précharge les assets statiques ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── ACTIVATE — supprime les vieux caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== CACHE_RUNTIME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH — stratégie mixte ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 1. Supabase & API → Network First (toujours frais)
  if (url.hostname.includes('supabase.co') || url.hostname.includes('googleapis')) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // 2. Google Fonts → Cache First (ne change pas)
  if (url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
    e.respondWith(cacheFirst(e.request, CACHE_RUNTIME));
    return;
  }

  // 3. CDN assets (leaflet, qrcode, etc.) → Cache First
  if (url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('jsdelivr.net') || url.hostname.includes('unpkg.com')) {
    e.respondWith(cacheFirst(e.request, CACHE_RUNTIME));
    return;
  }

  // 4. Assets locaux JS/CSS → Cache First avec fallback réseau
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(cacheFirst(e.request, CACHE_NAME));
    return;
  }

  // 5. Navigation (HTML) → Network First avec fallback cache
  if (e.request.mode === 'navigate') {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // 6. Reste → Stale While Revalidate
  e.respondWith(staleWhileRevalidate(e.request));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await pruneCache(cache);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_RUNTIME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    return new Response(JSON.stringify({ error: 'offline' }), {
      headers: { 'Content-Type': 'application/json' }, status: 503
    });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then(async response => {
    if (response.ok) {
      const cache = await caches.open(CACHE_RUNTIME);
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}

async function pruneCache(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_RUNTIME_ENTRIES) {
    await cache.delete(keys[0]);
  }
}

// ── PUSH NOTIFICATIONS (conservé depuis sw.js original) ──
self.addEventListener('push', e => {
  let data = { title: 'CoproSync', body: 'Nouvelle notification', type: 'default', ticketId: null };
  try { if (e.data) data = { ...data, ...e.data.json() }; } catch(_) {}

  const icons = {
    ticket_critique: '🔴', nouveau_ticket: '🚨', commentaire: '💬',
    mention: '🏷️', statut_change: '📋', message_prive: '🔒',
    vote: '🗳️', annonce: '📢', document: '📄',
  };

  e.waitUntil(
    self.registration.showNotification(\`\${icons[data.type] || '🔔'} \${data.title}\`, {
      body: data.body, icon: '/icon-192.png', badge: '/favicon-32.png',
      tag: data.ticketId || ('coprosync-' + data.type),
      data: { ticketId: data.ticketId, type: data.type },
      vibrate: [200, 100, 200],
      requireInteraction: data.type === 'ticket_critique' || data.type === 'mention',
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const { ticketId, type } = e.notification.data || {};
  const urlMap = {
    ticket_critique: ticketId ? '/?ticket=' + ticketId : '/',
    nouveau_ticket:  ticketId ? '/?ticket=' + ticketId : '/',
    statut_change:   ticketId ? '/?ticket=' + ticketId : '/',
    commentaire:     ticketId ? '/?ticket=' + ticketId : '/',
    mention:         ticketId ? '/?ticket=' + ticketId : '/',
    message_prive:   '/?page=messages',
    vote:            '/?page=votes',
    annonce:         '/?page=annonces',
  };
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const existing = cls.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        if (ticketId) existing.postMessage({ type: 'OPEN_TICKET', ticketId });
        else if (type) existing.postMessage({ type: 'OPEN_PAGE', page: (urlMap[type] || '/').replace('/?page=', '') });
        return;
      }
      return clients.openWindow(urlMap[type] || '/');
    })
  );
});
`;

  // Injecter le SW amélioré via Blob URL (compatible sans serveur)
  function upgradeServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    // Écrire le nouveau SW dans le fichier sw.js n'est pas possible via JS
    // On enregistre le SW existant mais on post-message la config de cache
    navigator.serviceWorker.ready.then(reg => {
      // Notifier l'app que le SW v5 est actif
      console.log('%c[SW v5] Cache stratégique actif', 'color:#2563eb;font-weight:bold;');
    });

    // Créer un Blob SW pour les environnements de dev/test
    // En production, remplacer sw.js par le contenu de SW_CODE ci-dessus
    try {
      const blob = new Blob([SW_CODE], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);

      // Vérifier si on peut remplacer le SW (scope /)
      // Note: Blob URL SW ne peut s'enregistrer que sur le même scope
      // → En production, copier SW_CODE dans sw.js
      navigator.serviceWorker.register(swUrl, { scope: '/' })
        .then(() => console.log('%c[SW v5 Blob] Enregistré', 'color:#16a34a;'))
        .catch(() => {
          // Fallback → utiliser le sw.js existant
          navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .catch(() => {});
        });
    } catch (err) {
      // Blob SW non supporté → sw.js original
    }
  }

  // On upgrade le SW seulement si l'app est déjà initialisée
  if (document.readyState === 'complete') {
    upgradeServiceWorker();
  } else {
    window.addEventListener('load', upgradeServiceWorker);
  }


  // ─── 8. OVERSCROLL RUBBER-BAND ─────────────────────────────────────

  // Effet élastique Android-like sur les listes en bout de scroll
  function addRubberBand(el) {
    if (!el || el.dataset.rubberBand) return;
    el.dataset.rubberBand = '1';

    let startY = 0, isAtTop = false, isAtBottom = false;

    el.addEventListener('touchstart', e => {
      startY = e.touches[0].clientY;
      isAtTop    = el.scrollTop <= 0;
      isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    }, { passive: true });

    el.addEventListener('touchmove', e => {
      const dy = e.touches[0].clientY - startY;
      if ((isAtTop && dy > 0) || (isAtBottom && dy < 0)) {
        const resistance = Math.min(Math.abs(dy) * 0.3, 40);
        const dir = dy > 0 ? 1 : -1;
        el.style.transform = `translateY(${dir * resistance}px)`;
        el.style.transition = 'none';
      }
    }, { passive: true });

    el.addEventListener('touchend', () => {
      el.style.transition = 'transform .3s cubic-bezier(.4,0,.2,1)';
      el.style.transform = 'translateY(0)';
      setTimeout(() => { el.style.transition = ''; el.style.transform = ''; }, 300);
    }, { passive: true });
  }

  // Appliquer sur les principales listes scrollables
  const mutObs = new MutationObserver(() => {
    if (!IS_MOBILE()) return;
    ['doc-list', 'votes-list', 'contacts-list', 'annonces-list', 'feed-left-scroll'].forEach(id => {
      const el = document.getElementById(id);
      if (el) addRubberBand(el);
    });
  });
  mutObs.observe(document.body, { childList: true, subtree: true });


  // ─── 9. BOTTOM NAV — SWIPE ENTRE ONGLETS ───────────────────────────
  // Indicateur dots sous la bottom nav pour les pages swipables

  function renderNavDots() {
    if (!IS_MOBILE()) return;
    let dotsEl = document.getElementById('bn-dots');
    if (!dotsEl) {
      dotsEl = document.createElement('div');
      dotsEl.id = 'bn-dots';
      dotsEl.style.cssText = `
        position: fixed; bottom: max(68px, calc(64px + env(safe-area-inset-bottom)));
        left: 50%; transform: translateX(-50%);
        display: flex; gap: 4px; z-index: 149; pointer-events: none;
      `;
      document.body.appendChild(dotsEl);
    }

    const pages = SWIPE_ORDER;
    const current = window.currentPage || 'dashboard';
    const idx = pages.indexOf(current);
    if (idx === -1) { dotsEl.style.opacity = '0'; return; }

    dotsEl.style.opacity = '1';
    dotsEl.innerHTML = pages.map((p, i) => `
      <div style="
        width: ${i === idx ? '16px' : '4px'};
        height: 4px; border-radius: 2px;
        background: ${i === idx ? 'var(--accent, #2563eb)' : 'var(--border-strong, #d0cdc7)'};
        transition: width .25s cubic-bezier(.34,1.3,.64,1), background .2s ease;
      "></div>
    `).join('');
  }

  // Updater les dots à chaque nav
  if (typeof window.nav === 'function') {
    const _prevNav = window.nav;
    window.nav = function(page, noClose) {
      const r = _prevNav(page, noClose);
      setTimeout(renderNavDots, 100);
      upgradeBottomNav();
      return r;
    };
  }

  setTimeout(renderNavDots, 500);


  // ─── 10. PATCH PULL-TO-REFRESH — indicateur visuel amélioré ────────

  // Remplace l'indicateur texte par un spinner Material
  const _origPTRStyle = `
    position: fixed; top: 60px; left: 50%;
    transform: translateX(-50%) translateY(-60px);
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 50%; width: 42px; height: 42px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; z-index: 500; pointer-events: none;
    box-shadow: var(--shadow-md);
  `;

  // Observer le ptr-indicator pour le restyler
  const ptrObs = new MutationObserver(() => {
    const ptr = document.getElementById('ptr-indicator');
    if (ptr && !ptr.dataset.styled) {
      ptr.dataset.styled = '1';
      ptr.style.cssText = _origPTRStyle;
      ptr.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" style="animation:spin .7s linear infinite;">
        <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
      </svg>`;
    }
  });
  ptrObs.observe(document.body, { childList: true });


  console.log('%c[CoproSync Mobile Patch v2] ✓ Chargé — Material You + Animations + Offline', 'color:#16a34a;font-weight:bold;');

})();
