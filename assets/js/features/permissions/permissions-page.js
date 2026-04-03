// ════════════════════════════════════════════════════════════════
//  COPROSYNC — Page Admin : Gestion des permissions
//  assets/js/features/permissions/permissions-page.js
//
//  Accessible UNIQUEMENT aux administrateurs (hardcodé).
//  Fonctionnalités :
//    - Matrice de permissions (grille rôle × permission, switches)
//    - Master Switch par rôle (verrouillage d'urgence)
//    - Simulateur "Voir en tant que" (View As)
//    - Contrôle CRUD granulaire par module
//    - Journal des modifications
// ════════════════════════════════════════════════════════════════

// ── STATE ────────────────────────────────────────────────────────
let _permPageState = {
  catalog:       [],        // toutes les permissions
  byModule:      {},        // catalog groupé par module
  rolePerms:     {},        // { role: { permId: boolean } }
  locks:         {},        // { role: { locked, reason } }
  changelog:     [],
  activeRole:    'syndic',  // rôle sélectionné dans la matrice
  viewAsRole:    null,      // simulation en cours
  saving:        new Set(), // IDs en cours de sauvegarde
};

const PERM_ROLES = ['syndic', 'membre_cs', 'copropriétaire'];
const ROLE_LABELS = {
  syndic:         'Syndic',
  membre_cs:      'Conseil Syndical',
  'copropriétaire': 'Copropriétaire',
  administrateur: 'Administrateur',
};
const ROLE_COLORS = {
  syndic:         { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  membre_cs:      { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
  'copropriétaire': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
};
const MODULE_LABELS = {
  dashboard:   '🏠 Tableau de bord',
  tickets:     '🔧 Signalements',
  map:         '🗺️ Carte',
  messages:    '💬 Messagerie',
  annonces:    '📢 Annonces',
  agenda:      '📅 Agenda',
  contacts:    '📞 Contacts',
  faq:         '❓ FAQ',
  documents:   '📄 Documents',
  votes:       '🗳️ Votes',
  rapport:     '📊 Rapport syndic',
  contrats:    '📋 Contrats',
  cles:        '🔑 Clés',
  journal:     '📒 Journal',
};

// ── RENDER ──────────────────────────────────────────────────────

async function renderPermissionsPage() {
  // Garde de sécurité hardcodée
  if (!isAdmin()) {
    $('page').innerHTML = `<div style="padding:24px;text-align:center;color:var(--red);">
      🔒 Accès réservé aux administrateurs.
    </div>`;
    return;
  }

  $('page').innerHTML = `<div style="padding:16px 20px 60px;" id="perm-page">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
      <div>
        <h1 style="font-family:var(--font-head);font-size:22px;font-weight:800;letter-spacing:-.3px;margin-bottom:4px;">
          Gestion des permissions
        </h1>
        <p style="font-size:13px;color:var(--text-2);margin:0;">
          Configurez en temps réel ce que chaque rôle peut voir et faire.
        </p>
      </div>
      <div id="view-as-wrap" style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:12px;color:var(--text-3);font-weight:600;">Simuler le vue de :</span>
        <select id="view-as-select" class="select" style="width:180px;font-size:13px;" onchange="permSimulateAs(this.value)">
          <option value="">— Choisir un rôle —</option>
          ${PERM_ROLES.map(r => `<option value="${r}">${ROLE_LABELS[r]}</option>`).join('')}
        </select>
        <button id="view-as-stop" class="btn btn-danger btn-sm" style="display:none;" onclick="permStopSimulation()">
          ✕ Arrêter la simulation
        </button>
      </div>
    </div>

    <div id="view-as-banner" style="display:none;margin-bottom:16px;padding:12px 16px;background:var(--amber-light);border:1px solid var(--amber-border);border-radius:var(--r-md);">
      <strong>👁️ Mode simulation</strong> — Vous voyez l'application comme un <span id="view-as-label"></span>.
      <span style="font-size:12px;color:var(--text-2);display:block;margin-top:4px;">La navigation et les boutons reflètent exactement ce que ce rôle verrait.</span>
    </div>

    <!-- TABS -->
    <div style="display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:20px;">
      <button class="perm-tab active" data-tab="matrix" onclick="permSwitchTab('matrix')">Matrice</button>
      <button class="perm-tab" data-tab="locks" onclick="permSwitchTab('locks')">Verrous d'urgence</button>
      <button class="perm-tab" data-tab="log" onclick="permSwitchTab('log')">Journal</button>
    </div>

    <div id="perm-tab-matrix"><div style="text-align:center;padding:40px;color:var(--text-3);">Chargement…</div></div>
    <div id="perm-tab-locks" style="display:none;"></div>
    <div id="perm-tab-log" style="display:none;"></div>
  </div>

  <style>
    .perm-tab {
      padding:10px 20px;font-size:13px;font-weight:600;
      border:none;background:none;cursor:pointer;
      color:var(--text-2);border-bottom:2px solid transparent;
      margin-bottom:-1px;font-family:var(--font-body);
      transition:color .12s;
    }
    .perm-tab.active { color:var(--text);border-bottom-color:var(--text); }
    .perm-tab:hover { color:var(--text); }

    .perm-switch {
      position:relative;width:40px;height:22px;
      background:var(--border);border-radius:11px;
      cursor:pointer;border:none;
      transition:background .18s;flex-shrink:0;
    }
    .perm-switch::after {
      content:'';position:absolute;top:3px;left:3px;
      width:16px;height:16px;border-radius:50%;background:#fff;
      transition:transform .18s;box-shadow:0 1px 3px rgba(0,0,0,.2);
    }
    .perm-switch.on { background:var(--green); }
    .perm-switch.on::after { transform:translateX(18px); }
    .perm-switch.saving { opacity:.5;pointer-events:none; }
    .perm-switch.hardcoded { background:var(--border-strong);cursor:not-allowed;opacity:.5; }

    .module-card {
      background:var(--surface);border:1px solid var(--border);
      border-radius:var(--r-lg);margin-bottom:12px;overflow:hidden;
    }
    .module-header {
      display:flex;align-items:center;justify-content:space-between;
      padding:12px 16px;background:var(--surface-2);
      border-bottom:1px solid var(--border);cursor:pointer;
      user-select:none;
    }
    .module-header:hover { background:var(--bg); }
    .module-title { font-weight:700;font-size:14px;color:var(--text); }
    .module-summary { font-size:11px;color:var(--text-3);margin-top:2px; }
    .module-body { padding:0; }

    .perm-row {
      display:flex;align-items:center;gap:12px;
      padding:11px 16px;border-bottom:1px solid var(--border);
      transition:background .1s;
    }
    .perm-row:last-child { border-bottom:none; }
    .perm-row:hover { background:var(--surface-2); }
    .perm-row-info { flex:1;min-width:0; }
    .perm-row-label { font-size:13px;color:var(--text);font-weight:500; }
    .perm-row-desc { font-size:11px;color:var(--text-3);margin-top:2px; }
    .perm-action-badge {
      font-size:10px;padding:2px 7px;border-radius:8px;font-weight:700;
      background:var(--surface-2);color:var(--text-3);flex-shrink:0;
    }

    .role-pill {
      display:inline-flex;align-items:center;gap:6px;
      font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;
      cursor:pointer;border:1.5px solid;transition:all .12s;
    }

    .lock-card {
      background:var(--surface);border:1px solid var(--border);
      border-radius:var(--r-lg);padding:18px 20px;
      display:flex;align-items:center;gap:16px;flex-wrap:wrap;
      margin-bottom:10px;
    }
    .lock-card.locked {
      border-color:var(--red-border);background:var(--red-light);
    }

    .changelog-row {
      display:flex;align-items:flex-start;gap:10px;
      padding:10px 0;border-bottom:1px solid var(--border);
      font-size:12px;
    }
    .changelog-row:last-child { border-bottom:none; }
  </style>`;

  await _loadPermData();
  _renderMatrix();
  _renderLocks();
  _renderLog();
}

// ── CHARGEMENT DES DONNÉES ────────────────────────────────────────

async function _loadPermData() {
  const [catalog, locks, changelog] = await Promise.all([
    Permissions.loadCatalog(),
    Permissions.getRoleLocks(),
    Permissions.getChangeLog(50),
  ]);

  _permPageState.catalog = catalog;
  _permPageState.locks = locks;
  _permPageState.changelog = changelog;

  // Groupe par module
  _permPageState.byModule = {};
  catalog.forEach(p => {
    if (!_permPageState.byModule[p.module]) _permPageState.byModule[p.module] = [];
    _permPageState.byModule[p.module].push(p);
  });

  // Charge les permissions actuelles pour chaque rôle
  await Promise.all(PERM_ROLES.map(async role => {
    _permPageState.rolePerms[role] = await Permissions.getPermissionsForRole(role);
  }));
}

// ── TAB SWITCH ───────────────────────────────────────────────────

function permSwitchTab(tab) {
  document.querySelectorAll('.perm-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('perm-tab-matrix').style.display = tab === 'matrix' ? '' : 'none';
  document.getElementById('perm-tab-locks').style.display  = tab === 'locks'  ? '' : 'none';
  document.getElementById('perm-tab-log').style.display    = tab === 'log'    ? '' : 'none';
}

// ── MATRICE ──────────────────────────────────────────────────────

function _renderMatrix() {
  const el = document.getElementById('perm-tab-matrix');
  if (!el) return;

  const activeRole = _permPageState.activeRole;
  const roleColor = ROLE_COLORS[activeRole] || {};

  el.innerHTML = `
    <!-- Sélecteur de rôle -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;align-items:center;">
      <span style="font-size:12px;color:var(--text-3);font-weight:600;margin-right:4px;">Configurer :</span>
      ${PERM_ROLES.map(r => {
        const c = ROLE_COLORS[r];
        const isActive = r === activeRole;
        return `<button class="role-pill"
          style="background:${isActive?c.bg:'var(--surface)'};color:${isActive?c.text:'var(--text-2)'};border-color:${isActive?c.border:'var(--border)'};"
          onclick="permSelectRole('${r}')">
          ${isActive ? '● ' : ''}${ROLE_LABELS[r]}
        </button>`;
      }).join('')}
    </div>

    <!-- Info verrou -->
    ${_permPageState.locks[activeRole]?.locked ? `
    <div style="padding:10px 14px;background:var(--red-light);border:1px solid var(--red-border);border-radius:var(--r-md);margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
      <span style="font-size:13px;font-weight:700;color:var(--red);">🔒 Ce rôle est verrouillé — toutes les permissions sont suspendues.</span>
      <button class="btn btn-sm" style="background:var(--red);color:#fff;border:none;" onclick="permToggleLock('${activeRole}', false)">Déverrouiller</button>
    </div>` : ''}

    <!-- Modules & permissions -->
    <div id="perm-modules">
      ${Object.entries(_permPageState.byModule)
        .filter(([mod]) => MODULE_LABELS[mod])
        .map(([mod, perms]) => _renderModuleCard(mod, perms, activeRole))
        .join('')}
    </div>
  `;
}

function _renderModuleCard(mod, perms, role) {
  const granted = perms.filter(p => _permPageState.rolePerms[role]?.[p.id] === true).length;
  const total = perms.length;

  const rows = perms.map(p => {
    const isOn = _permPageState.rolePerms[role]?.[p.id] === true;
    const isSaving = _permPageState.saving.has(`${role}:${p.id}`);
    const isHardcoded = p.hardcoded;
    const actionLabel = { view:'Voir', create:'Créer', edit:'Modifier', delete:'Supprimer', read:'Lire' }[p.action] || p.action;

    return `
      <div class="perm-row">
        <div class="perm-row-info">
          <div class="perm-row-label">${escHtml(p.label)}</div>
          ${p.description ? `<div class="perm-row-desc">${escHtml(p.description)}</div>` : ''}
        </div>
        <span class="perm-action-badge">${actionLabel}</span>
        ${isHardcoded
          ? `<button class="perm-switch hardcoded" title="Permission système — non modifiable" disabled></button>`
          : `<button
              class="perm-switch ${isOn?'on':''} ${isSaving?'saving':''}"
              title="${isOn ? 'Cliquer pour révoquer' : 'Cliquer pour accorder'}"
              onclick="permToggle('${role}','${p.id}',${!isOn})"
            ></button>`}
      </div>`;
  }).join('');

  return `
    <div class="module-card">
      <div class="module-header" onclick="permToggleModule('${mod}')">
        <div>
          <div class="module-title">${MODULE_LABELS[mod] || mod}</div>
          <div class="module-summary">${granted}/${total} permission${total>1?'s':''} accordée${granted>1?'s':''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${granted === total ? `<span style="font-size:11px;background:var(--green-light);color:var(--green);padding:2px 8px;border-radius:8px;font-weight:700;">Tout accordé</span>` : ''}
          ${granted === 0 ? `<span style="font-size:11px;background:var(--surface-2);color:var(--text-3);padding:2px 8px;border-radius:8px;font-weight:700;">Tout refusé</span>` : ''}
          <svg id="perm-chevron-${mod}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-3);transition:transform .2s"><polyline points="6,9 12,15 18,9"/></svg>
        </div>
      </div>
      <div class="module-body" id="perm-module-body-${mod}">
        ${rows}
      </div>
    </div>`;
}

function permToggleModule(mod) {
  const body = document.getElementById(`perm-module-body-${mod}`);
  const chevron = document.getElementById(`perm-chevron-${mod}`);
  if (!body) return;
  const isHidden = body.style.display === 'none';
  body.style.display = isHidden ? '' : 'none';
  if (chevron) chevron.style.transform = isHidden ? '' : 'rotate(-90deg)';
}

async function permToggle(role, permId, granted) {
  const key = `${role}:${permId}`;
  _permPageState.saving.add(key);
  _updateSwitch(role, permId, null, true); // état saving

  const ok = await Permissions.setPermission(role, permId, granted);
  if (ok) {
    if (!_permPageState.rolePerms[role]) _permPageState.rolePerms[role] = {};
    _permPageState.rolePerms[role][permId] = granted;
    // Recharge le log
    _permPageState.changelog = await Permissions.getChangeLog(50);
    const logEl = document.getElementById('perm-tab-log');
    if (logEl && logEl.style.display !== 'none') _renderLog();
  }

  _permPageState.saving.delete(key);
  _updateSwitch(role, permId, granted, false);
}

function _updateSwitch(role, permId, granted, saving) {
  // Trouve le switch dans le DOM sans re-render toute la matrice
  const rows = document.querySelectorAll(`#perm-tab-matrix .perm-row`);
  rows.forEach(row => {
    const btn = row.querySelector('.perm-switch:not(.hardcoded)');
    if (!btn) return;
    if (btn.getAttribute('onclick')?.includes(`'${permId}'`) && btn.getAttribute('onclick')?.includes(`'${role}'`)) {
      btn.classList.toggle('saving', saving);
      if (!saving && granted !== null) {
        btn.classList.toggle('on', granted);
        btn.setAttribute('onclick', `permToggle('${role}','${permId}',${!granted})`);
        btn.title = granted ? 'Cliquer pour révoquer' : 'Cliquer pour accorder';
      }
    }
  });

  // Met à jour le compteur du module
  const modEntry = _permPageState.catalog.find(p => p.id === permId);
  if (modEntry) {
    const mod = modEntry.module;
    const perms = _permPageState.byModule[mod] || [];
    const newGranted = perms.filter(p => _permPageState.rolePerms[role]?.[p.id] === true).length;
    const summary = document.querySelector(`.module-card:has(#perm-module-body-${mod}) .module-summary`);
    if (summary) summary.textContent = `${newGranted}/${perms.length} permission${perms.length>1?'s':''} accordée${newGranted>1?'s':''}`;
  }
}

function permSelectRole(role) {
  _permPageState.activeRole = role;
  _renderMatrix();
}

// ── VERROUS D'URGENCE ─────────────────────────────────────────────

function _renderLocks() {
  const el = document.getElementById('perm-tab-locks');
  if (!el) return;

  el.innerHTML = `
    <div style="margin-bottom:20px;">
      <h2 style="font-size:16px;font-weight:700;margin-bottom:4px;font-family:var(--font-head);">Master Switch — Verrous d'urgence</h2>
      <p style="font-size:13px;color:var(--text-2);">Verrouiller un rôle suspend instantanément toutes ses permissions. Utile en cas de maintenance ou d'incident de sécurité.</p>
    </div>
    ${PERM_ROLES.map(role => {
      const lock = _permPageState.locks[role] || {};
      const isLocked = lock.locked === true;
      const c = ROLE_COLORS[role];
      return `
        <div class="lock-card ${isLocked ? 'locked' : ''}">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:isLocked?6px:0;">
              <span style="font-size:14px;font-weight:700;color:var(--text);">${ROLE_LABELS[role]}</span>
              ${isLocked ? `<span style="font-size:11px;font-weight:700;background:var(--red);color:#fff;padding:2px 8px;border-radius:8px;">🔒 VERROUILLÉ</span>` : ''}
            </div>
            ${isLocked ? `
            <div style="font-size:12px;color:var(--red);margin-top:4px;">
              Toutes les permissions suspendues. Les utilisateurs de ce rôle ne peuvent plus rien faire.
              ${lock.reason ? `<br>Raison : ${escHtml(lock.reason)}` : ''}
            </div>` : `
            <div style="font-size:12px;color:var(--text-3);margin-top:2px;">
              Ce rôle est actif — ses permissions s'appliquent normalement.
            </div>`}
          </div>
          ${isLocked
            ? `<button class="btn btn-sm" style="background:var(--green);color:#fff;border:none;" onclick="permToggleLock('${role}', false)">🔓 Déverrouiller</button>`
            : `<button class="btn btn-sm btn-danger" onclick="permToggleLock('${role}', true)">🔒 Verrouiller</button>`}
        </div>`;
    }).join('')}

    <div style="margin-top:24px;padding:14px 16px;background:var(--red-light);border:1px solid var(--red-border);border-radius:var(--r-md);">
      <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:6px;">🚨 Verrouillage global</div>
      <div style="font-size:12px;color:var(--text-2);margin-bottom:12px;">Verrouille instantanément TOUS les rôles non-admin. Mode audit / maintenance d'urgence.</div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-danger" onclick="permLockAll()">🔒 Verrouiller tout</button>
        <button class="btn btn-secondary" onclick="permUnlockAll()">🔓 Tout déverrouiller</button>
      </div>
    </div>`;
}

async function permToggleLock(role, locked) {
  const reason = locked
    ? (await askTextModal({ title: 'Raison du verrouillage', label: 'Raison (optionnel)', placeholder: 'Ex: Maintenance en cours' })) || ''
    : '';

  const ok = await Permissions.setRoleLock(role, locked, reason);
  if (!ok) return;

  _permPageState.locks = await Permissions.getRoleLocks();
  _permPageState.changelog = await Permissions.getChangeLog(50);
  _renderLocks();
  _renderMatrix(); // Met à jour le bandeau rouge si présent
  toast(locked ? `🔒 Rôle "${ROLE_LABELS[role]}" verrouillé` : `🔓 Rôle "${ROLE_LABELS[role]}" déverrouillé`, locked ? 'warn' : 'ok');
}

async function permLockAll() {
  if (!confirm('Verrouiller TOUS les rôles ? Les utilisateurs ne pourront plus rien faire.')) return;
  await Promise.all(PERM_ROLES.map(r => Permissions.setRoleLock(r, true, 'Verrouillage global')));
  _permPageState.locks = await Permissions.getRoleLocks();
  _renderLocks();
  toast('🔒 Tous les rôles verrouillés', 'warn');
}

async function permUnlockAll() {
  await Promise.all(PERM_ROLES.map(r => Permissions.setRoleLock(r, false)));
  _permPageState.locks = await Permissions.getRoleLocks();
  _renderLocks();
  toast('🔓 Tous les rôles déverrouillés', 'ok');
}

// ── JOURNAL ──────────────────────────────────────────────────────

function _renderLog() {
  const el = document.getElementById('perm-tab-log');
  if (!el) return;

  const log = _permPageState.changelog;
  const actionLabel = {
    granted:      { ico: '✅', txt: 'Permission accordée' },
    revoked:      { ico: '❌', txt: 'Permission révoquée' },
    role_locked:  { ico: '🔒', txt: 'Rôle verrouillé' },
    role_unlocked:{ ico: '🔓', txt: 'Rôle déverrouillé' },
  };
  const permLabel = id => _permPageState.catalog.find(p => p.id === id)?.label || id;

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
      <div>
        <h2 style="font-size:15px;font-weight:700;font-family:var(--font-head);margin-bottom:2px;">Journal des modifications</h2>
        <p style="font-size:12px;color:var(--text-3);margin:0;">${log.length} entrée${log.length>1?'s':''} — immuable</p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="_refreshLog()">Actualiser</button>
    </div>
    <div class="module-card" style="padding:0 16px;">
      ${!log.length
        ? `<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px;">Aucune modification enregistrée.</div>`
        : log.map(entry => {
          const al = actionLabel[entry.action] || { ico:'📝', txt: entry.action };
          const c = ROLE_COLORS[entry.role] || {};
          return `
            <div class="changelog-row">
              <div style="font-size:18px;flex-shrink:0;">${al.ico}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:12px;font-weight:600;color:var(--text);">${al.txt}
                  ${entry.permission !== '*' ? `<span style="color:var(--text-3);font-weight:400;"> — ${escHtml(permLabel(entry.permission))}</span>` : ''}
                </div>
                <div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
                  <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:6px;background:${c.bg||'var(--surface-2)'};color:${c.text||'var(--text-3)'};">${ROLE_LABELS[entry.role]||entry.role}</span>
                  <span style="font-size:11px;color:var(--text-3);">par ${escHtml(entry.admin_nom||'Admin')}</span>
                  <span style="font-size:11px;color:var(--text-3);">${fmt(entry.created_at)}</span>
                </div>
              </div>
            </div>`;
        }).join('')}
    </div>`;
}

async function _refreshLog() {
  _permPageState.changelog = await Permissions.getChangeLog(50);
  _renderLog();
}

// ── SIMULATEUR "VIEW AS" ──────────────────────────────────────────

/**
 * Active la simulation d'un rôle.
 * Modifie temporairement le profil en mémoire et re-charge les permissions.
 * IMPORTANT : ne modifie RIEN en base — purement local.
 */
async function permSimulateAs(role) {
  if (!role) { permStopSimulation(); return; }

  // Sauvegarde du profil réel
  if (!window._realProfile) {
    window._realProfile = { ...profile };
    window._realPermCache = { ...Permissions._cache };
  }

  _permPageState.viewAsRole = role;

  // Modifie le profil temporairement
  profile = { ...profile, role };

  // Recharge les permissions pour ce rôle simulé
  await Permissions.load();

  // Met à jour l'UI
  initUI();

  // Bannière
  const banner = document.getElementById('view-as-banner');
  const label = document.getElementById('view-as-label');
  const stopBtn = document.getElementById('view-as-stop');
  if (banner) banner.style.display = '';
  if (label) label.textContent = ROLE_LABELS[role] || role;
  if (stopBtn) stopBtn.style.display = '';

  // Navigue vers la page par défaut du rôle simulé
  nav(Permissions.getDefaultPage());

  toast(`👁️ Simulation activée : vous voyez l'app comme "${ROLE_LABELS[role]}"`, 'warn');
}

/**
 * Arrête la simulation et restaure le vrai profil.
 */
async function permStopSimulation() {
  if (!window._realProfile) return;

  profile = { ...window._realProfile };
  window._realProfile = null;
  _permPageState.viewAsRole = null;

  // Recharge les vraies permissions
  await Permissions.load();
  initUI();

  const banner = document.getElementById('view-as-banner');
  const select = document.getElementById('view-as-select');
  const stopBtn = document.getElementById('view-as-stop');
  if (banner) banner.style.display = 'none';
  if (select) select.value = '';
  if (stopBtn) stopBtn.style.display = 'none';

  nav('permissions');
  toast('✓ Simulation arrêtée — retour à votre compte', 'ok');
}
