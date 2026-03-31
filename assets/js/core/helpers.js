// ── HELPERS ──
const $ = id => document.getElementById(id);
const d = (el, html) => { if(el) el.innerHTML = html; };
const APP_DEBUG = localStorage.getItem('coprosync_debug') === '1' || /localhost|127\.0\.0\.1/.test(location.hostname);
function dbg(...args) { if (APP_DEBUG) console.log(...args); }
function warn(...args) { if (APP_DEBUG) console.warn(...args); }
function err(...args) { console.error(...args); }

function askTextModal({
  title = 'Saisir une valeur',
  label = 'Valeur',
  placeholder = '',
  confirmLabel = 'Valider',
  defaultValue = ''
} = {}) {
  return new Promise(resolve => {
    const id = `ask-text-${Date.now()}`;
    const overlay = document.createElement('div');
    overlay.className = 'overlay open';
    overlay.id = id;
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px;">
        <div class="mh">
          <span class="mh-title">${title}</span>
          <button class="mclose" type="button">×</button>
        </div>
        <div class="mb">
          <div class="fg">
            <label class="label">${label}</label>
            <input class="input" id="${id}-input" type="text" placeholder="${placeholder}">
          </div>
        </div>
        <div class="mf">
          <button class="btn btn-secondary" type="button" id="${id}-cancel">Annuler</button>
          <button class="btn btn-primary" type="button" id="${id}-ok">${confirmLabel}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const input = document.getElementById(`${id}-input`);
    if (input) {
      input.value = defaultValue || '';
      input.focus();
      input.select();
    }

    const close = value => {
      overlay.remove();
      resolve(value);
    };

    overlay.querySelector('.mclose')?.addEventListener('click', () => close(null));
    document.getElementById(`${id}-cancel`)?.addEventListener('click', () => close(null));
    document.getElementById(`${id}-ok`)?.addEventListener('click', () => {
      const val = (input?.value || '').trim();
      close(val || null);
    });
    overlay.addEventListener('click', e => {
      if (e.target === overlay) close(null);
    });
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = (input?.value || '').trim();
        close(val || null);
      }
      if (e.key === 'Escape') close(null);
    });
  });
}

// ── AFFICHAGE NOM PROPRE ──
// Évite d'afficher le username (ex: "jeremysuzet") si un vrai prénom/nom est dispo
function displayName(prenom, nom, email, fallback) {
  const p = (prenom || '').trim();
  const n = (nom || '').trim();
  const e = (email || '').trim();

  function isUsername(s) {
    if (!s) return true;
    if (s.includes('@')) return true;
    if (/\d/.test(s)) return true;
    if (s.length > 25) return true;
    if (e && s === e.split('@')[0]) return true;
    if (s === s.toLowerCase() && !s.includes(' ') && s.length > 5) return true;
    return false;
  }

  if (p && !isUsername(p)) {
    if (n && !isUsername(n)) return p + ' ' + n;
    return p;
  }
  if (n && !isUsername(n)) return n;
  if (e) {
    const local = e.split('@')[0];
    if (/\d/.test(local) || local.length > 15) return fallback || 'Résident';
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return fallback || '—';
}

function displayNameFromProfile(p, email) {
  if (!p) return '—';
  return displayName(p.prenom, p.nom, p.email || email, 'Résident');
}

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function fmtD(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function depuisJours(iso) {
  if (!iso) return '';
  const j = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (j === 0) return "aujourd'hui";
  if (j === 1) return 'hier';
  if (j < 30) return `${j}j`;
  if (j < 365) return `${Math.floor(j/30)}mois`;
  return `${Math.floor(j/365)}an`;
}
function daysUntil(d) {
  return Math.ceil((new Date(d) - new Date()) / 864e5);
}
function isManager() {
  // Le syndic externe n'est PAS un manager — il a un accès très restreint
  return profile && ['administrateur', 'membre_cs'].includes(profile.role);
}
function isAdmin() {
  return profile && profile.role === 'administrateur';
}
function isSyndicExterne() {
  return profile && profile.role === 'syndic';
}
function isSyndicOrAdmin() {
  return profile && ['administrateur', 'syndic'].includes(profile.role);
}

function toast(msg, type='ok') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type==='ok'?'✓':type==='err'?'✕':'⚠'}</span>${msg}`;
  $('toasts').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function badgeUrgence(u) {
  const m = { critique:'badge-critique', important:'badge-important', normal:'badge-normal' };
  const l = { critique:'🔴 Critique', important:'🟠 Important', normal:'🔵 Normal' };
  return `<span class="badge ${m[u]||'badge-normal'}">${l[u]||u}</span>`;
}
function badgeStatut(s) {
  const m = {
    nouveau:'badge-nouveau', en_cours:'badge-en_cours',
    transmis_syndic:'badge-transmis_syndic', attente_intervention:'badge-attente_intervention',
    résolu:'badge-résolu', clos:'badge-clos'
  };
  const l = {
    nouveau:'Nouveau', en_cours:'En cours', transmis_syndic:'Transmis syndic',
    attente_intervention:'En attente', résolu:'Résolu', clos:'Clos'
  };
  return `<span class="badge ${m[s]||'badge-nouveau'}">${l[s]||s}</span>`;
}
