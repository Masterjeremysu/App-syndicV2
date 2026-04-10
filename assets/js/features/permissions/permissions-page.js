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

// Mapping des modules pour l'affichage UI
const PERM_MODULE_LABELS = {
  dashboard:   'Tableau de bord',
  tickets:     'Signalements',
  messages:    'Messagerie',
  annonces:    'Annonces',
  documents:   'Documents',
  votes:       'Votes / AG',
  registre:    'Registre d\'intervention', // Focus CS
  permissions: 'Gouvernance'
};

let _pp = {
  catalog:    [],
  rolePerms:  {},
  activeRole: 'copropriétaire',
  viewAsReal: null
};

/**
 * Rendu Principal - Utilise les classes .ph et .dash2-chip de app.css
 */
export async function renderPermissionsPage() {
  const page = document.getElementById('page');
  
  // Seul l'Admin ou le Syndic gère les droits, mais le CS peut consulter
  if (typeof isAdmin === 'function' && !isAdmin() && profile?.role !== 'membre_cs') { 
    nav('dashboard'); 
    return; 
  }

  page.innerHTML = `
  <div class="page-enter">
    
    <div class="ph d-flex justify-content-between align-items-start mb-4">
      <div>
        <h1>🛡️ Gouvernance & Permissions</h1>
        <p>Gérez les accès aux données. Note : Le Conseil Syndical a désormais un accès étendu au Registre.</p>
      </div>
      
      <div class="card p-2 d-flex flex-row align-items-center gap-2" style="background: var(--surface-2); border-radius: var(--r-md);">
        <span class="text-3 fw-bold px-2" style="font-size:11px">MODE TEST :</span>
        <select id="view-as-select" class="select py-1" style="width:160px; font-size:12px" onchange="ppSimulateAs(this.value)">
          <option value="">— Simuler un profil —</option>
          ${PERM_ROLES_LIST.map(r => `<option value="${r}">${PERM_ROLE_LABELS[r]}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="dash2-focusbar mb-4">
      <button class="dash2-chip active" onclick="ppSwitchTab(this, 'matrix')">📊 Matrice des droits</button>
      <button class="dash2-chip" onclick="ppSwitchTab(this, 'emergency')">🚨 Verrous d'urgence</button>
      <button class="dash2-chip" onclick="ppSwitchTab(this, 'logs')">📜 Historique d'audit</button>
    </div>

    <div id="pp-content-matrix">
       <div class="d-flex gap-2 mb-3 align-items-center">
         <span class="text-3 fw-bold" style="font-size:11px; text-transform:uppercase">Édition du rôle :</span>
         ${PERM_ROLES_LIST.map(r => `
            <button class="btn btn-xs ${r === _pp.activeRole ? 'btn-primary' : 'btn-secondary'}" 
                    onclick="ppSelectRole('${r}')">
              ${PERM_ROLE_LABELS[r]}
            </button>
         `).join('')}
       </div>

       <div class="card">
         <div class="tbl-wrap">
           <table id="pp-matrix-table">
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
  </div>
  `;

  await _ppLoadAll();
  _ppRenderMatrix();
}

/**
 * Génère les lignes de la matrice groupées par module
 */
async function _ppRenderMatrix() {
  const tbody = document.getElementById('pp-matrix-body');
  const role = _pp.activeRole;
  
  if (!_pp.rolePerms[role]) {
    _pp.rolePerms[role] = await Permissions.getPermissionsForRole(role);
  }

  // Groupement par module
  const byModule = {};
  _pp.catalog.forEach(p => {
    if (!byModule[p.module]) byModule[p.module] = [];
    byModule[p.module].push(p);
  });

  let html = '';
  Object.entries(byModule).forEach(([modId, perms]) => {
    const modLabel = PERM_MODULE_LABELS[modId] || modId;
    
    // Header de section (Module)
    html += `
      <tr style="background: var(--surface-2)">
        <td colspan="2"><strong class="text-primary">${modLabel.toUpperCase()}</strong></td>
      </tr>
    `;

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
        </tr>
      `;
    });
  });

  tbody.innerHTML = html;
}

/**
 * Mise à jour d'une permission
 */
async function ppTogglePerm(role, permId, targetState) {
  const ok = await Permissions.setPermission(role, permId, targetState);
  if (ok) {
    _pp.rolePerms[role][permId] = targetState;
    toast(`Droits mis à jour pour ${PERM_ROLE_LABELS[role]}`, 'ok');
  } else {
    toast('Erreur lors de la sauvegarde', 'err');
    _ppRenderMatrix(); // Reset UI
  }
}

/**
 * Chargement du catalogue via Permissions.js
 */
async function _ppLoadAll() {
  _pp.catalog = await Permissions.loadCatalog();
}

/**
 * Navigation simplifiée
 */
function ppSelectRole(role) {
  _pp.activeRole = role;
  renderPermissionsPage(); // Re-render pour mettre à jour les boutons active
}
