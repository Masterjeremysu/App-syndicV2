// ═══════════════════════════════════════════════════════════════════
//  COPROSYNC — Mobile Android UX Patch v3
//  Session 3/N — Fix Thread layout + Scroll Messages + Ergonomie
//
//  INCLURE après les patches v1 et v2 dans index.html :
//  <script src="assets/js/mobile-android-patch-v3.js" defer></script>
//
//  Corrections ciblées d'après screenshot :
//  1. Feed thread : bulle post remontée, layout flex correct
//  2. Scroll Messages : fix hauteur dynamique clavier
//  3. Zone commentaires trop vide → état vide ergonomique
//  4. Input composer collé en bas, toujours visible
//  5. Header "Discussion" avec retour propre
//  6. Fil feed : cards plus denses, moins d'espace perdu
// ═══════════════════════════════════════════════════════════════════

(function CoproSyncMobilePatchV3() {
  'use strict';

  const IS_MOBILE = () => window.innerWidth <= 768;

  // ─── CSS FIXES THREAD + SCROLL ──────────────────────────────────────
  const css = `

/* ══════════════════════════════════════════
   FIX #1 — Feed Thread : layout complet
   La bulle de post doit être en haut,
   les commentaires au milieu,
   l'input COLLÉ en bas de l'écran
══════════════════════════════════════════ */
@media (max-width: 768px) {

  /* Conteneur principal thread */
  #feed-thread-pane,
  .feed-thread-wrap {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    min-height: 0 !important;
    overflow: hidden !important;
  }

  /* Header "Discussion" — fixe en haut */
  .feed-thread-header {
    flex-shrink: 0 !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 10 !important;
    background: var(--surface) !important;
    border-bottom: 1px solid var(--border) !important;
    padding: 10px 14px !important;
    min-height: 52px !important;
  }

  /* Post original — hauteur max limitée, scrollable */
  .feed-thread-post-body {
    flex-shrink: 0 !important;
    max-height: 30vh !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    padding: 12px 16px !important;
    border-bottom: 1px solid var(--border) !important;
    background: var(--surface-2) !important;
  }

  /* Label COMMENTAIRES */
  .feed-thread-comments-label {
    flex-shrink: 0 !important;
    padding: 8px 16px 4px !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    letter-spacing: .1em !important;
    text-transform: uppercase !important;
    color: var(--text-3) !important;
    background: var(--surface) !important;
  }

  /* Zone scroll commentaires — PREND TOUT L'ESPACE RESTANT */
  #feed-thread-scroll,
  .feed-thread-scroll {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    -webkit-overflow-scrolling: touch !important;
    overscroll-behavior: contain !important;
    padding: 8px 0 !important;
  }

  /* Composer — STICKY EN BAS, jamais caché */
  .feed-thread-composer {
    flex-shrink: 0 !important;
    position: sticky !important;
    bottom: 0 !important;
    z-index: 10 !important;
    background: var(--surface) !important;
    border-top: 1px solid var(--border) !important;
    padding: 10px 14px !important;
    padding-bottom: max(10px, env(safe-area-inset-bottom)) !important;
    /* Ombre pour marquer la séparation */
    box-shadow: 0 -4px 16px rgba(0,0,0,.06) !important;
  }

  .feed-thread-composer-box {
    display: flex !important;
    gap: 10px !important;
    align-items: flex-end !important;
  }

  #feed-thread-comment-input {
    flex: 1 !important;
    min-height: 40px !important;
    max-height: 100px !important;
    font-size: 16px !important; /* évite zoom iOS */
    border-radius: 20px !important;
    padding: 10px 14px !important;
    resize: none !important;
    overflow-y: auto !important;
    background: var(--surface-2) !important;
    border: 1.5px solid var(--border) !important;
    color: var(--text) !important;
    line-height: 1.4 !important;
    transition: border-color .15s !important;
  }
  #feed-thread-comment-input:focus {
    border-color: var(--accent) !important;
    outline: none !important;
  }

  /* Bouton envoyer commentaire */
  .feed-thread-composer .chat-send {
    width: 40px !important;
    height: 40px !important;
    border-radius: 50% !important;
    background: var(--accent) !important;
    border: none !important;
    flex-shrink: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    transition: transform .15s, background .15s !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  .feed-thread-composer .chat-send:active {
    transform: scale(.88) !important;
    background: var(--accent-hover) !important;
  }

  /* État vide commentaires — plus ergonomique */
  .feed-thread-empty-comments {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 32px 20px !important;
    gap: 8px !important;
    text-align: center !important;
  }
  .feed-thread-empty-comments .empty-ico {
    font-size: 36px !important;
    opacity: .5 !important;
    margin-bottom: 4px !important;
  }
  .feed-thread-empty-comments .empty-title {
    font-size: 14px !important;
    font-weight: 700 !important;
    color: var(--text-2) !important;
  }
  .feed-thread-empty-comments .empty-sub {
    font-size: 12px !important;
    color: var(--text-3) !important;
    line-height: 1.5 !important;
  }

/* ══════════════════════════════════════════
   FIX #2 — Scroll Messages (chat canaux)
   Clavier virtuel = layout ne doit pas casser
══════════════════════════════════════════ */

  /* Container principal msg-main */
  #msg-main {
    position: absolute !important;
    inset: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    /* Adaptatif au clavier virtuel */
    height: 100dvh !important;
  }

  /* Messages — tout l'espace entre header et input */
  #chat-messages {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    -webkit-overflow-scrolling: touch !important;
    overscroll-behavior-y: contain !important;
    padding: 12px 12px 8px !important;
    /* scroll-padding-bottom pour que le dernier message
       ne soit pas sous le composer */
    scroll-padding-bottom: 80px !important;
  }

  /* Input bar — toujours en bas, s'adapte au clavier */
  .chat-input-bar {
    flex-shrink: 0 !important;
    position: sticky !important;
    bottom: 0 !important;
    z-index: 20 !important;
    background: var(--surface) !important;
    border-top: 1px solid var(--border) !important;
    padding: 8px 12px !important;
    padding-bottom: max(8px, env(safe-area-inset-bottom)) !important;
    box-shadow: 0 -2px 12px rgba(0,0,0,.05) !important;
  }

  /* Input text message */
  .chat-input {
    font-size: 16px !important; /* évite zoom iOS/Android */
    border-radius: 20px !important;
    min-height: 40px !important;
    max-height: 120px !important;
    padding: 10px 14px !important;
    background: var(--surface-2) !important;
    border: 1.5px solid var(--border) !important;
  }
  .chat-input:focus {
    border-color: var(--accent) !important;
    background: var(--surface) !important;
  }

  /* Bouton envoyer */
  .chat-send {
    width: 40px !important;
    height: 40px !important;
    flex-shrink: 0 !important;
    border-radius: 50% !important;
    align-self: flex-end !important;
  }

  /* Reply bar */
  .msg-reply-bar {
    flex-shrink: 0 !important;
    padding: 6px 12px 0 !important;
    background: var(--surface) !important;
  }

  /* Typing indicator */
  .chat-typing {
    flex-shrink: 0 !important;
    min-height: 20px !important;
    padding: 2px 14px !important;
  }

/* ══════════════════════════════════════════
   FIX #3 — Feed split layout propre
══════════════════════════════════════════ */

  #feed-split {
    position: relative !important;
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
  }

  /* Left pane (liste posts) — prend tout sur mobile */
  #feed-left-pane {
    position: absolute !important;
    inset: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    transition: transform .28s cubic-bezier(.4,0,.2,1) !important;
    background: var(--bg) !important;
    z-index: 1 !important;
  }

  #feed-left-scroll {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    -webkit-overflow-scrolling: touch !important;
    overscroll-behavior: contain !important;
  }

  /* Thread pane — slide depuis la droite */
  #feed-thread-pane {
    position: absolute !important;
    inset: 0 !important;
    z-index: 5 !important;
    background: var(--surface) !important;
    transform: translateX(100%) !important;
    transition: transform .28s cubic-bezier(.4,0,.2,1) !important;
    will-change: transform !important;
    display: flex !important;
    flex-direction: column !important;
  }

  #feed-split.thread-active #feed-thread-pane {
    transform: translateX(0) !important;
  }

  #feed-split.thread-active #feed-left-pane {
    transform: translateX(-8%) !important;
    opacity: .7 !important;
    pointer-events: none !important;
  }

/* ══════════════════════════════════════════
   FIX #4 — Cards feed plus denses
   Moins d'espace blanc inutile
══════════════════════════════════════════ */

  .feed-post {
    padding: 12px 14px 10px !important;
    margin: 0 !important;
    border-radius: 0 !important;
    border-bottom: 1px solid var(--border) !important;
    border-left: none !important;
    border-right: none !important;
    border-top: none !important;
  }

  .feed-post-header {
    margin-bottom: 8px !important;
  }

  .feed-post-av {
    width: 36px !important;
    height: 36px !important;
    font-size: 14px !important;
    border-radius: 50% !important;
    flex-shrink: 0 !important;
  }

  .feed-post-author {
    font-size: 13.5px !important;
    font-weight: 700 !important;
  }

  .feed-post-time {
    font-size: 11px !important;
  }

  .feed-post-body {
    font-size: 14px !important;
    line-height: 1.55 !important;
    margin-bottom: 10px !important;
    word-break: break-word !important;
  }

  .feed-post-actions {
    display: flex !important;
    align-items: center !important;
    gap: 0 !important;
    margin-top: 8px !important;
  }

  .feed-action-btn {
    min-height: 36px !important;
    min-width: 44px !important;
    padding: 0 10px !important;
    font-size: 13px !important;
    border-radius: 8px !important;
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
  }

  /* Chips catégories — scroll horizontal sans wrap */
  .feed-cat-chips-scroll {
    padding: 8px 12px !important;
    gap: 6px !important;
  }

  .feed-cat-chip {
    padding: 6px 10px !important;
    font-size: 12px !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }

  /* Compose bar compact */
  .feed-compose-bar {
    padding: 8px 12px !important;
    gap: 8px !important;
  }

  .feed-compose-trigger {
    height: 36px !important;
    font-size: 13px !important;
    border-radius: 18px !important;
  }

/* ══════════════════════════════════════════
   FIX #5 — Messages layout général
   La page messages doit être full height
   sans scroll parasite
══════════════════════════════════════════ */

  /* #page en mode messages : pas de padding, full height */
  #page.page-messages {
    padding: 0 !important;
    max-width: none !important;
    overflow: hidden !important;
    height: calc(100dvh - 52px) !important; /* soustrait topbar */
    display: flex !important;
    flex-direction: column !important;
  }

  .msg-layout {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow: hidden !important;
    position: relative !important;
    display: flex !important;
  }

  .msg-sidebar {
    width: 100% !important;
    position: absolute !important;
    inset: 0 !important;
    z-index: 3 !important;
    transform: translateX(0) !important;
    transition: transform .25s ease !important;
    background: var(--surface) !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .msg-sidebar.hidden {
    transform: translateX(-100%) !important;
    pointer-events: none !important;
  }

  .msg-main {
    position: absolute !important;
    inset: 0 !important;
    z-index: 2 !important;
    transform: translateX(100%) !important;
    transition: transform .25s ease !important;
    background: var(--surface) !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }

  .msg-main.visible {
    transform: translateX(0) !important;
    z-index: 4 !important;
  }

/* ══════════════════════════════════════════
   FIX #6 — Tabs internes messages
   Toujours visible, z-index correct
══════════════════════════════════════════ */

  .msg-inner-tabs {
    flex-shrink: 0 !important;
    z-index: 5 !important;
    background: var(--surface) !important;
    border-bottom: 1px solid var(--border) !important;
  }

  .msg-sidebar-scroll {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

/* ══════════════════════════════════════════
   FIX #7 — Commentaire individuel
   Meilleure lisibilité, plus compact
══════════════════════════════════════════ */

  .feed-comment {
    padding: 0 14px 10px !important;
    gap: 8px !important;
  }

  .feed-comment-av {
    width: 28px !important;
    height: 28px !important;
    font-size: 11px !important;
    flex-shrink: 0 !important;
    border-radius: 50% !important;
  }

  .feed-comment-bubble {
    background: var(--surface-2) !important;
    border-radius: 0 12px 12px 12px !important;
    padding: 8px 11px !important;
    font-size: 13.5px !important;
    line-height: 1.5 !important;
  }

  .feed-comment-author {
    font-size: 11.5px !important;
    font-weight: 700 !important;
    margin-bottom: 3px !important;
    color: var(--text) !important;
  }

  /* "Charger plus" bouton thread */
  #feed-thread-load-more-btn {
    width: calc(100% - 28px) !important;
    margin: 4px 14px 8px !important;
    font-size: 12px !important;
    color: var(--accent) !important;
    background: var(--accent-light) !important;
    border-color: transparent !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
  }

} /* fin @media */

/* ══════════════════════════════════════════
   FIX GLOBAL — Keyboard visual viewport
   Fonctionne sur tous les mobiles modernes
══════════════════════════════════════════ */
@supports (height: 100dvh) {
  @media (max-width: 768px) {
    #msg-main,
    .msg-layout,
    #feed-split,
    .feed-thread-wrap {
      height: 100% !important;
    }
  }
}
`;

  if (!document.getElementById('coprosync-patch-v3-css')) {
    const s = document.createElement('style');
    s.id = 'coprosync-patch-v3-css';
    s.textContent = css;
    document.head.appendChild(s);
  }


  // ─── FIX JAVASCRIPT : openFeedThread rebuild ────────────────────────
  // Réécriture complète de openFeedThread pour corriger le layout

  window._v3_openFeedThread = async function(postId) {
    const sid = String(postId);

    // State
    if (window._msgState) {
      window._msgState.activeFeedThreadPostId = sid;
      window._msgState.feedThreadRenderedCommentIds = new Set();
      window._msgState.feedThreadState = { loaded: false, oldestLoadedAt: null, hasMore: false };
      window._msgState.feedCommentUnreadByPost[sid] = 0;
    }

    // Activer le slide
    const split = document.getElementById('feed-split');
    if (split) split.classList.add('thread-active');

    // Effacer badge unread
    const ub = document.getElementById(`feed-unread-${sid}`);
    if (ub) ub.style.display = 'none';

    // Charger le post
    let post = (window._msgState?.feed || []).find(p => String(p.id) === sid);
    if (!post && window.sb) {
      try {
        const { data } = await window.sb.from('feed_posts')
          .select('*, profiles(id,prenom,nom,email)')
          .eq('id', sid).single();
        post = data;
      } catch(e) { console.warn('[v3 thread]', e); }
    }
    if (!post) return;

    const threadPane = document.getElementById('feed-thread-pane');
    if (!threadPane) return;

    // Auteur du post
    const auteur = post.profiles
      ? (typeof window.displayName === 'function'
          ? window.displayName(post.profiles.prenom, post.profiles.nom, post.profiles.email, 'Résident')
          : (post.profiles.prenom || post.profiles.nom || 'Résident'))
      : 'Résident';
    const initiale = auteur.charAt(0).toUpperCase();
    const color = typeof window.avatarColor === 'function' ? window.avatarColor(auteur) : '#2563eb';
    const time = typeof window.depuisJours === 'function' ? window.depuisJours(post.created_at) : '';
    const contenuHtml = typeof window.escHtml === 'function' ? window.escHtml(post.contenu || '') : (post.contenu || '');

    // Titres selon type
    const isAffiche = post.epingle && post.type === 'post';
    const titrePanneau = post.titre_panneau
      ? `<div style="font-family:var(--font-head);font-weight:800;font-size:15px;color:var(--orange);margin-bottom:6px;">${typeof window.escHtml === 'function' ? window.escHtml(post.titre_panneau) : post.titre_panneau}</div>`
      : '';

    let bodyHtml = '';
    if (post.type === 'post') {
      bodyHtml = `${titrePanneau}<div style="font-size:14px;line-height:1.6;color:var(--text);">${contenuHtml}</div>`;
    } else if (post.type === 'ticket') {
      bodyHtml = `<div style="background:var(--orange-light);border:1px solid var(--orange-border);border-radius:10px;padding:10px 13px;font-size:13px;color:var(--orange);">🔧 ${contenuHtml}</div>`;
    } else if (post.type === 'resolved') {
      bodyHtml = `<div style="background:var(--green-light);border:1px solid var(--green-border);border-radius:10px;padding:10px 13px;font-size:13px;color:var(--green);">✅ ${contenuHtml}</div>`;
    } else {
      bodyHtml = `<div style="font-size:14px;line-height:1.6;color:var(--text);">${contenuHtml}</div>`;
    }

    const isMine = post.auteur_id === window.user?.id;
    const canPin = typeof window.canManageAnnonces === 'function' && window.canManageAnnonces() && post.type === 'post';

    // HTML du thread — structure flex column robuste
    threadPane.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">

        <!-- HEADER fixe -->
        <div class="feed-thread-header" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface);border-bottom:1px solid var(--border);flex-shrink:0;">
          <button onclick="window.closeFeedThread && window.closeFeedThread()" 
            style="width:36px;height:36px;border-radius:50%;border:1px solid var(--border);background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;flex-shrink:0;color:var(--text-2);-webkit-tap-highlight-color:transparent;">←</button>
          <div style="flex:1;min-width:0;">
            <div style="font-family:var(--font-head);font-weight:800;font-size:15px;letter-spacing:-.2px;">Discussion</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:1px;">${auteur} · ${time}</div>
          </div>
          ${canPin ? `<button onclick="window.toggleFeedPin && window.toggleFeedPin('${sid}')" style="padding:6px 8px;border-radius:8px;border:1px solid var(--border);background:none;font-size:13px;cursor:pointer;color:var(--text-3);">${post.epingle ? '📌' : '📍'}</button>` : ''}
          ${isMine ? `<button onclick="window.deleteFeedPost && window.deleteFeedPost('${sid}')" style="padding:6px 8px;border-radius:8px;border:none;background:none;font-size:13px;cursor:pointer;color:var(--red);">✕</button>` : ''}
        </div>

        <!-- POST ORIGINAL — max 30vh, scrollable -->
        <div style="flex-shrink:0;max-height:30vh;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 14px;border-bottom:1px solid var(--border);background:var(--surface-2);">
          <div style="display:flex;gap:10px;align-items:flex-start;">
            <div style="width:34px;height:34px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;">${initiale}</div>
            <div style="flex:1;min-width:0;">${bodyHtml}</div>
          </div>
        </div>

        <!-- LABEL COMMENTAIRES -->
        <div style="flex-shrink:0;padding:8px 14px 4px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);background:var(--surface);border-bottom:0.5px solid var(--border);">
          Commentaires
          <span id="v3-comment-count-${sid}" style="font-weight:400;color:var(--text-3);"></span>
        </div>

        <!-- SCROLL COMMENTAIRES — prend tout l'espace restant -->
        <div id="feed-thread-scroll" style="flex:1 1 0;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:4px 0;">
          <div style="padding:0;">
            <button id="feed-thread-load-more-btn" onclick="window.loadFeedThreadOlder && window.loadFeedThreadOlder()" style="display:none;width:calc(100% - 28px);margin:4px 14px 8px;font-size:12px;color:var(--accent);background:var(--accent-light);border:none;border-radius:10px;font-weight:600;padding:8px;cursor:pointer;">
              ↑ Charger les messages précédents
            </button>
            <div id="feed-thread-comments-list">
              <div class="feed-thread-empty-comments">
                <div class="empty-ico">💬</div>
                <div class="empty-title">Aucun commentaire</div>
                <div class="empty-sub">Soyez le premier à répondre à ce message !</div>
              </div>
            </div>
          </div>
        </div>

        <!-- COMPOSER — sticky bas -->
        <div class="feed-thread-composer" style="flex-shrink:0;border-top:1px solid var(--border);background:var(--surface);padding:10px 14px;padding-bottom:max(10px,env(safe-area-inset-bottom));box-shadow:0 -4px 16px rgba(0,0,0,.06);">
          <div class="feed-thread-composer-box" style="display:flex;gap:10px;align-items:flex-end;">
            <textarea
              id="feed-thread-comment-input"
              placeholder="Répondre…"
              rows="1"
              style="flex:1;min-height:40px;max-height:100px;font-size:16px;border-radius:20px;padding:10px 14px;resize:none;overflow-y:auto;background:var(--surface-2);border:1.5px solid var(--border);color:var(--text);font-family:var(--font-body);line-height:1.4;transition:border-color .15s;-webkit-tap-highlight-color:transparent;"
              oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px';"
              onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();window.sendFeedThreadComment&&window.sendFeedThreadComment();}"
            ></textarea>
            <button
              class="chat-send"
              onclick="window.sendFeedThreadComment && window.sendFeedThreadComment()"
              style="width:40px;height:40px;border-radius:50%;background:var(--accent);border:none;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s;-webkit-tap-highlight-color:transparent;"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
            </button>
          </div>
        </div>

      </div>`;

    // Charger les commentaires
    if (typeof window.loadFeedThreadComments === 'function') {
      await window.loadFeedThreadComments(sid, { older: false });
    }

    // Focus l'input après animation (150ms = durée slide)
    setTimeout(() => {
      const inp = document.getElementById('feed-thread-comment-input');
      // Ne pas focus auto pour éviter l'ouverture du clavier à l'arrivée
      // inp?.focus();
    }, 300);

    if (typeof window.haptic === 'function') window.haptic('light');
  };

  // Surcharger openFeedThread avec notre version corrigée
  // On attend que le DOM soit prêt et que les fonctions originales existent
  function patchOpenFeedThread() {
    if (typeof window.openFeedThread === 'function') {
      const _orig = window.openFeedThread;
      window.openFeedThread = function(postId) {
        if (IS_MOBILE()) {
          return window._v3_openFeedThread(postId);
        }
        return _orig(postId);
      };
    } else {
      // Retry
      setTimeout(patchOpenFeedThread, 200);
    }
  }

  // Patch closeFeedThread pour retirer le décalage du left pane
  function patchCloseFeedThread() {
    if (typeof window.closeFeedThread === 'function') {
      const _origClose = window.closeFeedThread;
      window.closeFeedThread = function() {
        const split = document.getElementById('feed-split');
        const leftPane = document.getElementById('feed-left-pane');
        if (split) split.classList.remove('thread-active');
        if (leftPane) {
          leftPane.style.transform = '';
          leftPane.style.opacity = '';
          leftPane.style.pointerEvents = '';
        }
        if (typeof window._msgState !== 'undefined') {
          window._msgState.activeFeedThreadPostId = null;
        }
        const pane = document.getElementById('feed-thread-pane');
        if (pane) {
          pane.innerHTML = `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--text-3);padding:40px;text-align:center;">
              <div style="font-size:42px;opacity:.4;">💬</div>
              <div style="font-family:var(--font-head);font-weight:800;font-size:16px;color:var(--text-2);">Ouvrez une discussion</div>
              <div style="font-size:13px;color:var(--text-3);line-height:1.5;">Tapez sur "Commenter" pour voir la conversation.</div>
            </div>`;
        }
      };
    } else {
      setTimeout(patchCloseFeedThread, 200);
    }
  }

  // Ajouter la classe page-messages sur #page quand on navigue vers messages
  function patchNavMessages() {
    if (typeof window.nav === 'function') {
      const _origNav = window.nav;
      window.nav = function(page, noClose) {
        const pageEl = document.getElementById('page');
        if (pageEl) {
          pageEl.classList.toggle('page-messages', page === 'messages');
        }
        return _origNav(page, noClose);
      };
    } else {
      setTimeout(patchNavMessages, 100);
    }
  }

  // ─── FIX : Scroll to bottom sur ouverture chat ─────────────────────
  function patchScrollToBottom() {
    if (typeof window.renderMessageBubbles === 'function') {
      const _orig = window.renderMessageBubbles;
      window.renderMessageBubbles = function() {
        _orig();
        // Double RAF pour garantir que le DOM est peint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const el = document.getElementById('chat-messages');
            if (el) el.scrollTop = el.scrollHeight;
          });
        });
      };
    } else {
      setTimeout(patchScrollToBottom, 200);
    }
  }

  // ─── FIX : updateCommentCount dans le thread ───────────────────────
  const _origLoadFeedThreadComments = window.loadFeedThreadComments;
  if (typeof _origLoadFeedThreadComments === 'function') {
    window.loadFeedThreadComments = async function(postId, opts) {
      const result = await _origLoadFeedThreadComments(postId, opts);
      // Mettre à jour le compteur
      const sid = String(postId);
      const list = document.getElementById('feed-thread-comments-list');
      const counter = document.getElementById(`v3-comment-count-${sid}`);
      if (list && counter) {
        const count = list.querySelectorAll('.feed-comment').length;
        counter.textContent = count > 0 ? ` · ${count}` : '';
      }
      return result;
    };
  }

  // ─── Initialisation différée ────────────────────────────────────────
  setTimeout(() => {
    patchOpenFeedThread();
    patchCloseFeedThread();
    patchNavMessages();
    patchScrollToBottom();

    // Appliquer classe page-messages si on est déjà sur cette page
    if (window.currentPage === 'messages') {
      document.getElementById('page')?.classList.add('page-messages');
    }
  }, 300);

  // Observer pour réappliquer si la page change
  const pageObs = new MutationObserver(() => {
    const pageEl = document.getElementById('page');
    if (!pageEl) return;
    if (window.currentPage === 'messages') {
      pageEl.classList.add('page-messages');
    } else {
      pageEl.classList.remove('page-messages');
    }
  });
  pageObs.observe(document.body, { childList: true });

  console.log('%c[CoproSync Mobile Patch v3] ✓ Thread layout + Scroll fix + Ergonomie feed', 'color:#16a34a;font-weight:bold;');

})();
