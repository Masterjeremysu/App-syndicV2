// ════════════════════════════════════════════════════════════════════════════
//  REGISTRE D'INTERVENTION — CoproSync Premium
//  assets/js/features/registre/registre.js
//
//  Fonctionnalités :
//    • Historique des passages avec statuts temps réel
//    • QR Codes par zone (local poubelle, hall, etc.) — URL publique
//    • Page de pointage publique (scan QR → arrivée / départ)
//    • Annuaire prestataires éditable (missions, contrat, contacts)
//    • Validation manuelle par membre CS (si oubli de pointage)
//    • Alertes dépassement / anomalie automatiques
// ════════════════════════════════════════════════════════════════════════════

// ── ÉTAT LOCAL ────────────────────────────────────────────────────────────────

let _regTab       = 'historique';  // 'historique' | 'prestataires' | 'zones'
let _regFilter    = 'all';         // 'all' | 'en_cours' | 'termine' | 'anomalie' | 'manquant'
let _editPrestaId = null;          // ID prestataire en cours d'édition

// ── DONNÉES MOCK (à remplacer par Supabase) ──────────────────────────────────

const _mockZones = [
  { id: 'z1', nom: 'Local Poubelles — Bat. A', icone: 'trash', qr_token: 'tok_z1_abc123' },
  { id: 'z2', nom: 'Hall d\'entrée principal', icone: 'door',  qr_token: 'tok_z2_def456' },
  { id: 'z3', nom: 'Parkings Sous-Sol',        icone: 'car',   qr_token: 'tok_z3_ghi789' },
  { id: 'z4', nom: 'Espaces Verts — Cour',     icone: 'leaf',  qr_token: 'tok_z4_jkl012' },
  { id: 'z5', nom: 'Local Technique / VMC',    icone: 'wrench',qr_token: 'tok_z5_mno345' },
];

const _mockPrestas = [
  {
    id: 'p1', nom: 'NettoyagePlus', couleur: '#22C55E',
    missions: [
      { id: 'm1', label: 'Ménage des communs', zones: ['z1','z2'], frequence: '2× / semaine', horaire_attendu: { debut: '08:00', fin: '10:30' }, duree_min: 90, duree_max: 180 },
    ],
    telephone: '01 23 45 67 89', email: 'contact@nettoyageplus.fr',
    adresse: '14 rue de la Paix, 75001 Paris', siret: '123 456 789 00012',
    contrat_debut: '2024-01-01', contrat_fin: '2025-12-31',
    notes: 'Contact urgent : M. Dupont — 06 12 34 56 78',
  },
  {
    id: 'p2', nom: 'Espaces Verts Pro', couleur: '#3B82F6',
    missions: [
      { id: 'm2', label: 'Tonte pelouse & entretien', zones: ['z4'], frequence: '1× / mois', horaire_attendu: { debut: '09:00', fin: '12:00' }, duree_min: 120, duree_max: 240 },
    ],
    telephone: '06 12 34 56 78', email: 'jardins@evp.fr',
    adresse: '8 allée des Fleurs, 78000 Versailles', siret: '987 654 321 00034',
    contrat_debut: '2024-03-01', contrat_fin: '2025-02-28',
    notes: '',
  },
  {
    id: 'p3', nom: 'Ascenseurs Schindler', couleur: '#F59E0B',
    missions: [
      { id: 'm3', label: 'Maintenance préventive', zones: ['z2'], frequence: 'Sur appel', horaire_attendu: { debut: '07:00', fin: '18:00' }, duree_min: 15, duree_max: 480 },
    ],
    telephone: '0800 123 456', email: 'sav@schindler.fr',
    adresse: '100 bd Haussmann, 75008 Paris', siret: '555 000 111 00056',
    contrat_debut: '2023-06-01', contrat_fin: '2026-05-31',
    notes: 'Numéro de contrat: SCH-2023-4421',
  },
];

const _mockPassages = [
  { id: 'pa1', presta_id: 'p1', mission_id: 'm1', zone_id: 'z2', arrivee: new Date(Date.now() - 1000*60*45).toISOString(), depart: null, status: 'en_cours', valide_par: null, note: '' },
  { id: 'pa2', presta_id: 'p2', mission_id: 'm2', zone_id: 'z4', arrivee: new Date(Date.now() - 1000*60*60*24*2 - 1000*60*120).toISOString(), depart: new Date(Date.now() - 1000*60*60*24*2).toISOString(), status: 'termine', valide_par: null, note: '' },
  { id: 'pa3', presta_id: 'p3', mission_id: 'm3', zone_id: 'z2', arrivee: new Date(Date.now() - 1000*60*60*24*5 - 1000*60*15).toISOString(), depart: new Date(Date.now() - 1000*60*60*24*5).toISOString(), status: 'anomalie', valide_par: null, note: 'Durée trop courte (15 min)' },
  { id: 'pa4', presta_id: 'p1', mission_id: 'm1', zone_id: 'z1', arrivee: new Date(Date.now() - 1000*60*60*24*7 - 1000*60*180).toISOString(), depart: new Date(Date.now() - 1000*60*60*24*7).toISOString(), status: 'termine', valide_par: null, note: '' },
  { id: 'pa5', presta_id: 'p1', mission_id: 'm1', zone_id: 'z2', arrivee: new Date(Date.now() - 1000*60*60*24*9 - 1000*60*150).toISOString(), depart: null, status: 'manquant', valide_par: null, note: 'Départ non scanné' },
];

// ── CSS INJECTION ─────────────────────────────────────────────────────────────

