// ════════════════════════════════════════════════════════════════
//  DASHBOARD v5 — Modulaire, Draggable & Personnalisable
//  assets/js/features/dashboard/dashboard.js
// ════════════════════════════════════════════════════════════════

let _dashFocusMode = 'tout';
let _dashFocusZone = null;

/* ═══════════════════════════════════════════════════════════════
   CONFIGURATION DES WIDGETS
═══════════════════════════════════════════════════════════════ */
const DASH_WIDGETS = [
  { id: 'situation',  label: 'Situation Room',      ico: '🚨', managerOnly: true,  defaultVisible: true,  defaultSize: 'normal' },
  { id: 'chart',      label: 'Activité 6 mois',     ico: '📊', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'zones',      label: 'Par bâtiment',        ico: '🏢', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'contrats',   label: 'Contrats & Budgets',  ico: '📄', managerOnly: true,  defaultVisible: true,  defaultSize: 'normal' },
  { id: 'events',     label: 'Agenda & Événements', ico: '📅', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'annonces',   label: 'Panneau / Annonces',  ico: '📢', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'votes',      label: 'Votes en cours',      ico: '🗳️', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'documents',  label: 'Documents récents',   ico: '📁', managerOnly: false, defaultVisible: true,  defaultSize: 'compact' },
  { id: 'install',    label: "Installer l'app",     ico: '📱', managerOnly: false, defaultVisible: false, defaultSize: 'compact' },
];

const DASH_LS_KEY = 'coprosync_dash_prefs_v2'; // Passé en v2 pour reset les vieux caches

