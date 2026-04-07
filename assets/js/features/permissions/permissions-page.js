// ════════════════════════════════════════════════════════════════
//  PAGE ADMIN : GESTION DES PERMISSIONS GRANULAIRES (V2 PRO)
//  assets/js/features/permissions/permissions-page.js
// ════════════════════════════════════════════════════════════════

const PERM_ROLES_LIST = ['syndic', 'membre_cs', 'copropriétaire'];

const PERM_ROLE_LABELS = {
  syndic: 'Syndic (Externe)',
  membre_cs: 'Conseil Syndical',
  'copropriétaire': 'Résident / Copro',
};

// Actions possibles pour chaque module
const ACTIONS_META = {
  view:   { label: 'Voir', ico: '👁️', color: '#6366f1' },
  create: { label: 'Créer', ico: '➕', color: '#10b981' },
  edit:   { label: 'Modif', ico: '✏️', color: '#f59e0b' },
  delete: { label: 'Suppr', ico: '🗑️', color: '#ef4444' },
  manage: { label: 'Gérer', ico: '⚙️', color: '#7c3aed' }
};

let _pp = {
  catalog:    [],
  byModule:   {},
  rolePerms:  {},
  locks:      {},
  changelog:  [],
  activeRole: 'copropriétaire', // Focus par défaut sur les résidents
  saving:     new Set(),
  viewAsReal: null
};

// ── RENDER PRINCIPAL ─────────────────────────────────────────────

