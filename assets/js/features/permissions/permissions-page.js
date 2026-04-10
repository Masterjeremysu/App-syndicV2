// ════════════════════════════════════════════════════════════════
//  PAGE ADMIN : GESTION DES PERMISSIONS (V3 DESIGN SYSTEM)
//  assets/js/features/permissions/permissions-page.js
// ════════════════════════════════════════════════════════════════

const PERM_ROLES_LIST = ['syndic', 'membre_cs', 'copropriétaire'];

const PERM_ROLE_LABELS = {
  syndic: 'Syndic (Gestion)',
  membre_cs: 'Conseil Syndical (CS)',
  'copropriétaire': 'Résident / Copro',
};

const PERM_MODULE_LABELS = {
  dashboard:   'Tableau de bord',
  tickets:     'Signalements',
  messages:    'Messagerie',
  annonces:    'Annonces',
  documents:   'Documents',
  votes:       'Votes / AG',
  registre:    'Registre d\'intervention', // Ajouté ici pour la gestion fine
  permissions: 'Gouvernance'
};

let _pp = {
  catalog:    [],
  rolePerms:  {},
  locks:      {},
  activeRole: 'copropriétaire'
};

/**
 * Rendu Principal
 */
async function renderPermissionsPage() {
  const page = document.getElementById('page');
  if (!page) return;

  // Accès : Admin ou CS
  const userRole = typeof profile !== 'undefined' ? profile.role : null;
  if (userRole !== 'administrateur' && userRole !== 'syndic' && userRole !== 'membre_cs') { 
    if (typeof nav === 'function') nav('dashboard'); 
    return; 
  }

  page.innerHTML = `
  <div class="page-enter">
    <div class="ph d-flex justify-content-between align-items-start mb-4">
      <div>
        <h1>🛡️ Gouvernance & Permissions</h1>
        <p>Contrôlez finement l'accès aux données, notamment le <strong>Registre</strong> pour le CS et le Syndic.</p>
      </div>
      
      <div class="card p-2 d-flex flex-row align-items-center gap-2" style="background: var(--surface-2); border-radius: var(--r-md);">
        <span class="text-3 fw-bold px-2" style="font-size:11px">SIMULER :</span>
        <select class="select py-1" style="width:160px; font-size:12px" onchange="ppSimulateAs(this.value)">
          <option value="">— Choisir —</option>
          ${PERM_ROLES_LIST.map(r => `<option value="${r}">${PERM_ROLE_LABELS[r]}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="dash2-focusbar mb-4">
      <button class="dash2-chip active" id="btn-tab-matrix" onclick="ppSwitchTab('matrix')">📊 Matrice des droits</button>
      <button class="dash2-chip" id="btn-tab-emergency" onclick="ppSwitchTab('emergency')">🚨 Verrous d'urgence</button>
    </div>

    <div id="pp-main-view">
        <div class="d-flex gap-2 mb-3 align-items-center">
          <span class="text-3 fw-bold" style="font-size:11px; text-transform:uppercase">Édition du rôle :</span>
          ${PERM_ROLES_LIST.map(r => `
             <button class="btn btn-xs btn-role-pill ${r === _pp.activeRole ? 'btn-primary' : 'btn-secondary'}" 
                     data-role="${r}" onclick="ppSelectRole('${r}')">
               ${PERM_ROLE_LABELS[r]}
             </button>
          `).join('')}
        </div>

        <div class="card">
          <div class="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Module & Fonctionnalité</th>
                  <th class="text-center" style="width:100px">Accès</th>
                </tr>
              </thead>
              <tbody id="pp-matrix-body">
                <tr><td colspan="2" class="text-center py-5"><div class="spin"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
    </div>
  </div>`;

  await _ppLoadAll();
  _ppRenderMatrix();
}

/**
 * Matrice des droits
 */
async function _ppRenderMatrix() {
  const tbody = document.getElementById('pp-matrix-body');
  if (!tbody) return;

  const role = _pp.activeRole;
  _pp.rolePerms[role] = await Permissions.getPermissionsForRole(role);

  const byModule = {};
  _pp.catalog.forEach(p => {
    if (!byModule[p.module]) byModule[p.module] = [];
    byModule[p.module].push(p);
  });

  let html = '';
  Object.entries(byModule).forEach(([modId, perms]) => {
    html += `
      <tr style="background: var(--surface-2)">
        <td colspan="2"><strong class="text-primary" style="font-size:11px; letter-spacing:0.05em;">${(PERM_MODULE_LABELS[modId] || modId).toUpperCase()}</strong></td>
      </tr>`;

    perms.forEach(p => {
      const isOn = _pp.rolePerms[role]?.[p.id] === true;
      html += `
        <tr>
          <td>
            <div class="fw-bold">${p.label}</div>
            <div class="text-3" style="font-size:11px">${p.description || ''}</div>
          </td>
          <td class="text-center">
            <div class="form-check form-switch d-flex justify-content-center">
              <input class="form-check-input" type="checkbox" role="switch" 
                     ${isOn ? 'checked' : ''} 
                     onclick="ppTogglePerm('${role}', '${p.id}', ${!isOn})">
            </div>
          </td>
        </tr>`;
    });
  });
  tbody.innerHTML = html;
}

/**
 * Gestion des Verrous d'Urgence (Restauré)
 */
function _ppRenderEmergency() {
  const container = document.getElementById('pp-main-view');
  container.innerHTML = `
    <div class="card p-4">
      <h3 class="mb-2 text-danger">Arrêt d'Urgence par Rôle</h3>
      <p class="text-3 mb-4">Coupez l'accès complet à un rôle en cas de maintenance ou d'abus suspecté.</p>
      
      <div class="d-flex flex-column gap-3">
        ${PERM_ROLES_LIST.map(r => {
          const isL = _pp.locks[r]?.locked;
          return `
            <div class="card p-3 d-flex justify-content-between align-items-center" style="border-color: ${isL ? 'var(--red-border)' : 'var(--border)'}; background: ${isL ? 'var(--red-light)' : 'var(--surface)'}">
               <div>
                 <div class="fw-bold ${isL ? 'text-danger' : ''}">${PERM_ROLE_LABELS[r]}</div>
                 <small class="text-3">${isL ? '🚫 ACCÈS SUSPENDU' : '✅ Accès opérationnel'}</small>
               </div>
               <button class="btn ${isL ? 'btn-success' : 'btn-danger'}" onclick="ppToggleRoleLock('${r}', ${!isL})">
                 ${isL ? 'Rétablir' : 'Verrouiller'}
               </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Switcher d'onglets
 */
window.ppSwitchTab = function(tab) {
  document.querySelectorAll('.dash2-chip').forEach(c => c.classList.remove('active'));
  document.getElementById(`btn-tab-${tab}`).classList.add('active');
  
  if (tab === 'matrix') {
    renderPermissionsPage(); // Recharge la vue matrice
  } else if (tab === 'emergency') {
    _ppRenderEmergency();
  }
};

window.ppSelectRole = function(role) {
  _pp.activeRole = role;
  document.querySelectorAll('.btn-role-pill').forEach(b => {
    b.classList.toggle('btn-primary', b.dataset.role === role);
    b.classList.toggle('btn-secondary', b.dataset.role !== role);
  });
  _ppRenderMatrix();
};

window.ppTogglePerm = async function(role, permId, targetState) {
  const ok = await Permissions.setPermission(role, permId, targetState);
  if (ok) {
    _pp.rolePerms[role][permId] = targetState;
    toast('Droits mis à jour', 'ok');
  }
};

window.ppToggleRoleLock = async function(role, locked) {
  const ok = await Permissions.setRoleLock(role, locked, 'Maintenance');
  if (ok) {
    _pp.locks[role] = { locked };
    _ppRenderEmergency();
    toast('Statut du rôle mis à jour', 'warn');
  }
};

async function _ppLoadAll() {
  _pp.catalog = await Permissions.loadCatalog();
  _pp.locks = await Permissions.getRoleLocks();
}

// Global Export
window.renderPermissionsPage = renderPermissionsPage;
