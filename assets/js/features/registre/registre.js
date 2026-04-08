// ════════════════════════════════════════════════════════════════
//  REGISTRE D'INTERVENTION (Zones & QR Codes Spécifiques)
//  assets/js/features/registre/registre.js
// ════════════════════════════════════════════════════════════════

let _regTab = 'historique'; 

// --- MOCK DATA ENRICHIE AVEC LES ZONES ---
const _mockRegistre = [
  { id: 1, presta: 'NettoyagePlus', zone: 'Hall Entrée Tour 17', arrivee: new Date(Date.now() - 1000 * 60 * 45).toISOString(), depart: null, status: 'en_cours' },
  { id: 2, presta: 'Espaces Verts Pro', zone: 'Jardins Sud', arrivee: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 120).toISOString(), depart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), status: 'termine' },
  { id: 3, presta: 'Ascenseurs Schindler', zone: 'Machinerie Tour 19', arrivee: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5 - 1000 * 60 * 15).toISOString(), depart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), status: 'anomalie' },
];

// Chaque prestataire a maintenant son propre tableau de zones
let _mockPrestas = [
  { 
    id: 'p1', nom: 'NettoyagePlus', contrat: 'Ménage hebdomadaire', couleur: 'var(--blue)', telephone: '01 23 45 67 89', email: 'contact@nettoyageplus.fr',
    zones: [
      { id: 'z1', nom: 'Hall Entrée Tour 17' },
      { id: 'z2', nom: 'Local Poubelles T17' }
    ]
  },
  { 
    id: 'p2', nom: 'Espaces Verts Pro', contrat: 'Entretien extérieur', couleur: 'var(--green)', telephone: '06 12 34 56 78', email: 'jardins@evp.fr',
    zones: [
      { id: 'z3', nom: 'Jardins Sud' },
      { id: 'z4', nom: 'Allées Principales' }
    ]
  },
  { 
    id: 'p3', nom: 'Ascenseurs Schindler', contrat: 'Maintenance préventive', couleur: 'var(--orange)', telephone: '0800 123 456', email: 'sav@schindler.fr',
    zones: [
      { id: 'z5', nom: 'Machinerie Tour 17' },
      { id: 'z6', nom: 'Machinerie Tour 19' }
    ]
  }
];

