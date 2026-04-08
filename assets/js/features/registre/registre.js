// ════════════════════════════════════════════════════════════════
//  REGISTRE D'INTERVENTION (Check-in Prestataires - SaaS Premium)
//  assets/js/features/registre/registre.js
// ════════════════════════════════════════════════════════════════

let _regTab = 'historique'; // historique | prestataires

// --- FAUSSES DONNÉES POUR LA DÉMO (En attendant la BDD) ---
const _mockRegistre = [
  { id: 1, presta: 'NettoyagePlus', type: 'Ménage des communs', arrivee: new Date(Date.now() - 1000 * 60 * 45).toISOString(), depart: null, status: 'en_cours' },
  { id: 2, presta: 'Espaces Verts Pro', type: 'Tonte pelouse', arrivee: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 120).toISOString(), depart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), status: 'termine' },
  { id: 3, presta: 'Ascenseurs Schindler', type: 'Maintenance Tour 17', arrivee: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5 - 1000 * 60 * 15).toISOString(), depart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), status: 'anomalie' }, // Anomalie : durée trop courte (15 min)
  { id: 4, presta: 'NettoyagePlus', type: 'Ménage des communs', arrivee: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 - 1000 * 60 * 180).toISOString(), depart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), status: 'termine' }
];

const _mockPrestas = [
  { nom: 'NettoyagePlus', contrat: 'Ménage hebdomadaire', couleur: 'var(--blue)' },
  { nom: 'Espaces Verts Pro', contrat: 'Entretien extérieur', couleur: 'var(--green)' },
  { nom: 'Ascenseurs Schindler', contrat: 'Maintenance préventive', couleur: 'var(--orange)' }
];

// ── CSS SPECIFIQUE ────────────────────────────────────────────────────────
(function injectRegistreCSS() {
  if (document.getElementById('saas-registre-css')) return;
  const s = document.createElement('style');
  s.id = 'saas-registre-css';
  s.textContent = `
    .reg-grid { display: grid; grid-template-columns: minmax(180px, 2fr) minmax(150px, 1.5fr) 120px 120px 100px 120px; gap: 16px; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--border); transition: background 0.15s; }
    .reg-th { background: var(--bg-1); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); padding-top: 14px; padding-bottom: 14px; }
    .reg-tr:hover { background: var(--bg-2); }
    .reg-tr:last-child { border-bottom: none; }
    
    .reg-presta-name { font-size: 14px; font-weight: 800; color: var(--text-1); margin-bottom: 2px; }
    .reg-presta-type { font-size: 12px; color: var(--text-3); font-weight: 500; }
    .reg-time { font-family: var(--font-body); font-size: 13.5px; font-weight: 600; color: var(--text-2); font-variant-numeric: tabular-nums; }
    .reg-duration { font-size: 13px; font-weight: 800; color: var(--text-1); }
    
    .reg-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid currentColor; }
    .reg-badge .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    
    .reg-encours { color: var(--green); background: var(--green-light); border-color: var(--green-border); }
    .reg-encours .dot { background: var(--green); animation: pulse-green 2s infinite; }
    .reg-termine { color: var(--text-2); background: transparent; border-color: var(--border-strong); }
    .reg-termine .dot { background: var(--text-3); }
    .reg-anomalie { color: var(--orange); background: var(--orange-light); border-color: var(--orange-border); }
    .reg-anomalie .dot { background: var(--orange); }

    @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

    .presta-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: all 0.2s; }
    .presta-card:hover { border-color: var(--border-strong); box-shadow: 0 8px 24px rgba(0,0,0,0.04); transform: translateY(-2px); }
    .presta-ico { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; color: white; }

    /* Qr Modal */
    .qr-box { background: white; padding: 24px; border-radius: 16px; text-align: center; border: 1px dashed #d1d5db; margin: 20px 0; }
    .qr-placeholder { width: 200px; height: 200px; background: repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 10px, #ffffff 10px, #ffffff 20px); border: 1px solid #e5e7eb; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 48px; }

    @media (max-width: 960px) {
      .reg-th { display: none; }
      .reg-grid { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 16px; position: relative; }
      .reg-grid > div { width: 100%; }
      .reg-grid > div:nth-child(5) { position: absolute; top: 16px; right: 16px; width: auto; } /* Badge en haut à droite */
      .reg-grid > div:nth-child(6) { display: none; } /* Cache les actions pour simplifier sur mobile */
    }
  `;
  document.head.appendChild(s);
})();

