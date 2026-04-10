// ════════════════════════════════════════════════════════════════
//  PAGE ADMIN : GESTION DES PERMISSIONS GRANULAIRES (V3 PRO MAX)
//  assets/js/features/permissions/permissions-page.js
// ════════════════════════════════════════════════════════════════

const PERM_ROLES_LIST = ['syndic', 'membre_cs', 'copropriétaire', 'gestionnaire_registre'];

const PERM_ROLE_LABELS = {
  syndic:                 'Syndic (Externe)',
  membre_cs:              'Conseil Syndical',
  'copropriétaire':       'Résident / Copro',
  gestionnaire_registre:  'Gestionnaire Registre',
};

const PERM_ROLE_META = {
  syndic:                { icon: '🏢', color: '#6366f1', desc: 'Gestionnaire professionnel externe' },
  membre_cs:             { icon: '🤝', color: '#0ea5e9', desc: 'Membre élu du conseil syndical' },
  'copropriétaire':      { icon: '🏠', color: '#10b981', desc: 'Résident ou propriétaire' },
  gestionnaire_registre: { icon: '📋', color: '#f59e0b', desc: 'Accès dédié au registre d\'intervention' },
};

const PERM_MODULE_LABELS = {
  dashboard:   'Tableau de bord',
  tickets:     'Signalements',
  map:         'Carte & Plan',
  messages:    'Messagerie',
  annonces:    'Annonces',
  agenda:      'Agenda',
  contacts:    'Contacts',
  faq:         'FAQ',
  documents:   'Documents',
  votes:       'Votes / AG',
  rapport:     'Rapports',
  contrats:    'Contrats',
  cles:        'Gestion des Clés',
  journal:     'Journal d\'audit',
  users:       'Utilisateurs',
  admin:       'Administration',
  registre:    'Registre d\'intervention',
  permissions: 'Permissions'
};

const PERM_MODULE_ICONS = {
  dashboard:   '📊',
  tickets:     '🎫',
  map:         '🗺️',
  messages:    '💬',
  annonces:    '📢',
  agenda:      '📅',
  contacts:    '👥',
  faq:         '❓',
  documents:   '📄',
  votes:       '🗳️',
  rapport:     '📈',
  contrats:    '📝',
  cles:        '🔑',
  journal:     '📜',
  users:       '👤',
  admin:       '⚙️',
  registre:    '📋',
  permissions: '🛡️'
};

// Modules critiques liés au Registre
const REGISTRE_MODULES = ['registre', 'documents', 'rapport', 'journal'];