(function injectRegistreCSS() {
  if (document.getElementById('coprosync-registre-css')) return;
  const s = document.createElement('style');
  s.id = 'coprosync-registre-css';
  s.textContent = `
    /* ── ROOT OVERRIDES FOR REGISTRE ── */
    .reg-wrap { padding: 32px 40px; max-width: 1280px; margin: 0 auto; }

    /* ── HEADER ── */
    .reg-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:20px; margin-bottom:36px; }
    .reg-header-left {}
    .reg-eyebrow { font-size:11px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-3); margin-bottom:6px; display:flex; align-items:center; gap:6px; }
    .reg-eyebrow::before { content:''; display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--green); box-shadow:0 0 8px var(--green); animation:reg-pulse 2s infinite; }
    @keyframes reg-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
    .reg-h1 { font-family:var(--font-head); font-size:34px; font-weight:900; letter-spacing:-1.2px; color:var(--text-1); margin:0 0 6px; }
    .reg-sub { font-size:14px; color:var(--text-3); font-weight:500; margin:0; }
    .reg-header-actions { display:flex; gap:10px; flex-wrap:wrap; }

    /* ── BTN SYSTEM ── */
    .reg-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.18s cubic-bezier(.4,0,.2,1); border:1px solid transparent; white-space:nowrap; }
    .reg-btn svg { flex-shrink:0; }
    .reg-btn-primary { background:var(--primary); color:white; border-color:var(--primary); box-shadow:0 4px 14px rgba(0,0,0,0.18); }
    .reg-btn-primary:hover { filter:brightness(1.1); box-shadow:0 6px 20px rgba(0,0,0,0.25); transform:translateY(-1px); }
    .reg-btn-secondary { background:var(--surface); color:var(--text-2); border-color:var(--border); }
    .reg-btn-secondary:hover { background:var(--surface-2); color:var(--text-1); border-color:var(--border-strong); }
    .reg-btn-ghost { background:transparent; color:var(--text-3); border-color:transparent; }
    .reg-btn-ghost:hover { background:var(--surface-2); color:var(--text-1); }
    .reg-btn-danger { background:rgba(239,68,68,.08); color:#EF4444; border-color:rgba(239,68,68,.25); }
    .reg-btn-danger:hover { background:rgba(239,68,68,.15); }
    .reg-btn-sm { padding:6px 12px; font-size:12px; border-radius:8px; }
    .reg-btn-icon { padding:9px; border-radius:10px; background:var(--surface); border:1px solid var(--border); color:var(--text-2); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; transition:all .18s; }
    .reg-btn-icon:hover { background:var(--surface-2); color:var(--text-1); }

    /* ── SEGMENTED TABS ── */
    .reg-tabs { display:inline-flex; background:var(--bg-2); padding:3px; border-radius:12px; border:1px solid var(--border); gap:2px; margin-bottom:28px; }
    .reg-tab { padding:7px 18px; font-size:13px; font-weight:700; color:var(--text-3); background:transparent; border:none; border-radius:9px; cursor:pointer; transition:all .2s cubic-bezier(.4,0,.2,1); display:flex; align-items:center; gap:6px; }
    .reg-tab:hover:not(.active) { color:var(--text-1); }
    .reg-tab.active { color:var(--text-1); background:var(--surface); box-shadow:0 1px 6px rgba(0,0,0,.1); }
    .reg-tab-count { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; padding:0 5px; border-radius:20px; font-size:10px; font-weight:900; background:var(--bg-1); color:var(--text-3); }
    .reg-tab.active .reg-tab-count { background:var(--primary); color:white; }

    /* ── FILTER BAR ── */
    .reg-filterbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:18px; }
    .reg-filters { display:flex; gap:6px; flex-wrap:wrap; }
    .reg-filter-pill { padding:5px 13px; border-radius:20px; font-size:12px; font-weight:700; cursor:pointer; transition:all .18s; border:1px solid var(--border); background:var(--surface); color:var(--text-3); }
    .reg-filter-pill:hover { color:var(--text-1); border-color:var(--border-strong); }
    .reg-filter-pill.active { background:var(--text-1); color:var(--bg-1); border-color:var(--text-1); }
    .reg-filter-pill.f-en_cours.active  { background:var(--green);  border-color:var(--green);  color:white; }
    .reg-filter-pill.f-anomalie.active  { background:#F59E0B; border-color:#F59E0B; color:white; }
    .reg-filter-pill.f-manquant.active  { background:#EF4444; border-color:#EF4444; color:white; }
    .reg-filter-pill.f-termine.active   { background:var(--text-3); border-color:var(--text-3); color:white; }

    /* ── TABLE HISTORIQUE ── */
    .reg-table-shell { background:var(--surface); border:1px solid var(--border); border-radius:18px; overflow:hidden; }
    .reg-table-head { display:grid; grid-template-columns: 2.5fr 1.2fr 85px 85px 90px 120px 40px; gap:8px; align-items:center; padding:12px 20px; background:var(--bg-1); border-bottom:1px solid var(--border); }
    .reg-th-cell { font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--text-3); }
    .reg-th-cell.right { text-align:right; }

    .reg-row { display:grid; grid-template-columns: 2.5fr 1.2fr 85px 85px 90px 120px 40px; gap:8px; align-items:center; padding:14px 20px; border-bottom:1px solid var(--bg-2); transition:background .15s; cursor:default; }
    .reg-row:last-child { border-bottom:none; }
    .reg-row:hover { background:var(--surface-2); }
    .reg-row.row-manquant { background:rgba(239,68,68,.03); }
    .reg-row.row-anomalie { background:rgba(245,158,11,.03); }

    .reg-presta-pill { display:inline-flex; align-items:center; gap:8px; }
    .reg-presta-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .reg-presta-name { font-size:14px; font-weight:800; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .reg-mission-tag { font-size:11.5px; color:var(--text-3); font-weight:500; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .reg-zone-badge { display:inline-flex; align-items:center; gap:5px; font-size:11.5px; font-weight:600; color:var(--text-2); }
    .reg-time-cell { font-size:13px; font-weight:700; color:var(--text-2); font-variant-numeric:tabular-nums; }
    .reg-dur-cell { font-size:14px; font-weight:900; color:var(--text-1); font-variant-numeric:tabular-nums; }
    .reg-dur-live { color:var(--green); font-size:12px; font-weight:700; }
    .reg-actions-cell { display:flex; justify-content:flex-end; }

    /* ── BADGES ── */
    .reg-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 9px; border-radius:20px; font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; }
    .badge-en_cours { background:rgba(34,197,94,.1);  color:var(--green); }
    .badge-en_cours .bdot { background:var(--green); animation:reg-pulse 2s infinite; }
    .badge-termine   { background:var(--bg-2);  color:var(--text-3); }
    .badge-termine .bdot { background:var(--text-3); }
    .badge-anomalie  { background:rgba(245,158,11,.1); color:#F59E0B; }
    .badge-anomalie .bdot { background:#F59E0B; }
    .badge-manquant  { background:rgba(239,68,68,.1); color:#EF4444; }
    .badge-manquant .bdot { background:#EF4444; }
    .bdot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
    .badge-valide { background:rgba(34,197,94,.08); color:var(--green); font-size:9.5px; padding:2px 7px; margin-left:4px; }

    /* ── STAT CARDS ── */
    .reg-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
    .reg-stat-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px 20px; display:flex; align-items:center; gap:14px; }
    .reg-stat-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .reg-stat-val { font-size:24px; font-weight:900; color:var(--text-1); font-variant-numeric:tabular-nums; }
    .reg-stat-lbl { font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; letter-spacing:.06em; margin-top:1px; }

    /* ── GRILLE ZONES ── */
    .reg-zones-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:18px; }
    .zone-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:20px; cursor:pointer; transition:all .22s cubic-bezier(.4,0,.2,1); }
    .zone-card:hover { border-color:var(--border-strong); box-shadow:0 8px 24px rgba(0,0,0,.06); transform:translateY(-2px); }
    .zone-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .zone-ico { width:44px; height:44px; border-radius:12px; background:var(--bg-2); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--text-2); }
    .zone-token { font-family:monospace; font-size:10px; color:var(--text-3); background:var(--bg-2); padding:2px 8px; border-radius:4px; border:1px solid var(--border); }
    .zone-name { font-size:16px; font-weight:800; color:var(--text-1); margin-bottom:4px; }
    .zone-lastpass { font-size:12px; color:var(--text-3); font-weight:500; }
    .zone-actions { display:flex; gap:8px; margin-top:16px; border-top:1px solid var(--bg-2); padding-top:16px; }

    /* ── GRILLE PRESTATAIRES ── */
    .reg-prestas-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:22px; }
    .presta-card { background:var(--surface); border:1px solid var(--border); border-radius:20px; overflow:hidden; transition:all .22s cubic-bezier(.4,0,.2,1); }
    .presta-card:hover { border-color:var(--border-strong); box-shadow:0 12px 32px rgba(0,0,0,.06); transform:translateY(-3px); }
    .presta-card-top { padding:22px 22px 0; }
    .presta-card-header { display:flex; align-items:flex-start; gap:14px; margin-bottom:18px; }
    .presta-ava { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:white; flex-shrink:0; }
    .presta-nom { font-size:18px; font-weight:900; color:var(--text-1); margin-bottom:3px; }
    .presta-contrat { font-size:12.5px; color:var(--text-3); font-weight:600; }
    .presta-missions { display:flex; flex-direction:column; gap:8px; margin-bottom:18px; }
    .presta-mission-row { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--bg-1); border-radius:10px; border:1px solid var(--border); }
    .presta-mission-name { font-size:13px; font-weight:700; color:var(--text-1); margin-bottom:2px; }
    .presta-mission-meta { font-size:11px; color:var(--text-3); font-weight:500; }
    .presta-mission-freq { font-size:11px; font-weight:800; color:var(--primary); background:rgba(var(--primary-rgb),.08); padding:3px 8px; border-radius:6px; white-space:nowrap; }
    .presta-card-footer { display:flex; gap:10px; padding:16px 22px; border-top:1px solid var(--bg-2); margin-top:4px; }

    /* ── FORMULAIRE MODAL ── */
    .frm-row { margin-bottom:18px; }
    .frm-label { font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--text-3); display:block; margin-bottom:7px; }
    .frm-input { width:100%; background:var(--bg-1); border:1px solid var(--border); border-radius:10px; padding:10px 14px; font-size:14px; font-weight:600; color:var(--text-1); outline:none; transition:border-color .18s; box-sizing:border-box; font-family:var(--font-body); }
    .frm-input:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(var(--primary-rgb),.1); }
    .frm-select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; background-size:16px; padding-right:36px; }
    .frm-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .frm-section { font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.1em; color:var(--text-3); padding:8px 0 12px; border-bottom:1px solid var(--border); margin-bottom:16px; }
    .frm-textarea { min-height:80px; resize:vertical; }
    .frm-mission-block { border:1px solid var(--border); border-radius:12px; padding:14px; margin-bottom:10px; background:var(--bg-1); position:relative; }
    .frm-add-mission { width:100%; padding:9px; border-radius:10px; border:1px dashed var(--border); background:transparent; color:var(--text-3); font-size:13px; font-weight:700; cursor:pointer; transition:all .18s; display:flex; align-items:center; justify-content:center; gap:6px; }
    .frm-add-mission:hover { border-color:var(--primary); color:var(--primary); }

    /* ── ALERTE / VALIDATION MANUELLE ── */
    .reg-alert-banner { display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:12px; margin-bottom:20px; background:rgba(239,68,68,.07); border:1px solid rgba(239,68,68,.2); }
    .reg-alert-ico { color:#EF4444; flex-shrink:0; }
    .reg-alert-text { flex:1; font-size:13px; font-weight:700; color:var(--text-1); }
    .reg-alert-text span { font-weight:500; color:var(--text-2); }

    /* ── EMPTY STATE ── */
    .reg-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:64px 20px; color:var(--text-3); gap:12px; }
    .reg-empty svg { opacity:.3; }
    .reg-empty p { font-size:15px; font-weight:700; margin:0; }
    .reg-empty span { font-size:13px; font-weight:500; opacity:.7; }

    /* ── QR MODAL ── */
    .qr-modal-content { display:flex; flex-direction:column; align-items:center; gap:20px; padding:8px 0; }
    .qr-frame { background:white; border-radius:16px; padding:20px; display:flex; align-items:center; justify-content:center; }
    .qr-url { font-family:monospace; font-size:11px; background:var(--bg-2); padding:8px 14px; border-radius:8px; border:1px solid var(--border); color:var(--text-2); word-break:break-all; text-align:center; }
    .qr-zone-name { font-size:16px; font-weight:800; color:var(--text-1); text-align:center; }
    .qr-instructions { font-size:13px; color:var(--text-3); text-align:center; font-weight:500; line-height:1.6; }

    /* ── RESPONSIVE ── */
    @media (max-width: 1100px) {
      .reg-stats { grid-template-columns:repeat(2,1fr); }
    }
    @media (max-width: 768px) {
      .reg-wrap { padding:18px 16px; }
      .reg-h1 { font-size:26px; }
      .reg-stats { grid-template-columns:repeat(2,1fr); gap:10px; }
      .reg-table-head { display:none; }
      .reg-row { grid-template-columns: 1fr auto; gap:10px; padding:14px 16px; }
      .reg-row > *:nth-child(3),
      .reg-row > *:nth-child(4),
      .reg-row > *:nth-child(5) { display:none; }
      .reg-tab { padding:7px 12px; font-size:12px; }
      .reg-header { flex-direction:column; }
      .reg-header-actions { width:100%; }
      .reg-btn { flex:1; justify-content:center; }
    }
    @media (max-width: 480px) {
      .reg-stats { grid-template-columns:1fr 1fr; }
    }

    /* ── PRINT QR ── */
    @media print {
      body > * { display:none !important; }
      #reg-print-area { display:flex !important; position:fixed; inset:0; background:white; color:black; flex-direction:column; align-items:center; justify-content:center; gap:24px; padding:40px; z-index:9999; }
      #reg-print-area .pt { font-size:42px; font-weight:900; text-transform:uppercase; letter-spacing:-1px; text-align:center; }
      #reg-print-area .ps { font-size:20px; color:#6b7280; text-align:center; font-weight:600; }
      #reg-print-area .pqr { width:360px; height:360px; }
      #reg-print-area .pu { font-size:13px; color:#9ca3af; margin-top:8px; word-break:break-all; text-align:center; }
      #reg-print-area .pf { font-size:15px; font-weight:700; color:#d1d5db; margin-top:16px; }
    }
    @keyframes pageIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  `;
  document.head.appendChild(s);
})();