// ── RENDER PRINCIPAL ──────────────────────────────────────────────────────────

async function renderRegistre() {
  const page = $('page');
  if (!page) return;

  const isManagerUser = typeof isManager === 'function' ? isManager() : false;

  page.innerHTML = `
  <div class="saas-container">
    
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:32px;">
      <div>
        <h1 class="saas-page-title">Registre d'Intervention</h1>
        <p class="saas-page-sub">Suivi en temps réel des passages et du temps de travail des prestataires.</p>
      </div>
      
      ${isManagerUser ? `
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <button class="saas-btn-outline" onclick="openQrManager()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
          Gestion QR Codes
        </button>
        <button class="saas-btn-black" onclick="openPointageManuel()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Pointage Manuel
        </button>
      </div>` : ''}
    </div>

    <div class="anc-tabs" style="margin-bottom:24px;">
      <button class="anc-tab active" data-tab="historique" onclick="setRegistreTab('historique')">Historique des passages</button>
      ${isManagerUser ? `<button class="anc-tab" data-tab="prestataires" onclick="setRegistreTab('prestataires')">Annuaire Prestataires</button>` : ''}
    </div>

    <div id="reg-tab-historique"></div>
    <div id="reg-tab-prestataires" style="display:none;"></div>

  </div>`;

  _renderHistorique();
  if (isManagerUser) _renderPrestataires();
}