/* ─── Persistance localStorage ────────────────────────────── */
function _dashLoadPrefs() {
  try {
    const raw = localStorage.getItem(DASH_LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(e) { return {}; }
}

function _dashSavePrefs(prefs) {
  try { localStorage.setItem(DASH_LS_KEY, JSON.stringify(prefs)); } catch(e) {}
}

function _dashGetWidgetPref(id, key) {
  const prefs = _dashLoadPrefs();
  const w = DASH_WIDGETS.find(x => x.id === id);
  if (!w) return null;
  if (prefs[id] && key in prefs[id]) return prefs[id][key];
  if (key === 'visible') return w.defaultVisible;
  if (key === 'size')    return w.defaultSize;
  return null;
}

function _dashGetOrder() {
  const prefs = _dashLoadPrefs();
  const saved = prefs._order;
  const ids   = DASH_WIDGETS.map(w => w.id);
  if (!saved) return ids;
  const merged = saved.filter(id => ids.includes(id));
  ids.forEach(id => { if (!merged.includes(id)) merged.push(id); });
  return merged;
}

function _dashSetWidgetPref(id, key, val) {
  const prefs = _dashLoadPrefs();
  if (!prefs[id]) prefs[id] = {};
  prefs[id][key] = val;
  _dashSavePrefs(prefs);
}

function _dashSetOrder(order) {
  const prefs = _dashLoadPrefs();
  prefs._order = order;
  _dashSavePrefs(prefs);
}

/* ─── CSS ─────────────────────────────────────────────────── */
(function injectDashV5CSS() {
  if (document.getElementById('dash-v5-css')) return;
  const s = document.createElement('style');
  s.id = 'dash-v5-css';
  s.textContent = `
    /* ── Situation Room ── */
    .sr-wrap { border-radius:16px; overflow:hidden; border:1px solid var(--border); box-shadow:0 4px 12px rgba(0,0,0,0.03); margin-bottom:8px; }
    .sr-bar { display:flex; align-items:center; gap:12px; padding:16px 20px; font-size:14px; font-weight:700; letter-spacing:0.02em; }
    .sr-bar.sr-ok   { background:linear-gradient(135deg, #059669, #10b981); color:#fff; }
    .sr-bar.sr-warn { background:linear-gradient(135deg, #d97706, #f59e0b); color:#fff; }
    .sr-bar.sr-crit { background:linear-gradient(135deg, #dc2626, #ef4444); color:#fff; }
    .sr-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; background:#fff; box-shadow:0 0 0 4px rgba(255,255,255,0.2); }
    .sr-dot.blink { animation:srBlink 1.5s ease-in-out infinite; }
    @keyframes srBlink { 0%,100%{box-shadow:0 0 0 4px rgba(255,255,255,0.2);} 50%{box-shadow:0 0 0 10px rgba(255,255,255,0);} }
    .sr-phrase { flex:1; opacity:0.95; }
    .sr-time { font-size:12px; font-weight:600; opacity:0.7; font-variant-numeric:tabular-nums; }
    .sr-body { background:var(--surface); padding:12px 16px 16px; display:flex; flex-direction:column; gap:8px; }
    .sr-empty { padding:24px 20px; background:var(--surface); font-size:14px; font-weight:600; color:var(--text-2); text-align:center; }
    .sr-lbl { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-3); margin-bottom:4px; padding-left:4px; }
    
    .ac { display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:12px; cursor:pointer; border:1px solid transparent; transition:all 0.2s; }
    .ac:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,0.06); }
    .ac.ac-r { background:var(--red-light);  border-color:var(--red-border); }
    .ac.ac-o { background:var(--orange-light); border-color:var(--orange-border); }
    .ac.ac-b { background:var(--primary-light); border-color:var(--primary-border); }
    
    .ac-ico  { font-size:20px; flex-shrink:0; }
    .ac-body { flex:1; min-width:0; }
    .ac-title { font-size:14px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
    .ac.ac-r .ac-title { color:var(--red); }
    .ac.ac-o .ac-title { color:var(--orange); }
    .ac.ac-b .ac-title { color:var(--primary); }
    .ac-sub  { font-size:12px; color:var(--text-2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    
    .ac-cta  { font-size:12px; font-weight:700; padding:6px 14px; border-radius:8px; border:none; cursor:pointer; flex-shrink:0; transition:opacity 0.2s; }
    .ac-cta:hover { opacity:0.8; }
    .ac.ac-r .ac-cta { background:var(--red);   color:#fff; box-shadow:0 2px 8px rgba(239,68,68,0.3); }
    .ac.ac-o .ac-cta { background:var(--orange); color:#fff; box-shadow:0 2px 8px rgba(245,158,11,0.3); }
    .ac.ac-b .ac-cta { background:var(--primary); color:#fff; box-shadow:0 2px 8px rgba(59,130,246,0.3); }

    /* ── Contrats widget ── */
    .dcc-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding:16px; border-bottom:1px solid var(--border); }
    .dcc-kpi { text-align:center; padding:12px 8px; border-radius:12px; background:var(--surface-2); border:1px solid transparent; }
    .dcc-kpi-val { font-size:22px; font-weight:800; line-height:1; margin-bottom:4px; font-family:var(--font-head); }
    .dcc-kpi-label { font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-3); font-weight:700; }
    .dcc-kpi.ck-r { background:var(--red-light); border-color:var(--red-border); } .dcc-kpi.ck-r .dcc-kpi-val { color:var(--red); }
    .dcc-kpi.ck-o { background:var(--orange-light); border-color:var(--orange-border); } .dcc-kpi.ck-o .dcc-kpi-val { color:var(--orange); }
    .dcc-kpi.ck-g { background:var(--green-light); border-color:var(--green-border); }  .dcc-kpi.ck-g .dcc-kpi-val { color:var(--green); }
    
    .dcc-row { display:flex; align-items:center; gap:12px; padding:12px 16px; cursor:pointer; transition:background 0.2s; border-bottom:1px solid var(--bg-2); }
    .dcc-row:last-child { border-bottom:none; }
    .dcc-row:hover { background:var(--surface-2); }
    .dcc-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .dcc-name { font-size:14px; font-weight:700; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-1); margin-bottom:2px; }
    .dcc-type { font-size:12px; color:var(--text-3); }
    .dcc-days { font-size:13px; font-weight:800; flex-shrink:0; }
    
    .dcc-budget { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:var(--bg-1); border-top:1px solid var(--border); }
    .dcc-budget-lbl { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-3); }
    .dcc-budget-val { font-size:16px; font-weight:800; color:var(--text-1); font-family:var(--font-head); }
    .dcc-empty { padding:24px 16px; text-align:center; font-size:14px; color:var(--text-3); font-weight:500; }

    /* ── Layout dashboard ── */
    .dash5 { padding:16px 0 32px; max-width: 1400px; margin: 0 auto; }
    .dash5-hero { padding:24px; border:1px solid var(--border); border-radius:24px; background:var(--surface); margin-bottom:24px; box-shadow:0 4px 24px rgba(0,0,0,0.02); position:relative; overflow:hidden; }
    .dash5-hero::before { content:''; position:absolute; top:0; right:0; bottom:0; width:50%; background:radial-gradient(ellipse at top right, var(--primary-light), transparent 70%); opacity:0.5; pointer-events:none; }
    
    .dash5-kpis { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:16px; margin-bottom:24px; }
    .dash5-focusbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:24px; background:var(--surface); padding:8px; border-radius:16px; border:1px solid var(--border); }
    
    .dash5-chip { appearance:none; border:1px solid transparent; background:transparent; color:var(--text-2); border-radius:12px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s; user-select:none; }
    .dash5-chip:hover { background:var(--bg-2); color:var(--text-1); }
    .dash5-chip.sel { background:var(--text-1); color:var(--surface); box-shadow:0 4px 12px rgba(0,0,0,0.1); }
    
    .dash5-layout { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1.2fr); gap:20px; align-items:start; }
    @media(max-width:1024px){ .dash5-layout { grid-template-columns:1fr; } }
    
    .dash5-col-left { display:flex; flex-direction:column; gap:20px; }
    .dash5-col-right { display:flex; flex-direction:column; gap:20px; }

    /* ── Widget shell ── */
    .d5w {
      background:var(--surface); border:1px solid var(--border);
      border-radius:20px; overflow:hidden;
      box-shadow:0 2px 8px rgba(0,0,0,0.02);
      transition:box-shadow 0.2s, border-color 0.2s, transform 0.2s;
    }
    .d5w.dragging { opacity:0.6; transform:scale(0.98); box-shadow:0 12px 40px rgba(59,130,246,0.2); border-color:var(--primary); z-index:100; }
    .d5w.drag-over { border-color:var(--primary); box-shadow:0 0 0 4px var(--primary-light); }
    .d5w[data-size="compact"] .d5w-extra { display:none; }
    .d5w[data-size="large"]   .d5w-chart canvas { height:220px !important; }
    
    .d5w-head { display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid var(--border); background:var(--bg-1); }
    .d5w-title { font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-1); flex:1; display:flex; align-items:center; gap:8px; }
    .d5w-link { font-size:12px; font-weight:700; color:var(--primary); background:var(--primary-light); border:none; border-radius:12px; padding:4px 10px; cursor:pointer; transition:opacity 0.2s; }
    .d5w-link:hover { opacity:0.8; }
    
    .d5w-tools { display:flex; align-items:center; gap:6px; opacity:0; transition:opacity 0.2s; }
    .d5w:hover .d5w-tools, .dash5.editing .d5w-tools { opacity:1; }
    .d5w-btn { width:28px; height:28px; border:1px solid var(--border); border-radius:8px; background:var(--surface); color:var(--text-2); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:11px; transition:all 0.15s; font-weight:700; }
    .d5w-btn:hover { border-color:var(--text-3); color:var(--text-1); background:var(--bg-2); }
    .d5w-handle { cursor:grab; font-size:14px; }
    .d5w-handle:active { cursor:grabbing; }
    
    .d5w-body { padding:16px 20px; }
    .d5w-body.no-pad { padding:0; }

    /* Mode édition — animation de flottement "Wiggle" iOS */
    .dash5.editing .d5w { animation:wiggle 3s ease-in-out infinite; cursor:grab; border-color:var(--border-strong); }
    .dash5.editing .d5w:nth-child(even) { animation-direction: reverse; }
    @keyframes wiggle { 0%,100%{transform:rotate(0deg);} 25%{transform:rotate(-0.5deg);} 75%{transform:rotate(0.5deg);} }
    .dash5.editing .d5w.dragging { animation:none; }
    .dash5.editing .d5w-body { pointer-events:none; opacity:0.7; }

    /* ── Panneau personnaliser ── */
    .d5-customize {
      display:none; position:fixed;
      top:80px; right:24px;
      width:min(400px, calc(100vw - 48px));
      max-height:calc(100dvh - 100px); overflow-y:auto;
      background:var(--surface); border:1px solid var(--border);
      border-radius:24px; box-shadow:0 24px 80px rgba(0,0,0,0.15);
      z-index:200; padding:24px;
    }
    .d5-customize.open { display:block; animation:slide-in-right 0.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
    @keyframes slide-in-right { from{opacity:0; transform:translateX(40px);} to{opacity:1; transform:translateX(0);} }
    
    .d5-customize-title { font-family:var(--font-head); font-size:22px; font-weight:900; margin-bottom:6px; color:var(--text-1); }
    .d5-customize-sub { font-size:13px; color:var(--text-3); margin-bottom:20px; line-height:1.5; }
    
    .d5-witem {
      display:flex; align-items:center; gap:12px; padding:12px 16px;
      border:1px solid var(--border); border-radius:16px; margin-bottom:8px;
      background:var(--surface); transition:all 0.2s;
    }
    .d5-witem.hidden { opacity:0.5; background:var(--bg-2); }
    .d5-witem-ico { font-size:20px; width:32px; height:32px; background:var(--bg-2); border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .d5-witem-label { flex:1; font-size:14px; font-weight:700; color:var(--text-1); }
    
    .d5-witem-size {
      font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em;
      padding:4px 12px; border-radius:12px; border:1px solid var(--border);
      background:var(--surface); color:var(--text-2); cursor:pointer; transition:all 0.15s;
    }
    .d5-witem-size:hover { border-color:var(--primary); color:var(--primary); background:var(--primary-light); }
    
    .d5-witem-toggle {
      width:40px; height:24px; border-radius:12px; border:none; cursor:pointer;
      position:relative; transition:background 0.2s; flex-shrink:0;
      background:var(--border-strong);
    }
    .d5-witem-toggle.on { background:var(--green); }
    .d5-witem-toggle::after {
      content:''; position:absolute; top:3px; left:3px;
      width:18px; height:18px; border-radius:50%; background:#fff;
      transition:transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow:0 2px 4px rgba(0,0,0,0.2);
    }
    .d5-witem-toggle.on::after { transform:translateX(16px); }

    /* ── Barre d'édition ── */
    .d5-editbar {
      display:none; align-items:center; justify-content:space-between; padding:12px 20px;
      background:var(--primary-light); border:1px solid var(--primary-border);
      border-radius:16px; margin-bottom:24px; box-shadow:0 4px 12px rgba(59,130,246,0.1);
    }
    .d5-editbar.show { display:flex; animation:pageIn 0.2s ease both; }
    .d5-editbar-label { font-size:14px; font-weight:800; color:var(--primary); }

    /* ── Tickets récents ── */
    .d5-ticket { display:flex; align-items:flex-start; gap:14px; padding:14px 20px; cursor:pointer; transition:background 0.15s; border-bottom:1px solid var(--bg-2); position:relative; }
    .d5-ticket:last-child { border-bottom:none; }
    .d5-ticket:hover { background:var(--surface-2); }
    .d5-ticket-stripe { position:absolute; left:0; top:0; bottom:0; width:4px; }
    .d5-ticket-ico { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
    .d5-ticket-body { flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center; height:36px; }
    .d5-ticket-title { font-size:14px; font-weight:700; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px; line-height:1; }
    .d5-ticket-meta { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-3); font-weight:500; line-height:1; }

    /* ── Zones bâtiment ── */
    .d5-zone { display:flex; align-items:center; gap:12px; padding:10px 20px; cursor:pointer; transition:background 0.15s; border-bottom:1px solid var(--bg-2); }
    .d5-zone:last-child { border-bottom:none; }
    .d5-zone:hover { background:var(--surface-2); }
    .d5-zone-name { font-size:13px; font-weight:700; width:120px; flex-shrink:0; color:var(--text-1); }
    .d5-zone-track { flex:1; height:8px; background:var(--bg-2); border-radius:4px; overflow:hidden; }
    .d5-zone-fill { height:100%; border-radius:4px; transition:width 0.5s ease-out; }
    .d5-zone-num { font-size:14px; font-weight:800; width:24px; text-align:right; flex-shrink:0; font-family:var(--font-head); }

    /* ── List rows générique ── */
    .d5-row { display:flex; align-items:center; gap:14px; padding:14px 20px; cursor:pointer; transition:background 0.15s; border-bottom:1px solid var(--bg-2); }
    .d5-row:last-child { border-bottom:none; }
    .d5-row:hover { background:var(--surface-2); }
    .d5-row-ico { font-size:20px; width:40px; height:40px; background:var(--bg-1); border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .d5-row-body { flex:1; min-width:0; }
    .d5-row-title { font-size:14px; font-weight:700; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px; }
    .d5-row-sub { font-size:12px; color:var(--text-3); font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    
    .d5-pill { font-size:11px; font-weight:800; padding:4px 10px; border-radius:20px; white-space:nowrap; flex-shrink:0; text-transform:uppercase; letter-spacing:0.05em; }
    .d5-pill-o { background:var(--orange-light); color:var(--orange); border:1px solid var(--orange-border); }
    .d5-pill-g { background:var(--green-light); color:var(--green); border:1px solid var(--green-border); }
    .d5-pill-b { background:var(--primary-light); color:var(--primary); border:1px solid var(--primary-border); }
    .d5-empty { padding:32px 20px; text-align:center; font-size:14px; font-weight:500; color:var(--text-3); }
  `;
  document.head.appendChild(s);
})();

/* ═══════════════════════════════════════════════════════════════
   HELPERS INTERNES
═══════════════════════════════════════════════════════════════ */
function _e(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _eur(n) { return (n||0).toLocaleString('fr-FR',{minimumFractionDigits:0})+'\u00a0\u20ac'; }

/* ═══════════════════════════════════════════════════════════════
   SITUATION ROOM
═══════════════════════════════════════════════════════════════ */
function _buildSituationRoom(ouverts, critiques, syndic) {
  const actifs      = (typeof cache !== 'undefined' && cache.contrats) ? cache.contrats.filter(c => c.actif !== false) : [];
  const contratsExp = actifs.filter(c => typeof daysUntil === 'function' && daysUntil(c.date_echeance) < 0);
  const contratsAlt = actifs.filter(c => { const d=typeof daysUntil === 'function' ? daysUntil(c.date_echeance) : 999; return d>=0&&d<=(c.alerte_jours??90); });
  const votes       = (typeof _votesCache!=='undefined') ? _votesCache.filter(v=>v.statut==='ouvert') : [];
  const sansMaRep   = (typeof _reponsesCache!=='undefined') ? votes.filter(v=>!_reponsesCache[v.id]) : [];

  const isCrit = critiques.length>0 || contratsExp.length>0;
  const isWarn = !isCrit && (contratsAlt.length>0 || syndic.length>0);

  let barCls, phrase;
  if (isCrit) {
    barCls = 'sr-crit';
    const p=[];
    if(critiques.length)   p.push(critiques.length+' incident'+(critiques.length>1?'s critiques':' critique'));
    if(contratsExp.length) p.push(contratsExp.length+' contrat'+(contratsExp.length>1?'s expirés':' expiré'));
    phrase = 'Action Immédiate Requise \u2014 '+p.join(' \u00b7 ');
  } else if (isWarn) {
    barCls = 'sr-warn';
    const p=[];
    if(contratsAlt.length) p.push(contratsAlt.length+' contrat'+(contratsAlt.length>1?'s en alerte':' en alerte'));
    if(syndic.length)      p.push(syndic.length+' dossier'+(syndic.length>1?'s transmis':' transmis'));
    phrase = 'Vigilance \u2014 '+p.join(' \u00b7 ');
  } else {
    barCls = 'sr-ok';
    phrase = 'Résidence sous contrôle \u2014 Aucune anomalie détectée';
  }

  const cards=[];
  critiques.slice(0,2).forEach(tk=>cards.push({cls:'ac-r',ico:'🚨',title:_e(tk.titre),sub:_e((tk.batiment||'Général')+(tk.zone?' \u00b7 '+tk.zone:'')),btn:'Traiter',fn:"openDetail('"+tk.id+"')"}));
  contratsExp.slice(0,2).forEach(c=>cards.push({cls:'ac-r',ico:'📄',title:_e(c.fournisseur),sub:_e(c.type_contrat||'')+' \u00b7 expir\u00e9 depuis '+Math.abs(daysUntil(c.date_echeance))+'j',btn:'G\u00e9rer',fn:"nav('contrats')"}));
  contratsAlt.slice(0,2).forEach(c=>cards.push({cls:'ac-o',ico:'⚠️',title:_e(c.fournisseur),sub:_e(c.type_contrat||'')+' \u00b7 \u00e9ch\u00e9ance dans '+daysUntil(c.date_echeance)+'j',btn:'Voir',fn:"nav('contrats')"}));
  if(sansMaRep.length>0) cards.push({cls:'ac-b',ico:'🗳️',title:sansMaRep.length+' vote'+(sansMaRep.length>1?'s':'')+' en attente',sub:sansMaRep.slice(0,2).map(v=>_e(v.titre)).join(' \u00b7 '),btn:'Voter',fn:"nav('votes')"});

  const bodyHTML = cards.length===0
    ? '<div class="sr-empty"><span style="font-size:24px; display:block; margin-bottom:8px;">✅</span>Aucune action prioritaire requise pour le moment.</div>'
    : '<div class="sr-body"><div class="sr-lbl">À traiter en priorité</div>'
      +cards.map(a=>'<div class="ac '+a.cls+'" onclick="'+a.fn+'">'
        +'<div class="ac-ico">'+a.ico+'</div>'
        +'<div class="ac-body"><div class="ac-title">'+a.title+'</div><div class="ac-sub">'+a.sub+'</div></div>'
        +'<button class="ac-cta" onclick="event.stopPropagation();'+a.fn+'">'+a.btn+'</button>'
        +'</div>').join('')
      +'</div>';

  return '<div class="sr-wrap">'
    +'<div class="sr-bar '+barCls+'">'
    +'<div class="sr-dot'+(barCls!=='sr-ok'?' blink':'')+'"></div>'
    +'<span class="sr-phrase">'+phrase+'</span>'
    +'<span class="sr-time">'+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})+'</span>'
    +'</div>'+bodyHTML+'</div>';
}

/* ═══════════════════════════════════════════════════════════════
   CONTENU DES WIDGETS
═══════════════════════════════════════════════════════════════ */
function _widgetChart() {
  return '<div class="d5w-chart" style="padding:16px 20px;"><div style="position:relative;">'
    +'<canvas id="dash-chart" height="140"></canvas>'
    +'<div id="dash-chart-tip" style="display:none; position:absolute; background:var(--text-1); color:var(--surface); padding:8px 12px; border-radius:8px; font-size:12px; font-weight:600; pointer-events:none; z-index:10; box-shadow:0 4px 12px rgba(0,0,0,0.2); transform:translate(-50%, -100%); margin-top:-10px;"></div>'
    +'</div></div>';
}

function _widgetZones(ouverts) {
  const zones=(typeof COPRO !== 'undefined' && COPRO.tours) ? COPRO.tours.concat(['Parking visiteurs','Parking privé','Garages','Aire de jeux','Portails / portillons','Extérieur général']) : [];
  if (zones.length === 0) return '<div class="d5-empty">Zones non configurées</div>';
  
  const max=Math.max(1,...zones.map(z=>ouverts.filter(t=>t.batiment===z).length));
  
  const rows=zones.map(zone=>{
    const cnt=ouverts.filter(t=>t.batiment===zone).length;
    if(!cnt) return '';
    const pct=Math.round((cnt/max)*100);
    const color=cnt>=3?'var(--red)':cnt>=2?'var(--orange)':'var(--primary)';
    return '<div class="d5-zone" onclick="setDashZoneFocus('+JSON.stringify(zone)+')" title="Filtrer : '+_e(zone)+'">'
      +'<div class="d5-zone-name">'+_e(zone.startsWith('Tour')?zone:zone.split(' ')[0])+'</div>'
      +'<div class="d5-zone-track"><div class="d5-zone-fill" style="width:'+pct+'%;background:'+color+';"></div></div>'
      +'<div class="d5-zone-num" style="color:'+color+';">'+cnt+'</div>'
      +'</div>';
  }).join('');
  
  return '<div id="dash-zone-list">'+( rows||'<div class="d5-empty"><span style="font-size:24px; display:block; margin-bottom:8px;">🎉</span>Aucun incident ouvert dans les zones communes.</div>')+'</div>';
}

function _widgetContrats() {
  const actifs   = (typeof cache !== 'undefined' && cache.contrats) ? cache.contrats.filter(c=>c.actif!==false) : [];
  const expires  = actifs.filter(c=> typeof daysUntil === 'function' && daysUntil(c.date_echeance)<0);
  const alertes  = actifs.filter(c=> { const d = typeof daysUntil === 'function' ? daysUntil(c.date_echeance) : 999; return d>=0&&d<=(c.alerte_jours??90); });
  const conformes= actifs.filter(c=> typeof daysUntil === 'function' && daysUntil(c.date_echeance)>(c.alerte_jours??90));
  const budget   = actifs.reduce((s,c)=>s+(c.montant_annuel||0),0);
  const urgents  = [...expires,...alertes].sort((a,b)=>new Date(a.date_echeance)-new Date(b.date_echeance)).slice(0,4);

  return '<div class="dcc-kpis">'
    +'<div class="dcc-kpi '+(expires.length?'ck-r':'')+'"><div class="dcc-kpi-val">'+expires.length+'</div><div class="dcc-kpi-label">Expir\u00e9s</div></div>'
    +'<div class="dcc-kpi '+(alertes.length?'ck-o':'')+'"><div class="dcc-kpi-val">'+alertes.length+'</div><div class="dcc-kpi-label">En alerte</div></div>'
    +'<div class="dcc-kpi ck-g"><div class="dcc-kpi-val">'+conformes.length+'</div><div class="dcc-kpi-label">Conformes</div></div>'
    +'</div>'
    +(urgents.length===0?'<div class="dcc-empty">✅ Tous les contrats sont à jour</div>':urgents.map(c=>{
        const d = typeof daysUntil === 'function' ? daysUntil(c.date_echeance) : 0;
        const color=d<0||d<=30?'var(--red)':'var(--amber)';
        const lbl=d<0?'Expir\u00e9 ('+(-d)+'j)':d+'j';
        return '<div class="dcc-row" onclick="nav(\'contrats\')">'
          +'<div class="dcc-dot" style="background:'+color+';"></div>'
          +'<div style="flex:1;min-width:0;"><div class="dcc-name">'+_e(c.fournisseur)+'</div>'
          +'<div class="dcc-type">'+_e(c.type_contrat||'')+(c.contact_nom?' \u00b7 '+_e(c.contact_nom):'')+'</div></div>'
          +'<div class="dcc-days" style="color:'+color+';">'+lbl+'</div>'
          +'</div>';
      }).join(''))
    +'<div class="dcc-budget"><span class="dcc-budget-lbl">Budget annuel estimé</span><span class="dcc-budget-val">'+_eur(budget)+'</span></div>';
}

function _widgetTicketsList(list) {
  if(!list.length) return `<div class="d5-empty" style="padding:40px 20px;"><div style="font-size:32px;margin-bottom:12px; opacity:0.5;">✅</div><div style="font-weight:700; color:var(--text-1); margin-bottom:4px;">Aucun signalement en cours</div><div style="margin-bottom:16px;">La résidence tourne à merveille.</div><button class="btn btn-primary btn-sm" style="margin:0 auto;" onclick="openNewTicket()">Signaler un problème</button></div>`;
  
  return list.slice(0,8).map(tk=>{
    const isC=tk.urgence==='critique', isI=tk.urgence==='important';
    const stripe=isC?'var(--red)':isI?'var(--orange)':'var(--primary)';
    const bgIco=isC?'var(--red-light)':isI?'var(--orange-light)':'var(--primary-light)';
    const ico=isC?'🚨':isI?'⚠️':'🔧';
    const formatD = typeof depuisJours === 'function' ? depuisJours(tk.created_at) : '';
    const badgeHTML = typeof badgeStatut === 'function' ? badgeStatut(tk.statut) : `<span style="font-size:10px; font-weight:bold; color:var(--text-2); text-transform:uppercase;">${tk.statut}</span>`;
    
    return `<div class="d5-ticket" onclick="if(typeof openDetail==='function') openDetail('${tk.id}')">
      <div class="d5-ticket-stripe" style="background:${stripe};"></div>
      <div class="d5-ticket-ico" style="background:${bgIco};">${ico}</div>
      <div class="d5-ticket-body">
        <div class="d5-ticket-title">${_e(tk.titre)}</div>
        <div class="d5-ticket-meta">
          ${badgeHTML}
          <span style="color:var(--border-strong); font-weight:bold;">·</span>
          <span class="d5-ticket-loc">${_e(tk.batiment||'Général')}${tk.zone?' \u2014 '+_e(tk.zone):''}</span>
          <span style="color:var(--border-strong); font-weight:bold;">·</span>
          <span class="d5-ticket-age">${formatD}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════
   WIDGET SHELL — construit un widget avec ses contrôles
═══════════════════════════════════════════════════════════════ */
function _makeWidget(id, title, link, linkFn, bodyHTML, size) {
  const sizeLabel = {compact:'Petit', normal:'Moyen', large:'Grand'}[size]||'Moyen';
  
  const iconMap = {
    situation: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    chart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    zones: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-1)" stroke-width="2.5"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    contrats: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    events: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    annonces: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    votes: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    documents: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" stroke-width="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    install: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-1)" stroke-width="2.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'
  };

  return `<div class="d5w" data-widget="${id}" data-size="${size}" draggable="true" ondragstart="dashDragStart(event)" ondragover="dashDragOver(event)" ondrop="dashDrop(event)" ondragend="dashDragEnd(event)">
    <div class="d5w-head">
      ${iconMap[id] || ''}
      <span class="d5w-title">${title}</span>
      ${link ? `<button class="d5w-link" onclick="${linkFn}">${link}</button>` : ''}
      <div class="d5w-tools">
        <button class="d5w-btn" onclick="dashCycleSize('${id}')" title="Changer la taille">${sizeLabel}</button>
        <div class="d5w-btn d5w-handle" title="Déplacer (Maintenir enfoncé)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg></div>
      </div>
    </div>
    <div class="d5w-body no-pad">${bodyHTML}</div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   RENDER DASHBOARD
═══════════════════════════════════════════════════════════════ */
async function renderDashboard() {
  const el = $('page');
  if (!el) return;
  
  if (typeof cache === 'undefined' || !cache.tickets) {
    el.innerHTML = '<div style="padding:40px; text-align:center;"><div class="spinner"></div></div>';
    return;
  }

  const t         = cache.tickets || [];
  const ouverts   = t.filter(x => x.statut !== 'résolu' && x.statut !== 'clos');
  const critiques = t.filter(x => x.urgence === 'critique' && x.statut !== 'résolu' && x.statut !== 'clos');
  const syndic    = t.filter(x => x.statut === 'transmis_syndic');
  
  const isManagerUser = typeof isManager === 'function' ? isManager() : false;

  _dashFocusMode = 'tout';
  _dashFocusZone = null;

  const safePrenom = profile?.prenom || 'Résident';
  const order  = _dashGetOrder();

  // ── Hero Section (Premium) ──
  const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const todayStr = new Date().toLocaleDateString('fr-FR', dateOptions);
  
  const heroHTML = `
    <div class="dash5-hero" style="animation:pageIn .25s both;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:2;">
        <div>
          <div style="font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.1em; color:var(--primary); margin-bottom:8px;">${todayStr}</div>
          <h1 style="font-family:var(--font-head); font-size:clamp(28px, 4vw, 36px); font-weight:900; color:var(--text-1); letter-spacing:-1px; margin:0 0 12px 0;">Bonjour, ${escHtml(safePrenom)} 👋</h1>
          
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            ${critiques.length > 0
              ? `<span style="background:var(--red-light); color:var(--red); font-size:12px; font-weight:800; padding:6px 12px; border-radius:20px; border:1px solid var(--red-border); display:flex; align-items:center; gap:6px;"><span style="width:8px; height:8px; border-radius:50%; background:var(--red); animation:pulse 2s infinite;"></span> ${critiques.length} Critique(s)</span>`
              : `<span style="background:var(--green-light); color:var(--green); font-size:12px; font-weight:800; padding:6px 12px; border-radius:20px; border:1px solid var(--green-border); display:flex; align-items:center; gap:6px;">✓ Résidence sous contrôle</span>`
            }
            ${ouverts.length > 0 ? `<span style="font-size:13px; font-weight:600; color:var(--text-2);">${ouverts.length} incident(s) en cours</span>` : ''}
          </div>
        </div>
        
        <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:flex-end;">
          <button class="btn btn-secondary" onclick="if(typeof dashToggleCustomize === 'function') dashToggleCustomize()" title="Personnaliser">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6 1 1 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span class="desktop-only">Modifier</span>
          </button>
          <button class="btn btn-primary" onclick="if(typeof openNewTicket === 'function') openNewTicket()" style="box-shadow:0 4px 12px rgba(59,130,246,0.3);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 
            Nouveau Signalement
          </button>
        </div>
      </div>
    </div>`;

  // ── Focusbar ──
  const chips=[
    {key:'tout',     lbl:'Tout voir',   cls:''},
    {key:'ouvert',   lbl:'Ouverts', cls:'sel'},
    {key:'critique', lbl:'Critiques',cls:'danger'},
    isManagerUser ? {key:'transmis',lbl:'Transmis',cls:'info'} : {key:'mine',lbl:'Mes tickets',cls:'info'},
    {key:'resolu',   lbl:'Résolus', cls:'success'},
  ];
  
  const focusHTML = `
    <div class="dash5-focusbar" id="dash-focusbar" style="animation:pageIn .28s .08s both;">
      <span style="font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-3); margin-right:8px; display:none;">Filtres :</span>
      ${chips.map(c=>`<button class="dash5-chip ${c.key===_dashFocusMode ? 'sel' : ''}" data-dash-focus="${c.key}" onclick="setDashFocus('${c.key}')">${c.lbl}</button>`).join('')}
      <button class="dash5-chip dash2-chip-zone" id="dash-chip-zone" style="display:none;" onclick="clearDashFocus()"></button>
    </div>`;

  // ── Barre édition ──
  const editbarHTML = `
    <div class="d5-editbar" id="d5-editbar">
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:24px;">🎨</span>
        <span class="d5-editbar-label">Mode Personnalisation Actif <br><span style="color:var(--text-2); font-weight:500; font-size:12px;">Faites glisser les cartes pour réorganiser votre tableau de bord.</span></span>
      </div>
      <button class="btn btn-primary btn-sm" onclick="dashToggleEdit()">Enregistrer</button>
    </div>`;

  // ── Colonne gauche (tickets récents) — toujours fixe ──
  const recentHTML = `
    <div class="d5w" style="animation:pageIn .3s .22s both;" id="dash-recent-card">
      <div class="d5w-head">
        <span class="d5w-title" style="display:flex; align-items:center; gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Incidents Récents</span>
        <button class="d5w-link" onclick="if(typeof nav==='function') nav('tickets')">Voir le registre</button>
      </div>
      <div class="d5w-body no-pad" id="dash-recent-list">
        ${_widgetTicketsList(t.slice(0,8))}
      </div>
    </div>`;

  // ── Colonne droite — widgets paramétrables ──
  let rightHTML = '';
  order.forEach((wid, i) => {
    const cfg = DASH_WIDGETS.find(w=>w.id===wid);
    if(!cfg) return;
    if(cfg.managerOnly && !isManagerUser) return;
    const visible = _dashGetWidgetPref(wid, 'visible');
    if(!visible) return;
    const size = _dashGetWidgetPref(wid, 'size');
    const delay = 0.25 + i * 0.04;

    let body='', link='', linkFn='', title='';
    switch(wid) {
      case 'situation':
        rightHTML += `<div data-widget="situation" data-size="${size}" style="animation:pageIn .3s ${delay}s both;">${_buildSituationRoom(ouverts,critiques,syndic)}</div>`;
        return;
      case 'chart':
        title='Activité (6 mois)'; body=_widgetChart(); break;
      case 'zones':
        title='Cartographie des incidents'; body=_widgetZones(ouverts); break;
      case 'contrats':
        title='Suivi Prestataires'; link='Gérer les contrats'; linkFn="nav('contrats')"; body=_widgetContrats(); break;
      case 'events':
        title='Agenda Copropriété'; link='Ouvrir'; linkFn="nav('agenda')";
        body='<div class="d5-empty" id="dash-events-list"><div class="spinner" style="margin:0 auto;"></div></div>'; break;
      case 'annonces':
        title='Panneau d\'affichage'; link='Voir'; linkFn="nav('annonces')";
        body='<div class="d5-empty" id="dash-annonces-list"><div class="spinner" style="margin:0 auto;"></div></div>'; break;
      case 'votes':
        title='Décisions & Consultations'; link='Participer'; linkFn="nav('votes')"; body=_widgetVotes(); break;
      case 'documents':
        title='Derniers fichiers'; link='Archives'; linkFn="nav('documents')"; body=_widgetDocuments(); break;
      case 'install':
        title='Installer l\'App PWA';
        body=`<div class="d5w-body" style="text-align:center; padding:24px 20px;">
                <div style="font-size:36px; margin-bottom:12px;">📱</div>
                <div style="font-size:14px; font-weight:700; color:var(--text-1); margin-bottom:6px;">L'application est disponible</div>
                <div style="font-size:13px; color:var(--text-3); line-height:1.5;"><b>iOS (Safari)</b> : Icône Partager ➔ Sur l'écran d'accueil<br><b>Android (Chrome)</b> : Menu ⋮ ➔ Installer l'application</div>
              </div>`;
        break;
      default: return;
    }
    
    rightHTML += `<div style="animation:pageIn .3s ${delay}s both;">${_makeWidget(wid, title, link, linkFn, body, size)}</div>`;
  });

  // ── Panneau Personnaliser ──
  const customizeHTML = `
    <div class="d5-customize" id="d5-customize">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
        <div class="d5-customize-title">Personnaliser</div>
        <button class="btn btn-ghost btn-sm" style="font-size:20px; padding:4px;" onclick="dashToggleCustomize()">×</button>
      </div>
      <div class="d5-customize-sub">Activez ou masquez les cartes. Le mode édition vous permet de les réorganiser par glisser-déposer.</div>
      
      <button class="btn btn-primary" style="width:100%; justify-content:center; margin-bottom:20px; box-shadow:0 4px 12px rgba(59,130,246,0.3);" onclick="dashToggleEdit(); dashToggleCustomize();">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg> 
        Activer le glisser-déposer
      </button>
      
      <div class="d5-widget-list">
        ${DASH_WIDGETS.filter(w => !w.managerOnly || isManagerUser).map(w => {
          const vis  = _dashGetWidgetPref(w.id,'visible');
          const size = _dashGetWidgetPref(w.id,'size');
          const szMap = { compact:'S', normal:'M', large:'L' };
          return `
          <div class="d5-witem ${vis ? '' : 'hidden'}" id="d5-witem-${w.id}">
            <div class="d5-witem-ico">${w.ico}</div>
            <div class="d5-witem-label">${w.label}</div>
            <button class="d5-witem-size" onclick="dashCycleSize('${w.id}')" id="d5-size-${w.id}" title="Changer la taille">${szMap[size]}</button>
            <button class="d5-witem-toggle ${vis ? 'on' : ''}" id="d5-toggle-${w.id}" onclick="dashToggleWidget('${w.id}')"></button>
          </div>`;
        }).join('')}
      </div>
      <div style="margin-top:24px; padding-top:16px; border-top:1px solid var(--border); text-align:center;">
        <button class="btn btn-ghost btn-sm" style="color:var(--text-3);" onclick="dashResetPrefs()">↺ Rétablir l'affichage par défaut</button>
      </div>
    </div>`;

  el.innerHTML = `
    <div class="dash2 dash5" id="dash-content">
      ${heroHTML}
      ${focusHTML}
      ${editbarHTML}
      <div class="dash5-layout">
        <div class="dash5-col-left">${recentHTML}</div>
        <div class="dash5-col-right" id="dash-widgets-col">${rightHTML}</div>
      </div>
      ${customizeHTML}
    </div>`;

  loadDashboardWidgets();
  _refreshEditMode();
}

/* ── Widgets votes et documents ── */
function _widgetVotes() {
  const votes = (typeof _votesCache !== 'undefined') ? _votesCache.filter(v => v.statut === 'ouvert') : [];
  if(!votes.length) return `<div class="d5-empty" style="padding:24px 20px;"><div style="font-size:24px; margin-bottom:8px;">✅</div>Aucune consultation en cours.</div>`;
  
  return votes.slice(0,3).map(v => {
    const maRep = (typeof _reponsesCache !== 'undefined') ? _reponsesCache[v.id] : null;
    const total = (typeof _allReponsesCache !== 'undefined' && _allReponsesCache[v.id]) ? _allReponsesCache[v.id].length : 0;
    
    return `<div class="d5-row" onclick="if(typeof nav==='function') nav('votes')">
      <div class="d5-row-ico" style="background:var(--purple-light); color:var(--purple);">${(typeof VOTE_TYPES !== 'undefined' && VOTE_TYPES[v.type]) ? VOTE_TYPES[v.type].ico : '🗳️'}</div>
      <div class="d5-row-body">
        <div class="d5-row-title">${escHtml(v.titre)}</div>
        <div class="d5-row-sub">${total} participant(s)</div>
      </div>
      ${maRep ? '<span class="d5-pill d5-pill-g">✓ Voté</span>' : '<span class="d5-pill d5-pill-o" style="animation:pulse 2s infinite;">À voter</span>'}
    </div>`;
  }).join('');
}

function _widgetDocuments() {
  const docs = (typeof _docsCache !== 'undefined') ? _docsCache : [];
  if(!docs.length) return '<div class="d5-empty">Aucun document récent</div>';
  
  return docs.slice(0,4).map(doc => {
    const cat = (typeof DOC_CATS !== 'undefined' && DOC_CATS[doc.categorie]) ? DOC_CATS[doc.categorie] : {ico:'📄'};
    const isNew = (typeof _docsVus !== 'undefined') ? !_docsVus.has(doc.id) : false;
    const dateStr = typeof fmtD === 'function' ? fmtD(doc.created_at) : new Date(doc.created_at).toLocaleDateString();
    
    return `<div class="d5-row" onclick="if(typeof nav==='function') nav('documents')">
      <div class="d5-row-ico" style="background:var(--surface-2); border:1px solid var(--border);">${cat.ico}</div>
      <div class="d5-row-body">
        <div class="d5-row-title">${escHtml(doc.titre)}</div>
        <div class="d5-row-sub">${dateStr}</div>
      </div>
      ${isNew ? '<span class="d5-pill d5-pill-b">Nouveau</span>' : ''}
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════
   CONTRÔLES WIDGETS — taille, visible/masqué, reset
═══════════════════════════════════════════════════════════════ */
window.dashCycleSize = function(id) {
  const sizes = ['compact', 'normal', 'large'];
  const cur = _dashGetWidgetPref(id, 'size');
  const next = sizes[(sizes.indexOf(cur)+1) % sizes.length];
  _dashSetWidgetPref(id, 'size', next);
  
  const btn = document.getElementById('d5-size-'+id);
  if(btn) btn.textContent = {compact:'S', normal:'M', large:'L'}[next];
  
  const w = document.querySelector('[data-widget="'+id+'"]');
  if(w) { 
    w.setAttribute('data-size', next); 
    const hd = w.querySelector('.d5w-tools .d5w-btn'); 
    if(hd) hd.textContent = {compact:'S', normal:'M', large:'L'}[next]; 
  }
  
  if(id === 'chart') setTimeout(renderDashChart, 100);
};

window.dashToggleWidget = function(id) {
  const cur = _dashGetWidgetPref(id, 'visible');
  const next = !cur;
  _dashSetWidgetPref(id, 'visible', next);
  
  const btn = document.getElementById('d5-toggle-'+id);
  if(btn) btn.classList.toggle('on', next);
  
  const item = document.getElementById('d5-witem-'+id);
  if(item) item.classList.toggle('hidden', !next);
  
  renderDashboard();
};

window.dashToggleCustomize = function() {
  const panel = document.getElementById('d5-customize');
  if(panel) panel.classList.toggle('open');
};

window.dashResetPrefs = function() {
  if(!confirm('Rétablir la disposition par défaut du tableau de bord ?')) return;
  try { localStorage.removeItem(DASH_LS_KEY); } catch(e) {}
  if (typeof toast === 'function') toast('Tableau de bord réinitialisé', 'ok');
  renderDashboard();
};

let _dashEditing = false;
window.dashToggleEdit = function() {
  _dashEditing = !_dashEditing;
  _refreshEditMode();
};

function _refreshEditMode() {
  const dash = document.getElementById('dash-content');
  const bar = document.getElementById('d5-editbar');
  if(dash) dash.classList.toggle('editing', _dashEditing);
  if(bar)  bar.classList.toggle('show', _dashEditing);
}

/* ═══════════════════════════════════════════════════════════════
   DRAG & DROP
═══════════════════════════════════════════════════════════════ */
let _dragSrcId = null;

window.dashDragStart = function(e) {
  if (!_dashEditing) return; // Sécurité : on ne drag qu'en mode édition
  const w = e.currentTarget.closest('.d5w');
  if (!w) return;
  _dragSrcId = w.getAttribute('data-widget');
  w.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', _dragSrcId);
};

window.dashDragOver = function(e) {
  if (!_dashEditing) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const w = e.currentTarget.closest('.d5w');
  if (w && w.getAttribute('data-widget') !== _dragSrcId) {
    w.classList.add('drag-over');
  }
};

window.dashDrop = function(e) {
  if (!_dashEditing) return;
  e.preventDefault();
  const target = e.currentTarget.closest('.d5w');
  if (!target) return;
  
  const targetId = target.getAttribute('data-widget');
  target.classList.remove('drag-over');
  
  if(!_dragSrcId || _dragSrcId === targetId) return;

  const order = _dashGetOrder();
  const fromIdx = order.indexOf(_dragSrcId);
  const toIdx   = order.indexOf(targetId);
  
  if(fromIdx === -1 || toIdx === -1) return;
  
  order.splice(fromIdx, 1);
  order.splice(toIdx, 0, _dragSrcId);
  
  _dashSetOrder(order);
  renderDashboard();
};

window.dashDragEnd = function(e) {
  const w = e.currentTarget.closest('.d5w');
  if(w) w.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  _dragSrcId = null;
};

/* ═══════════════════════════════════════════════════════════════
   FOCUS / FILTRE (Mise à jour sans recharger)
═══════════════════════════════════════════════════════════════ */
function clearDashFocus() { setDashFocus('tout'); }
function setDashZoneFocus(zone) { _dashFocusMode='zone'; _dashFocusZone=zone; refreshDashFocus(); }
function setDashFocus(mode) { _dashFocusMode=mode||'tout'; _dashFocusZone=null; refreshDashFocus(); }
function isResolvedStatut(s) { return s==='résolu'||s==='clos'; }
function isOpenStatut(s)     { return !isResolvedStatut(s); }

function getDashTicketsForRecent() {
  const l = (typeof cache !== 'undefined' && cache.tickets) ? cache.tickets : [];
  const m = _dashFocusMode;
  if(m==='tout')     return l;
  if(m==='ouvert')   return l.filter(t=>isOpenStatut(t.statut));
  if(m==='critique') return l.filter(t=>t.urgence==='critique'&&isOpenStatut(t.statut));
  if(m==='resolu')   return l.filter(t=>isResolvedStatut(t.statut));
  if(m==='mine')     return l.filter(t=>t.auteur_id===(typeof user !== 'undefined'?user.id:null)&&isOpenStatut(t.statut));
  if(m==='transmis') return l.filter(t=>t.statut==='transmis_syndic');
  if(m==='zone')     return l.filter(t=>t.batiment===_dashFocusZone&&isOpenStatut(t.statut));
  return l;
}

function getDashTicketsForZones()  { return _dashFocusMode==='tout'?(cache.tickets||[]).filter(t=>isOpenStatut(t.statut)):getDashTicketsForRecent(); }
function getDashTicketsForChart()  { return _dashFocusMode==='tout'?(cache.tickets||[]):getDashTicketsForRecent(); }

function renderDashRecentListHTML(list) {
  if(!list.length) return `<div class="d5-empty" style="padding:40px 20px;"><div style="font-size:32px;margin-bottom:12px; opacity:0.5;">✅</div><div style="font-weight:700; color:var(--text-1); margin-bottom:4px;">Aucun signalement en cours</div><button class="btn btn-primary btn-sm" style="margin:16px auto 0;" onclick="if(typeof openNewTicket==='function') openNewTicket()">Signaler un problème</button></div>`;
  return _widgetTicketsList(list);
}

function renderDashZonesListHTML(tickets) {
  const zones=(typeof COPRO !== 'undefined' && COPRO.tours) ? COPRO.tours.concat(['Parking visiteurs','Parking privé','Garages','Aire de jeux','Portails / portillons','Extérieur général']) : [];
  if (!zones.length) return '';
  
  const max=Math.max(1,...zones.map(z=>tickets.filter(t=>t.batiment===z).length));
  
  const rows=zones.map(zone=>{
    const cnt=tickets.filter(t=>t.batiment===zone).length;
    if(!cnt) return '';
    const pct=Math.round((cnt/max)*100);
    const color=cnt>=3?'var(--red)':cnt>=2?'var(--orange)':'var(--primary)';
    return '<div class="d5-zone" onclick="setDashZoneFocus('+JSON.stringify(zone)+')">'
      +'<div class="d5-zone-name">'+_e(zone.startsWith('Tour')?zone:zone.split(' ')[0])+'</div>'
      +'<div class="d5-zone-track"><div class="d5-zone-fill" style="width:'+pct+'%;background:'+color+';"></div></div>'
      +'<div class="d5-zone-num" style="color:'+color+';">'+cnt+'</div></div>';
  }).join('');
  return rows||`<div class="d5-empty" style="padding:40px 20px;"><span style="font-size:32px; display:block; margin-bottom:12px; opacity:0.5;">🎉</span>Aucun incident ouvert</div>`;
}

function refreshDashFocus() {
  const recentEl=$('dash-recent-list'),zoneEl=$('dash-zone-list');
  const bar=$('dash-focusbar');
  
  if(bar){
    bar.querySelectorAll('[data-dash-focus]').forEach(btn => btn.classList.toggle('sel',btn.getAttribute('data-dash-focus')===_dashFocusMode));
    const cz=$('dash-chip-zone');
    if(cz){
      const show = _dashFocusMode==='zone' && !!_dashFocusZone;
      cz.style.display = show ? '' : 'none';
      if(show) {
        cz.textContent = '📍 ' + _dashFocusZone + ' ✕';
        cz.classList.add('sel');
      }
    }
  }
  
  if(recentEl) recentEl.innerHTML=renderDashRecentListHTML(getDashTicketsForRecent());
  if(zoneEl)   zoneEl.innerHTML  =renderDashZonesListHTML(getDashTicketsForZones());
  renderDashChart();
}

/* ═══════════════════════════════════════════════════════════════
   WIDGETS ASYNCHRONES (Récupération des données secondaires)
═══════════════════════════════════════════════════════════════ */
async function loadDashboardWidgets() {
  // Agenda / Événements
  try {
    const {data:evts} = await sb.from('evenements').select('*').gte('date_debut',new Date().toISOString()).order('date_debut').limit(4);
    const evtEl = $('dash-events-list');
    if(evtEl){
      if(!evts || !evts.length){
        evtEl.innerHTML='<div class="d5-empty" style="padding:32px 20px;"><div style="font-size:24px;margin-bottom:8px;">🌴</div>Rien de prévu prochainement</div>';
      } else {
        evtEl.className='';
        evtEl.innerHTML=evts.map(e=>{
          const et = (typeof EVENT_TYPES!=='undefined' && EVENT_TYPES[e.type]) ? EVENT_TYPES[e.type] : {color:'var(--primary)'};
          const d = new Date(e.date_debut);
          const isImmi = (d - new Date()) < 86400000;
          return `<div class="d5-row" onclick="if(typeof nav==='function') nav('agenda')">
            <div style="width:4px; height:40px; border-radius:4px; background:${et.color}; flex-shrink:0;"></div>
            <div class="d5-row-body">
              <div class="d5-row-title" style="${isImmi ? 'color:var(--orange);' : ''}">${_e(e.titre)}</div>
              <div class="d5-row-sub">📅 ${d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})} à ${d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}${e.lieu?' · '+_e(e.lieu):''}</div>
            </div>
            ${isImmi ? '<span class="d5-pill d5-pill-o" style="animation:pulse 2s infinite;">Imminent</span>' : ''}
          </div>`;
        }).join('');
      }
    }
  } catch(e){}

  // Panneau Annonces
  try {
    const {data:annsRaw} = await sb.from('annonces').select('*').order('epingle',{ascending:false}).order('created_at',{ascending:false}).limit(12);
    const anns = (annsRaw||[]).filter(a => typeof annonceReaderCanSee==='function' ? annonceReaderCanSee(a) : true).slice(0,3);
    const annEl = $('dash-annonces-list');
    if(annEl){
      if(!anns.length){
        annEl.innerHTML='<div class="d5-empty" style="padding:32px 20px;"><div style="font-size:24px;margin-bottom:8px;">📌</div>Panneau d\'affichage vide</div>';
      } else {
        annEl.className='';
        const icos = { urgent:'🚨', important:'⚠️', info:'📢' };
        annEl.innerHTML = anns.map(a => `
          <div class="d5-row" onclick="if(typeof nav==='function') nav('annonces')">
            <div class="d5-row-ico" style="${a.epingle ? 'background:var(--orange-light); color:var(--orange);' : 'background:var(--bg-2);'}">${a.epingle ? '📌' : (icos[a.type]||'📢')}</div>
            <div class="d5-row-body">
              <div class="d5-row-title">${_e(a.titre)}</div>
              ${a.contenu ? `<div class="d5-row-sub">${_e(a.contenu.substring(0,60))}${a.contenu.length>60?'…':''}</div>` : ''}
            </div>
            ${a.epingle ? '<span class="d5-pill d5-pill-o">Épinglé</span>' : ''}
          </div>`
        ).join('');
      }
    }
  } catch(e){}
  
  renderDashChart();
}

/* ═══════════════════════════════════════════════════════════════
   GRAPHIQUE CANVAS (Dessiné manuellement, 0 dépendances, ultra-rapide)
═══════════════════════════════════════════════════════════════ */
function renderDashChart() {
  const canvas=$('dash-chart');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const tipEl=$('dash-chart-tip');
  const months=[], now=new Date();
  
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    months.push({label:d.toLocaleDateString('fr-FR',{month:'short'}), year:d.getFullYear(), month:d.getMonth()});
  }
  
  const tks=getDashTicketsForChart();
  const created=months.map(m=>tks.filter(t=>{const d=new Date(t.created_at);return d.getFullYear()===m.year&&d.getMonth()===m.month;}).length);
  const resolved=months.map(m=>tks.filter(t=>{if(!isResolvedStatut(t.statut))return false;const d=new Date(t.updated_at||t.created_at);return d.getFullYear()===m.year&&d.getMonth()===m.month;}).length);
  
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  
  const W=canvas.offsetWidth||400, H=canvas.offsetHeight||140;
  canvas.width = W * window.devicePixelRatio; // Support Écrans Retina
  canvas.height = H * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  
  const pad = {top:16, right:16, bottom:28, left:32};
  const cW = W-pad.left-pad.right, cH = H-pad.top-pad.bottom;
  const maxV = Math.max(...created, ...resolved, 4); // Minimum 4 sur l'axe Y
  
  const barW = (cW/months.length)*0.30, barG = (cW/months.length)*0.08;
  
  ctx.clearRect(0,0,W,H);
  
  // Grille horizontale
  [0,1,2,3].forEach(i=>{
    const y = pad.top + (cH/3)*i;
    ctx.strokeStyle = gridColor; 
    ctx.lineWidth = 1;
    // Ligne pointillée
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W-pad.right, y); ctx.stroke();
    ctx.setLineDash([]);
    
    // Labels Y
    if(i<4){
      ctx.fillStyle = textColor; 
      ctx.font = '600 10px Inter, sans-serif'; 
      ctx.textAlign = 'right'; 
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(maxV-(maxV/3)*i), pad.left-8, y);
    }
  });

  // Barres
  months.forEach((m,i)=>{
    const x = pad.left + (cW/months.length)*i + (cW/months.length)*0.15;
    
    // Créés (Bleu)
    const h1 = (created[i]/maxV)*cH;
    ctx.fillStyle = '#3b82f6'; 
    ctx.beginPath(); ctx.roundRect(x, pad.top+cH-h1, barW, h1, [4,4,0,0]); ctx.fill();
    
    // Résolus (Vert)
    const h2 = (resolved[i]/maxV)*cH;
    ctx.fillStyle = '#10b981'; 
    ctx.beginPath(); ctx.roundRect(x+barW+barG, pad.top+cH-h2, barW, h2, [4,4,0,0]); ctx.fill();
    
    // Labels X (Mois)
    ctx.fillStyle = textColor; 
    ctx.font = '600 11px Inter, sans-serif'; 
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'top';
    ctx.fillText(m.label.charAt(0).toUpperCase() + m.label.slice(1), x+barW+barG/2, H-20);
  });
  
  // Légende
  const lx = W/2 - 50;
  ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.roundRect(lx, 4, 12, 12, 4); ctx.fill();
  ctx.fillStyle = textColor; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('Déclarés', lx+18, 10);
  
  ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.roundRect(lx+80, 4, 12, 12, 4); ctx.fill();
  ctx.fillStyle = textColor; ctx.fillText('Résolus', lx+98, 10);

  // Infobulle (Tooltip)
  if(tipEl){
    const wrap = canvas.parentElement;
    const handler = e => {
      const rect = wrap.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      
      if(px<pad.left || px>pad.left+cW || py<pad.top || py>pad.top+cH) { tipEl.style.display='none'; return; }
      
      const idx = Math.floor((px-pad.left)/(cW/months.length));
      if(idx<0 || idx>=months.length) { tipEl.style.display='none'; return; }
      
      tipEl.style.display = 'block';
      tipEl.style.left = px + 'px';
      tipEl.style.top = Math.max(20, py - 20) + 'px';
      tipEl.innerHTML = `
        <div style="font-weight:800; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:4px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.05em;">${months[idx].label} ${months[idx].year}</div>
        <div style="display:flex; justify-content:space-between; gap:16px;"><span>🔴 Déclarés :</span> <strong>${created[idx]}</strong></div>
        <div style="display:flex; justify-content:space-between; gap:16px;"><span>✅ Résolus :</span> <strong>${resolved[idx]}</strong></div>
      `;
    };
    if(canvas.__dh) canvas.removeEventListener('mousemove', canvas.__dh);
    canvas.__dh = handler;
    canvas.addEventListener('mousemove', handler);
    canvas.addEventListener('mouseleave', () => { tipEl.style.display='none'; });
  }
}