// ── CSS PREMIUM ────────────────────────────────────────────────────────────
(function injectRegistreCSS() {
  if (document.getElementById('saas-registre-css')) return;
  const s = document.createElement('style');
  s.id = 'saas-registre-css';
  s.textContent = `
    .reg-container { padding: 32px 40px; max-width: 1200px; margin: 0 auto; animation: pageIn 0.3s ease; }
    
    .reg-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; margin-bottom: 32px; }
    .reg-title { font-family: var(--font-head); font-size: 32px; font-weight: 900; letter-spacing: -1px; color: var(--text-1); margin: 0 0 8px 0; }
    .reg-sub { font-size: 15px; color: var(--text-3); font-weight: 500; margin: 0; }
    
    .reg-tabs-wrap { display: inline-flex; background: var(--bg-2); padding: 4px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 24px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02); }
    .reg-tab { padding: 8px 20px; font-size: 13.5px; font-weight: 700; color: var(--text-3); background: transparent; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .reg-tab:hover:not(.active) { color: var(--text-1); }
    .reg-tab.active { color: var(--text-1); background: var(--surface); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    
    .reg-table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
    .reg-grid { display: grid; grid-template-columns: minmax(200px, 2fr) minmax(140px, 1fr) 100px 100px 100px 120px; gap: 16px; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--bg-2); transition: background 0.15s; }
    .reg-th { background: var(--bg-1); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); padding-top: 16px; padding-bottom: 16px; }
    .reg-tr:hover { background: var(--surface-2); }
    .reg-tr:last-child { border-bottom: none; }
    
    .reg-presta-name { font-size: 14px; font-weight: 800; color: var(--text-1); margin-bottom: 4px; }
    .reg-presta-zone { font-size: 12px; color: var(--text-3); font-weight: 600; }
    .reg-time { font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--text-2); }
    .reg-duration { font-size: 13.5px; font-weight: 800; color: var(--text-1); }
    
    .reg-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid currentColor; }
    .reg-badge .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; background: currentColor; }
    .reg-encours { color: var(--green); } .reg-encours .dot { animation: pulse-green 2s infinite; }
    .reg-termine { color: var(--text-3); border-color: var(--border-strong); }
    .reg-anomalie { color: var(--orange); }

    @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

    .presta-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); transition: all 0.25s ease; position: relative; overflow: hidden; }
    .presta-card:hover { border-color: var(--border-strong); box-shadow: 0 12px 32px rgba(0,0,0,0.06); transform: translateY(-4px); }
    .presta-ico { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; color: white; }
    
    .presta-btn-group { display: flex; gap: 10px; border-top: 1px solid var(--bg-2); padding-top: 20px; margin-top: auto; }
    .presta-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 14px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; }
    .presta-btn.primary { background: var(--text-1); color: var(--surface); }
    .presta-btn.primary:hover { opacity: 0.9; }
    .presta-btn.secondary { background: var(--surface-2); color: var(--text-2); border-color: var(--border); }
    .presta-btn.secondary:hover { background: var(--bg-1); color: var(--text-1); border-color: var(--border-strong); }

    /* Fiche Presta - Zones List */
    .zone-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 8px; transition: border-color 0.15s; }
    .zone-row:hover { border-color: var(--border-strong); background: var(--surface); }
    .zone-name { font-size: 14px; font-weight: 700; color: var(--text-1); }
    .zone-id { font-size: 11px; color: var(--text-3); font-family: monospace; background: var(--bg-2); padding: 2px 6px; border-radius: 4px; margin-left: 8px; }

    /* Print Specific (Affiche QR) */
    @media print {
      body * { visibility: hidden; }
      #print-area, #print-area * { visibility: visible; }
      #print-area { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; background: white; color: black; display: flex !important; flex-direction: column; align-items: center; justify-content: center; padding: 40px; }
      #print-area .print-title { font-size: 54px; font-weight: 900; margin-bottom: 10px; text-transform: uppercase; letter-spacing: -1px; text-align: center; line-height: 1.1; }
      #print-area .print-presta { font-size: 28px; font-weight: 800; color: #4f46e5; margin-bottom: 10px; }
      #print-area .print-zone { font-size: 22px; font-weight: 600; color: #4b5563; margin-bottom: 60px; padding: 10px 20px; border: 2px dashed #9ca3af; border-radius: 12px; }
      #print-area img { width: 400px; height: 400px; margin-bottom: 60px; }
      #print-area .print-foot { font-size: 18px; font-weight: 700; color: #9ca3af; }
    }

    @media (max-width: 960px) {
      .reg-container { padding: 20px 16px; }
      .reg-th { display: none; }
      .reg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px; position: relative; border-bottom: 1px solid var(--border); }
      .reg-grid > div:nth-child(1) { grid-column: 1 / -1; }
      .reg-grid > div:nth-child(5) { font-size: 16px; }
      .reg-grid > div:nth-child(6) { position: absolute; top: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(s);
})();

// ── RENDER PRINCIPAL ──────────────────────────────────────────────────────────

async function renderRegistre() {
  const page = $('page');
  if (!page) return;

  const isManagerUser = typeof isManager === 'function' ? isManager() : true;

  page.innerHTML = `
  <div class="reg-container">
    <div class="reg-header">
      <div>
        <h1 class="reg-title">Registre d'Intervention</h1>
        <p class="reg-sub">Suivi en temps réel des passages et du temps de travail des prestataires.</p>
      </div>
      ${isManagerUser ? `
      <div>
        <button class="btn btn-primary" style="font-weight:800; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.2);" onclick="openPointageManuel()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:6px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Pointage Manuel
        </button>
      </div>` : ''}
    </div>

    <div class="reg-tabs-wrap">
      <button class="reg-tab active" data-tab="historique" onclick="setRegistreTab('historique')">Historique des passages</button>
      ${isManagerUser ? `<button class="reg-tab" data-tab="prestataires" onclick="setRegistreTab('prestataires')">Annuaire Prestataires</button>` : ''}
    </div>

    <div id="reg-tab-historique" style="animation: pageIn 0.2s ease;"></div>
    <div id="reg-tab-prestataires" style="display:none; animation: pageIn 0.2s ease;"></div>
  </div>
  
  <div id="print-area" style="display:none;"></div>
  `;

  _renderHistorique();
  if (isManagerUser) _renderPrestataires();
}

function setRegistreTab(tab) {
  _regTab = tab;
  document.querySelectorAll('.reg-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  $('reg-tab-historique').style.display = tab === 'historique' ? 'block' : 'none';
  $('reg-tab-prestataires').style.display = tab === 'prestataires' ? 'block' : 'none';
}

// ── RENDU HISTORIQUE ──────────────────────────────────────────────────────────

function _renderHistorique() {
  const container = $('reg-tab-historique');
  if (!container) return;

  let html = `
    <div class="reg-table-wrap">
      <div class="reg-grid reg-th">
        <div>Prestataire & Zone</div>
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
      dureeStr = '<span style="color:var(--green); animation:pulse-green 2s infinite;">En cours...</span>';
    }

    let badge = '';
    if (row.status === 'en_cours') badge = `<span class="reg-badge reg-encours"><span class="dot"></span>En cours</span>`;
    else if (row.status === 'termine') badge = `<span class="reg-badge reg-termine"><span class="dot"></span>Terminé</span>`;
    else if (row.status === 'anomalie') badge = `<span class="reg-badge reg-anomalie" title="Temps suspect"><span class="dot"></span>Anomalie</span>`;

    html += `
      <div class="reg-grid reg-tr">
        <div>
          <div class="reg-presta-name">${row.presta}</div>
          <div class="reg-presta-zone">📍 ${row.zone}</div>
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

// ── RENDU PRESTATAIRES ──────────────────────────────────────────────────────

function _renderPrestataires() {
  const container = $('reg-tab-prestataires');
  if (!container) return;

  let html = `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:24px;">`;

  _mockPrestas.forEach(p => {
    const init = p.nom.substring(0, 2).toUpperCase();
    const zonesCount = p.zones.length;
    
    html += `
      <div class="presta-card">
        <div style="display:flex; align-items:center; gap:16px;">
          <div class="presta-ico" style="background:${p.couleur}; box-shadow: 0 8px 16px ${p.couleur}33;">${init}</div>
          <div style="flex:1; min-width:0;">
            <div style="font-family:var(--font-head); font-size:18px; font-weight:800; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.nom}</div>
            <div style="font-size:13px; font-weight:600; color:var(--text-3);">${p.contrat}</div>
          </div>
        </div>
        
        <div class="presta-btn-group">
           <button class="presta-btn secondary" onclick="openPointageManuel('${p.nom}')">
             ⏱️ Badger
           </button>
           <button class="presta-btn primary" onclick="openFichePresta('${p.id}')">
             Gestion des Zones (${zonesCount})
           </button>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// ── LOGIQUE : GESTION DES ZONES & IMPRESSION QR ──────────────────────────────

// Cette fonction s'occupera d'ajouter une fausse zone pour la démo
window.addZonePresta = function(prestaId) {
  const nomZone = prompt("Nom de la nouvelle zone d'intervention (ex: Local Vélos) :");
  if (!nomZone) return;
  
  const presta = _mockPrestas.find(p => p.id === prestaId);
  if (presta) {
    presta.zones.push({ id: 'z' + Math.random().toString(36).substr(2, 5), nom: nomZone });
    toast('Zone ajoutée avec succès', 'ok');
    openFichePresta(prestaId); // Re-render modal
    _renderPrestataires();     // Re-render grid
  }
};

window.printZoneQR = function(prestaId, zoneId) {
  const presta = _mockPrestas.find(p => p.id === prestaId);
  const zone = presta.zones.find(z => z.id === zoneId);
  if (!presta || !zone) return;

  // L'URL magique vers laquelle pointera le QR Code :
  // Le prestataire scanne ça, et atterrit sur une page qui sait déjà QUI il est et OÙ il est.
  const pointageUrl = `${window.location.origin}${window.location.pathname}?p=pointage&presta=${prestaId}&zone=${zoneId}`;
  
  // API de génération de QR Code :
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pointageUrl)}&color=000000&bgcolor=ffffff&margin=10`;

  // On prépare la zone d'impression cachée
  const printArea = $('print-area');
  if (printArea) {
    printArea.innerHTML = `
      <div style="text-align:center; padding: 40px; font-family: sans-serif;">
        <h1 class="print-title">POINTAGE OBLIGATOIRE</h1>
        <div class="print-presta">${presta.nom}</div>
        <div class="print-zone">📍 ZONE : ${zone.nom.toUpperCase()}</div>
        
        <p style="font-size:20px; color:#4b5563; margin-bottom:40px; max-width:600px; margin-left:auto; margin-right:auto;">
          Veuillez scanner ce QR Code avec votre smartphone à votre <strong>arrivée</strong> et à votre <strong>départ</strong> pour valider votre intervention.
        </p>
        
        <img src="${qrApiUrl}" alt="QR Code" style="width: 350px; height: 350px; display:block; margin:0 auto 40px; border-radius: 16px; border: 2px solid #e5e7eb; padding: 10px;">
        
        <div class="print-foot">Propulsé par CoproSync</div>
      </div>
    `;
    
    toast('Préparation de l\'affiche...', 'ok');
    
    // Délai pour laisser l'image se charger depuis l'API QRServer
    setTimeout(() => {
      window.print();
    }, 800);
  }
};

function openFichePresta(id) {
  const presta = _mockPrestas.find(p => p.id === id);
  if (!presta) return;

  let zonesHtml = presta.zones.length === 0 
    ? `<div style="text-align:center; padding:20px; color:var(--text-3); font-size:13px;">Aucune zone définie.</div>`
    : presta.zones.map(z => `
      <div class="zone-row">
        <div>
          <span class="zone-name">${escHtml(z.nom)}</span>
          <span class="zone-id">#${z.id}</span>
        </div>
        <button class="btn btn-secondary btn-sm" style="background:white; font-weight:700;" onclick="printZoneQR('${presta.id}', '${z.id}')">
          🖨️ Affiche QR
        </button>
      </div>
    `).join('');

  const html = `
    <div style="display:flex; flex-direction:column; gap:24px;">
      
      <div style="background:var(--bg-2); padding:16px 20px; border-radius:16px; border:1px solid var(--border);">
        <div style="font-size:11px; font-weight:800; color:var(--text-3); text-transform:uppercase; margin-bottom:8px;">Contact & Contrat</div>
        <div style="font-size:14px; font-weight:700; color:var(--text-1); margin-bottom:4px;">${presta.contrat} (${presta.frequence})</div>
        <div style="font-size:13px; color:var(--text-2); display:flex; gap:16px; margin-top:8px;">
          <span>📞 ${presta.telephone}</span>
          <span>✉️ ${presta.email}</span>
        </div>
      </div>
      
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-family:var(--font-head); font-size:16px; font-weight:800; color:var(--text-1); margin:0;">📍 Zones d'intervention</h3>
          <button class="btn btn-ghost btn-sm" style="color:var(--primary); font-weight:700;" onclick="addZonePresta('${presta.id}')">
            + Ajouter
          </button>
        </div>
        
        <div style="background:var(--bg-1); padding:12px; border-radius:16px; border:1px solid var(--border);">
          ${zonesHtml}
        </div>
        
        <p style="font-size:12px; color:var(--text-3); margin-top:12px; line-height:1.5;">
          Générez une affiche QR Code pour chaque zone. Le prestataire la scannera avec son téléphone in-situ pour badger avec précision.
        </p>
      </div>

    </div>
  `;

  _showModal(`Fiche : ${presta.nom}`, html);
}

// ── LOGIQUE : POINTAGE MANUEL ────────────────────────────────────────────────

function openPointageManuel(preselectNom = null) {
  const options = _mockPrestas.map(p => `<option value="${p.nom}" ${p.nom === preselectNom ? 'selected' : ''}>${p.nom}</option>`).join('');
  
  const html = `
    <div style="margin-bottom:20px;">
      <label style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--text-3); display:block; margin-bottom:8px;">Prestataire</label>
      <select class="input" style="width:100%; font-weight:600; background:var(--bg-2); border-color:var(--border);">${options}</select>
    </div>
    
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
      <div>
        <label style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--text-3); display:block; margin-bottom:8px;">Arrivée</label>
        <input type="time" class="input" style="width:100%; font-family:var(--font-body); font-weight:700; background:var(--bg-2); border-color:var(--border);" value="08:00">
      </div>
      <div>
        <label style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--text-3); display:block; margin-bottom:8px;">Départ</label>
        <input type="time" class="input" style="width:100%; font-family:var(--font-body); font-weight:700; background:var(--bg-2); border-color:var(--border);" value="${new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}">
      </div>
    </div>
    
    <div>
       <label style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--text-3); display:block; margin-bottom:8px;">Zone / Observations</label>
       <input type="text" class="input" style="width:100%; background:var(--bg-2); border-color:var(--border);" placeholder="Ex: Hall Principal - Sol glissant">
    </div>
  `;

  _showModal('Saisir un passage manuel', html, 'Valider', () => {
    if (typeof toast === 'function') toast('Pointage enregistré avec succès', 'ok');
  });
}

// ── HELPER : MODAL SYSTEM ─────────────────────────────────────────────────────

function _showModal(title, bodyHtml, btnText = 'Fermer', onConfirm = null) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-registre';
  overlay.innerHTML = `
    <div class="modal" style="max-width:560px; border-radius:24px;">
      <div class="mh" style="padding:20px 24px; border-bottom:1px solid var(--border); background:var(--bg-1);">
        <span class="mh-title" style="font-size:20px; font-weight:900; color:var(--text-1);">${title}</span>
        <button type="button" class="mclose" style="font-size:24px; border:none; background:transparent;" onclick="document.getElementById('modal-registre').remove()">×</button>
      </div>
      <div class="mb" style="padding:24px;">${bodyHtml}</div>
      <div class="mf" style="padding:16px 24px; border-top:1px solid var(--border); display:flex; gap:12px; justify-content:flex-end; background:var(--surface);">
        ${onConfirm ? `<button type="button" class="btn btn-ghost" style="font-weight:700;" onclick="document.getElementById('modal-registre').remove()">Annuler</button>` : ''}
        <button type="button" class="btn btn-primary" id="modal-reg-confirm" style="font-weight:800; padding:10px 24px;">
          ${btnText}
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  document.getElementById('modal-reg-confirm').addEventListener('click', () => {
    if (onConfirm) onConfirm();
    overlay.remove();
  });
}