function setRegistreTab(tab) {
  _regTab = tab;
  document.querySelectorAll('.anc-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  $('reg-tab-historique').style.display = tab === 'historique' ? 'block' : 'none';
  $('reg-tab-prestataires').style.display = tab === 'prestataires' ? 'block' : 'none';
}

// ── RENDU HISTORIQUE ──────────────────────────────────────────────────────────

function _renderHistorique() {
  const container = $('reg-tab-historique');
  if (!container) return;

  let html = `
    <div class="saas-table-wrap">
      <div class="reg-grid reg-th">
        <div>Prestataire</div>
        <div>Date</div>
        <div>Arrivée</div>
        <div>Départ</div>
        <div>Durée</div>
        <div style="text-align:right;">Statut</div>
      </div>
  `;

  _mockRegistre.forEach(row => {
    const dArr = new Date(row.arrivee);
    const dDep = row.depart ? new Date(row.depart) : null;
    
    const dateStr = dArr.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
    const arrStr = dArr.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const depStr = dDep ? dDep.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
    
    let dureeStr = '—';
    if (dDep) {
      const diffMins = Math.floor((dDep - dArr) / 60000);
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      dureeStr = h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m} min`;
    } else {
      dureeStr = '<span style="color:var(--green); animation:pulse 2s infinite;">En cours...</span>';
    }

    let badge = '';
    if (row.status === 'en_cours') badge = `<span class="reg-badge reg-encours"><span class="dot"></span>En cours</span>`;
    else if (row.status === 'termine') badge = `<span class="reg-badge reg-termine"><span class="dot"></span>Terminé</span>`;
    else if (row.status === 'anomalie') badge = `<span class="reg-badge reg-anomalie" title="Temps de présence suspect"><span class="dot"></span>Anomalie</span>`;

    html += `
      <div class="reg-grid reg-tr">
        <div>
          <div class="reg-presta-name">${row.presta}</div>
          <div class="reg-presta-type">${row.type}</div>
        </div>
        <div class="reg-time" style="text-transform:capitalize;">${dateStr}</div>
        <div class="reg-time">${arrStr}</div>
        <div class="reg-time">${depStr}</div>
        <div class="reg-duration">${dureeStr}</div>
        <div style="text-align:right;">${badge}</div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// ── RENDU PRESTATAIRES (Pour CS / Syndic) ───────────────────────────────────

function _renderPrestataires() {
  const container = $('reg-tab-prestataires');
  if (!container) return;

  let html = `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">`;

  _mockPrestas.forEach(p => {
    const init = p.nom.substring(0, 2).toUpperCase();
    html += `
      <div class="presta-card">
        <div style="display:flex; align-items:center; gap:16px;">
          <div class="presta-ico" style="background:${p.couleur}; box-shadow:0 4px 12px ${p.couleur}44;">${init}</div>
          <div>
            <div style="font-family:var(--font-head); font-size:18px; font-weight:800; color:var(--text-1);">${p.nom}</div>
            <div style="font-size:12px; font-weight:600; color:var(--text-3);">${p.contrat}</div>
          </div>
        </div>
        
        <div style="border-top:1px dashed var(--border); padding-top:16px; display:flex; justify-content:space-between; gap:8px;">
           <button class="saas-btn-outline" style="flex:1; justify-content:center; font-size:12px; padding:6px;" onclick="toast('Génération du code PDF...', 'ok')">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg> QR Code
           </button>
           <button class="saas-btn-outline" style="flex:1; justify-content:center; font-size:12px; padding:6px;" onclick="toast('Ouvre le contrat', 'ok')">
             📄 Contrat
           </button>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// ── MODALS D'ACTION ───────────────────────────────────────────────────────────

function openPointageManuel() {
  const options = _mockPrestas.map(p => `<option value="${p.nom}">${p.nom}</option>`).join('');
  
  const html = `
    <div style="margin-bottom:16px;">
      <label style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--text-3); display:block; margin-bottom:8px;">Prestataire</label>
      <select class="saas-select" style="width:100%;">${options}</select>
    </div>
    
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px;">
      <div>
        <label style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--text-3); display:block; margin-bottom:8px;">Heure d'arrivée</label>
        <input type="time" class="saas-input" style="width:100%;" value="08:00">
      </div>
      <div>
        <label style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--text-3); display:block; margin-bottom:8px;">Heure de départ</label>
        <input type="time" class="saas-input" style="width:100%;" value="${new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}">
      </div>
    </div>
    
    <div>
       <label style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--text-3); display:block; margin-bottom:8px;">Notes (Optionnel)</label>
       <input type="text" class="saas-input" style="width:100%;" placeholder="Ex: A nettoyé le local poubelle">
    </div>
  `;

  _showModal('Pointage Manuel', html, 'Valider le passage');
}

function openQrManager() {
  const html = `
    <div style="text-align:center; margin-bottom:16px; color:var(--text-2); font-size:14px; line-height:1.5;">
      Imprimez cette affiche et placez-la dans la loge ou le hall. Les prestataires pourront scanner ce code avec leur téléphone pour badger leur arrivée et leur départ, sans avoir besoin de télécharger l'application.
    </div>
    <div class="qr-box">
      <div class="qr-placeholder">📱</div>
      <div style="margin-top:16px; font-family:var(--font-head); font-weight:800; font-size:18px; color:var(--text-1);">Pointage CoproSync</div>
      <div style="font-size:13px; color:var(--text-3); margin-top:4px;">Résidence Les Jardins</div>
    </div>
  `;

  _showModal('Affiche QR Code Universel', html, '🖨️ Imprimer l\'affiche');
}

// Helper pour afficher une modal rapidement
function _showModal(title, bodyHtml, btnText) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-registre';
  overlay.innerHTML = `
    <div class="modal" style="max-width:500px; border-radius:20px;">
      <div class="mh" style="padding:20px 24px; border-bottom:1px solid var(--border); background:var(--bg-1);">
        <span class="mh-title" style="font-size:18px; font-weight:900;">${title}</span>
        <button type="button" class="mclose" style="font-size:24px;" onclick="document.getElementById('modal-registre').remove()">×</button>
      </div>
      <div class="mb" style="padding:24px;">${bodyHtml}</div>
      <div class="mf" style="padding:16px 24px; border-top:1px solid var(--border);">
        <button type="button" class="btn btn-ghost" onclick="document.getElementById('modal-registre').remove()">Annuler</button>
        <button type="button" class="saas-btn-black" onclick="toast('Action enregistrée', 'ok'); document.getElementById('modal-registre').remove();">
          ${btnText}
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
}
