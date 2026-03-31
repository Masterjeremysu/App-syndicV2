// ── FAQ — expérience “produit” (deep-links, clavier, progression, liens, recherche globale)
//
const FAQ_DATA = [
  { id:'faq-1',  cat:'signalements', ico:'🚨', q:'Comment signaler un problème dans la résidence ?', a:`Cliquez sur le bouton <strong>Signaler</strong> en haut à droite ou en bas de l'écran sur mobile. Choisissez la catégorie, le niveau d'urgence et la localisation précise. Vous pouvez joindre jusqu'à 5 photos.<br><br>Votre signalement est immédiatement visible par le conseil syndical et le syndic.` },
  { id:'faq-2',  cat:'signalements', ico:'📋', q:"Quels sont les différents statuts d'un signalement ?", a:`<ul><li><strong>Nouveau</strong> — vient d'être créé, pas encore traité</li><li><strong>En cours</strong> — pris en charge par le conseil syndical</li><li><strong>Transmis syndic</strong> — transmis au syndic pour intervention</li><li><strong>En attente d'intervention</strong> — prestataire contacté, intervention planifiée</li><li><strong>Résolu</strong> — problème réglé</li><li><strong>Clos</strong> — archivé</li></ul>` },
  { id:'faq-3',  cat:'signalements', ico:'🔔', q:"Serai-je notifié de l'avancement de mon signalement ?", a:`Oui. Vous recevrez une notification dans l'application à chaque changement de statut ou nouveau commentaire sur votre signalement. Activez les notifications du navigateur pour les recevoir même quand l'app est fermée.` },
  { id:'faq-4',  cat:'signalements', ico:'🔴', q:'Quand utiliser le niveau d\'urgence "Critique" ?', a:`Le niveau <strong>Critique</strong> est réservé aux situations présentant un risque immédiat : fuite d'eau majeure, panne d'ascenseur avec personnes bloquées, problème électrique dangereux, dégât structurel. Pour un problème courant, utilisez <strong>Normal</strong>.` },
  { id:'faq-5',  cat:'residence',    ico:'🏢', q:'Comment sont organisées les 4 tours ?', a:`La Résidence le Floréal comprend 4 tours au 13, 15, 17 et 19 rue du Moucherotte à Sassenage :<br><br><strong>Tour 13</strong> — sud &nbsp;·&nbsp; <strong>Tour 15</strong> — centre-sud &nbsp;·&nbsp; <strong>Tour 17</strong> — centre-nord &nbsp;·&nbsp; <strong>Tour 19</strong> — nord<br><br>Chaque tour dispose de 2 ascenseurs (impair et pair) et d'un local poubelles.` },
  { id:'faq-6',  cat:'residence',    ico:'🅿️', q:'Comment fonctionne le parking ?', a:`La résidence dispose de deux parkings distincts :<br><br><strong>Parking visiteurs</strong> (120 places) — ouvert aux visiteurs temporaires.<br><strong>Parking privé</strong> (120 places) — réservé aux résidents avec badge d'accès.<br><strong>Garages</strong> — boxes individuels fermés, sur attribution.<br><br>Pour tout problème d'accès ou de badge, signalez-le via le module <em>Signalements</em>.` },
  { id:'faq-7',  cat:'residence',    ico:'🛗', q:"L'ascenseur de ma tour est en panne, que faire ?", a:`1. Signalez immédiatement via <strong>Signaler → Ascenseur → Critique</strong>.<br>2. Le prestataire ACAF (contrat de maintenance) sera contacté en priorité.<br>3. Personne bloquée dans la cabine : appelez le <strong>18 (pompiers)</strong>.<br><br>Délai standard : 2h en heures ouvrées, 4h en astreinte.` },
  { id:'faq-8',  cat:'compte',       ico:'👤', q:'Comment créer mon compte résidant ?', a:`Sur la page de connexion, cliquez sur <strong>"Créer un compte"</strong>. Renseignez votre email, un mot de passe, votre prénom, votre tour et votre numéro de lot (figurant sur votre titre de propriété).<br><br>Votre compte doit être <strong>validé par un administrateur</strong> avant d'avoir accès à toutes les fonctionnalités.` },
  { id:'faq-9',  cat:'compte',       ico:'🔐', q:"J'ai oublié mon mot de passe, comment le réinitialiser ?", a:`Sur la page de connexion, entrez votre email puis cliquez sur <strong>"Mot de passe oublié ?"</strong>. Vous recevrez un email avec un lien de réinitialisation valable 24h.<br><br>Vérifiez vos spams si vous ne recevez pas l'email dans les 5 minutes.` },
  { id:'faq-10', cat:'compte',       ico:'🌙', q:'Comment activer le mode sombre ?', a:`Cliquez sur l'icône 🌙 dans la barre en haut à droite pour basculer entre mode clair et mode sombre. Votre préférence est sauvegardée automatiquement.` },
  { id:'faq-11', cat:'votes',        ico:'🗳️', q:'Comment participer aux votes et sondages ?', a:`Accédez à la section <strong>Votes & Sondages</strong> dans le menu. Les votes ouverts apparaissent avec un bandeau vert. Vous ne pouvez voter qu'une seule fois par scrutin. Les résultats sont affichés en temps réel dès que le vote est clos.` },
  { id:'faq-12', cat:'votes',        ico:'📊', q:'Qui peut créer un vote ou un sondage ?', a:`Seuls les membres du <strong>Conseil Syndical</strong> et les <strong>Administrateurs</strong> peuvent créer des votes. Pour soumettre un sujet, contactez un membre du CS via le module Messages.` },
  { id:'faq-13', cat:'documents',    ico:'📄', q:'Où trouver les documents de la copropriété ?', a:`Dans la section <strong>Documents</strong>, classés par catégorie :<ul><li>Procès-verbaux d'AG</li><li>Règlement de copropriété</li><li>Contrats prestataires</li><li>Relevés de charges</li><li>Diagnostics techniques</li></ul>Les nouveaux documents sont signalés par un badge <em>"Nouveau"</em>.` },
  { id:'faq-14', cat:'documents',    ico:'📅', q:"Quand ont lieu les assemblées générales ?", a:`Les dates d'AG sont publiées dans l'<strong>Agenda</strong> au moins 21 jours avant la réunion. Le PV est disponible dans <em>Documents</em> sous 15 jours après chaque AG.` },
  { id:'faq-15', cat:'messages',     ico:'💬', q:'Comment contacter le conseil syndical ou un voisin ?', a:`Via le module <strong>Messages</strong> :<ul><li><strong>Canaux</strong> — espaces de discussion par tour ou thématique</li><li><strong>Messages privés (DM)</strong> — conversation directe avec n'importe quel résident</li></ul>Pour les urgences, utilisez directement <em>Contacts & Urgences</em>.` },
  { id:'faq-16', cat:'messages',     ico:'📢', q:"Comment m'abonner aux annonces importantes ?", a:`Les annonces sont automatiquement visibles dans la section <strong>Annonces</strong>. Activez les notifications du navigateur pour recevoir les annonces urgentes même quand l'app est fermée.` },
];