async function renderPermissionsPage() {
  if (typeof isAdmin === 'function' && !isAdmin()) { nav('dashboard'); return; }

  $('page').innerHTML = `
  <div class="saas-container" style="padding-bottom: 100px;">
    
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:20px; margin-bottom:32px; border-bottom:1px solid var(--border); padding-bottom:24px;">
      <div>
        <h1 class="saas-page-title">🛡️ Gouvernance & Permissions</h1>
        <p class="saas-page-sub">Contrôlez finement l'accès aux données pour chaque profil de la copropriété.</p>
      </div>
      
      <div style="background:var(--bg-2); padding:12px; border-radius:16px; border:1px solid var(--border); display:flex; align-items:center; gap:12px;">
        <div style="text-align:right;">
          <div style="font-size:11px; font-weight:800; color:var(--text-3); text-transform:uppercase;">Mode Test</div>
          <div style="font-size:13px; font-weight:700;">Simuler un profil</div>
        </div>
        <select id="view-as-select" class="saas-select" style="width:180px; margin:0;" onchange="ppSimulateAs(this.value)">
          <option value="">— Choisir —</option>
          ${PERM_ROLES_LIST.map(r => `<option value="${r}">${PERM_ROLE_LABELS[r]}</option>`).join('')}
        </select>
        <button id="view-as-stop" class="saas-btn-black" style="display:none; background:var(--red); padding:8px 12px;" onclick="ppStopSimulation()">✕ Quitter</button>
      </div>
    </div>

    <div id="view-as-banner" style="display:none; margin-bottom:24px; padding:16px; background:var(--orange-light); border:1px solid var(--orange-border); border-radius:12px; animation: pulse 2s infinite;">
      <div style="display:flex; align-items:center; gap:12px; color:var(--orange);">
        <span style="font-size:24px;">👁️</span>
        <div>
          <div style="font-weight:800; font-size:14px;">SESSION DE SIMULATION ACTIVE</div>
          <div style="font-size:13px;">Vous naviguez avec les droits d'un <strong><span id="view-as-label"></span></strong>. Les modifications ne sont pas enregistrées.</div>
        </div>
      </div>
    </div>

    <div style="display:flex; gap:8px; margin-bottom:24px;">
      <button class="saas-btn-outline pp-tab-btn active" onclick="ppSwitchTab(this, 'matrix')">📊 Matrice des droits</button>
      <button class="saas-btn-outline pp-tab-btn" onclick="ppSwitchTab(this, 'emergency')">🚨 Verrous d'urgence</button>
      <button class="saas-btn-outline pp-tab-btn" onclick="ppSwitchTab(this, 'logs')">📜 Historique</button>
    </div>

    <div id="pp-content-matrix">
       <div style="display:flex; gap:16px; align-items:center; margin-bottom:20px; background:var(--bg-1); padding:12px; border-radius:12px;">
         <span style="font-size:12px; font-weight:800; color:var(--text-3); text-transform:uppercase;">Rôle à configurer :</span>
         ${PERM_ROLES_LIST.map(r => `
            <button class="role-pill ${r === _pp.activeRole ? 'active' : ''}" data-role="${r}" onclick="ppSelectRole('${r}')">
              ${PERM_ROLE_LABELS[r]}
            </button>
         `).join('')}
       </div>
       <div id="pp-matrix-grid" class="saas-table-wrap">
         <div style="padding:40px; text-align:center;"><div class="spinner"></div></div>
       </div>
    </div>

    <div id="pp-content-emergency" style="display:none;"></div>
    <div id="pp-content-logs" style="display:none;"></div>

  </div>

  <style>
    .role-pill { background:var(--surface); border:1px solid var(--border); padding:8px 16px; border-radius:20px; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s; color:var(--text-2); }
    .role-pill.active { background:var(--text-1); color:var(--surface); border-color:var(--text-1); box-shadow:0 4px 12px rgba(0,0,0,0.1); }
    
    .pp-tab-btn.active { border-color:var(--primary); color:var(--primary); background:var(--primary-light); }
    
    .perm-card { border-bottom:1px solid var(--border); background:var(--surface); }
    .perm-card-header { padding:16px 20px; background:var(--bg-1); display:flex; justify-content:space-between; align-items:center; cursor:pointer; }
    .perm-card-header:hover { background:var(--bg-2); }
    
    .perm-row { display:grid; grid-template-columns: 1fr auto auto; gap:20px; align-items:center; padding:12px 24px; border-bottom:1px solid var(--bg-2); transition:background 0.1s; }
    .perm-row:last-child { border-bottom:none; }
    .perm-row:hover { background:var(--bg-1); }
    
    .action-tag { font-size:10px; font-weight:800; text-transform:uppercase; padding:2px 8px; border-radius:6px; background:var(--bg-2); color:var(--text-3); }
    
    /* Toggle Premium */
    .p-toggle { width:40px; height:20px; background:var(--border-strong); border-radius:10px; position:relative; cursor:pointer; border:none; transition:all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .p-toggle.on { background:var(--green); }
    .p-toggle::after { content:''; position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:white; transition:transform 0.3s; box-shadow:0 1px 3px rgba(0,0,0,0.2); }
    .p-toggle.on::after { transform:translateX(20px); }
    .p-toggle.saving { opacity:0.5; pointer-events:none; }
  </style>
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
  
  _pp.catalog = catalog;
  _pp.locks = locks;
  _pp.changelog = changelog;
  
  // Groupe par module
  _pp.byModule = {};
  catalog.forEach(p => {
    if (!_pp.byModule[p.module]) _pp.byModule[p.module] = [];
    _pp.byModule[p.module].push(p);
  });

  // Charge les permissions réelles pour le rôle actif
  _pp.rolePerms[_pp.activeRole] = await Permissions.getPermissionsForRole(_pp.activeRole);
}

// ── NAVIGATION ONGLETS ───────────────────────────────────────────

function ppSwitchTab(btn, target) {
  document.querySelectorAll('.pp-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  ['matrix', 'emergency', 'logs'].forEach(t => {
    $(`pp-content-${t}`).style.display = (t === target) ? 'block' : 'none';
  });
  
  if (target === 'emergency') _ppRenderEmergency();
  if (target === 'logs') _ppRenderLogs();
}

// ── RENDU MATRICE ────────────────────────────────────────────────

function ppSelectRole(role) {
  _pp.activeRole = role;
  document.querySelectorAll('.role-pill').forEach(p => p.classList.toggle('active', p.dataset.role === role));
  _ppRenderMatrix();
}

async function _ppRenderMatrix() {
  const container = $('pp-matrix-grid');
  const role = _pp.activeRole;
  
  // Re-chargement si data non présente
  if (!_pp.rolePerms[role]) {
    container.innerHTML = '<div style="padding:40px; text-align:center;"><div class="spinner"></div></div>';
    _pp.rolePerms[role] = await Permissions.getPermissionsForRole(role);
  }

  const isLocked = _pp.locks[role]?.locked === true;

  let html = `
    <div class="saas-th saas-grid" style="grid-template-columns: 1fr 120px 80px; background:var(--bg-2); border-bottom:1px solid var(--border);">
      <div style="padding-left:24px;">Fonctionnalité / Permission</div>
      <div>Action</div>
      <div style="text-align:center;">Accès</div>
    </div>
  `;

  if (isLocked) {
    html += `<div style="padding:16px 24px; background:var(--red-light); color:var(--red); font-weight:700; font-size:13px; text-align:center;">⚠️ CE RÔLE EST ACTUELLEMENT VERROUILLÉ : TOUTES LES PERMISSIONS SONT RÉVOQUÉES.</div>`;
  }

  Object.entries(_pp.byModule).forEach(([modId, perms]) => {
    const grantedCount = perms.filter(p => _pp.rolePerms[role]?.[p.id]).length;
    const label = PERM_MODULE_LABELS[modId] || modId;

    html += `
    <div class="perm-card">
      <div class="perm-card-header" onclick="ppToggleModuleUI('${modId}')">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-weight:800; font-size:14px; color:var(--text-1);">${label}</span>
          <span style="font-size:11px; font-weight:700; color:var(--text-3); background:var(--bg-2); padding:2px 8px; border-radius:10px;">${grantedCount} / ${perms.length}</span>
        </div>
        <svg id="pp-chev-${modId}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="transition:0.2s;"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div id="pp-body-${modId}" class="perm-card-body">
        ${perms.map(p => {
          const isOn = _pp.rolePerms[role]?.[p.id] === true;
          const meta = ACTIONS_META[p.action] || { label: p.action, ico: '🔹', color: 'var(--text-3)' };
          return `
            <div class="perm-row">
              <div>
                <div style="font-size:13.5px; font-weight:700; color:var(--text-1);">${escHtml(p.label)}</div>
                <div style="font-size:11px; color:var(--text-3); font-weight:500;">${escHtml(p.description || '')}</div>
              </div>
              <div><span class="action-tag" style="border:1px solid ${meta.color}44; color:${meta.color};">${meta.ico} ${meta.label}</span></div>
              <div style="text-align:center;">
                <button class="p-toggle ${isOn ? 'on' : ''}" 
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
  if (chev) chev.style.transform = isHidden ? '' : 'rotate(-90deg)';
}

async function ppTogglePerm(role, permId, targetState) {
  // Feedback visuel immédiat
  const { data: ok } = await Permissions.setPermission(role, permId, targetState);
  
  if (ok !== false) {
    _pp.rolePerms[role][permId] = targetState;
    _ppRenderMatrix();
    toast(`Droits mis à jour pour ${PERM_ROLE_LABELS[role]}`, 'ok');
  } else {
    toast('Erreur de sauvegarde', 'err');
  }
}

// ── EMERGENCY LOCKS ──────────────────────────────────────────────

function _ppRenderEmergency() {
  const container = $('pp-content-emergency');
  container.innerHTML = `
    <div class="saas-table-wrap" style="padding:24px;">
      <h3 style="font-weight:900; color:var(--red); margin-bottom:12px;">Arrêt d'Urgence par Rôle</h3>
      <p style="font-size:14px; color:var(--text-2); margin-bottom:24px;">Si vous suspectez un abus ou lors d'une maintenance critique, vous pouvez couper l'accès complet à un rôle. Les utilisateurs de ce rôle ne pourront plus rien voir sauf leur profil.</p>
      
      <div style="display:grid; gap:12px;">
        ${PERM_ROLES_LIST.map(r => {
          const isL = _pp.locks[r]?.locked;
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:16px; border:1px solid ${isL ? 'var(--red-border)' : 'var(--border)'}; border-radius:12px; background:${isL ? 'var(--red-light)' : 'var(--surface)'};">
               <div>
                 <div style="font-weight:800; font-size:15px; color:${isL ? 'var(--red)' : 'var(--text-1)'};">${PERM_ROLE_LABELS[r]}</div>
                 <div style="font-size:12px; color:var(--text-3);">${isL ? '🚫 ACCÈS SUSPENDU' : '✅ Accès opérationnel'}</div>
               </div>
               <button class="saas-btn-primary" style="background:${isL ? 'var(--green)' : 'var(--red)'}; color:white;" onclick="ppToggleRoleLock('${r}', ${!isL})">
                 ${isL ? '🔓 Rétablir l\'accès' : '🔒 Verrouiller le rôle'}
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

  // Sauvegarde des vrais accès admin
  if (!_pp.viewAsReal) _pp.viewAsReal = { ...profile };

  // Injection forcée du rôle simulé dans le profil global
  profile = { ..._pp.viewAsReal, role: role };

  // Re-déclenchement du moteur de permissions
  await Permissions.load();
  
  // Re-initialisation de l'UI (Masque la sidebar, change les menus)
  if (typeof initUI === 'function') initUI();

  // Interface de simulation
  $('view-as-banner').style.display = 'block';
  $('view-as-label').textContent = PERM_ROLE_LABELS[role].toUpperCase();
  $('view-as-stop').style.display = 'flex';
  $('view-as-select').value = role;

  toast(`Simulation active : Profil ${PERM_ROLE_LABELS[role]}`, 'warn');
  
  // Navigation automatique vers la page d'accueil autorisée du rôle
  nav(Permissions.getDefaultPage());
}

async function ppStopSimulation() {
  if (!_pp.viewAsReal) return;

  // Rétablissement du compte admin
  profile = { ..._pp.viewAsReal };
  _pp.viewAsReal = null;

  await Permissions.load();
  if (typeof initUI === 'function') initUI();

  $('view-as-banner').style.display = 'none';
  $('view-as-stop').style.display = 'none';
  $('view-as-select').value = '';

  nav('permissions');
  toast('Retour au mode Administrateur', 'ok');
}

// ── JOURNAL D'AUDIT ──────────────────────────────────────────────

async function _ppRenderLogs() {
  const container = $('pp-content-logs');
  const logs = await Permissions.getChangeLog(50);
  
  container.innerHTML = `
    <div class="saas-table-wrap">
      <div class="saas-th saas-grid" style="grid-template-columns: 100px 1fr 180px 140px;">
        <div style="padding-left:24px;">Action</div>
        <div>Cible</div>
        <div>Auteur</div>
        <div style="text-align:right; padding-right:24px;">Date</div>
      </div>
      ${logs.map(l => `
        <div class="saas-grid" style="grid-template-columns: 100px 1fr 180px 140px; padding:12px 24px; font-size:12px; border-bottom:1px solid var(--bg-2);">
          <div style="font-weight:800; color:${l.action === 'granted' ? 'var(--green)' : 'var(--red)'};">${l.action.toUpperCase()}</div>
          <div style="color:var(--text-1); font-weight:600;">${l.permission} <span style="color:var(--text-3); font-weight:400;">pour ${l.role}</span></div>
          <div style="color:var(--text-2); font-weight:700;">${l.admin_nom}</div>
          <div style="text-align:right; color:var(--text-3);">${fmt(l.created_at)}</div>
        </div>
      `).join('')}
    </div>
  `;
}