// ── UTILITAIRES ───────────────────────────────────────────────────────────────

function _regPresta(id) { return _mockPrestas.find(p => p.id === id); }
function _regZone(id)   { return _mockZones.find(z => z.id === id); }
function _regMission(presta, mid) { return presta?.missions?.find(m => m.id === mid); }

function _regFmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function _regFmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'short' });
}
function _regDuree(a, b) {
  if (!b) return null;
  const mins = Math.floor((new Date(b) - new Date(a)) / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${m} min`;
}
function _regSince(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s/60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m/60); return `${h}h${String(m%60).padStart(2,'0')}`;
}
function _regIcoSvg(name, size=18) {
  const icons = {
    trash:  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`,
    door:   `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9"/><polyline points="1 9 12 2 23 9"/></svg>`,
    car:    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    leaf:   `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22c0-9 8-16 18-16-1 9-9 16-18 16z"/><path d="M2 22s4-4 10-7"/></svg>`,
    wrench: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
    qr:     `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3v3h3zM15 16v3"/><path d="M21 21v-2"/><path d="M15 3h3v3h-3v3M3 9v3h6V9M9 3v3"/></svg>`,
    plus:   `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    clock:  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    check:  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    edit:   `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    print:  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    warn:   `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    close:  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    phone:  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.71 19.79 19.79 0 012 1.18 2 2 0 014 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`,
    mail:   `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    trash2: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2"/></svg>`,
    user:   `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    doc:    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  };
  return icons[name] || icons['clock'];
}

// Génère un vrai QR Code SVG via qrcodegen (librairie légère inline)
// Pour un projet réel : utiliser qrcode.js ou appel serveur
function _generateQrSvg(text, size=200) {
  // Placeholder visuel réaliste — en prod, injecter qrcode.js
  const cells = 25;
  const cell  = size / cells;
  let rects   = '';
  // Seed pseudo-aléatoire déterministe basé sur le texte
  let h = 0;
  for (let i = 0; i < text.length; i++) { h = (Math.imul(31, h) + text.charCodeAt(i)) | 0; }
  const rand = (x, y) => { let v = (h ^ (x * 374761393 + y * 668265263)) | 0; v = Math.imul(v, v); return ((v >>> 16) & 1) === 1; };
  // Patterns de localisation (coins)
  const loc = (ox, oy) => {
    for (let r=0;r<7;r++) for (let c=0;c<7;c++) {
      const fill = (r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4)) ? 1 : 0;
      if (fill) rects += `<rect x="${(ox+c)*cell}" y="${(oy+r)*cell}" width="${cell}" height="${cell}" fill="#111"/>`;
    }
  };
  for (let r=0;r<cells;r++) for (let c=0;c<cells;c++) {
    const inLoc = (r<8&&c<8)||(r<8&&c>=cells-8)||(r>=cells-8&&c<8);
    if (!inLoc && rand(c, r)) rects += `<rect x="${c*cell}" y="${r*cell}" width="${cell}" height="${cell}" fill="#111"/>`;
  }
  loc(0,0); loc(cells-7,0); loc(0,cells-7);
  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="white"/>${rects}</svg>`;
}

// ── RENDER PRINCIPAL ──────────────────────────────────────────────────────────

async function renderRegistre() {
  const page = typeof $ === 'function' ? $('page') : document.getElementById('page');
  if (!page) return;

  const mgr = typeof isManager === 'function' ? isManager() : true;
  const cs  = typeof hasRole   === 'function' ? (hasRole('membre_cs') || hasRole('syndic') || hasRole('administrateur')) : true;

  // Compte les alertes en attente
  const nManquant = _mockPassages.filter(p => p.status === 'manquant').length;
  const nAnomalie = _mockPassages.filter(p => p.status === 'anomalie').length;
  const nAlerts   = nManquant + nAnomalie;

  page.innerHTML = `
  <div class="reg-wrap" style="animation:pageIn .3s ease;">

    <div class="reg-header">
      <div class="reg-header-left">
        <div class="reg-eyebrow">Registre d'Intervention</div>
        <h1 class="reg-h1">Suivi des passages</h1>
        <p class="reg-sub">Temps réel · QR Codes par zone · Validation manuelle</p>
      </div>
      ${mgr ? `
      <div class="reg-header-actions">
        <button class="reg-btn reg-btn-secondary" onclick="openGererZones()">
          ${_regIcoSvg('qr')} Gérer les QR Zones
        </button>
        <button class="reg-btn reg-btn-primary" onclick="openPointageManuel()">
          ${_regIcoSvg('clock')} Pointage manuel
        </button>
      </div>` : ''}
    </div>

    ${nAlerts > 0 ? `
    <div class="reg-alert-banner">
      <span class="reg-alert-ico">${_regIcoSvg('warn', 20)}</span>
      <span class="reg-alert-text">
        ${nManquant > 0 ? `<strong>${nManquant} passage${nManquant>1?'s':''} sans départ</strong>` : ''}
        ${nManquant > 0 && nAnomalie > 0 ? ' · ' : ''}
        ${nAnomalie > 0 ? `<strong>${nAnomalie} anomalie${nAnomalie>1?'s':''} détectée${nAnomalie>1?'s':''}</strong>` : ''}
        <span> — cliquez sur une ligne pour valider ou corriger manuellement.</span>
      </span>
    </div>` : ''}

    <div id="reg-stats-area"></div>

    <div class="reg-tabs">
      <button class="reg-tab active" data-tab="historique" onclick="setRegistreTab('historique')">
        Historique
        <span class="reg-tab-count">${_mockPassages.length}</span>
      </button>
      ${mgr ? `
      <button class="reg-tab" data-tab="prestataires" onclick="setRegistreTab('prestataires')">
        Prestataires
        <span class="reg-tab-count">${_mockPrestas.length}</span>
      </button>
      <button class="reg-tab" data-tab="zones" onclick="setRegistreTab('zones')">
        Zones QR
        <span class="reg-tab-count">${_mockZones.length}</span>
      </button>` : ''}
    </div>

    <div id="reg-tab-historique"></div>
    <div id="reg-tab-prestataires" style="display:none;"></div>
    <div id="reg-tab-zones" style="display:none;"></div>

  </div>
  <div id="reg-print-area" style="display:none;"></div>
  `;

  _renderStats();
  _renderHistorique();
  _renderPrestataires();
  _renderZones();
}

function setRegistreTab(tab) {
  _regTab = tab;
  document.querySelectorAll('.reg-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  ['historique','prestataires','zones'].forEach(id => {
    const el = document.getElementById(`reg-tab-${id}`);
    if (el) el.style.display = id === tab ? 'block' : 'none';
  });
}

