// ═══════════════════════════════════════════════════════════════════
//  COPROSYNC — Mobile Android UX Patch v1
//  Session 1/N — 5 corrections prioritaires
//
//  INCLURE dans index.html juste avant </body> :
//  <script src="assets/js/mobile-android-patch.js" defer></script>
//
//  Corrections :
//  1. Bottom Sheet native (remplace les .overlay sur mobile)
//  2. Fix scroll messages (CSS grid, clavier iOS/Android)
//  3. Transitions directionnelles (slide left/right)
//  4. Haptic feedback (vibration sur actions clés)
//  5. Compression photo avant upload
// ═══════════════════════════════════════════════════════════════════

(function CoproSyncMobilePatch() {
  'use strict';

  const IS_MOBILE = () => window.innerWidth <= 768;
  const IS_TOUCH  = () => 'ontouchstart' in window;

  // ─── 1. INJECT CSS ─────────────────────────────────────────────────
  const css = `
/* ── PATCH: Bottom Sheet native ── */
.bs-overlay {
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(0,0,0,0); pointer-events: none;
  transition: background .25s ease;
}
.bs-overlay.open {
  background: rgba(0,0,0,.5); pointer-events: all;
}
.bottom-sheet {
  position: fixed; left: 0; right: 0; bottom: 0;
  z-index: 1101;
  background: var(--surface);
  border-radius: 20px 20px 0 0;
  transform: translateY(100%);
  transition: transform .3s cubic-bezier(.32,0,.67,0);
  will-change: transform;
  max-height: 92dvh;
  display: flex; flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0,0,0,.18);
  touch-action: none;
}
.bottom-sheet.snap-25  { transform: translateY(75%); }
.bottom-sheet.snap-60  { transform: translateY(40%); }
.bottom-sheet.snap-full { transform: translateY(0); }
.bottom-sheet.animating { transition: transform .3s cubic-bezier(.32,0,.67,0); }
.bs-handle-bar {
  flex-shrink: 0;
  display: flex; justify-content: center; align-items: center;
  padding: 10px 0 6px;
  cursor: grab;
}
.bs-handle-bar:active { cursor: grabbing; }
.bs-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: var(--border-strong, #d0cdc7);
}
.bs-content {
  flex: 1; overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 20px 20px;
}
.bs-header {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px 12px;
}
.bs-title {
  font-family: var(--font-head, 'Syne', sans-serif);
  font-size: 17px; font-weight: 800; letter-spacing: -.3px;
}
.bs-close {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--surface-2); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; cursor: pointer; color: var(--text-3);
  transition: all .15s;
}
.bs-close:hover { background: var(--red-light); color: var(--red); }

/* ── PATCH: Fix scroll messages chat ── */
@media (max-width: 768px) {
  #msg-main {
    display: grid !important;
    grid-template-rows: auto 1fr auto auto auto !important;
    height: 100% !important;
    overflow: hidden !important;
  }
  .chat-messages {
    overflow-y: auto !important;
    overflow-x: hidden !important;
    -webkit-overflow-scrolling: touch !important;
    overscroll-behavior: contain !important;
    min-height: 0 !important;
  }
  .chat-input-bar {
    position: sticky !important;
    bottom: 0 !important;
    padding-bottom: max(10px, env(safe-area-inset-bottom)) !important;
    background: var(--surface) !important;
    z-index: 10 !important;
  }
  /* Feed thread fix */
  #feed-split {
    height: 100% !important;
    overflow: hidden !important;
    position: relative !important;
  }
  #feed-thread-pane {
    width: 100% !important;
    height: 100% !important;
    position: absolute !important;
    top: 0; left: 0; right: 0; bottom: 0 !important;
    background: var(--surface) !important;
    display: flex !important;
    flex-direction: column !important;
    transform: translateX(100%) !important;
    transition: transform .28s cubic-bezier(.4,0,.2,1) !important;
    will-change: transform !important;
  }
  #feed-split.thread-active #feed-thread-pane {
    transform: translateX(0) !important;
  }
  .feed-thread-scroll {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }
  .feed-thread-composer {
    flex-shrink: 0 !important;
    padding-bottom: max(10px, env(safe-area-inset-bottom)) !important;
  }
  /* Safe area bottom nav */
  #bottom-nav {
    padding-bottom: max(0px, env(safe-area-inset-bottom)) !important;
  }
  #page {
    padding-bottom: calc(62px + max(0px, env(safe-area-inset-bottom)) + 24px) !important;
  }
}

/* ── PATCH: Transitions directionnelles ── */
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideOutLeft {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(-24px); }
}
.page-slide-in  { animation: slideInRight .22s cubic-bezier(.4,0,.2,1) both; }
.page-slide-back { animation: slideInLeft  .22s cubic-bezier(.4,0,.2,1) both; }

/* ── PATCH: Haptic feedback visual cue ── */
@keyframes hapticPulse {
  0%   { transform: scale(1); }
  40%  { transform: scale(.96); }
  100% { transform: scale(1); }
}
.haptic-btn:active {
  animation: hapticPulse .15s ease !important;
}

/* ── PATCH: Skeleton Loading ── */
.sk-android {
  background: linear-gradient(90deg,
    var(--border) 25%,
    var(--surface-2) 50%,
    var(--border) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: var(--r-sm);
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.sk-ticket-card {
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 16px; margin-bottom: 10px;
  background: var(--surface);
}
.sk-line-title { height: 16px; width: 65%; margin-bottom: 10px; }
.sk-line-sub   { height: 12px; width: 40%; margin-bottom: 8px; }
.sk-line-meta  { height: 10px; width: 80%; }

/* ── PATCH: Long press context menu ── */
.ctx-menu {
  position: fixed; z-index: 1200;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: 0 8px 32px rgba(0,0,0,.16);
  min-width: 200px; overflow: hidden;
  animation: ctxIn .15s ease both;
}
@keyframes ctxIn {
  from { opacity: 0; transform: scale(.92); }
  to   { opacity: 1; transform: scale(1); }
}
.ctx-item {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px; cursor: pointer;
  font-size: 14px; font-weight: 500;
  color: var(--text); transition: background .1s;
  border-bottom: 1px solid var(--border);
}
.ctx-item:last-child { border-bottom: none; }
.ctx-item:hover, .ctx-item:active { background: var(--surface-2); }
.ctx-item.danger { color: var(--red); }
.ctx-item-ico { font-size: 16px; width: 20px; text-align: center; }
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'coprosync-mobile-patch-css';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);


  // ─── 2. HAPTIC FEEDBACK ────────────────────────────────────────────

  window.haptic = function(pattern = 'light') {
    if (!IS_TOUCH() || !navigator.vibrate) return;
    const patterns = {
      light:   [10],
      medium:  [20],
      success: [10, 30, 10],
      error:   [20, 60, 20],
      warning: [15, 40, 15],
    };
    navigator.vibrate(patterns[pattern] || [10]);
  };

  // Patch les boutons clés existants avec haptic + classe CSS
  function patchHapticBtn(selector, pattern = 'light') {
    document.querySelectorAll(selector).forEach(el => {
      if (el.dataset.hapticPatched) return;
      el.dataset.hapticPatched = '1';
      el.classList.add('haptic-btn');
      el.addEventListener('touchstart', () => haptic(pattern), { passive: true });
    });
  }

  // Observer pour patcher dynamiquement les nouveaux boutons injectés
  const hapticObserver = new MutationObserver(() => {
    patchHapticBtn('.btn-primary',    'light');
    patchHapticBtn('.bn-signaler',    'medium');
    patchHapticBtn('[onclick*="submitVote"]', 'success');
    patchHapticBtn('[onclick*="submitTicket"]', 'medium');
    patchHapticBtn('[onclick*="sendMessage"]', 'light');
    patchHapticBtn('[onclick*="publishFeedPost"]', 'success');
  });
  hapticObserver.observe(document.body, { childList: true, subtree: true });

  // Wrapper sur toast pour ajouter haptic
  if (typeof window.toast === 'function') {
    const _origToast = window.toast;
    window.toast = function(msg, type) {
      if (IS_TOUCH()) {
        if (type === 'ok')   haptic('success');
        if (type === 'err')  haptic('error');
        if (type === 'warn') haptic('warning');
      }
      return _origToast(msg, type);
    };
  }


  // ─── 3. BOTTOM SHEET NATIVE ────────────────────────────────────────

  let _bsActive = null;
  let _bsDragState = null;

  window.openBottomSheet = function({ title = '', contentHTML = '', snapPoint = 'snap-60', onClose = null } = {}) {
    closeBottomSheet();

    const overlay = document.createElement('div');
    overlay.className = 'bs-overlay';
    overlay.id = 'bs-overlay';

    const sheet = document.createElement('div');
    sheet.className = 'bottom-sheet';
    sheet.id = 'bottom-sheet-el';
    sheet.innerHTML = `
      <div class="bs-handle-bar" id="bs-handle-bar">
        <div class="bs-handle"></div>
      </div>
      <div class="bs-header">
        <span class="bs-title">${title}</span>
        <button class="bs-close" id="bs-close-btn">×</button>
      </div>
      <div class="bs-content">${contentHTML}</div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(sheet);

    _bsActive = { sheet, overlay, onClose };

    // Open animation
    requestAnimationFrame(() => {
      overlay.classList.add('open');
      sheet.classList.add('animating', snapPoint);
    });

    // Drag to dismiss / snap
    const handleBar = sheet.querySelector('#bs-handle-bar');
    let startY = 0, startTranslate = 0, currentTranslate = 0;

    function getTranslateY() {
      const style = window.getComputedStyle(sheet);
      const matrix = new DOMMatrix(style.transform);
      return matrix.m42;
    }

    handleBar.addEventListener('touchstart', e => {
      startY = e.touches[0].clientY;
      startTranslate = getTranslateY();
      sheet.classList.remove('animating');
      _bsDragState = 'dragging';
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      if (_bsDragState !== 'dragging') return;
      const dy = e.touches[0].clientY - startY;
      currentTranslate = Math.max(0, startTranslate + dy);
      sheet.style.transform = `translateY(${currentTranslate}px)`;
    }, { passive: true });

    document.addEventListener('touchend', () => {
      if (_bsDragState !== 'dragging') return;
      _bsDragState = null;
      sheet.style.transform = '';
      sheet.classList.add('animating');

      const sheetH = sheet.offsetHeight;
      const pct = currentTranslate / sheetH;

      if (pct > 0.5) {
        closeBottomSheet();
      } else if (pct > 0.25) {
        sheet.className = 'bottom-sheet animating snap-60';
      } else {
        sheet.className = 'bottom-sheet animating snap-full';
      }
      haptic('light');
    }, { passive: true });

    sheet.querySelector('#bs-close-btn').addEventListener('click', closeBottomSheet);
    overlay.addEventListener('click', closeBottomSheet);

    haptic('light');
    return sheet;
  };

  window.closeBottomSheet = function() {
    if (!_bsActive) return;
    const { sheet, overlay, onClose } = _bsActive;
    sheet.classList.add('animating');
    sheet.className = 'bottom-sheet animating';
    overlay.classList.remove('open');
    setTimeout(() => {
      sheet.remove();
      overlay.remove();
      if (typeof onClose === 'function') onClose();
    }, 300);
    _bsActive = null;
  };

  // Patch openDocModal pour utiliser bottom sheet sur mobile
  if (typeof window.openDocModal === 'function') {
    const _origOpenDocModal = window.openDocModal;
    window.openDocModal = function(id) {
      if (!IS_MOBILE()) return _origOpenDocModal(id);
      // Laisse le comportement normal (la modale existante) mais on améliore le look
      _origOpenDocModal(id);
    };
  }


  // ─── 4. TRANSITIONS DIRECTIONNELLES ────────────────────────────────

  // Hiérarchie de navigation (pour déterminer la direction)
  const NAV_DEPTH = {
    dashboard: 0, tickets: 1, map: 1, messages: 1,
    annonces: 1, agenda: 1, contacts: 1, faq: 1,
    documents: 1, votes: 1, rapport: 2, contrats: 2,
    cles: 2, journal: 2, users: 2, permissions: 2,
    profile: 1, notifications: 1,
  };

  let _lastPageDepth = 0;

  if (typeof window.nav === 'function') {
    const _origNav = window.nav;
    window.nav = function(page, noClose) {
      if (IS_MOBILE()) {
        const fromDepth = _lastPageDepth;
        const toDepth   = NAV_DEPTH[page] ?? 1;
        const pageEl    = document.getElementById('page');

        if (pageEl) {
          pageEl.style.animation = 'none';
          // Force reflow
          pageEl.offsetHeight;
          pageEl.classList.remove('page-slide-in', 'page-slide-back', 'page-enter');

          if (toDepth >= fromDepth) {
            pageEl.classList.add('page-slide-in');
          } else {
            pageEl.classList.add('page-slide-back');
          }
        }
        _lastPageDepth = toDepth;
      }
      return _origNav(page, noClose);
    };
  }


  // ─── 5. COMPRESSION PHOTO AVANT UPLOAD ─────────────────────────────

  const MAX_DIM = 1600;
  const QUALITY = 0.82;

  window.compressImageFile = function(file) {
    return new Promise((resolve) => {
      // Si déjà petit (<500Ko) ou pas une image → pas de compression
      if (file.size < 500 * 1024 || !file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width <= MAX_DIM && height <= MAX_DIM) {
            resolve(file);
            return;
          }

          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width  = Math.round(width  * ratio);
          height = Math.round(height * ratio);

          const canvas = document.createElement('canvas');
          canvas.width  = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(blob => {
            if (!blob || blob.size >= file.size) {
              resolve(file); // compression inefficace → original
              return;
            }
            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            console.log(`[patch] Photo compressée: ${(file.size/1024).toFixed(0)}Ko → ${(compressed.size/1024).toFixed(0)}Ko`);
            resolve(compressed);
          }, 'image/jpeg', QUALITY);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Patch handlePhotos pour compresser automatiquement
  if (typeof window.handlePhotos === 'function') {
    const _origHandlePhotos = window.handlePhotos;
    window.handlePhotos = async function(e) {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      // Remplacer les fichiers par leurs versions compressées
      const compressed = await Promise.all(files.map(f => window.compressImageFile(f)));

      // Recréer un objet similaire à l'event pour _origHandlePhotos
      const dt = new DataTransfer();
      compressed.forEach(f => dt.items.add(f));
      e.target.files = dt.files;

      return _origHandlePhotos(e);
    };
  }

  // Patch saveDoc (upload documents) pour compresser aussi les images
  if (typeof window.saveDoc === 'function') {
    const _origSaveDoc = window.saveDoc;
    window.saveDoc = async function(id) {
      const input = document.getElementById('doc-fichier');
      if (input && input.files && input.files[0]) {
        const f = input.files[0];
        if (f.type.startsWith('image/')) {
          const compressed = await window.compressImageFile(f);
          if (compressed !== f) {
            const dt = new DataTransfer();
            dt.items.add(compressed);
            input.files = dt.files;
          }
        }
      }
      return _origSaveDoc(id);
    };
  }


  // ─── 6. SKELETON LOADING ───────────────────────────────────────────

  window.renderSkeletonTickets = function(count = 4) {
    return Array.from({ length: count }, () => `
      <div class="sk-ticket-card">
        <div class="sk-android sk-line-title"></div>
        <div class="sk-android sk-line-sub"></div>
        <div class="sk-android sk-line-meta"></div>
      </div>
    `).join('');
  };

  window.renderSkeletonMessages = function(count = 5) {
    return Array.from({ length: count }, (_, i) => {
      const isMine = i % 3 === 0;
      return `<div style="display:flex;flex-direction:column;align-items:${isMine ? 'flex-end' : 'flex-start'};margin-bottom:12px;gap:4px;">
        <div class="sk-android" style="height:40px;width:${40 + Math.random() * 30 | 0}%;border-radius:18px;"></div>
        <div class="sk-android" style="height:10px;width:50px;"></div>
      </div>`;
    }).join('');
  };

  // Patch loadTickets pour afficher un skeleton pendant le chargement
  if (typeof window.loadTickets === 'function') {
    const _origLoadTickets = window.loadTickets;
    window.loadTickets = async function() {
      const tbody = document.getElementById('tickets-tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7">${renderSkeletonTickets(6)}</td></tr>`;
      }
      return _origLoadTickets();
    };
  }


  // ─── 7. LONG PRESS CONTEXT MENU ────────────────────────────────────

  let _ctxTimer   = null;
  let _ctxElement = null;

  window.showContextMenu = function({ x, y, items = [] }) {
    document.getElementById('ctx-menu-el')?.remove();
    if (!items.length) return;

    const menu = document.createElement('div');
    menu.className = 'ctx-menu';
    menu.id = 'ctx-menu-el';

    // Éviter que le menu sorte de l'écran
    const safeX = Math.min(x, window.innerWidth  - 220);
    const safeY = Math.min(y, window.innerHeight - items.length * 50 - 20);

    menu.style.cssText = `left:${safeX}px; top:${safeY}px;`;
    menu.innerHTML = items.map(item => `
      <div class="ctx-item ${item.danger ? 'danger' : ''}" data-action="${item.action || ''}">
        <span class="ctx-item-ico">${item.ico || ''}</span>
        <span>${item.label}</span>
      </div>
    `).join('');

    document.body.appendChild(menu);
    haptic('light');

    menu.querySelectorAll('.ctx-item').forEach((el, i) => {
      el.addEventListener('click', () => {
        if (typeof items[i].fn === 'function') items[i].fn();
        menu.remove();
        haptic('light');
      });
    });

    const dismiss = e => {
      if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('touchstart', dismiss); document.removeEventListener('click', dismiss); }
    };
    setTimeout(() => {
      document.addEventListener('touchstart', dismiss, { passive: true });
      document.addEventListener('click', dismiss);
    }, 100);
  };

  // Long press sur les tickets
  document.addEventListener('touchstart', e => {
    const ticketRow = e.target.closest('tr[onclick*="openDetail"]') || e.target.closest('.d5-ticket');
    if (!ticketRow || !IS_TOUCH()) return;

    const touch = e.touches[0];
    _ctxElement = ticketRow;
    const startX = touch.clientX, startY = touch.clientY;

    _ctxTimer = setTimeout(() => {
      haptic('medium');
      const idMatch = ticketRow.getAttribute('onclick')?.match(/openDetail\('([^']+)'\)/);
      const ticketId = idMatch ? idMatch[1] : null;

      if (!ticketId) return;
      const t = (window.cache?.tickets || []).find(x => x.id === ticketId);
      if (!t) return;

      const items = [
        { ico: '👁️', label: 'Voir le détail', fn: () => window.openDetail?.(ticketId) },
        { ico: '🔗', label: 'Copier le lien', fn: () => {
          const url = `${location.origin}${location.pathname}?ticket=${ticketId}`;
          navigator.clipboard?.writeText(url);
          window.toast?.('Lien copié ✓', 'ok');
        }},
      ];

      if (navigator.share) {
        items.push({ ico: '↗️', label: 'Partager', fn: () => navigator.share?.({ title: t.titre, text: `Signalement : ${t.titre}`, url: location.href }) });
      }

      if (window.canDeleteTicket?.()) {
        items.push({ ico: '🗑', label: 'Supprimer', danger: true, fn: () => window.deleteTicket?.(ticketId) });
      }

      showContextMenu({ x: touch.clientX, y: touch.clientY, items });
    }, 500);

    const cancel = () => { clearTimeout(_ctxTimer); _ctxTimer = null; };
    document.addEventListener('touchend',   cancel, { once: true });
    document.addEventListener('touchmove',  e2 => {
      const dx = Math.abs(e2.touches[0].clientX - startX);
      const dy = Math.abs(e2.touches[0].clientY - startY);
      if (dx > 8 || dy > 8) cancel();
    }, { once: true, passive: true });
  }, { passive: true });

  // Long press sur les messages du feed
  document.addEventListener('touchstart', e => {
    const feedPost = e.target.closest('.feed-post');
    if (!feedPost || !IS_TOUCH()) return;

    const touch = e.touches[0];
    const postId = feedPost.id?.replace('post-', '');
    if (!postId) return;

    const timer = setTimeout(() => {
      haptic('medium');
      const items = [
        { ico: '💬', label: 'Commenter', fn: () => window.openFeedThread?.(postId) },
        { ico: '👍', label: 'Réagir', fn: () => window.toggleFeedReaction?.(postId, '👍') },
        { ico: '🔗', label: 'Copier le lien', fn: () => {
          navigator.clipboard?.writeText(location.href);
          window.toast?.('Lien copié ✓', 'ok');
        }},
      ];

      const post = (window._msgState?.feed || []).find(p => String(p.id) === String(postId));
      if (post?.auteur_id === window.user?.id) {
        items.push({ ico: '✕', label: 'Supprimer', danger: true, fn: () => window.deleteFeedPost?.(postId) });
      }

      showContextMenu({ x: touch.clientX, y: touch.clientY, items });
    }, 500);

    const cancel = () => clearTimeout(timer);
    document.addEventListener('touchend',  cancel, { once: true });
    document.addEventListener('touchmove', cancel, { once: true, passive: true });
  }, { passive: true });


  // ─── 8. WEB SHARE API ──────────────────────────────────────────────

  window.nativeShare = async function({ title, text, url } = {}) {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: url || location.href });
        haptic('success');
        return true;
      } catch (e) {
        if (e.name !== 'AbortError') console.warn('[share]', e);
      }
    }
    // Fallback clipboard
    try {
      await navigator.clipboard.writeText(url || location.href);
      window.toast?.('Lien copié ✓', 'ok');
    } catch (_) {}
    return false;
  };


  // ─── 9. APP BADGE (icône PWA) ──────────────────────────────────────

  window.updateAppBadge = async function(count) {
    if (!navigator.setAppBadge) return;
    try {
      if (count > 0) await navigator.setAppBadge(count);
      else await navigator.clearAppBadge();
    } catch (_) {}
  };

  // Hook sur refreshNotifBadge pour mettre à jour le badge PWA
  if (typeof window.refreshNotifBadge === 'function') {
    const _origRefresh = window.refreshNotifBadge;
    window.refreshNotifBadge = function() {
      _origRefresh();
      const count = (window._notifCache || []).length;
      window.updateAppBadge(count);
    };
  }


  // ─── 10. PULL TO REFRESH — fix direction ───────────────────────────
  // Patch le PTR existant pour éviter le déclenchement sur scroll horizontal
  // (La logique est dans mobile-interactions.js, on override ici)

  let _ptrStartX = 0, _ptrStartY = 0, _ptrPulling = false, _ptrActivated = false;

  document.addEventListener('touchstart', e => {
    const page = document.getElementById('page');
    if (!page || page.scrollTop > 2) return;
    _ptrStartX = e.touches[0].clientX;
    _ptrStartY = e.touches[0].clientY;
    _ptrPulling = true;
    _ptrActivated = false;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!_ptrPulling) return;
    const dx = Math.abs(e.touches[0].clientX - _ptrStartX);
    const dy = e.touches[0].clientY - _ptrStartY;
    // Annuler si mouvement horizontal dominant
    if (dx > dy * 0.8 || dy < 15) return;

    const ind = document.getElementById('ptr-indicator');
    if (!ind) return;
    const progress = Math.min(dy - 15, 80);
    ind.style.transform = `translateX(-50%) translateY(${progress * 0.6}px)`;
    _ptrActivated = progress > 55;
    ind.innerHTML = _ptrActivated ? '↑ Relâcher pour actualiser' : '↓ Tirer pour actualiser';
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!_ptrPulling) return;
    _ptrPulling = false;
    if (_ptrActivated && typeof window.loadAll === 'function') {
      const ind = document.getElementById('ptr-indicator');
      if (ind) { ind.innerHTML = '⟳ Actualisation…'; haptic('success'); }
    }
  }, { passive: true });


  console.log('%c[CoproSync Mobile Patch v1] ✓ Chargé — 10 correctifs actifs', 'color:#16a34a;font-weight:bold;');

})();