const FAQ_CATS = [
  { id:'all',          label:'Toutes',       ico:'📋' },
  { id:'signalements', label:'Signalements', ico:'🚨' },
  { id:'residence',    label:'Résidence',    ico:'🏢' },
  { id:'compte',       label:'Mon compte',   ico:'👤' },
  { id:'votes',        label:'Votes',        ico:'🗳️' },
  { id:'documents',    label:'Documents',    ico:'📄' },
  { id:'messages',     label:'Messages',     ico:'💬' },
];

const FAQ_VOTES_KEY = 'coprosync_faq_votes_v1';
const FAQ_HELPFUL_KEY = 'coprosync_faq_helpful_count_v1';
const FAQ_READ_KEY = 'coprosync_faq_read_v1';

let _faqVotes = {};
let _faqHelpful = {};
let _faqRead = {};

let _faqActiveCat = 'all';
let _faqSearchQuery = '';
let _faqOpenId = null;
let _faqSearchTimer = null;
let _faqLastVisibleIds = [];
let _faqKbIdx = -1;

function loadFaqVotes() {
  try {
    const raw = localStorage.getItem(FAQ_VOTES_KEY);
    _faqVotes = raw ? JSON.parse(raw) : {};
  } catch {
    _faqVotes = {};
  }
}

function saveFaqVotes() {
  try { localStorage.setItem(FAQ_VOTES_KEY, JSON.stringify(_faqVotes || {})); } catch {}
}

