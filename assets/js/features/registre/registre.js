// ════════════════════════════════════════════════════════════════
//  REGISTRE D'INTERVENTION (SaaS Premium + Logique QR/Contrats)
//  assets/js/features/registre/registre.js
// ════════════════════════════════════════════════════════════════

let _regTab = 'historique'; // historique | prestataires

// --- MOCK DATA ENRICHIE ---
const _mockRegistre = [
  { id: 1, presta: 'NettoyagePlus', type: 'Ménage des communs', arrivee: new Date(Date.now() - 1000 * 60 * 45).toISOString(), depart: null, status: 'en_cours' },
  { id: 2, presta: 'Espaces Verts Pro', type: 'Tonte pelouse', arrivee: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 120).toISOString(), depart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), status: 'termine' },
  { id: 3, presta: 'Ascenseurs Schindler', type: 'Maintenance Tour 17', arrivee: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5 - 1000 * 60 * 15).toISOString(), depart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), status: 'anomalie' },
  { id: 4, presta: 'NettoyagePlus', type: 'Ménage des communs', arrivee: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 - 1000 * 60 * 180).toISOString(), depart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), status: 'termine' }
];

const _mockPrestas = [
  { id: 'p1', nom: 'NettoyagePlus', contrat: 'Ménage hebdomadaire', couleur: 'var(--blue)', telephone: '01 23 45 67 89', email: 'contact@nettoyageplus.fr', frequence: '2x / semaine' },
  { id: 'p2', nom: 'Espaces Verts Pro', contrat: 'Entretien extérieur', couleur: 'var(--green)', telephone: '06 12 34 56 78', email: 'jardins@evp.fr', frequence: '1x / mois' },
  { id: 'p3', nom: 'Ascenseurs Schindler', contrat: 'Maintenance préventive', couleur: 'var(--orange)', telephone: '0800 123 456', email: 'sav@schindler.fr', frequence: 'Sur appel' }
];