// ── STATS CARDS ──────────────────────────────────────────────────────────────

function _renderStats() {
  const el = document.getElementById('reg-stats-area');
  if (!el) return;
  const total    = _mockPassages.length;
  const enCours  = _mockPassages.filter(p=>p.status==='en_cours').length;
  const alertes  = _mockPassages.filter(p=>p.status==='anomalie'||p.status==='manquant').length;
  const prestas  = _mockPrestas.length;
  el.innerHTML = `
    <div class="reg-stats">
      <div class="reg-stat-card">
        <div class="reg-stat-icon" style="background:rgba(34,197,94,.1);color:#22C55E;">${_regIcoSvg('clock',20)}</div>
        <div><div class="reg-stat-val">${enCours}</div><div class="reg-stat-lbl">En cours</div></div>
      </div>
      <div class="reg-stat-card">
        <div class="reg-stat-icon" style="background:rgba(var(--primary-rgb),.1);color:var(--primary);">${_regIcoSvg('doc',20)}</div>
        <div><div class="reg-stat-val">${total}</div><div class="reg-stat-lbl">Passages (30j)</div></div>
      </div>
      <div class="reg-stat-card">
        <div class="reg-stat-icon" style="background:rgba(239,68,68,.1);color:#EF4444;">${_regIcoSvg('warn',20)}</div>
        <div><div class="reg-stat-val">${alertes}</div><div class="reg-stat-lbl">Alertes</div></div>
      </div>
      <div class="reg-stat-card">
        <div class="reg-stat-icon" style="background:rgba(245,158,11,.1);color:#F59E0B;">${_regIcoSvg('user',20)}</div>
        <div><div class="reg-stat-val">${prestas}</div><div class="reg-stat-lbl">Prestataires</div></div>
      </div>
    </div>
  `;
}

// ── HISTORIQUE ────────────────────────────────────────────────────────────────

function setRegFilter(f) {
  _regFilter = f;
  document.querySelectorAll('.reg-filter-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.filter === f);
  });
  _renderHistoriqueRows();
}

function _renderHistorique() {
  const el = document.getElementById('reg-tab-historique');
  if (!el) return;
  el.innerHTML = `
    <div class="reg-filterbar">
      <div class="reg-filters">
        <span class="reg-filter-pill active" data-filter="all" onclick="setRegFilter('all')">Tous</span>
        <span class="reg-filter-pill f-en_cours" data-filter="en_cours" onclick="setRegFilter('en_cours')">En cours</span>
        <span class="reg-filter-pill f-anomalie" data-filter="anomalie" onclick="setRegFilter('anomalie')">Anomalie</span>
        <span class="reg-filter-pill f-manquant" data-filter="manquant" onclick="setRegFilter('manquant')">Départ manquant</span>
        <span class="reg-filter-pill f-termine" data-filter="termine" onclick="setRegFilter('termine')">Terminés</span>
      </div>
    </div>
    <div class="reg-table-shell">
      <div class="reg-table-head">
        <div class="reg-th-cell">Prestataire &amp; Mission</div>
        <div class="reg-th-cell">Zone</div>
        <div class="reg-th-cell">Arrivée</div>
        <div class="reg-th-cell">Départ</div>
        <div class="reg-th-cell">Durée</div>
        <div class="reg-th-cell right">Statut</div>
        <div></div>
      </div>
      <div id="reg-rows"></div>
    </div>
  `;
  _renderHistoriqueRows();
}

function _renderHistoriqueRows() {
  const el = document.getElementById('reg-rows');
  if (!el) return;

  const rows = _regFilter === 'all'
    ? _mockPassages
    : _mockPassages.filter(p => p.status === _regFilter);

  if (!rows.length) {
    el.innerHTML = `<div class="reg-empty">${_regIcoSvg('doc',40)}<p>Aucun passage</p><span>Modifiez le filtre pour voir d'autres résultats.</span></div>`;
    return;
  }

  el.innerHTML = rows.map(row => {
    const p  = _regPresta(row.presta_id);
    const z  = _regZone(row.zone_id);
    const m  = _regMission(p, row.mission_id);
    const dur = row.depart ? _regDuree(row.arrivee, row.depart) : null;

    const badgeCls   = { en_cours:'badge-en_cours', termine:'badge-termine', anomalie:'badge-anomalie', manquant:'badge-manquant' }[row.status] || 'badge-termine';
    const badgeTxt   = { en_cours:'En cours', termine:'Terminé', anomalie:'Anomalie', manquant:'Départ manquant' }[row.status] || row.status;

    const rowCls = row.status === 'manquant' ? 'row-manquant' : row.status === 'anomalie' ? 'row-anomalie' : '';
    const isAlert = row.status === 'manquant' || row.status === 'anomalie';

    return `
      <div class="reg-row ${rowCls}" onclick="openPassageDetail('${row.id}')">
        <div>
          <div class="reg-presta-pill">
            <span class="reg-presta-dot" style="background:${p?.couleur||'#888'};"></span>
            <span class="reg-presta-name">${p?.nom || '—'}</span>
          </div>
          <div class="reg-mission-tag">${m?.label || '—'}</div>
        </div>
        <div class="reg-zone-badge">
          ${z ? `${_regIcoSvg(z.icone,13)} ${z.nom}` : '—'}
        </div>
        <div class="reg-time-cell">${_regFmt(row.arrivee)}</div>
        <div class="reg-time-cell">${row.depart ? _regFmt(row.depart) : '—'}</div>
        <div class="reg-dur-cell">
          ${dur ? dur : row.status === 'en_cours' ? `<span class="reg-dur-live">+${_regSince(row.arrivee)}</span>` : '—'}
          ${row.valide_par ? `<span class="reg-badge badge-valide">${_regIcoSvg('check',10)} Validé</span>` : ''}
        </div>
        <div style="text-align:right;">
          <span class="reg-badge ${badgeCls}"><span class="bdot"></span>${badgeTxt}</span>
        </div>
        <div class="reg-actions-cell">
          ${isAlert ? `<button class="reg-btn-icon" title="Valider / Corriger" onclick="event.stopPropagation();openValidationManuelle('${row.id}')" style="color:#EF4444;border-color:rgba(239,68,68,.25);">${_regIcoSvg('check',15)}</button>` : `<button class="reg-btn-icon" title="Détail" onclick="event.stopPropagation();openPassageDetail('${row.id}')">${_regIcoSvg('doc',15)}</button>`}
        </div>
      </div>
    `;
  }).join('');
}