function loadFaqHelpful() {
  try {
    const raw = localStorage.getItem(FAQ_HELPFUL_KEY);
    _faqHelpful = raw ? JSON.parse(raw) : {};
  } catch {
    _faqHelpful = {};
  }
}

function saveFaqHelpful() {
  try { localStorage.setItem(FAQ_HELPFUL_KEY, JSON.stringify(_faqHelpful || {})); } catch {}
}

function loadFaqRead() {
  try {
    const raw = localStorage.getItem(FAQ_READ_KEY);
    _faqRead = raw ? JSON.parse(raw) : {};
  } catch {
    _faqRead = {};
  }
}

function saveFaqRead() {
  try { localStorage.setItem(FAQ_READ_KEY, JSON.stringify(_faqRead || {})); } catch {}
}

function faqParseHashId() {
  const raw = (location.hash || '').replace(/^#/, '');
  const m = raw.match(/^faq=([\w-]+)$/i);
  return m ? m[1] : null;
}

function faqReplaceHash(id) {
  const h = `#faq=${id}`;
  if (location.hash !== h) {
    try { history.replaceState(null, '', `${location.pathname}${location.search}${h}`); } catch { location.hash = h; }
  }
}

function faqClearHashIfFaq() {
  if (/^#faq=/.test(location.hash || '')) {
    try { history.replaceState(null, '', `${location.pathname}${location.search}`); } catch { location.hash = ''; }
  }
}

function faqTopHelpfulSet() {
  const entries = Object.entries(_faqHelpful || {}).filter(([, n]) => (n || 0) > 0);
  entries.sort((a, b) => b[1] - a[1]);
  return new Set(entries.slice(0, 5).map(([id]) => id));
}

function faqReadingMinutes(html) {
  const plain = (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = plain ? plain.split(' ').length : 0;
  return Math.max(1, Math.round(words / 220) || 1);
}

function faqStrip(s) {
  return (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function faqNormalizeTokens(s) {
  return faqStrip(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

function faqRelatedItems(cur, max) {
  const tok = new Set(faqNormalizeTokens(cur.q + ' ' + cur.a));
  const same = FAQ_DATA.filter(f => f.id !== cur.id && f.cat === cur.cat);
  const scored = same.map(f => {
    const ft = faqNormalizeTokens(f.q);
    let s = 0;
    for (const t of ft) if (tok.has(t)) s++;
    return { f, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
  const out = scored.map(x => x.f);
  if (out.length < max) {
    for (const f of same) {
      if (out.length >= max) break;
      if (!out.find(x => x.id === f.id)) out.push(f);
    }
  }
  return out.slice(0, max);
}

function faqRelatedHtml(cur) {
  const rel = faqRelatedItems(cur, 3);
  if (!rel.length) return '';
  return `<div class="faq2-related">
    <div class="faq2-related-title">À lire aussi</div>
    <div class="faq2-related-list">
      ${rel.map(r => `
        <button type="button" class="faq2-related-chip" onclick="faqJumpTo('${r.id}')">
          <span>${r.ico || '❓'}</span> ${escHtml(r.q)}
        </button>
      `).join('')}
    </div>
  </div>`;
}

function faqMarkOpened(id) {
  if (!id) return;
  _faqRead = _faqRead || {};
  _faqRead[id] = new Date().toISOString();
  saveFaqRead();
}

function faqReadProgressHtml() {
  const n = Object.keys(_faqRead || {}).filter(id => FAQ_DATA.some(f => f.id === id)).length;
  const total = FAQ_DATA.length;
  const pct = total ? Math.round((n / total) * 100) : 0;
  return `<div class="faq2-progress" title="Questions ouvertes au moins une fois sur cet appareil">
    <div class="faq2-progress-ring" style="--p:${pct};"><span>${pct}%</span></div>
    <div class="faq2-progress-txt"><strong>${n}</strong> / ${total} vues</div>
  </div>`;
}

function faqBindHashListener() {
  if (window.__faqHashBound) return;
  window.__faqHashBound = true;
  window.addEventListener('hashchange', () => {
    if (typeof currentPage === 'undefined' || currentPage !== 'faq') return;
    const id = faqParseHashId();
    if (id && FAQ_DATA.some(f => f.id === id)) faqJumpTo(id, { fromHash: true });
  });
}

function faqBindKeyboard() {
  if (window.__faqKbBound) return;
  window.__faqKbBound = true;
  document.addEventListener('keydown', faqOnGlobalKeydown);
}

function faqOnGlobalKeydown(e) {
  if (typeof currentPage === 'undefined' || currentPage !== 'faq') return;
  if ($('search-overlay')) return;
  const tag = (e.target && e.target.tagName) || '';
  const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;
  if (e.key === '/' && !inField) {
    e.preventDefault();
    $('faq-search')?.focus();
    return;
  }
  if (e.key === 'Escape' && document.activeElement === $('faq-search') && !(_faqSearchQuery || '').trim()) {
    $('faq-search')?.blur();
    return;
  }
  if (e.key === 'Escape' && (_faqSearchQuery || '').trim()) {
    e.preventDefault();
    faqClearSearch();
    return;
  }
  if (inField && document.activeElement === $('faq-search')) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      faqKbMove(1);
    }
    return;
  }
  if (inField) return;
  if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') { e.preventDefault(); faqKbMove(1); }
  else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') { e.preventDefault(); faqKbMove(-1); }
  else if (e.key === 'Enter') {
    const id = _faqLastVisibleIds[_faqKbIdx];
    if (id) faqToggle(id);
  }
}

function faqKbMove(delta) {
  if (!_faqLastVisibleIds.length) return;
  if (_faqKbIdx < 0) _faqKbIdx = 0;
  else _faqKbIdx = (_faqKbIdx + delta + _faqLastVisibleIds.length) % _faqLastVisibleIds.length;
  faqRenderList();
  const id = _faqLastVisibleIds[_faqKbIdx];
  requestAnimationFrame(() => $('faq-item-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
}

function renderFAQ() {
  loadFaqVotes();
  loadFaqHelpful();
  loadFaqRead();
  faqBindHashListener();
  faqBindKeyboard();

  $('page').innerHTML = `
    <div class="faq2-page">
      <div class="faq2-sticky">
        <div class="faq2-hero">
          <div class="faq2-hero-top">
            <div>
              <h1>❓ FAQ CoproSync</h1>
              <p>Aides, raccourcis clavier, liens partageables — tout pour débloquer les résidents en 10 secondes.</p>
            </div>
            ${faqReadProgressHtml()}
          </div>
          <div class="faq2-hints">
            <span><kbd>/</kbd> recherche</span>
            <span><kbd>J</kbd> <kbd>K</kbd> navigation</span>
            <span><kbd>Entrée</kbd> ouvrir</span>
            <span><kbd>Échap</kbd> effacer</span>
          </div>
          <div class="faq2-search-wrap">
            <svg class="faq2-search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input class="faq2-search-input" id="faq-search" type="text" placeholder="Rechercher une question…" autocomplete="off" aria-label="Rechercher dans la FAQ">
            <button class="faq2-search-clear" id="faq-search-clear" onclick="faqClearSearch()" title="Effacer" type="button">×</button>
          </div>
        </div>
      </div>

      <div class="faq2-cats" id="faq-cats"></div>
      <div id="faq-list"></div>

      <div class="faq2-contact">
        <div class="faq2-contact-ico">🤝</div>
        <div class="faq2-contact-body">
          <div class="faq2-contact-title">Vous n'avez pas trouvé votre réponse ?</div>
          <div class="faq2-contact-sub">Contactez le conseil syndical ou le syndic. Réponse sous 48h ouvrées.</div>
        </div>
        <div class="faq2-contact-actions">
          <button type="button" class="btn btn-primary" onclick="nav('messages')">💬 Envoyer un message</button>
          <button type="button" class="btn btn-secondary" onclick="nav('contacts')">📞 Contacts & Urgences</button>
        </div>
      </div>
    </div>
  `;

  const input = $('faq-search');
  if (input) {
    input.value = _faqSearchQuery || '';
    const q0 = _faqSearchQuery || '';
    const clearBtn = $('faq-search-clear');
    if (clearBtn) clearBtn.style.display = q0 ? 'block' : 'none';
    input.addEventListener('input', (e) => faqOnSearch(e.target.value));
  }

  faqRenderCats();
  faqRenderList();

  const fromHash = faqParseHashId();
  if (fromHash && FAQ_DATA.some(f => f.id === fromHash)) {
    faqJumpTo(fromHash, { fromHash: true });
  } else {
    setTimeout(() => $('faq-search')?.focus(), 60);
  }
}

function faqRenderCats() {
  const el = $('faq-cats');
  if (!el) return;
  el.innerHTML = FAQ_CATS.map(cat => {
    const count = cat.id === 'all' ? FAQ_DATA.length : FAQ_DATA.filter(f => f.cat === cat.id).length;
    return `<button type="button" class="faq2-cat-btn ${_faqActiveCat === cat.id ? 'active' : ''}" onclick="faqSetCat('${cat.id}')">
      <span>${cat.ico} ${cat.label}</span> <span class="faq2-cat-count">(${count})</span>
    </button>`;
  }).join('');
}

function faqSetCat(id) {
  _faqActiveCat = id;
  _faqOpenId = null;
  _faqKbIdx = -1;
  faqClearHashIfFaq();
  faqRenderCats();
  faqRenderList();
}

function faqOnSearch(val) {
  _faqSearchQuery = val || '';
  _faqOpenId = null;
  _faqKbIdx = -1;
  const clearBtn = $('faq-search-clear');
  if (clearBtn) clearBtn.style.display = _faqSearchQuery ? 'block' : 'none';
  clearTimeout(_faqSearchTimer);
  faqRenderList();
}

function faqClearSearch() {
  _faqSearchQuery = '';
  const input = $('faq-search');
  if (input) input.value = '';
  const clearBtn = $('faq-search-clear');
  if (clearBtn) clearBtn.style.display = 'none';
  _faqOpenId = null;
  _faqKbIdx = -1;
  faqClearHashIfFaq();
  faqRenderList();
}

function faqHl(text, q) {
  if (!q) return text;
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re = new RegExp(`(${safe})`, 'gi');
  return (text || '').replace(re, '<span class="faq2-hl">$1</span>');
}

function faqCopyDeepLink(id) {
  const base = `${location.origin}${location.pathname}${location.search}`;
  const url = `${base}#faq=${id}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => toast('Lien copié dans le presse-papiers', 'ok')).catch(() => toast('Copie impossible', 'err'));
  } else {
    toast('Copie non supportée sur ce navigateur', 'warn');
  }
}

function faqItemHtml(f, q, hotIds, kbFocus) {
  const isOpen = _faqOpenId === f.id;
  const vote = _faqVotes?.[f.id];
  const helpfulN = _faqHelpful?.[f.id] || 0;
  const isHot = hotIds.has(f.id);
  const mins = faqReadingMinutes(f.a);
  return `<div class="faq2-item ${isOpen ? 'open' : ''} ${kbFocus ? 'faq2-kb-focus' : ''}" id="faq-item-${f.id}" data-faq-id="${f.id}">
    <button type="button" class="faq2-q" onclick="faqToggle('${f.id}')" aria-expanded="${isOpen ? 'true' : 'false'}">
      <span class="faq2-ico">${f.ico||'❓'}</span>
      <span class="faq2-q-text">${faqHl(f.q, q)}</span>
      ${isHot ? '<span class="faq2-pill-hot" title="Souvent marquée comme utile">★ Top</span>' : ''}
      ${helpfulN >= 3 ? `<span class="faq2-pill-count">${helpfulN} utiles</span>` : ''}
      <svg class="faq2-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <polyline points="6,9 12,15 18,9"/>
      </svg>
    </button>
    <div class="faq2-a">
      <div class="faq2-a-inner">
        ${faqHl(f.a||'', q)}
        <div class="faq2-answer-meta">
          <span class="faq2-readtime">Lecture ~${mins} min</span>
          <button type="button" class="btn btn-ghost btn-xs faq2-copy-btn" onclick="event.stopPropagation();faqCopyDeepLink('${f.id}')">Copier le lien</button>
        </div>
        ${isOpen ? faqRelatedHtml(f) : ''}
        <div class="faq2-vote">
          <span class="faq2-vote-label">Cette réponse vous a aidé ?</span>
          <button type="button" class="faq2-vote-btn ${vote === true ? 'voted-yes' : ''}" onclick="faqVote('${f.id}',true)">👍 Oui</button>
          <button type="button" class="faq2-vote-btn ${vote === false ? 'voted-no' : ''}" onclick="faqVote('${f.id}',false)">👎 Non</button>
        </div>
      </div>
    </div>
  </div>`;
}

function faqToggle(id) {
  _faqOpenId = _faqOpenId === id ? null : id;
  if (_faqOpenId) {
    faqMarkOpened(_faqOpenId);
    faqReplaceHash(_faqOpenId);
  } else {
    faqClearHashIfFaq();
  }
  if (_faqOpenId) _faqKbIdx = _faqLastVisibleIds.indexOf(_faqOpenId);
  faqRenderList();
  if (_faqOpenId) {
    setTimeout(() => $('faq-item-' + id)?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 50);
  }
}

function faqVote(id, helpful) {
  _faqVotes = _faqVotes || {};
  const was = _faqVotes[id];
  _faqVotes[id] = helpful;
  saveFaqVotes();
  if (helpful && was !== true) {
    _faqHelpful = _faqHelpful || {};
    _faqHelpful[id] = (_faqHelpful[id] || 0) + 1;
    saveFaqHelpful();
    toast('Merci — ça aide à améliorer la FAQ', 'ok');
  }
  const root = $('faq-item-' + id);
  if (!root) return;
  root.querySelectorAll('.faq2-vote-btn').forEach(btn => btn.classList.remove('voted-yes', 'voted-no'));
  const btns = root.querySelectorAll('.faq2-vote-btn');
  if (btns[0] && helpful) btns[0].classList.add('voted-yes');
  if (btns[1] && !helpful) btns[1].classList.add('voted-no');
}

function faqNormalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function faqScore(item, q) {
  const qq = faqNormalize(q);
  if (!qq) return 0;
  const hay = faqNormalize(item.q + ' ' + (item.a || '').replace(/<[^>]+>/g, ' '));
  const tokens = qq.split(' ').filter(Boolean);
  let score = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (hay.includes(t)) score += 2;
  }
  if (faqNormalize(item.q).includes(qq)) score += 4;
  return score;
}

function faqRenderAssistant(q) {
  const el = $('faq-list');
  if (!el) return;

  const ranked = [...FAQ_DATA]
    .map(it => ({ it, s: faqScore(it, q) }))
    .filter(x => x.s > 0)
    .sort((a,b) => b.s - a.s)
    .slice(0, 3)
    .map(x => x.it);

  el.innerHTML = `
    <div class="faq2-no-results">
      <div class="faq2-no-hint">
        <div class="faq2-no-ico">🔍</div>
        <div class="faq2-no-title">Aucune question trouvée pour « ${escHtml(q)} »</div>
        <div class="faq2-no-sub">Suggestions intelligentes (sans cloud ni clé API — tout reste ici).</div>
      </div>
      ${ranked.length ? `
        <div class="faq2-ai-card">
          <div class="faq2-ai-head">
            <span class="faq2-ai-badge">IA locale</span>
            <span class="faq2-ai-label">Meilleures correspondances</span>
          </div>
          <div class="faq2-ai-body">
            ${ranked.map(r => `
              <button type="button" class="faq2-ai-suggest" onclick="faqJumpTo('${r.id}')">
                <span class="faq2-ai-suggest-ico">${r.ico||'❓'}</span>
                <span class="faq2-ai-suggest-txt">${escHtml(r.q)}</span>
                <span class="faq2-ai-suggest-go">Voir →</span>
              </button>
            `).join('')}
          </div>
          <div class="faq2-ai-foot">
            <span class="faq2-ai-foot-label">Toujours bloqué ?</span>
            <button type="button" class="btn btn-secondary btn-sm" onclick="faqClearSearch()">← Retour</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="nav('messages')">💬 Message</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="nav('contacts')">📞 Contacts</button>
          </div>
        </div>
      ` : `
        <div class="faq2-ai-card">
          <div class="faq2-ai-head">
            <span class="faq2-ai-badge">Assistant</span>
            <span class="faq2-ai-label">Aucune suggestion fiable</span>
          </div>
          <div class="faq2-ai-body" style="color:var(--text-2);">
            Essaie <strong>ascenseur</strong>, <strong>badge</strong>, <strong>mot de passe</strong>, ou passe par <strong>Messages</strong>.
          </div>
          <div class="faq2-ai-foot">
            <span class="faq2-ai-foot-label">Besoin d’aide ?</span>
            <button type="button" class="btn btn-secondary btn-sm" onclick="faqClearSearch()">← Retour</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="nav('messages')">💬 Message</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="nav('contacts')">📞 Contacts</button>
          </div>
        </div>
      `}
    </div>
  `;
}

function faqJumpTo(id, opts) {
  const fromHash = opts && opts.fromHash;
  _faqActiveCat = 'all';
  _faqOpenId = id;
  _faqSearchQuery = '';
  const input = $('faq-search');
  if (input) input.value = '';
  const clearBtn = $('faq-search-clear');
  if (clearBtn) clearBtn.style.display = 'none';
  faqMarkOpened(id);
  if (!fromHash) faqReplaceHash(id);
  faqRenderCats();
  faqRenderList();
  setTimeout(() => $('faq-item-' + id)?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 80);
}

/**
 * Pour la recherche globale (Ctrl+K) : retourne jusqu'à n entrées { id, q, ico }.
 */
function faqGlobalSearchMatches(query, n) {
  const qq = (query || '').trim().toLowerCase();
  if (!qq || qq.length < 2) return [];
  const scored = FAQ_DATA.map(f => ({
    f,
    s: (f.q.toLowerCase().includes(qq) ? 10 : 0) +
       ((f.a || '').toLowerCase().includes(qq) ? 4 : 0) +
       faqScore(f, qq) * 0.5
  }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n || 4);
  return scored.map(x => ({ id: x.f.id, q: x.f.q, ico: x.f.ico || '❓' }));
}

function navigateToFaqItem(id) {
  nav('faq');
  setTimeout(() => faqJumpTo(id), 50);
}

function faqRefreshProgressUI() {
  const ring = document.querySelector('.faq2-progress');
  if (!ring) return;
  const n = Object.keys(_faqRead || {}).filter(id => FAQ_DATA.some(f => f.id === id)).length;
  const total = FAQ_DATA.length;
  const pct = total ? Math.round((n / total) * 100) : 0;
  const pr = ring.querySelector('.faq2-progress-ring');
  const span = pr?.querySelector('span');
  if (pr) pr.style.setProperty('--p', String(pct));
  if (span) span.textContent = pct + '%';
  const txt = ring.querySelector('.faq2-progress-txt');
  if (txt) txt.innerHTML = `<strong>${n}</strong> / ${total} vues`;
}

function faqRenderList() {
  const el = $('faq-list');
  if (!el) return;
  const q = (_faqSearchQuery || '').toLowerCase().trim();
  let items = [...FAQ_DATA];
  if (_faqActiveCat !== 'all') items = items.filter(f => f.cat === _faqActiveCat);
  if (q) items = items.filter(f => f.q.toLowerCase().includes(q) || (f.a||'').toLowerCase().includes(q));

  if (_faqOpenId && !items.some(f => f.id === _faqOpenId)) {
    _faqOpenId = null;
    faqClearHashIfFaq();
  }

  if (items.length === 0 && q) {
    clearTimeout(_faqSearchTimer);
    _faqSearchTimer = setTimeout(() => faqRenderAssistant(q), 250);
    _faqLastVisibleIds = [];
    return;
  }

  _faqLastVisibleIds = items.map(f => f.id);
  if (_faqOpenId) {
    const ix = _faqLastVisibleIds.indexOf(_faqOpenId);
    _faqKbIdx = ix >= 0 ? ix : (_faqLastVisibleIds.length ? 0 : -1);
  } else {
    if (_faqKbIdx >= _faqLastVisibleIds.length) _faqKbIdx = Math.max(0, _faqLastVisibleIds.length - 1);
    if (_faqKbIdx < 0 && _faqLastVisibleIds.length) _faqKbIdx = 0;
  }

  const hotIds = faqTopHelpfulSet();
  const focusId = _faqKbIdx >= 0 ? (_faqLastVisibleIds[_faqKbIdx] || null) : null;

  if (_faqActiveCat === 'all' && !q) {
    const groups = {};
    items.forEach(f => { if (!groups[f.cat]) groups[f.cat] = []; groups[f.cat].push(f); });
    el.innerHTML = Object.entries(groups).map(([catId, catItems]) => {
      const cat = FAQ_CATS.find(c => c.id === catId);
      return `<div class="faq2-section">
        <div class="faq2-section-label">${cat?.ico} ${cat?.label}</div>
        ${catItems.map(f => faqItemHtml(f, '', hotIds, focusId === f.id)).join('')}
      </div>`;
    }).join('');
  } else {
    el.innerHTML = items.map(f => faqItemHtml(f, q, hotIds, focusId === f.id)).join('');
  }

  faqRefreshProgressUI();
}