// ── CSS PREMIUM (Light/Dark + Print) ──────────────────────────────────────
(function injectRegistreCSS() {
  if (document.getElementById('saas-registre-css')) return;
  const s = document.createElement('style');
  s.id = 'saas-registre-css';
  s.textContent = `
    .reg-container { padding: 32px 40px; max-width: 1200px; margin: 0 auto; animation: pageIn 0.3s ease; }
    
    .reg-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; margin-bottom: 32px; }
    .reg-title { font-family: var(--font-head); font-size: 32px; font-weight: 900; letter-spacing: -1px; color: var(--text-1); margin: 0 0 8px 0; }
    .reg-sub { font-size: 15px; color: var(--text-3); font-weight: 500; margin: 0; }
    
    /* Segmented Controls (iOS Style Tabs) */
    .reg-tabs-wrap { display: inline-flex; background: var(--bg-2); padding: 4px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 24px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02); }
    .reg-tab { padding: 8px 20px; font-size: 13.5px; font-weight: 700; color: var(--text-3); background: transparent; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
    .reg-tab:hover:not(.active) { color: var(--text-1); }
    .reg-tab.active { color: var(--text-1); background: var(--surface); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    
    /* Table Historique */
    .reg-table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
    .reg-grid { display: grid; grid-template-columns: minmax(200px, 2fr) minmax(140px, 1fr) 100px 100px 100px 120px; gap: 16px; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--bg-2); transition: background 0.15s; }
    .reg-th { background: var(--bg-1); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); padding-top: 16px; padding-bottom: 16px; }
    .reg-tr:hover { background: var(--surface-2); }
    .reg-tr:last-child { border-bottom: none; }
    
    .reg-presta-name { font-size: 14px; font-weight: 800; color: var(--text-1); margin-bottom: 4px; }
    .reg-presta-type { font-size: 12px; color: var(--text-3); font-weight: 500; }
    .reg-time { font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--text-2); font-variant-numeric: tabular-nums; }
    .reg-duration { font-size: 13.5px; font-weight: 800; color: var(--text-1); }
    
    /* Badges */
    .reg-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid currentColor; background: transparent; }
    .reg-badge .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; background: currentColor; }
    .reg-encours { color: var(--green); } .reg-encours .dot { animation: pulse-green 2s infinite; }
    .reg-termine { color: var(--text-3); border-color: var(--border-strong); }
    .reg-anomalie { color: var(--orange); }

    @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

    /* Presta Cards (SaaS Style) */
    .presta-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
    .presta-card:hover { border-color: var(--border-strong); box-shadow: 0 12px 32px rgba(0,0,0,0.06); transform: translateY(-4px); }
    .presta-ico { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; color: white; box-shadow: inset 0 -2px 0 rgba(0,0,0,0.2); }
    
    .presta-btn-group { display: flex; gap: 10px; border-top: 1px solid var(--bg-2); padding-top: 20px; margin-top: auto; }
    .presta-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 14px; border-radius: 12px; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; }
    .presta-btn.secondary { background: var(--surface-2); color: var(--text-2); border-color: var(--border); }
    .presta-btn.secondary:hover { background: var(--bg-1); color: var(--text-1); border-color: var(--border-strong); }

    /* Print Specific (Affiche QR) */
    @media print {
      body * { visibility: hidden; }
      #print-area, #print-area * { visibility: visible; }
      #print-area { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; background: white; color: black; display: flex !important; flex-direction: column; align-items: center; justify-content: center; padding: 40px; }
      #print-area .print-title { font-size: 48px; font-weight: 900; margin-bottom: 20px; text-transform: uppercase; letter-spacing: -1px; }
      #print-area .print-sub { font-size: 24px; font-weight: 600; color: #4b5563; margin-bottom: 60px; text-align: center; }
      #print-area svg { width: 400px; height: 400px; margin-bottom: 60px; }
      #print-area .print-foot { font-size: 18px; font-weight: 700; color: #9ca3af; }
    }

    @media (max-width: 960px) {
      .reg-container { padding: 20px 16px; }
      .reg-header { flex-direction: column; align-items: stretch; gap: 16px; }
      .reg-header > div:last-child { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .reg-header button { width: 100%; justify-content: center; padding: 10px; font-size: 13px; }
      
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

  const isManagerUser = typeof isManager === 'function' ? isManager() : true; // Remplacer par ta vraie fonction

  page.innerHTML = `
  <div class="reg-container">
    
    <div class="reg-header">
      <div>
        <h1 class="reg-title">Registre d'Intervention</h1>
        <p class="reg-sub">Suivi en temps réel des passages et du temps de travail des prestataires.</p>
      </div>
      
      ${isManagerUser ? `
      <div style="display:flex; gap:12px;">
        <button class="btn btn-secondary" style="font-weight:700; border-radius:10px; box-shadow:0 1px 2px rgba(0,0,0,0.05);" onclick="openQrUniversal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
          Affiche QR Code
        </button>
        <button class="btn btn-primary" style="font-weight:800; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.2);" onclick="openPointageManuel()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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
        <div>Prestataire & Mission</div>
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
    else if (row.status === 'anomalie') badge = `<span class="reg-badge reg-anomalie" title="Temps de présence suspect (Trop court ou trop long)"><span class="dot"></span>Anomalie</span>`;

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

// ── RENDU PRESTATAIRES ──────────────────────────────────────────────────────

function _renderPrestataires() {
  const container = $('reg-tab-prestataires');
  if (!container) return;

  let html = `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:24px;">`;

  _mockPrestas.forEach(p => {
    const init = p.nom.substring(0, 2).toUpperCase();
    
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
           <button class="presta-btn secondary" onclick="viewContrat('${p.id}')">
             📄 Fiche & Contrat
           </button>
           <button class="presta-btn" style="background:${p.couleur}; color:white; box-shadow:0 4px 12px ${p.couleur}44;" onclick="openPointageManuel('${p.nom}')">
             ⏱️ Badger
           </button>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// ── LOGIQUE : AFFICHE QR CODE (Impression) ───────────────────────────────────

// ── LOGIQUE : GESTION & IMPRESSION DU QR CODE (Vrai Tech) ──────────────────────

function openQrUniversal() {
  // 1. On construit l'URL exacte vers laquelle le QR Code doit pointer.
  // Plus tard, tu pourras créer la page "?p=pointage_externe" pour les prestataires.
  const pointageUrl = window.location.origin + window.location.pathname + '?p=pointage_externe';
  
  // 2. On utilise l'API qrserver pour générer un vrai QR Code dynamique
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pointageUrl)}&color=000000&bgcolor=ffffff&margin=10`;

  const html = `
    <div style="text-align:center; margin-bottom:24px; color:var(--text-2); font-size:14px; line-height:1.6;">
      Imprimez cette affiche et placez-la dans la loge ou le hall. Les prestataires pourront scanner ce vrai QR Code avec leur téléphone pour badger, sans avoir besoin de compte.
    </div>
    
    <div class="qr-box" style="background: #ffffff; padding: 32px; border-radius: 20px; text-align: center; border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.08); margin: 0 auto; max-width: 320px;">
      <img src="${qrApiUrl}" alt="QR Code Pointage" style="width: 220px; height: 220px; margin: 0 auto; display: block; border-radius: 8px;">
      
      <div style="margin-top:24px; font-family:var(--font-head); font-weight:900; font-size:22px; color:#111827; letter-spacing: -0.5px;">Pointage CoproSync</div>
      <div style="font-size:13px; color:#6b7280; font-weight: 500; margin-top:4px;">Résidence Les Jardins</div>
    </div>
  `;

  // On affiche la modale avec le bouton d'impression
  _showModal('Affiche QR Code Universel', html, '🖨️ Imprimer l\'affiche', () => {
    
    // 3. Logique d'impression : On injecte le QR Code dans la zone d'impression
    const printArea = $('print-area');
    if (printArea) {
      printArea.innerHTML = `
        <div style="text-align:center; padding: 60px 40px; font-family: sans-serif;">
          <h1 style="font-family:'Syne', sans-serif; font-size:54px; font-weight:900; margin-bottom:16px; color:#000; letter-spacing: -1px; text-transform: uppercase;">Pointage Prestataires</h1>
          <p style="font-size:22px; color:#374151; margin-bottom:80px; font-weight: 500;">
            Veuillez scanner ce QR Code à votre <strong>arrivée</strong> et à votre <strong>départ</strong>.
          </p>
          
          <img src="${qrApiUrl}" style="width: 450px; height: 450px; display:block; margin:0 auto 60px;">
          
          <div style="font-family:'Syne', sans-serif; font-weight:900; font-size:36px; color:#000;">Propulsé par CoproSync</div>
          <div style="font-size:18px; color:#6b7280; margin-top:12px;">Résidence Les Jardins</div>
        </div>
      `;
      
      // On attend 500ms pour laisser le temps à l'image de charger avant d'ouvrir la fenêtre d'impression
      setTimeout(() => {
        window.print();
      }, 500);
    }
  });
}

// ── LOGIQUE : QUICK VIEW CONTRAT ──────────────────────────────────────────────

function viewContrat(id) {
  const presta = _mockPrestas.find(p => p.id === id);
  if (!presta) return;

  const html = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="background:var(--surface-2); padding:16px; border-radius:12px; border:1px solid var(--border);">
        <div style="font-size:11px; font-weight:800; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Mission</div>
        <div style="font-size:15px; font-weight:700; color:var(--text-1);">${presta.contrat}</div>
        <div style="font-size:13px; color:var(--text-2); margin-top:4px;">Fréquence : <strong>${presta.frequence}</strong></div>
      </div>
      
      <div style="background:var(--surface-2); padding:16px; border-radius:12px; border:1px solid var(--border);">
        <div style="font-size:11px; font-weight:800; color:var(--text-3); text-transform:uppercase; margin-bottom:8px;">Contact</div>
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px; font-size:14px; font-weight:600;">
          <span>📞</span> <a href="tel:${presta.telephone.replace(/\s/g, '')}" style="color:var(--text-1); text-decoration:none;">${presta.telephone}</a>
        </div>
        <div style="display:flex; align-items:center; gap:10px; font-size:14px; font-weight:600;">
          <span>✉️</span> <a href="mailto:${presta.email}" style="color:var(--primary); text-decoration:none;">${presta.email}</a>
        </div>
      </div>
    </div>
  `;

  _showModal(`Fiche : ${presta.nom}`, html, 'Gérer le contrat', () => {
    // Redirige vers le vrai module contrats
    if (typeof nav === 'function') nav('contrats');
  });
}

// ── LOGIQUE : POINTAGE MANUEL ────────────────────────────────────────────────

function openPointageManuel(preselectNom = null) {
  const options = _mockPrestas.map(p => `<option value="${p.nom}" ${p.nom === preselectNom ? 'selected' : ''}>${p.nom}</option>`).join('');
  
  const html = `
    <div style="margin-bottom:20px;">
      <label style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--text-3); display:block; margin-bottom:8px;">Prestataire</label>
      <select class="input" style="width:100%; font-weight:600;">${options}</select>
    </div>
    
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
      <div>
        <label style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--text-3); display:block; margin-bottom:8px;">Arrivée</label>
        <input type="time" class="input" style="width:100%; font-family:var(--font-body); font-weight:700;" value="08:00">
      </div>
      <div>
        <label style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--text-3); display:block; margin-bottom:8px;">Départ</label>
        <input type="time" class="input" style="width:100%; font-family:var(--font-body); font-weight:700;" value="${new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}">
      </div>
    </div>
    
    <div>
       <label style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--text-3); display:block; margin-bottom:8px;">Notes & Observations</label>
       <textarea class="textarea" style="width:100%; min-height:80px;" placeholder="Ex: Intervention suite à une fuite d'eau..."></textarea>
    </div>
  `;

  _showModal('Saisir un passage manuel', html, 'Valider le pointage', () => {
    if (typeof toast === 'function') toast('Pointage enregistré avec succès', 'ok');
  });
}

// ── HELPER : MODAL SYSTEM ─────────────────────────────────────────────────────

function _showModal(title, bodyHtml, btnText, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-registre';
  overlay.innerHTML = `
    <div class="modal" style="max-width:500px; border-radius:24px;">
      <div class="mh" style="padding:24px 28px; border-bottom:1px solid var(--border); background:var(--bg-1);">
        <span class="mh-title" style="font-size:20px; font-weight:900; color:var(--text-1);">${title}</span>
        <button type="button" class="mclose" style="font-size:24px; border:none; background:transparent;" onclick="document.getElementById('modal-registre').remove()">×</button>
      </div>
      <div class="mb" style="padding:28px;">${bodyHtml}</div>
      <div class="mf" style="padding:20px 28px; border-top:1px solid var(--border); display:flex; gap:12px; justify-content:flex-end;">
        <button type="button" class="btn btn-ghost" style="font-weight:700;" onclick="document.getElementById('modal-registre').remove()">Annuler</button>
        <button type="button" class="btn btn-primary" id="modal-reg-confirm" style="font-weight:800; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
          ${btnText}
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  if (onConfirm) {
    document.getElementById('modal-reg-confirm').addEventListener('click', () => {
      onConfirm();
      overlay.remove();
    });
  }
}