// ── DÉTAIL PASSAGE ────────────────────────────────────────────────────────────

function openPassageDetail(id) {
  const row = _mockPassages.find(p => p.id === id);
  if (!row) return;
  const p   = _regPresta(row.presta_id);
  const z   = _regZone(row.zone_id);
  const m   = _regMission(p, row.mission_id);
  const dur = _regDuree(row.arrivee, row.depart);

  const isAlert = row.status === 'manquant' || row.status === 'anomalie';
  const body = `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--bg-1);border-radius:12px;border:1px solid var(--border);">
        <div style="width:44px;height:44px;border-radius:12px;background:${p?.couleur||'#888'};display:flex;align-items:center;justify-content:center;font-weight:900;color:white;font-size:16px;">${(p?.nom||'?').substring(0,2).toUpperCase()}</div>
        <div>
          <div style="font-size:16px;font-weight:800;color:var(--text-1);">${p?.nom||'—'}</div>
          <div style="font-size:12px;color:var(--text-3);font-weight:600;">${m?.label||'—'}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:10px;padding:12px;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:4px;">Zone</div>
          <div style="font-size:14px;font-weight:700;color:var(--text-1);">${z?.nom||'—'}</div>
        </div>
        <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:10px;padding:12px;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:4px;">Date</div>
          <div style="font-size:14px;font-weight:700;color:var(--text-1);text-transform:capitalize;">${_regFmtDate(row.arrivee)}</div>
        </div>
        <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:10px;padding:12px;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:4px;">Arrivée</div>
          <div style="font-size:20px;font-weight:900;color:var(--text-1);font-variant-numeric:tabular-nums;">${_regFmt(row.arrivee)}</div>
        </div>
        <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:10px;padding:12px;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:4px;">Départ</div>
          <div style="font-size:20px;font-weight:900;color:${row.depart?'var(--text-1)':'#EF4444'};font-variant-numeric:tabular-nums;">${row.depart ? _regFmt(row.depart) : 'Non scanné'}</div>
        </div>
      </div>
      ${dur ? `<div style="background:var(--bg-1);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;"><span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);">Durée totale</span><div style="font-size:28px;font-weight:900;color:var(--text-1);font-variant-numeric:tabular-nums;margin-top:4px;">${dur}</div></div>` : ''}
      ${row.note ? `<div style="background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:10px;padding:12px;font-size:13px;color:var(--text-2);font-weight:600;">${_regIcoSvg('warn',14)} ${row.note}</div>` : ''}
      ${row.valide_par ? `<div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--green);font-weight:700;">${_regIcoSvg('check',13)} Validé manuellement par ${row.valide_par}</div>` : ''}
    </div>
  `;

  _regShowModal(`Détail du passage`, body,
    isAlert ? 'Valider manuellement' : null,
    isAlert ? () => openValidationManuelle(id) : null
  );
}

// ── VALIDATION MANUELLE (membre CS) ──────────────────────────────────────────

function openValidationManuelle(id) {
  // Ferme modale précédente si ouverte
  document.getElementById('reg-modal')?.remove();

  const row = _mockPassages.find(p => p.id === id);
  if (!row) return;
  const p = _regPresta(row.presta_id);
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const body = `
    <div style="margin-bottom:12px;padding:12px 14px;border-radius:10px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);font-size:13px;font-weight:700;color:#EF4444;">
      ${_regIcoSvg('warn',15)}
      <span style="margin-left:6px;">${row.status === 'manquant' ? 'Départ non scanné' : 'Anomalie détectée'} — ${p?.nom||'?'}</span>
    </div>
    <div class="frm-row">
      <label class="frm-label">Heure d'arrivée (confirmée)</label>
      <input type="time" class="frm-input" id="vm-arr" value="${_regFmt(row.arrivee).replace('h',':')}">
    </div>
    <div class="frm-row">
      <label class="frm-label">Heure de départ (saisie manuelle)</label>
      <input type="time" class="frm-input" id="vm-dep" value="${row.depart ? _regFmt(row.depart) : hhmm}">
    </div>
    <div class="frm-row">
      <label class="frm-label">Motif de la validation manuelle</label>
      <select class="frm-input frm-select" id="vm-motif">
        <option value="oubli_scan">Oubli de scan au départ</option>
        <option value="probleme_tel">Problème téléphone / réseau</option>
        <option value="acces_restreint">Accès zone restreint</option>
        <option value="intervention_urgente">Intervention urgente</option>
        <option value="autre">Autre (préciser ci-dessous)</option>
      </select>
    </div>
    <div class="frm-row">
      <label class="frm-label">Observations (optionnel)</label>
      <textarea class="frm-input frm-textarea" id="vm-note" placeholder="Ex : Le prestataire a signalé un problème de réseau dans le sous-sol…"></textarea>
    </div>
    <div style="font-size:11px;color:var(--text-3);font-weight:600;padding:10px 12px;background:var(--bg-1);border-radius:8px;border:1px solid var(--border);">
      ${_regIcoSvg('user',12)} La validation sera enregistrée sous votre nom et horodatée.
    </div>
  `;

  _regShowModal('Validation manuelle — Membre CS', body, 'Valider & enregistrer', () => {
    // Mise à jour du mock (en prod → sb.from('passages').update(...))
    const dep = document.getElementById('vm-dep')?.value;
    const note = document.getElementById('vm-note')?.value || '';
    const motif = document.getElementById('vm-motif')?.value;
    const idx = _mockPassages.findIndex(p => p.id === id);
    if (idx !== -1) {
      _mockPassages[idx].status = 'termine';
      _mockPassages[idx].depart = dep ? new Date().toISOString() : _mockPassages[idx].depart;
      _mockPassages[idx].valide_par = 'Vous (membre CS)';
      _mockPassages[idx].note = note || `Validation manuelle — ${motif}`;
    }
    if (typeof toast === 'function') toast('Passage validé manuellement', 'ok');
    _renderHistoriqueRows();
    _renderStats();
  });
}

// ── ANNUAIRE PRESTATAIRES ─────────────────────────────────────────────────────

function _renderPrestataires() {
  const el = document.getElementById('reg-tab-prestataires');
  if (!el) return;

  const grid = _mockPrestas.map(p => `
    <div class="presta-card">
      <div class="presta-card-top">
        <div class="presta-card-header">
          <div class="presta-ava" style="background:${p.couleur};box-shadow:0 6px 16px ${p.couleur}44;">
            ${p.nom.substring(0,2).toUpperCase()}
          </div>
          <div style="flex:1;min-width:0;">
            <div class="presta-nom">${p.nom}</div>
            <div class="presta-contrat">${p.missions.map(m=>m.label).join(' · ')}</div>
          </div>
          <button class="reg-btn-icon" onclick="openEditPresta('${p.id}')" title="Modifier">
            ${_regIcoSvg('edit',15)}
          </button>
        </div>

        <div class="presta-missions">
          ${p.missions.map(m => {
            const zones = m.zones.map(zid => _regZone(zid)?.nom || zid).join(', ');
            return `
              <div class="presta-mission-row">
                <div>
                  <div class="presta-mission-name">${m.label}</div>
                  <div class="presta-mission-meta">${_regIcoSvg('qr',11)} ${zones} · ${m.horaire_attendu.debut}–${m.horaire_attendu.fin}</div>
                </div>
                <span class="presta-mission-freq">${m.frequence}</span>
              </div>
            `;
          }).join('')}
        </div>

        <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--text-2);">
            ${_regIcoSvg('phone',13)}<a href="tel:${p.telephone.replace(/\s/g,'')}" style="color:inherit;text-decoration:none;">${p.telephone}</a>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--text-2);">
            ${_regIcoSvg('mail',13)}<a href="mailto:${p.email}" style="color:var(--primary);text-decoration:none;">${p.email}</a>
          </div>
        </div>

        ${p.contrat_debut ? `<div style="font-size:11px;color:var(--text-3);font-weight:600;margin-bottom:16px;">
          Contrat : ${p.contrat_debut} → ${p.contrat_fin}
        </div>` : ''}
      </div>

      <div class="presta-card-footer">
        <button class="reg-btn reg-btn-secondary reg-btn-sm" style="flex:1;" onclick="openHistoriquePresta('${p.id}')">
          ${_regIcoSvg('doc',13)} Historique
        </button>
        <button class="reg-btn reg-btn-sm" style="flex:1;background:${p.couleur};color:white;border-color:${p.couleur};" onclick="openPointageManuel('${p.nom}')">
          ${_regIcoSvg('clock',13)} Badger
        </button>
      </div>
    </div>
  `).join('');

  el.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:18px;">
      <button class="reg-btn reg-btn-primary" onclick="openEditPresta(null)">
        ${_regIcoSvg('plus')} Ajouter un prestataire
      </button>
    </div>
    <div class="reg-prestas-grid">${grid}</div>
  `;
}