// Actions possibles pour chaque module
const ACTIONS_META = {
  view:   { label: 'Voir',   ico: '👁',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  create: { label: 'Créer',  ico: '＋',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  edit:   { label: 'Modif',  ico: '✏',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  delete: { label: 'Suppr',  ico: '✕',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  manage: { label: 'Gérer',  ico: '⚙',  color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' }
};

let _pp = {
  catalog:    [],
  byModule:   {},
  rolePerms:  {},
  locks:      {},
  changelog:  [],
  activeRole: 'gestionnaire_registre',
  saving:     new Set(),
  viewAsReal: null
};

// ── RENDER PRINCIPAL ─────────────────────────────────────────────

async function renderPermissionsPage() {
  if (typeof isAdmin === 'function' && !isAdmin()) { nav('dashboard'); return; }

  $('page').innerHTML = `
  <div class="pp-root">

    <style>
      /* ── ROOT & RESET ───────────────────────────── */
      .pp-root {
        font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
        background: var(--bg-page, #0f1117);
        color: var(--text-1, #f1f5f9);
        min-height: 100vh;
        padding: 0 0 120px;
      }

      /* ── HERO HEADER ────────────────────────────── */
      .pp-hero {
        background: linear-gradient(135deg, #0f1117 0%, #151b27 50%, #0f1117 100%);
        border-bottom: 1px solid rgba(255,255,255,0.06);
        padding: 40px 40px 32px;
        position: relative;
        overflow: hidden;
      }
      .pp-hero::before {
        content: '';
        position: absolute;
        top: -60px; right: -60px;
        width: 340px; height: 340px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
        pointer-events: none;
      }
      .pp-hero::after {
        content: '';
        position: absolute;
        bottom: -40px; left: 30%;
        width: 200px; height: 200px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%);
        pointer-events: none;
      }
      .pp-hero-inner {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 24px;
        position: relative;
        z-index: 1;
      }
      .pp-hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(99,102,241,0.15);
        border: 1px solid rgba(99,102,241,0.3);
        color: #818cf8;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        padding: 4px 12px;
        border-radius: 20px;
        margin-bottom: 12px;
      }
      .pp-hero-title {
        font-size: 28px;
        font-weight: 900;
        letter-spacing: -0.5px;
        color: #f8fafc;
        margin: 0 0 6px;
        line-height: 1.2;
      }
      .pp-hero-sub {
        font-size: 14px;
        color: #64748b;
        font-weight: 400;
        margin: 0;
      }

      /* ── SIMULATE BOX ───────────────────────────── */
      .pp-simulate-box {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        backdrop-filter: blur(8px);
        min-width: 320px;
      }
      .pp-simulate-label {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        color: #475569;
        margin-bottom: 2px;
      }
      .pp-simulate-title {
        font-size: 13px;
        font-weight: 700;
        color: #94a3b8;
      }
      .pp-select {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        color: #e2e8f0;
        border-radius: 10px;
        padding: 9px 14px;
        font-size: 13px;
        font-weight: 600;
        outline: none;
        cursor: pointer;
        width: 200px;
        transition: border-color 0.2s;
      }
      .pp-select:focus { border-color: #6366f1; }
      .pp-select option { background: #1e2533; }
      .pp-btn-stop {
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 10px;
        padding: 9px 16px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        display: none;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
      }
      .pp-btn-stop:hover { background: #dc2626; transform: scale(0.98); }

      /* ── SIMULATION BANNER ──────────────────────── */
      .pp-sim-banner {
        display: none;
        margin: 0 40px;
        padding: 14px 20px;
        background: rgba(245,158,11,0.1);
        border: 1px solid rgba(245,158,11,0.25);
        border-radius: 12px;
        margin-top: 16px;
      }
      .pp-sim-banner-inner {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #f59e0b;
        font-size: 13px;
        font-weight: 700;
      }

      /* ── TABS ───────────────────────────────────── */
      .pp-tabs {
        display: flex;
        gap: 4px;
        padding: 24px 40px 0;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        background: #0f1117;
      }
      .pp-tab {
        padding: 12px 20px;
        border-radius: 10px 10px 0 0;
        font-size: 13px;
        font-weight: 700;
        color: #475569;
        border: none;
        background: transparent;
        cursor: pointer;
        position: relative;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
      }
      .pp-tab:hover { color: #94a3b8; }
      .pp-tab.active {
        color: #e2e8f0;
        border-bottom-color: #6366f1;
        background: rgba(99,102,241,0.06);
      }

      /* ── BODY ───────────────────────────────────── */
      .pp-body { padding: 32px 40px; }

      /* ── ROLE SELECTOR ──────────────────────────── */
      .pp-role-selector {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        margin-bottom: 28px;
      }
      .pp-role-card {
        background: rgba(255,255,255,0.03);
        border: 1.5px solid rgba(255,255,255,0.07);
        border-radius: 14px;
        padding: 16px 18px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
        overflow: hidden;
      }
      .pp-role-card:hover {
        background: rgba(255,255,255,0.05);
        border-color: rgba(255,255,255,0.15);
        transform: translateY(-1px);
      }
      .pp-role-card.active {
        border-color: var(--rc, #6366f1);
        background: rgba(var(--rc-rgb, 99,102,241), 0.1);
        box-shadow: 0 4px 24px rgba(var(--rc-rgb, 99,102,241), 0.15);
      }
      .pp-role-card.active::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: var(--rc, #6366f1);
      }
      .pp-role-icon {
        width: 38px; height: 38px;
        border-radius: 10px;
        background: rgba(255,255,255,0.06);
        display: flex; align-items: center; justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }
      .pp-role-name {
        font-size: 13px;
        font-weight: 800;
        color: #e2e8f0;
        margin-bottom: 2px;
      }
      .pp-role-desc {
        font-size: 11px;
        color: #475569;
        font-weight: 500;
      }
      .pp-role-check {
        margin-left: auto;
        width: 20px; height: 20px;
        border-radius: 50%;
        background: var(--rc, #6366f1);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px;
        color: white;
        opacity: 0;
        transition: opacity 0.2s;
        flex-shrink: 0;
      }
      .pp-role-card.active .pp-role-check { opacity: 1; }

      /* ── REGISTRE SPOTLIGHT ─────────────────────── */
      .pp-registre-spotlight {
        background: linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(251,191,36,0.04) 100%);
        border: 1px solid rgba(245,158,11,0.2);
        border-radius: 16px;
        padding: 20px 24px;
        margin-bottom: 24px;
        display: flex;
        align-items: flex-start;
        gap: 16px;
        position: relative;
        overflow: hidden;
      }
      .pp-registre-spotlight::before {
        content: '';
        position: absolute;
        right: -20px; top: -20px;
        width: 100px; height: 100px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%);
      }
      .pp-registre-icon {
        width: 48px; height: 48px;
        border-radius: 12px;
        background: rgba(245,158,11,0.15);
        border: 1px solid rgba(245,158,11,0.25);
        display: flex; align-items: center; justify-content: center;
        font-size: 22px;
        flex-shrink: 0;
      }
      .pp-registre-spotlight h4 {
        font-size: 14px;
        font-weight: 800;
        color: #fbbf24;
        margin: 0 0 4px;
      }
      .pp-registre-spotlight p {
        font-size: 12px;
        color: #92400e;
        color: rgba(251,191,36,0.6);
        margin: 0 0 12px;
      }
      .pp-registre-modules {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .pp-registre-badge {
        background: rgba(245,158,11,0.15);
        border: 1px solid rgba(245,158,11,0.25);
        color: #fbbf24;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.5px;
        padding: 3px 10px;
        border-radius: 20px;
      }

      /* ── LOCK BANNER ────────────────────────────── */
      .pp-lock-banner {
        background: rgba(239,68,68,0.08);
        border: 1px solid rgba(239,68,68,0.2);
        border-radius: 12px;
        padding: 14px 20px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        color: #f87171;
        font-size: 13px;
        font-weight: 700;
      }

      /* ── TABLE HEADER ───────────────────────────── */
      .pp-table-head {
        display: grid;
        grid-template-columns: 1fr 130px 90px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 12px 12px 0 0;
        padding: 12px 24px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #334155;
      }

      /* ── MODULE GROUP ───────────────────────────── */
      .pp-module-group {
        border: 1px solid rgba(255,255,255,0.06);
        border-top: none;
        overflow: hidden;
        transition: all 0.2s;
      }
      .pp-module-group:last-child { border-radius: 0 0 12px 12px; }
      .pp-module-group.registre-group {
        border-color: rgba(245,158,11,0.2);
        background: rgba(245,158,11,0.02);
      }

      .pp-module-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 24px;
        background: rgba(255,255,255,0.02);
        cursor: pointer;
        transition: background 0.15s;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }
      .pp-module-header:hover { background: rgba(255,255,255,0.04); }
      .pp-module-header.registre-header {
        background: rgba(245,158,11,0.04);
      }
      .pp-module-header.registre-header:hover {
        background: rgba(245,158,11,0.08);
      }
      .pp-module-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .pp-module-icon {
        width: 28px; height: 28px;
        border-radius: 7px;
        background: rgba(255,255,255,0.05);
        display: flex; align-items: center; justify-content: center;
        font-size: 14px;
      }
      .pp-module-name {
        font-size: 13.5px;
        font-weight: 800;
        color: #cbd5e1;
      }
      .pp-module-badge {
        display: inline-flex;
        align-items: center;
        background: rgba(255,255,255,0.05);
        border-radius: 20px;
        padding: 2px 10px;
        font-size: 11px;
        font-weight: 700;
        color: #475569;
      }
      .pp-module-badge.full { background: rgba(16,185,129,0.12); color: #34d399; }
      .pp-module-chevron {
        transition: transform 0.2s;
        color: #334155;
      }
      .pp-module-chevron.open { transform: rotate(180deg); }

      /* ── PERM ROW ───────────────────────────────── */
      .pp-perm-row {
        display: grid;
        grid-template-columns: 1fr 130px 90px;
        align-items: center;
        padding: 13px 24px;
        border-bottom: 1px solid rgba(255,255,255,0.03);
        transition: background 0.12s;
        gap: 16px;
      }
      .pp-perm-row:last-child { border-bottom: none; }
      .pp-perm-row:hover { background: rgba(255,255,255,0.025); }
      .pp-perm-label {
        font-size: 13px;
        font-weight: 700;
        color: #94a3b8;
        margin-bottom: 2px;
      }
      .pp-perm-desc {
        font-size: 11px;
        color: #334155;
        font-weight: 500;
      }

      /* ── ACTION TAG ─────────────────────────────── */
      .pp-action-tag {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 4px 10px;
        border-radius: 7px;
        border: 1px solid;
        width: fit-content;
      }

      /* ── TOGGLE ─────────────────────────────────── */
      .pp-toggle {
        width: 44px;
        height: 24px;
        border-radius: 12px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.1);
        position: relative;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: block;
        margin: 0 auto;
      }
      .pp-toggle.on {
        background: #22c55e;
        border-color: #22c55e;
        box-shadow: 0 0 12px rgba(34,197,94,0.35);
      }
      .pp-toggle::after {
        content: '';
        position: absolute;
        top: 3px; left: 3px;
        width: 16px; height: 16px;
        border-radius: 50%;
        background: rgba(255,255,255,0.5);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      }
      .pp-toggle.on::after {
        transform: translateX(20px);
        background: white;
      }
      .pp-toggle.saving { opacity: 0.4; pointer-events: none; }

      /* ── EMERGENCY GRID ─────────────────────────── */
      .pp-emergency-grid { display: grid; gap: 12px; }
      .pp-emergency-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border: 1.5px solid rgba(255,255,255,0.07);
        border-radius: 16px;
        background: rgba(255,255,255,0.02);
        transition: all 0.2s;
      }
      .pp-emergency-card.locked {
        border-color: rgba(239,68,68,0.3);
        background: rgba(239,68,68,0.05);
      }
      .pp-emergency-role-name {
        font-size: 15px;
        font-weight: 800;
        color: #e2e8f0;
        margin-bottom: 4px;
      }
      .pp-emergency-status {
        font-size: 12px;
        font-weight: 700;
      }
      .pp-emergency-status.ok { color: #34d399; }
      .pp-emergency-status.locked { color: #f87171; }
      .pp-btn-lock {
        border: none;
        border-radius: 10px;
        padding: 10px 18px;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pp-btn-lock.lock { background: #ef4444; color: white; }
      .pp-btn-lock.unlock { background: #22c55e; color: white; }
      .pp-btn-lock:hover { transform: scale(0.97); filter: brightness(0.9); }

      /* ── LOGS TABLE ─────────────────────────────── */
      .pp-logs-table { border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; overflow: hidden; }
      .pp-logs-head {
        display: grid;
        grid-template-columns: 90px 1fr 160px 130px;
        background: rgba(255,255,255,0.03);
        padding: 12px 24px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #334155;
      }
      .pp-logs-row {
        display: grid;
        grid-template-columns: 90px 1fr 160px 130px;
        padding: 12px 24px;
        font-size: 12px;
        border-top: 1px solid rgba(255,255,255,0.04);
        align-items: center;
        transition: background 0.1s;
      }
      .pp-logs-row:hover { background: rgba(255,255,255,0.02); }
      .pp-logs-action {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.5px;
        padding: 3px 8px;
        border-radius: 6px;
        width: fit-content;
      }
      .pp-logs-action.granted { background: rgba(34,197,94,0.12); color: #4ade80; }
      .pp-logs-action.revoked { background: rgba(239,68,68,0.12); color: #f87171; }

      /* ── SECTION TITLE ──────────────────────────── */
      .pp-section-title {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #334155;
        margin-bottom: 16px;
      }

      /* ── EMPTY ──────────────────────────────────── */
      .pp-empty {
        padding: 48px;
        text-align: center;
        color: #334155;
        font-size: 14px;
        font-weight: 600;
      }
    </style>

    <!-- HERO -->
    <div class="pp-hero">
      <div class="pp-hero-inner">
        <div>
          <div class="pp-hero-badge">⚡ Admin · Sécurité</div>
          <h1 class="pp-hero-title">Gouvernance & Permissions</h1>
          <p class="pp-hero-sub">Contrôle granulaire des accès pour chaque profil de la copropriété.</p>
        </div>
        <div class="pp-simulate-box">
          <div>
            <div class="pp-simulate-label">Mode Test</div>
            <div class="pp-simulate-title">Simuler un profil</div>
          </div>
          <select id="view-as-select" class="pp-select" onchange="ppSimulateAs(this.value)">
            <option value="">— Choisir —</option>
            ${PERM_ROLES_LIST.map(r => `<option value="${r}">${PERM_ROLE_LABELS[r]}</option>`).join('')}
          </select>
          <button id="view-as-stop" class="pp-btn-stop" onclick="ppStopSimulation()">✕ Quitter</button>
        </div>
      </div>
    </div>

    <!-- SIM BANNER -->
    <div id="view-as-banner" class="pp-sim-banner">
      <div class="pp-sim-banner-inner">
        <span style="font-size:20px;">👁</span>
        <div>
          <span style="font-size:11px; letter-spacing:1px; text-transform:uppercase; opacity:0.7;">Session de simulation active — </span>
          Vous naviguez avec les droits d'un <strong><span id="view-as-label"></span></strong>. Aucune modification enregistrée.
        </div>
      </div>
    </div>

    <!-- TABS -->
    <div class="pp-tabs">
      <button class="pp-tab active" onclick="ppSwitchTab(this, 'matrix')">
        <span>📊</span> Matrice des droits
      </button>
      <button class="pp-tab" onclick="ppSwitchTab(this, 'emergency')">
        <span>🚨</span> Verrous d'urgence
      </button>
      <button class="pp-tab" onclick="ppSwitchTab(this, 'logs')">
        <span>📜</span> Historique
      </button>
    </div>

    <!-- BODY -->
    <div class="pp-body">

      <!-- MATRIX -->
      <div id="pp-content-matrix">
        <div class="pp-section-title">Rôle à configurer</div>
        <div class="pp-role-selector" id="pp-role-selector">
          ${PERM_ROLES_LIST.map(r => {
            const meta = PERM_ROLE_META[r];
            const isActive = r === _pp.activeRole;
            return `
              <div class="pp-role-card ${isActive ? 'active' : ''}"
                   data-role="${r}"
                   style="--rc:${meta.color};"
                   onclick="ppSelectRole('${r}')">
                <div class="pp-role-icon">${meta.icon}</div>
                <div style="flex:1; min-width:0;">
                  <div class="pp-role-name">${PERM_ROLE_LABELS[r]}</div>
                  <div class="pp-role-desc">${meta.desc}</div>
                </div>
                <div class="pp-role-check">✓</div>
              </div>
            `;
          }).join('')}
        </div>

        <div id="pp-registre-spotlight" style="display:none;">
          <div class="pp-registre-spotlight">
            <div class="pp-registre-icon">📋</div>
            <div style="position:relative; z-index:1;">
              <h4>🆕 Nouveau rôle — Gestionnaire Registre</h4>
              <p>Ce rôle est dédié à la gestion du Registre d'intervention. Configurez précisément les accès aux modules concernés.</p>
              <div class="pp-registre-modules">
                ${REGISTRE_MODULES.map(m => `<span class="pp-registre-badge">📋 ${PERM_MODULE_LABELS[m] || m}</span>`).join('')}
              </div>
            </div>
          </div>
        </div>

        <div id="pp-matrix-grid">
          <div class="pp-empty"><div class="spinner"></div></div>
        </div>
      </div>

      <div id="pp-content-emergency" style="display:none;"></div>
      <div id="pp-content-logs" style="display:none;"></div>

    </div>
  </div>
  `;

  await _ppLoadAll();
  _ppRenderMatrix();
}

// ── LOGIQUE DE CHARGEMENT ─────────────────────────────────────────

async function _ppLoadAll() {
  const [catalog, locks, changelog] = await Promise.all([
    Permissions.loadCatalog(),
    Permissions.getRoleLocks(),
    Permissions.getChangeLog(50)
  ]);

  _pp.catalog   = catalog;
  _pp.locks     = locks;
  _pp.changelog = changelog;

  _pp.byModule = {};
  catalog.forEach(p => {
    if (!_pp.byModule[p.module]) _pp.byModule[p.module] = [];
    _pp.byModule[p.module].push(p);
  });

  _pp.rolePerms[_pp.activeRole] = await Permissions.getPermissionsForRole(_pp.activeRole);
}

// ── NAVIGATION ONGLETS ───────────────────────────────────────────

function ppSwitchTab(btn, target) {
  document.querySelectorAll('.pp-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  ['matrix', 'emergency', 'logs'].forEach(t => {
    $(`pp-content-${t}`).style.display = (t === target) ? 'block' : 'none';
  });

  if (target === 'emergency') _ppRenderEmergency();
  if (target === 'logs')      _ppRenderLogs();
}

// ── SÉLECTION DU RÔLE ───────────────────────────────────────────

function ppSelectRole(role) {
  _pp.activeRole = role;

  document.querySelectorAll('.pp-role-card').forEach(c => {
    c.classList.toggle('active', c.dataset.role === role);
  });

  // Spotlight Registre uniquement pour ce rôle
  const spotlight = $('pp-registre-spotlight');
  if (spotlight) spotlight.style.display = (role === 'gestionnaire_registre') ? 'block' : 'none';

  _ppRenderMatrix();
}

// ── RENDU MATRICE ────────────────────────────────────────────────

async function _ppRenderMatrix() {
  const container = $('pp-matrix-grid');
  const role      = _pp.activeRole;

  if (!_pp.rolePerms[role]) {
    container.innerHTML = '<div class="pp-empty"><div class="spinner"></div></div>';
    _pp.rolePerms[role] = await Permissions.getPermissionsForRole(role);
  }

  const isLocked = _pp.locks[role]?.locked === true;

  // Affiche le spotlight Registre au premier render
  const spotlight = $('pp-registre-spotlight');
  if (spotlight) spotlight.style.display = (role === 'gestionnaire_registre') ? 'block' : 'none';

  let html = `
    <div class="pp-table-head">
      <div>Fonctionnalité / Permission</div>
      <div>Action</div>
      <div style="text-align:center;">Accès</div>
    </div>
  `;

  if (isLocked) {
    html = `<div class="pp-lock-banner">⚠️ Ce rôle est actuellement verrouillé — toutes les permissions sont révoquées.</div>` + html;
  }

  // Trier : modules Registre en premier si rôle gestionnaire_registre
  let moduleEntries = Object.entries(_pp.byModule);
  if (role === 'gestionnaire_registre') {
    moduleEntries = [
      ...moduleEntries.filter(([m]) => REGISTRE_MODULES.includes(m)),
      ...moduleEntries.filter(([m]) => !REGISTRE_MODULES.includes(m)),
    ];
  }

  moduleEntries.forEach(([modId, perms]) => {
    const grantedCount = perms.filter(p => _pp.rolePerms[role]?.[p.id]).length;
    const label        = PERM_MODULE_LABELS[modId] || modId;
    const icon         = PERM_MODULE_ICONS[modId] || '📦';
    const isFullAccess = grantedCount === perms.length && perms.length > 0;
    const isRegistreMod = REGISTRE_MODULES.includes(modId);
    const isRegistreRole = role === 'gestionnaire_registre';

    html += `
    <div class="pp-module-group ${(isRegistreMod && isRegistreRole) ? 'registre-group' : ''}">
      <div class="pp-module-header ${(isRegistreMod && isRegistreRole) ? 'registre-header' : ''}" onclick="ppToggleModuleUI('${modId}')">
        <div class="pp-module-title">
          <div class="pp-module-icon">${icon}</div>
          <span class="pp-module-name">${label}</span>
          ${(isRegistreMod && isRegistreRole) ? '<span style="font-size:10px; background:rgba(245,158,11,0.15); color:#fbbf24; padding:2px 8px; border-radius:10px; font-weight:800; letter-spacing:0.5px;">REGISTRE</span>' : ''}
          <span class="pp-module-badge ${isFullAccess ? 'full' : ''}">${grantedCount} / ${perms.length}</span>
        </div>
        <svg id="pp-chev-${modId}" class="pp-module-chevron open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div id="pp-body-${modId}">
        ${perms.map(p => {
          const isOn = _pp.rolePerms[role]?.[p.id] === true;
          const meta = ACTIONS_META[p.action] || { label: p.action, ico: '•', color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
          return `
            <div class="pp-perm-row">
              <div>
                <div class="pp-perm-label">${escHtml(p.label)}</div>
                <div class="pp-perm-desc">${escHtml(p.description || '')}</div>
              </div>
              <div>
                <span class="pp-action-tag" style="color:${meta.color}; background:${meta.bg}; border-color:${meta.color}33;">
                  ${meta.ico} ${meta.label}
                </span>
              </div>
              <div style="text-align:center;">
                <button class="pp-toggle ${isOn ? 'on' : ''}"
                        onclick="ppTogglePerm('${role}', '${p.id}', ${!isOn})"></button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    `;
  });

  container.innerHTML = html;
}

function ppToggleModuleUI(modId) {
  const body = $(`pp-body-${modId}`);
  const chev = $(`pp-chev-${modId}`);
  if (!body) return;
  const isHidden = body.style.display === 'none';
  body.style.display = isHidden ? 'block' : 'none';
  if (chev) chev.classList.toggle('open', isHidden);
}

async function ppTogglePerm(role, permId, targetState) {
  const { data: ok } = await Permissions.setPermission(role, permId, targetState);

  if (ok !== false) {
    _pp.rolePerms[role][permId] = targetState;
    _ppRenderMatrix();
    toast(`Droits mis à jour — ${PERM_ROLE_LABELS[role]}`, 'ok');
  } else {
    toast('Erreur de sauvegarde', 'err');
  }
}

// ── EMERGENCY LOCKS ──────────────────────────────────────────────

function _ppRenderEmergency() {
  const container = $('pp-content-emergency');
  container.innerHTML = `
    <div style="max-width:720px;">
      <div style="margin-bottom:24px;">
        <div class="pp-section-title">Arrêt d'Urgence par Rôle</div>
        <p style="font-size:14px; color:#64748b; margin:0; line-height:1.6;">
          Suspendez instantanément l'accès complet d'un rôle en cas d'abus ou de maintenance critique.
          Les utilisateurs concernés ne pourront plus accéder à aucune fonctionnalité jusqu'au rétablissement.
        </p>
      </div>
      <div class="pp-emergency-grid">
        ${PERM_ROLES_LIST.map(r => {
          const isL  = _pp.locks[r]?.locked;
          const meta = PERM_ROLE_META[r];
          return `
            <div class="pp-emergency-card ${isL ? 'locked' : ''}">
              <div style="display:flex; align-items:center; gap:14px;">
                <div class="pp-role-icon" style="background:rgba(255,255,255,0.04);">${meta.icon}</div>
                <div>
                  <div class="pp-emergency-role-name">${PERM_ROLE_LABELS[r]}</div>
                  <div class="pp-emergency-status ${isL ? 'locked' : 'ok'}">
                    ${isL ? '🚫 Accès suspendu' : '✅ Accès opérationnel'}
                  </div>
                </div>
              </div>
              <button class="pp-btn-lock ${isL ? 'unlock' : 'lock'}" onclick="ppToggleRoleLock('${r}', ${!isL})">
                ${isL ? '🔓 Rétablir l\'accès' : '🔒 Verrouiller'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

async function ppToggleRoleLock(role, locked) {
  let reason = '';
  if (locked) reason = prompt('Raison du verrouillage (sera affichée aux résidents) :') || 'Maintenance';

  const ok = await Permissions.setRoleLock(role, locked, reason);
  if (ok) {
    _pp.locks[role] = { locked };
    _ppRenderEmergency();
    _ppRenderMatrix();
    toast('Verrouillage mis à jour', 'warn');
  }
}

// ── SIMULATION "VIEW AS" ────────────────────────────────────────

async function ppSimulateAs(role) {
  if (!role) { ppStopSimulation(); return; }

  if (!_pp.viewAsReal) _pp.viewAsReal = { ...profile };
  profile = { ..._pp.viewAsReal, role: role };

  await Permissions.load();
  if (typeof initUI === 'function') initUI();

  $('view-as-banner').style.display = 'block';
  $('view-as-label').textContent     = PERM_ROLE_LABELS[role].toUpperCase();
  $('view-as-stop').style.display    = 'flex';
  $('view-as-select').value          = role;

  toast(`Simulation active : Profil ${PERM_ROLE_LABELS[role]}`, 'warn');
  nav(Permissions.getDefaultPage());
}

async function ppStopSimulation() {
  if (!_pp.viewAsReal) return;

  profile          = { ..._pp.viewAsReal };
  _pp.viewAsReal   = null;

  await Permissions.load();
  if (typeof initUI === 'function') initUI();

  $('view-as-banner').style.display = 'none';
  $('view-as-stop').style.display   = 'none';
  $('view-as-select').value         = '';

  nav('permissions');
  toast('Retour au mode Administrateur', 'ok');
}

// ── JOURNAL D'AUDIT ──────────────────────────────────────────────

async function _ppRenderLogs() {
  const container = $('pp-content-logs');
  const logs      = await Permissions.getChangeLog(50);

  container.innerHTML = `
    <div class="pp-logs-table">
      <div class="pp-logs-head">
        <div>Action</div>
        <div>Cible</div>
        <div>Auteur</div>
        <div style="text-align:right;">Date</div>
      </div>
      ${logs.length ? logs.map(l => `
        <div class="pp-logs-row">
          <div>
            <span class="pp-logs-action ${l.action === 'granted' ? 'granted' : 'revoked'}">
              ${l.action === 'granted' ? '✓ Accordé' : '✕ Révoqué'}
            </span>
          </div>
          <div style="color:#94a3b8; font-weight:600;">
            ${l.permission}
            <span style="color:#334155; font-weight:400;"> — ${l.role}</span>
          </div>
          <div style="color:#64748b; font-weight:700;">${l.admin_nom}</div>
          <div style="text-align:right; color:#334155;">${fmt(l.created_at)}</div>
        </div>
      `).join('') : '<div class="pp-empty">Aucun historique disponible</div>'}
    </div>
  `;
}
