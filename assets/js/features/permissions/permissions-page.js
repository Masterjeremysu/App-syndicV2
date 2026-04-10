// assets/js/features/permissions/permissions-page.js

const PERM_ROLES_LIST = ['syndic', 'membre_cs', 'copropriétaire'];

const PERM_ROLE_LABELS = {
  syndic: 'Syndic (Gestion)',
  membre_cs: 'Conseil Syndical (CS)',
  'copropriétaire': 'Résident / Copro',
};

// Mapping des modules utilisant les noms de votre app
const PERM_MODULE_LABELS = {
  dashboard:   'Tableau de bord',
  tickets:     'Signalements',
  messages:    'Messagerie',
  annonces:    'Annonces',
  documents:   'Documents',
  votes:       'Votes / AG',
  registre:    'Registre d\'intervention', // Focus pour le CS
  permissions: 'Gouvernance'
};

let _pp = {
  catalog:    [],
  rolePerms:  {},
  activeRole: 'copropriétaire'
};

/**
 * Rendu Principal - Utilise .ph et .dash2-chip de app.css
 */
export async function renderPermissionsPage() {
  const page = document.getElementById('page');
  if (!page) return;

  // Accès : Admin/Syndic pour modifier, CS pour consulter ses droits
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
        <p>Gérez les accès. Le Conseil Syndical a désormais un accès complet au Registre.</p>
      </div>
      
      <div class="card p-2 d-flex flex-row align-items-center gap-2" style="background: var(--surface-2); border-radius: var(--r-md);">
        <span class="text-3 fw-bold px-2" style="font-size:11px">RÔLE ACTIF :</span>
        <select id="pp-role-select" class="select py-1" style="width:160px; font-size:12px" onchange="ppSelectRole(this.value)">
          ${PERM_ROLES_LIST.map(r => `<option value="${r}" ${r === _pp.activeRole ? 'selected' : ''}>${PERM_ROLE_LABELS[r]}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="dash2-focusbar mb-4">
      <button class="dash2-chip active">📊 Matrice des droits</button>
      <button class="dash2-chip" onclick="toast('Bientôt disponible', 'info')">🚨 Verrous</button>
      <button class="dash2-chip" onclick="toast('Consultez le Journal', 'info')">📜 Audit</button>
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
  </div>`;

  await _ppLoadAll();
  _ppRenderMatrix();
}

async function _ppLoadAll() {
  // Utilise votre service de permissions existant
  if (typeof Permissions !== 'undefined') {
    _pp.catalog = await Permissions.loadCatalog();
  }
}

async function _ppRenderMatrix() {
  const tbody = document.getElementById('pp-matrix-body');
  const role = _pp.activeRole;
  
  if (typeof Permissions === 'undefined' || !tbody) return;
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

window.ppSelectRole = (role) => {
  _pp.activeRole = role;
  _ppRenderMatrix();
};

window.ppTogglePerm = async (role, permId, targetState) => {
  if (typeof Permissions !== 'undefined') {
    const ok = await Permissions.setPermission(role, permId, targetState);
    if (ok) {
      _pp.rolePerms[role][permId] = targetState;
      if (typeof toast === 'function') toast('Permission mise à jour', 'ok');
    }
  }
};