// ── ÉDITION PRESTATAIRE ───────────────────────────────────────────────────────

function openEditPresta(id) {
  const p   = id ? _regPresta(id) : null;
  const isNew = !p;

  const body = `
    <div>
      <div class="frm-section">Informations générales</div>
      <div class="frm-row">
        <label class="frm-label">Nom de la société</label>
        <input class="frm-input" id="ep-nom" placeholder="Ex: NettoyagePlus" value="${p?.nom||''}">
      </div>
      <div class="frm-grid2">
        <div class="frm-row">
          <label class="frm-label">Téléphone</label>
          <input class="frm-input" id="ep-tel" placeholder="01 23 45 67 89" value="${p?.telephone||''}">
        </div>
        <div class="frm-row">
          <label class="frm-label">Email</label>
          <input class="frm-input" id="ep-mail" type="email" placeholder="contact@société.fr" value="${p?.email||''}">
        </div>
      </div>
      <div class="frm-row">
        <label class="frm-label">Adresse</label>
        <input class="frm-input" id="ep-adresse" placeholder="14 rue de la Paix, 75001 Paris" value="${p?.adresse||''}">
      </div>
      <div class="frm-grid2">
        <div class="frm-row">
          <label class="frm-label">SIRET</label>
          <input class="frm-input" id="ep-siret" placeholder="123 456 789 00012" value="${p?.siret||''}">
        </div>
        <div class="frm-row">
          <label class="frm-label">Couleur identifiante</label>
          <input class="frm-input" id="ep-couleur" type="color" value="${p?.couleur||'#3B82F6'}" style="height:42px;padding:4px;">
        </div>
      </div>
      <div class="frm-grid2">
        <div class="frm-row">
          <label class="frm-label">Début de contrat</label>
          <input class="frm-input" id="ep-cdebut" type="date" value="${p?.contrat_debut||''}">
        </div>
        <div class="frm-row">
          <label class="frm-label">Fin de contrat</label>
          <input class="frm-input" id="ep-cfin" type="date" value="${p?.contrat_fin||''}">
        </div>
      </div>

      <div class="frm-section" style="margin-top:8px;">Missions</div>
      <div id="ep-missions-list">
        ${(p?.missions||[]).map((m,i) => _missionFormBlock(m,i)).join('')}
      </div>
      <button class="frm-add-mission" onclick="addMissionBlock()">
        ${_regIcoSvg('plus',14)} Ajouter une mission
      </button>

      <div class="frm-section" style="margin-top:16px;">Notes internes</div>
      <div class="frm-row">
        <label class="frm-label">Observations (contacts urgents, numéro contrat…)</label>
        <textarea class="frm-input frm-textarea" id="ep-notes" placeholder="Ex: Contact urgent M. Dupont — 06 12 34 56 78">${p?.notes||''}</textarea>
      </div>
    </div>
  `;

  _regShowModal(isNew ? 'Nouveau prestataire' : `Modifier — ${p.nom}`, body, isNew ? 'Créer' : 'Enregistrer', () => {
    const nom = document.getElementById('ep-nom')?.value || '';
    if (!nom) { alert('Le nom est requis.'); return false; }
    if (isNew) {
      const newP = {
        id: 'p' + Date.now(), nom,
        couleur: document.getElementById('ep-couleur')?.value || '#3B82F6',
        telephone: document.getElementById('ep-tel')?.value || '',
        email: document.getElementById('ep-mail')?.value || '',
        adresse: document.getElementById('ep-adresse')?.value || '',
        siret: document.getElementById('ep-siret')?.value || '',
        contrat_debut: document.getElementById('ep-cdebut')?.value || '',
        contrat_fin: document.getElementById('ep-cfin')?.value || '',
        notes: document.getElementById('ep-notes')?.value || '',
        missions: [],
      };
      _mockPrestas.push(newP);
      if (typeof toast === 'function') toast(`${nom} ajouté avec succès`, 'ok');
    } else {
      const idx = _mockPrestas.findIndex(x => x.id === id);
      if (idx !== -1) {
        Object.assign(_mockPrestas[idx], {
          nom,
          couleur:       document.getElementById('ep-couleur')?.value   || _mockPrestas[idx].couleur,
          telephone:     document.getElementById('ep-tel')?.value        || '',
          email:         document.getElementById('ep-mail')?.value       || '',
          adresse:       document.getElementById('ep-adresse')?.value    || '',
          siret:         document.getElementById('ep-siret')?.value      || '',
          contrat_debut: document.getElementById('ep-cdebut')?.value     || '',
          contrat_fin:   document.getElementById('ep-cfin')?.value       || '',
          notes:         document.getElementById('ep-notes')?.value      || '',
        });
      }
      if (typeof toast === 'function') toast(`${nom} mis à jour`, 'ok');
    }
    _renderPrestataires();
  }, { wide: true });
}

function _missionFormBlock(m, i) {
  const zoneOptions = _mockZones.map(z =>
    `<option value="${z.id}" ${m?.zones?.includes(z.id)?'selected':''}>${z.nom}</option>`
  ).join('');
  return `
    <div class="frm-mission-block" id="mb-${i}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:12px;font-weight:800;color:var(--text-3);">Mission ${i+1}</span>
        <button class="reg-btn reg-btn-ghost reg-btn-sm" style="color:#EF4444;" onclick="document.getElementById('mb-${i}').remove()">
          ${_regIcoSvg('trash2',12)}
        </button>
      </div>
      <div class="frm-row">
        <label class="frm-label">Intitulé de la mission</label>
        <input class="frm-input" placeholder="Ex: Ménage des communs" value="${m?.label||''}">
      </div>
      <div class="frm-grid2">
        <div class="frm-row">
          <label class="frm-label">Zone(s)</label>
          <select class="frm-input frm-select" multiple style="height:80px;">${zoneOptions}</select>
        </div>
        <div class="frm-row">
          <label class="frm-label">Fréquence</label>
          <select class="frm-input frm-select">
            ${['Quotidien','2× / semaine','1× / semaine','2× / mois','1× / mois','Sur appel'].map(f=>`<option ${m?.frequence===f?'selected':''}>${f}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="frm-grid2">
        <div class="frm-row">
          <label class="frm-label">Heure début attendue</label>
          <input type="time" class="frm-input" value="${m?.horaire_attendu?.debut||'08:00'}">
        </div>
        <div class="frm-row">
          <label class="frm-label">Heure fin attendue</label>
          <input type="time" class="frm-input" value="${m?.horaire_attendu?.fin||'10:00'}">
        </div>
      </div>
    </div>
  `;
}

let _missionCounter = 10;
function addMissionBlock() {
  const list = document.getElementById('ep-missions-list');
  if (!list) return;
  const div = document.createElement('div');
  div.innerHTML = _missionFormBlock(null, _missionCounter++);
  list.appendChild(div.firstElementChild);
}

// ── HISTORIQUE PAR PRESTATAIRE ────────────────────────────────────────────────

function openHistoriquePresta(id) {
  const p = _regPresta(id);
  if (!p) return;
  const rows = _mockPassages.filter(x => x.presta_id === id);
  const body = rows.length ? `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${rows.map(row => {
        const z = _regZone(row.zone_id);
        const dur = _regDuree(row.arrivee, row.depart);
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:var(--bg-1);border-radius:10px;border:1px solid var(--border);">
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--text-1);text-transform:capitalize;">${_regFmtDate(row.arrivee)}</div>
              <div style="font-size:11px;color:var(--text-3);margin-top:2px;">${z?.nom||'—'} · ${_regFmt(row.arrivee)} → ${row.depart?_regFmt(row.depart):'?'}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              ${dur?`<span style="font-size:15px;font-weight:900;color:var(--text-1);">${dur}</span>`:''}
              <span class="reg-badge ${{en_cours:'badge-en_cours',termine:'badge-termine',anomalie:'badge-anomalie',manquant:'badge-manquant'}[row.status]}"><span class="bdot"></span>${{en_cours:'En cours',termine:'OK',anomalie:'Anomalie',manquant:'Manquant'}[row.status]}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  ` : `<div class="reg-empty">${_regIcoSvg('doc',36)}<p>Aucun passage enregistré</p></div>`;

  _regShowModal(`Historique — ${p.nom}`, body, null, null);
}

// ── ZONES QR ──────────────────────────────────────────────────────────────────

function _renderZones() {
  const el = document.getElementById('reg-tab-zones');
  if (!el) return;

  el.innerHTML = `
    <div style="margin-bottom:18px;padding:14px 18px;background:var(--bg-1);border:1px solid var(--border);border-radius:12px;font-size:13px;color:var(--text-2);font-weight:600;line-height:1.6;">
      ${_regIcoSvg('qr',15)} Chaque zone dispose d'un QR Code unique. Imprimez-le et posez-le sur place. Le prestataire scanne à l'arrivée <strong>ET</strong> au départ via l'URL publique — sans compte nécessaire.
    </div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:18px;">
      <button class="reg-btn reg-btn-primary" onclick="openAjouterZone()">
        ${_regIcoSvg('plus')} Ajouter une zone
      </button>
    </div>
    <div class="reg-zones-grid">
      ${_mockZones.map(z => {
        const dernierPassage = _mockPassages.filter(p=>p.zone_id===z.id).sort((a,b)=>new Date(b.arrivee)-new Date(a.arrivee))[0];
        return `
          <div class="zone-card">
            <div class="zone-card-header">
              <div class="zone-ico">${_regIcoSvg(z.icone, 20)}</div>
              <span class="zone-token">${z.qr_token.slice(-8)}</span>
            </div>
            <div class="zone-name">${z.nom}</div>
            <div class="zone-lastpass">${dernierPassage ? `Dernier passage : ${_regFmtDate(dernierPassage.arrivee)}` : 'Aucun passage enregistré'}</div>
            <div class="zone-actions">
              <button class="reg-btn reg-btn-secondary reg-btn-sm" style="flex:1;" onclick="openQrZone('${z.id}')">
                ${_regIcoSvg('qr',13)} Affiche QR
              </button>
              <button class="reg-btn reg-btn-secondary reg-btn-sm" style="flex:1;" onclick="openEditZone('${z.id}')">
                ${_regIcoSvg('edit',13)} Modifier
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ── QR CODE PAR ZONE ─────────────────────────────────────────────────────────

function openQrZone(id) {
  const z = _regZone(id);
  if (!z) return;
  // URL publique de pointage (page sans login)
  const publicUrl = `${location.origin}/scan?zone=${z.qr_token}`;
  const qrSvg     = _generateQrSvg(publicUrl, 220);

  const body = `
    <div class="qr-modal-content">
      <div class="qr-zone-name">${z.nom}</div>
      <div class="qr-frame">${qrSvg}</div>
      <div class="qr-url">${publicUrl}</div>
      <div class="qr-instructions">
        Le prestataire scanne ce code à l'<strong>arrivée</strong> et au <strong>départ</strong>.<br>
        Aucun compte requis — accessible depuis le navigateur.
      </div>
    </div>
  `;

  _regShowModal(`QR Code — ${z.nom}`, body, `${_regIcoSvg('print',14)} Imprimer l'affiche`, () => {
    _printQrAffiche(z, publicUrl, qrSvg);
  });
}

function _printQrAffiche(z, url, qrSvg) {
  const el = document.getElementById('reg-print-area');
  if (!el) return;
  el.style.display = 'flex';
  el.innerHTML = `
    <div class="pt">Pointage Prestataires</div>
    <div class="ps">${z.nom}<br><small style="font-weight:500;color:#9ca3af;">Scannez à l'arrivée ET au départ</small></div>
    <div class="pqr">${qrSvg}</div>
    <div class="pu">${url}</div>
    <div class="pf">Propulsé par CoproSync</div>
  `;
  setTimeout(() => { window.print(); el.style.display = 'none'; }, 100);
}

// ── AJOUTER / MODIFIER ZONE ───────────────────────────────────────────────────

function openAjouterZone() { _editZoneModal(null); }
function openEditZone(id)   { _editZoneModal(id); }

function _editZoneModal(id) {
  const z     = id ? _regZone(id) : null;
  const isNew = !z;
  const iconList = ['trash','door','car','leaf','wrench','qr'];

  const body = `
    <div class="frm-row">
      <label class="frm-label">Nom de la zone</label>
      <input class="frm-input" id="ez-nom" placeholder="Ex: Local Poubelles — Bat. B" value="${z?.nom||''}">
    </div>
    <div class="frm-row">
      <label class="frm-label">Icône</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${iconList.map(ico => `
          <button type="button" class="reg-btn-icon" onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.style.background='');this.style.background='var(--bg-1)';document.getElementById('ez-ico').value='${ico}'" style="${(z?.icone||'trash')===ico?'background:var(--bg-1);border-color:var(--primary);':''}" title="${ico}">
            ${_regIcoSvg(ico, 18)}
          </button>
        `).join('')}
        <input type="hidden" id="ez-ico" value="${z?.icone||'trash'}">
      </div>
    </div>
  `;

  _regShowModal(isNew ? 'Nouvelle zone QR' : `Modifier — ${z.nom}`, body, isNew ? 'Créer la zone' : 'Enregistrer', () => {
    const nom = document.getElementById('ez-nom')?.value || '';
    const ico = document.getElementById('ez-ico')?.value || 'trash';
    if (!nom) { alert('Le nom est requis.'); return false; }
    if (isNew) {
      const token = 'tok_z' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
      _mockZones.push({ id:'z'+Date.now(), nom, icone:ico, qr_token:token });
      if (typeof toast === 'function') toast(`Zone "${nom}" créée`, 'ok');
    } else {
      const idx = _mockZones.findIndex(x => x.id === id);
      if (idx !== -1) { _mockZones[idx].nom = nom; _mockZones[idx].icone = ico; }
      if (typeof toast === 'function') toast(`Zone mise à jour`, 'ok');
    }
    _renderZones();
  });
}

// ── POINTAGE MANUEL ───────────────────────────────────────────────────────────

function openPointageManuel(preselectNom = null) {
  const opts = _mockPrestas.map(p => `<option value="${p.nom}" ${p.nom===preselectNom?'selected':''}>${p.nom}</option>`).join('');
  const now  = new Date();
  const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const zoneOpts = _mockZones.map(z => `<option value="${z.id}">${z.nom}</option>`).join('');

  const body = `
    <div class="frm-row">
      <label class="frm-label">Prestataire</label>
      <select class="frm-input frm-select" id="pm-presta">${opts}</select>
    </div>
    <div class="frm-row">
      <label class="frm-label">Zone</label>
      <select class="frm-input frm-select" id="pm-zone">${zoneOpts}</select>
    </div>
    <div class="frm-grid2">
      <div class="frm-row">
        <label class="frm-label">Date</label>
        <input type="date" class="frm-input" id="pm-date" value="${now.toISOString().slice(0,10)}">
      </div>
      <div></div>
    </div>
    <div class="frm-grid2">
      <div class="frm-row">
        <label class="frm-label">Heure d'arrivée</label>
        <input type="time" class="frm-input" id="pm-arr" value="08:00">
      </div>
      <div class="frm-row">
        <label class="frm-label">Heure de départ</label>
        <input type="time" class="frm-input" id="pm-dep" value="${hhmm}">
      </div>
    </div>
    <div class="frm-row">
      <label class="frm-label">Observations</label>
      <textarea class="frm-input frm-textarea" id="pm-note" placeholder="Ex: Intervention suite à fuite d'eau…"></textarea>
    </div>
  `;

  _regShowModal('Saisir un passage manuel', body, 'Valider le pointage', () => {
    const prestaEl = document.getElementById('pm-presta');
    const prestaId = _mockPrestas.find(p => p.nom === prestaEl?.value)?.id || 'p1';
    const newPass  = {
      id:        'pa' + Date.now(),
      presta_id: prestaId,
      mission_id: _regPresta(prestaId)?.missions?.[0]?.id || null,
      zone_id:   document.getElementById('pm-zone')?.value || 'z1',
      arrivee:   new Date().toISOString(),
      depart:    new Date().toISOString(),
      status:    'termine',
      valide_par:'Vous (membre CS)',
      note:      document.getElementById('pm-note')?.value || 'Saisie manuelle',
    };
    _mockPassages.unshift(newPass);
    if (typeof toast === 'function') toast('Pointage enregistré', 'ok');
    _renderHistoriqueRows();
    _renderStats();
  });
}

// ── MODAL SYSTÈME ─────────────────────────────────────────────────────────────

function _regShowModal(title, bodyHtml, btnText, onConfirm, opts = {}) {
  document.getElementById('reg-modal')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'reg-modal';
  overlay.className = 'overlay open';
  overlay.innerHTML = `
    <div class="modal" style="max-width:${opts.wide?640:520}px;border-radius:22px;overflow:hidden;display:flex;flex-direction:column;max-height:90vh;">
      <div style="padding:22px 26px;border-bottom:1px solid var(--border);background:var(--bg-1);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <span style="font-size:18px;font-weight:900;color:var(--text-1);letter-spacing:-.4px;">${title}</span>
        <button type="button" style="background:var(--surface-2);border:1px solid var(--border);border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-2);" onclick="document.getElementById('reg-modal').remove()">
          ${_regIcoSvg('close',14)}
        </button>
      </div>
      <div style="padding:24px 26px;overflow-y:auto;flex:1;">${bodyHtml}</div>
      ${btnText ? `
      <div style="padding:18px 26px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;background:var(--bg-1);">
        <button type="button" class="reg-btn reg-btn-ghost" onclick="document.getElementById('reg-modal').remove()">Annuler</button>
        <button type="button" class="reg-btn reg-btn-primary" id="reg-modal-confirm">${btnText}</button>
      </div>` : `
      <div style="padding:18px 26px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;flex-shrink:0;">
        <button type="button" class="reg-btn reg-btn-secondary" onclick="document.getElementById('reg-modal').remove()">Fermer</button>
      </div>`}
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  if (btnText && onConfirm) {
    document.getElementById('reg-modal-confirm').addEventListener('click', () => {
      const res = onConfirm();
      if (res !== false) overlay.remove();
    });
  }
}

// ── PAGE PUBLIQUE DE SCAN (montée sans auth) ──────────────────────────────────
// À appeler depuis votre routeur quand l'URL contient ?zone=tok_xxx
// Ex: if (urlParams.get('zone')) renderScanPage(urlParams.get('zone'));

function renderScanPage(token) {
  const page = typeof $ === 'function' ? $('page') : document.getElementById('page');
  if (!page) return;
  const z = _mockZones.find(x => x.qr_token === token);

  if (!z) {
    page.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui;">
        <div style="text-align:center;padding:40px;">
          <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
          <div style="font-size:22px;font-weight:800;margin-bottom:8px;">QR Code invalide</div>
          <div style="font-size:15px;color:#6b7280;">Ce code ne correspond à aucune zone enregistrée.</div>
        </div>
      </div>`;
    return;
  }

  const existing = _mockPassages.find(p => p.zone_id === z.id && p.status === 'en_cours');
  const scanType = existing ? 'depart' : 'arrivee';
  const label    = scanType === 'arrivee' ? 'Enregistrer mon arrivée' : 'Enregistrer mon départ';
  const color    = scanType === 'arrivee' ? '#22C55E' : '#EF4444';

  page.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f9fafb;font-family:-apple-system,sans-serif;padding:24px;">
      <div style="background:white;border-radius:24px;padding:36px 28px;max-width:380px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.1);text-align:center;">
        
        <div style="width:64px;height:64px;border-radius:18px;background:${color}20;border:2px solid ${color}30;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
          ${_regIcoSvg(z.icone, 28).replace('currentColor',color)}
        </div>

        <div style="font-size:13px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">CoproSync · Pointage</div>
        <div style="font-size:22px;font-weight:900;color:#111827;margin-bottom:4px;">${z.nom}</div>
        <div style="font-size:14px;color:#6b7280;margin-bottom:28px;">${scanType === 'arrivee' ? 'Aucun passage en cours sur cette zone.' : `Passage en cours — arrivée à ${_regFmt(existing?.arrivee)}`}</div>

        <div style="margin-bottom:20px;">
          <label style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;display:block;margin-bottom:8px;">Votre nom</label>
          <input id="scan-nom" style="width:100%;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:10px;padding:12px 16px;font-size:16px;font-weight:600;color:#111;outline:none;box-sizing:border-box;" placeholder="Prénom NOM">
        </div>

        <button onclick="_handleScan('${z.id}', '${scanType}')" style="width:100%;padding:16px;background:${color};color:white;border:none;border-radius:14px;font-size:17px;font-weight:900;cursor:pointer;box-shadow:0 8px 24px ${color}44;transition:all .18s;">
          ${label}
        </button>

        <div style="margin-top:16px;font-size:11px;color:#d1d5db;">Aucun compte requis · Données sécurisées</div>
      </div>
    </div>
  `;
}

function _handleScan(zoneId, type) {
  const nom = document.getElementById('scan-nom')?.value?.trim();
  if (!nom) { alert('Veuillez entrer votre nom.'); return; }

  const page = typeof $ === 'function' ? $('page') : document.getElementById('page');
  if (type === 'arrivee') {
    _mockPassages.unshift({ id:'pa'+Date.now(), presta_id:'p1', mission_id:'m1', zone_id:zoneId, arrivee:new Date().toISOString(), depart:null, status:'en_cours', valide_par:null, note:'' });
  } else {
    const idx = _mockPassages.findIndex(p => p.zone_id === zoneId && p.status === 'en_cours');
    if (idx !== -1) { _mockPassages[idx].depart = new Date().toISOString(); _mockPassages[idx].status = 'termine'; }
  }

  if (page) {
    const color = type === 'arrivee' ? '#22C55E' : '#3B82F6';
    page.innerHTML = `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f9fafb;font-family:-apple-system,sans-serif;padding:24px;">
        <div style="text-align:center;max-width:320px;">
          <div style="width:80px;height:80px;border-radius:50%;background:${color};margin:0 auto 24px;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 32px ${color}44;">
            ${_regIcoSvg('check',36).replace('currentColor','white')}
          </div>
          <div style="font-size:26px;font-weight:900;color:#111827;margin-bottom:8px;">${type==='arrivee'?'Arrivée enregistrée !':'Départ enregistré !'}</div>
          <div style="font-size:16px;color:#6b7280;margin-bottom:4px;">${nom}</div>
          <div style="font-size:13px;color:#9ca3af;">${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} · ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
        </div>
      </div>`;
  }
}
