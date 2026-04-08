// ════════════════════════════════════════════════════════════════
//  DASHBOARD v6 — Premium UI/UX
//  Design: Clean SaaS dark-ready, bento grid, micro-interactions
// ════════════════════════════════════════════════════════════════

let _dashFocusMode = 'tout';
let _dashFocusZone = null;

const DASH_WIDGETS = [
  { id: 'situation',  label: 'Situation',       ico: '🚨', managerOnly: true,  defaultVisible: true,  defaultSize: 'normal' },
  { id: 'chart',      label: 'Activité',         ico: '📊', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'zones',      label: 'Bâtiments',        ico: '🏢', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'contrats',   label: 'Contrats',         ico: '📄', managerOnly: true,  defaultVisible: true,  defaultSize: 'normal' },
  { id: 'events',     label: 'Événements',       ico: '📅', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'annonces',   label: 'Annonces',         ico: '📢', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'votes',      label: 'Votes',            ico: '🗳️', managerOnly: false, defaultVisible: true,  defaultSize: 'normal' },
  { id: 'documents',  label: 'Documents récents',ico: '📁', managerOnly: false, defaultVisible: true,  defaultSize: 'compact' },
  { id: 'install',    label: "Installer l'app",  ico: '📱', managerOnly: false, defaultVisible: false, defaultSize: 'compact' },
];

const DASH_LS_KEY = 'coprosync_dash_prefs_v1';
const TK_PRESET_KEY = 'coprosync_tickets_preset_v1';

function _dashLoadPrefs() {
  try { const raw = localStorage.getItem(DASH_LS_KEY); return raw ? JSON.parse(raw) : {}; } catch(e) { return {}; }
}
function _dashSavePrefs(prefs) { try { localStorage.setItem(DASH_LS_KEY, JSON.stringify(prefs)); } catch(e) {} }
function _dashGetWidgetPref(id, key) {
  const prefs = _dashLoadPrefs(); const w = DASH_WIDGETS.find(x => x.id === id);
  if (!w) return null;
  if (prefs[id] && key in prefs[id]) return prefs[id][key];
  return key === 'visible' ? w.defaultVisible : key === 'size' ? w.defaultSize : null;
}
function _dashGetOrder() {
  const prefs = _dashLoadPrefs(); const saved = prefs._order; const ids = DASH_WIDGETS.map(w => w.id);
  if (!saved) return ids;
  const merged = saved.filter(id => ids.includes(id));
  ids.forEach(id => { if (!merged.includes(id)) merged.push(id); });
  return merged;
}
function _dashSetWidgetPref(id, key, val) {
  const prefs = _dashLoadPrefs(); if (!prefs[id]) prefs[id] = {}; prefs[id][key] = val; _dashSavePrefs(prefs);
}
function _dashSetOrder(order) { const prefs = _dashLoadPrefs(); prefs._order = order; _dashSavePrefs(prefs); }

// ── CSS INJECTION ─────────────────────────────────────────────────────────────
(function injectDashCSS() {
  if (document.getElementById('dash6-css')) return;
  const s = document.createElement('style');
  s.id = 'dash6-css';
  s.textContent = `

/* ════════ DASHBOARD v6 ════════ */

.dash6 {
  padding: 0 0 32px;
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Hero Section ── */
.d6-hero {
  padding: 24px 24px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}
.d6-hero-left { flex: 1; min-width: 0; }
.d6-date-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
  text-transform: capitalize;
  letter-spacing: 0.04em;
  margin-bottom: 10px;
}
.d6-date-badge-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0 2px rgba(22,163,74,0.2);
}
.d6-greeting {
  font-family: var(--font-head);
  font-size: clamp(22px, 3vw, 30px);
  font-weight: 800;
  letter-spacing: -0.8px;
  line-height: 1.15;
  color: var(--text);
  margin-bottom: 8px;
}
.d6-hero-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.d6-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid;
  cursor: default;
  transition: transform 0.15s;
}
.d6-pill:hover { transform: translateY(-1px); }
.d6-pill.danger { background: var(--red-light); color: var(--red); border-color: var(--red-border); }
.d6-pill.success { background: var(--green-light); color: var(--green); border-color: var(--green-border); }
.d6-pill.info { background: var(--blue-light); color: var(--accent); border-color: var(--blue-border); }
.d6-pill.neutral { background: var(--surface-2); color: var(--text-2); border-color: var(--border); }
.d6-hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

/* ── KPI Grid ── */
.d6-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  border-bottom: 1px solid var(--border);
}
.d6-kpi {
  padding: 20px 22px;
  border-right: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
  overflow: hidden;
}
.d6-kpi:last-child { border-right: none; }
.d6-kpi:hover { background: var(--surface-2); }
.d6-kpi::before {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
}
.d6-kpi:hover::before { transform: scaleX(1); }
.d6-kpi.red::before { background: var(--red); }
.d6-kpi.orange::before { background: var(--orange); }
.d6-kpi.blue::before { background: var(--accent); }
.d6-kpi.green::before { background: var(--green); }
.d6-kpi-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-3);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.d6-kpi-label-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.d6-kpi.red .d6-kpi-label-dot { background: var(--red); }
.d6-kpi.orange .d6-kpi-label-dot { background: var(--orange); }
.d6-kpi.blue .d6-kpi-label-dot { background: var(--accent); }
.d6-kpi.green .d6-kpi-label-dot { background: var(--green); }
.d6-kpi-value {
  font-family: var(--font-head);
  font-size: 36px;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 6px;
  letter-spacing: -1.5px;
  animation: kpiCount 0.4s ease both;
}
.d6-kpi.red .d6-kpi-value { color: var(--red); }
.d6-kpi.orange .d6-kpi-value { color: var(--orange); }
.d6-kpi.blue .d6-kpi-value { color: var(--accent); }
.d6-kpi.green .d6-kpi-value { color: var(--green); }
.d6-kpi-sub {
  font-size: 12px;
  color: var(--text-3);
  font-weight: 500;
}
@keyframes kpiCount {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.d6-kpi:nth-child(1) .d6-kpi-value { animation-delay: 0.05s; }
.d6-kpi:nth-child(2) .d6-kpi-value { animation-delay: 0.10s; }
.d6-kpi:nth-child(3) .d6-kpi-value { animation-delay: 0.15s; }
.d6-kpi:nth-child(4) .d6-kpi-value { animation-delay: 0.20s; }

/* ── Focus Bar ── */
.d6-focusbar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 14px 20px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.d6-focuslabel {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-3);
  margin-right: 4px;
}
.d6-chip {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-2);
  border-radius: 999px;
  padding: 6px 13px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-body);
  transition: all 0.15s;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.d6-chip:hover {
  border-color: var(--border-strong);
  color: var(--text);
  transform: translateY(-1px);
}
.d6-chip.sel {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
}
.d6-chip.sel-warn { background: var(--orange); border-color: var(--orange); color: #fff; }
.d6-chip.sel-danger { background: var(--red); border-color: var(--red); color: #fff; }
.d6-chip.sel-success { background: var(--green); border-color: var(--green); color: #fff; }

/* ── Main Grid Layout ── */
.d6-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 0;
  border-bottom: 1px solid var(--border);
}
.d6-left { border-right: 1px solid var(--border); }
.d6-right { display: flex; flex-direction: column; }

/* ── Widget ── */
.d6w {
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  transition: background 0.15s;
}
.d6w:last-child { border-bottom: none; }
.d6w-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 10;
}
.d6w-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
  flex: 1;
}
.d6w-action {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-3);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: var(--font-body);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 0.15s;
}
.d6w-action:hover { color: var(--text); }
.d6w-action svg { width: 13px; height: 13px; opacity: 0.6; }

/* ── Situation Room ── */
.d6-sr {
  padding: 16px 18px;
}
.d6-sr-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
}
.d6-sr-bar.ok  { background: var(--green-light); color: var(--green); border: 1px solid var(--green-border); }
.d6-sr-bar.warn { background: var(--amber-light); color: var(--amber); border: 1px solid var(--amber-border); }
.d6-sr-bar.crit { background: var(--red-light); color: var(--red); border: 1px solid var(--red-border); }
.d6-sr-bar-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.d6-sr-bar.crit .d6-sr-bar-dot { animation: srPulse 1.4s ease-in-out infinite; }
@keyframes srPulse {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; }
  50% { box-shadow: 0 0 0 5px transparent; }
}
.d6-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 10px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s;
  border: 1px solid;
}
.d6-action-row:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.d6-action-row:last-child { margin-bottom: 0; }
.d6-action-row.r { background: var(--red-light); border-color: var(--red-border); color: var(--red); }
.d6-action-row.o { background: var(--orange-light); border-color: var(--orange-border); color: var(--orange); }
.d6-action-row.b { background: var(--blue-light); border-color: var(--blue-border); color: var(--accent); }
.d6-action-ico { font-size: 16px; flex-shrink: 0; line-height: 1; }
.d6-action-body { flex: 1; min-width: 0; }
.d6-action-title { font-size: 12.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.d6-action-sub { font-size: 11px; opacity: 0.7; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.d6-action-cta {
  font-size: 11px; font-weight: 800;
  padding: 4px 10px; border-radius: 6px;
  border: 1px solid currentColor;
  background: transparent;
  cursor: pointer; font-family: var(--font-body);
  color: inherit; flex-shrink: 0;
  transition: background 0.12s;
}
.d6-action-row:hover .d6-action-cta { background: rgba(0,0,0,0.06); }

/* ── Ticket Rows ── */
.d6-ticket {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid var(--border);
  position: relative;
}
.d6-ticket:last-child { border-bottom: none; }
.d6-ticket:hover { background: var(--surface-2); }
.d6-ticket:hover .d6-ticket-arrow { opacity: 1; transform: translateX(0); }
.d6-ticket-accent { width: 3px; height: 32px; border-radius: 2px; flex-shrink: 0; }
.d6-ticket-ico {
  width: 32px; height: 32px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
.d6-ticket-body { flex: 1; min-width: 0; }
.d6-ticket-title {
  font-size: 13.5px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: var(--text);
  margin-bottom: 2px;
}
.d6-ticket-meta {
  font-size: 11px; color: var(--text-3);
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.d6-ticket-arrow {
  opacity: 0; transform: translateX(-4px);
  transition: opacity 0.15s, transform 0.15s;
  color: var(--text-3);
}

/* ── Zones / Bâtiments ── */
.d6-zone {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid var(--border);
}
.d6-zone:last-child { border-bottom: none; }
.d6-zone:hover { background: var(--surface-2); }
.d6-zone-name {
  font-size: 12px; font-weight: 600;
  color: var(--text-2);
  width: 80px; flex-shrink: 0;
}
.d6-zone-track {
  flex: 1; height: 5px;
  background: var(--surface-2);
  border-radius: 3px; overflow: hidden;
}
.d6-zone-fill { height: 100%; border-radius: 3px; transition: width 0.6s cubic-bezier(.4,0,.2,1); }
.d6-zone-count { font-size: 12px; font-weight: 800; width: 18px; text-align: right; flex-shrink: 0; }

/* ── General Row ── */
.d6-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 18px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid var(--border);
}
.d6-row:last-child { border-bottom: none; }
.d6-row:hover { background: var(--surface-2); }
.d6-row-ico { font-size: 16px; flex-shrink: 0; line-height: 1; }
.d6-row-body { flex: 1; min-width: 0; }
.d6-row-title { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
.d6-row-sub { font-size: 11px; color: var(--text-3); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ── Badges inline ── */
.d6-badge {
  font-size: 10px; font-weight: 800;
  padding: 2px 7px; border-radius: 999px;
  flex-shrink: 0;
}
.d6-badge.new { background: var(--amber-light); color: var(--amber); }
.d6-badge.voted { background: var(--green-light); color: var(--green); }
.d6-badge.todo { background: var(--red-light); color: var(--red); }
.d6-badge.soon { background: var(--orange-light); color: var(--orange); }

/* ── Contrats widget ── */
.d6-contrat-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
}
.d6-ckpi {
  padding: 14px 16px;
  text-align: center;
  border-right: 1px solid var(--border);
}
.d6-ckpi:last-child { border-right: none; }
.d6-ckpi-val { font-size: 22px; font-weight: 800; font-family: var(--font-head); line-height: 1; }
.d6-ckpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); font-weight: 600; margin-top: 3px; }
.d6-ckpi.red .d6-ckpi-val { color: var(--red); }
.d6-ckpi.orange .d6-ckpi-val { color: var(--orange); }
.d6-ckpi.green .d6-ckpi-val { color: var(--green); }
.d6-budget-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 18px;
  border-top: 1px solid var(--border);
  font-size: 12px;
}
.d6-budget-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }
.d6-budget-val { font-size: 14px; font-weight: 800; color: var(--text); }
.d6-empty { padding: 28px 18px; text-align: center; font-size: 13px; color: var(--text-3); }

/* ── Chart ── */
.d6-chart-wrap {
  padding: 16px 18px 10px;
  position: relative;
}
.d6-chart-legend {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
}
.d6-chart-legend-item {
  display: flex; align-items: center; gap: 5px;
}
.d6-chart-legend-dot {
  width: 8px; height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* ── Edit bar ── */
.d6-editbar {
  display: none;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(37,99,235,0.06);
  border: 1px solid rgba(37,99,235,0.2);
  border-radius: 10px;
  margin: 16px 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}
.d6-editbar.show { display: flex; animation: pageIn 0.2s ease both; }

/* ── Customize panel ── */
.d6-customize {
  display: none;
  position: fixed;
  top: 68px; right: 16px;
  width: min(360px, calc(100vw - 32px));
  max-height: calc(100dvh - 90px);
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.15);
  z-index: 200;
  padding: 18px;
}
.d6-customize.open { display: block; animation: pageIn 0.2s ease both; }

/* ── Responsive ── */
@media (max-width: 900px) {
  .d6-grid { grid-template-columns: 1fr; }
  .d6-left { border-right: none; }
  .d6-kpi-grid { grid-template-columns: 1fr 1fr; }
  .d6-kpi:nth-child(2) { border-right: none; }
  .d6-kpi:nth-child(3), .d6-kpi:nth-child(4) { border-top: 1px solid var(--border); }
  .d6-kpi:nth-child(4) { border-right: none; }
  .d6-kpi-value { font-size: 28px; }
}
@media (max-width: 480px) {
  .d6-hero { padding: 16px; }
  .d6-greeting { font-size: 20px; }
  .d6-kpi { padding: 14px 14px; }
  .d6-kpi-value { font-size: 24px; }
  .d6-focusbar { padding: 10px 14px; }
  .d6-ticket, .d6-row, .d6-zone { padding-left: 14px; padding-right: 14px; }
}

/* ── Tickets Page Upgrades ── */
.saas-container { padding: 0; }
.saas-toolbar { padding: 16px 24px; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 20; gap: 10px; flex-wrap: wrap; margin-bottom: 0; }
.saas-table-wrap { border-radius: 0; border-left: none; border-right: none; border-top: none; border-bottom: none; }
.saas-grid { border-bottom: 1px solid var(--border); }
.saas-tr { border-bottom: 1px solid var(--border); }
.saas-tr:last-child { border-bottom: none; }
.tk-accent-bar { width: 3px; height: 100%; position: absolute; left: 0; top: 0; }

`;
  document.head.appendChild(s);
})();

// ── HELPERS ────────────────────────────────────────────────────────────────────
function _e(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function _eur(n) { return (n||0).toLocaleString('fr-FR',{minimumFractionDigits:0}) + '\u00a0€'; }
function _svgArrow() { return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`; }

// ── WIDGETS CONTENT ────────────────────────────────────────────────────────────

function _buildSituationRoom(ouverts, critiques, syndic) {
  const actifs = (cache.contrats||[]).filter(c => c.actif !== false);
  const contratsExp = actifs.filter(c => daysUntil(c.date_echeance) < 0);
  const contratsAlt = actifs.filter(c => { const d = daysUntil(c.date_echeance); return d >= 0 && d <= (c.alerte_jours ?? 90); });
  const votes = (typeof _votesCache !== 'undefined') ? _votesCache.filter(v => v.statut === 'ouvert') : [];
  const sansMaRep = (typeof _reponsesCache !== 'undefined') ? votes.filter(v => !_reponsesCache[v.id]) : [];
  const isCrit = critiques.length > 0 || contratsExp.length > 0;
  const isWarn = !isCrit && (contratsAlt.length > 0 || syndic.length > 0);
  
  let barCls, phrase;
  if (isCrit) {
    barCls = 'crit';
    const p = [];
    if (critiques.length) p.push(critiques.length + ' signalement' + (critiques.length > 1 ? 's critiques' : ' critique'));
    if (contratsExp.length) p.push(contratsExp.length + ' contrat' + (contratsExp.length > 1 ? 's expirés' : ' expiré'));
    phrase = 'Action requise · ' + p.join(' · ');
  } else if (isWarn) {
    barCls = 'warn';
    const p = [];
    if (contratsAlt.length) p.push(contratsAlt.length + ' contrat' + (contratsAlt.length > 1 ? 's en alerte' : ' en alerte'));
    if (syndic.length) p.push(syndic.length + ' dossier' + (syndic.length > 1 ? 's transmis' : ' transmis'));
    phrase = 'Vigilance · ' + p.join(' · ');
  } else {
    barCls = 'ok';
    phrase = 'Résidence sous contrôle — aucune anomalie';
  }

  const actions = [];
  critiques.slice(0,2).forEach(tk => actions.push({ cls:'r', ico:'🚨', title: _e(tk.titre), sub: _e(tk.batiment||'') + (tk.zone ? ' · ' + _e(tk.zone) : '') + ' — ' + depuisJours(tk.created_at), btn:'Traiter', fn: `openDetail('${tk.id}')` }));
  contratsExp.slice(0,2).forEach(c => actions.push({ cls:'r', ico:'📄', title: _e(c.fournisseur) + ' — contrat expiré', sub: _e(c.type_contrat||'') + ' · expiré depuis ' + Math.abs(daysUntil(c.date_echeance)) + 'j', btn:'Gérer', fn: `nav('contrats')` }));
  contratsAlt.slice(0,1).forEach(c => actions.push({ cls:'o', ico:'⚠️', title: _e(c.fournisseur) + ' — échéance dans ' + daysUntil(c.date_echeance) + 'j', sub: _e(c.type_contrat||''), btn:'Voir', fn: `nav('contrats')` }));
  if (sansMaRep.length > 0) actions.push({ cls:'b', ico:'🗳️', title: sansMaRep.length + ' vote' + (sansMaRep.length > 1 ? 's' : '') + ' en attente', sub: sansMaRep.slice(0,2).map(v => _e(v.titre)).join(' · '), btn:'Voter', fn: `nav('votes')` });

  return `<div class="d6-sr">
    <div class="d6-sr-bar ${barCls}">
      <div class="d6-sr-bar-dot"></div>
      <span style="flex:1;">${phrase}</span>
      <span style="font-size:11px;opacity:.65;">${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>
    </div>
    ${actions.length === 0
      ? '<div style="text-align:center;padding:14px 0;font-size:13px;color:var(--text-3);">Aucune action immédiate requise</div>'
      : actions.map(a => `<div class="d6-action-row ${a.cls}" onclick="${a.fn}">
          <div class="d6-action-ico">${a.ico}</div>
          <div class="d6-action-body"><div class="d6-action-title">${a.title}</div><div class="d6-action-sub">${a.sub}</div></div>
          <button class="d6-action-cta" onclick="event.stopPropagation();${a.fn}">${a.btn}</button>
        </div>`).join('')}
  </div>`;
}

function _buildTicketRows(list) {
  if (!list.length) return `<div class="d6-empty">
    <div style="font-size:28px;margin-bottom:8px;opacity:.4;">📋</div>
    <div>Aucun signalement</div>
    <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="openNewTicket()">+ Créer un signalement</button>
  </div>`;
  return list.slice(0, 8).map(tk => {
    const isC = tk.urgence === 'critique', isI = tk.urgence === 'important';
    const accent = isC ? 'var(--red)' : isI ? 'var(--orange)' : 'var(--accent)';
    const bgIco = isC ? 'var(--red-light)' : isI ? 'var(--orange-light)' : 'var(--blue-light)';
    const ico = isC ? '🔴' : isI ? '🟠' : '🔵';
    const bHTML = typeof badgeStatut === 'function' ? badgeStatut(tk.statut) : `<span>${tk.statut}</span>`;
    return `<div class="d6-ticket" onclick="openDetail('${tk.id}')">
      <div class="d6-ticket-accent" style="background:${accent};"></div>
      <div class="d6-ticket-ico" style="background:${bgIco};">${ico}</div>
      <div class="d6-ticket-body">
        <div class="d6-ticket-title">${_e(tk.titre)}</div>
        <div class="d6-ticket-meta">
          ${bHTML}
          <span>${_e(tk.batiment || '')}</span>
          <span>· ${depuisJours(tk.created_at)}</span>
        </div>
      </div>
      <div class="d6-ticket-arrow">${_svgArrow()}</div>
    </div>`;
  }).join('');
}

function _buildZones(ouverts) {
  const zones = (COPRO.tours || []).concat(['Parking visiteurs','Parking privé','Garages','Aire de jeux','Portails / portillons']);
  const max = Math.max(1, ...zones.map(z => ouverts.filter(t => t.batiment === z).length));
  const rows = zones.map(zone => {
    const cnt = ouverts.filter(t => t.batiment === zone).length;
    if (!cnt) return '';
    const pct = Math.round((cnt / max) * 100);
    const color = cnt >= 3 ? 'var(--red)' : cnt >= 2 ? 'var(--orange)' : 'var(--accent)';
    return `<div class="d6-zone" onclick="setDashZoneFocus(${JSON.stringify(zone)})">
      <div class="d6-zone-name">${_e(zone.startsWith('Tour') ? zone : zone.split(' ')[0])}</div>
      <div class="d6-zone-track"><div class="d6-zone-fill" style="width:${pct}%;background:${color};"></div></div>
      <div class="d6-zone-count" style="color:${color};">${cnt}</div>
    </div>`;
  }).join('');
  return rows || `<div class="d6-empty">Aucun problème ouvert 🎉</div>`;
}

function _buildContrats() {
  const actifs = (cache.contrats||[]).filter(c => c.actif !== false);
  const expires = actifs.filter(c => daysUntil(c.date_echeance) < 0);
  const alertes = actifs.filter(c => { const d = daysUntil(c.date_echeance); return d >= 0 && d <= (c.alerte_jours ?? 90); });
  const conformes = actifs.filter(c => daysUntil(c.date_echeance) > (c.alerte_jours ?? 90));
  const budget = actifs.reduce((s, c) => s + (c.montant_annuel || 0), 0);
  const urgents = [...expires, ...alertes].sort((a,b) => new Date(a.date_echeance) - new Date(b.date_echeance)).slice(0, 4);

  return `<div style="border-bottom:1px solid var(--border);">
    <div class="d6-contrat-kpis">
      <div class="d6-ckpi ${expires.length ? 'red' : ''}"><div class="d6-ckpi-val">${expires.length}</div><div class="d6-ckpi-label">Expirés</div></div>
      <div class="d6-ckpi ${alertes.length ? 'orange' : ''}"><div class="d6-ckpi-val">${alertes.length}</div><div class="d6-ckpi-label">En alerte</div></div>
      <div class="d6-ckpi green"><div class="d6-ckpi-val">${conformes.length}</div><div class="d6-ckpi-label">Conformes</div></div>
    </div>
  </div>
  ${urgents.length === 0
    ? '<div class="d6-empty">✅ Tous les contrats sont conformes</div>'
    : urgents.map(c => {
        const d = daysUntil(c.date_echeance);
        const color = d < 0 || d <= 30 ? 'var(--red)' : 'var(--orange)';
        const lbl = d < 0 ? 'Expiré (' + (-d) + 'j)' : d + 'j';
        return `<div class="d6-row" onclick="nav('contrats')">
          <div class="d6-row-ico">📄</div>
          <div class="d6-row-body">
            <div class="d6-row-title">${_e(c.fournisseur)}</div>
            <div class="d6-row-sub">${_e(c.type_contrat||'')}</div>
          </div>
          <div style="font-size:12px;font-weight:800;color:${color};">${lbl}</div>
        </div>`;
      }).join('')}
  <div class="d6-budget-row">
    <span class="d6-budget-label">Budget annuel</span>
    <span class="d6-budget-val">${_eur(budget)}</span>
  </div>`;
}

function _buildVotes() {
  const votes = (typeof _votesCache !== 'undefined') ? _votesCache.filter(v => v.statut === 'ouvert') : [];
  if (!votes.length) return '<div class="d6-empty">Aucun vote en cours</div>';
  return votes.slice(0, 3).map(v => {
    const maRep = (typeof _reponsesCache !== 'undefined') ? _reponsesCache[v.id] : null;
    const total = (typeof _allReponsesCache !== 'undefined' && _allReponsesCache[v.id]) ? _allReponsesCache[v.id].length : 0;
    return `<div class="d6-row" onclick="nav('votes')">
      <div class="d6-row-ico">${(typeof VOTE_TYPES !== 'undefined' && VOTE_TYPES[v.type]) ? VOTE_TYPES[v.type].ico : '🗳️'}</div>
      <div class="d6-row-body">
        <div class="d6-row-title">${_e(v.titre)}</div>
        <div class="d6-row-sub">${total} participant${total > 1 ? 's' : ''}</div>
      </div>
      ${maRep
        ? '<span class="d6-badge voted">✓ Voté</span>'
        : '<span class="d6-badge todo">À voter</span>'}
    </div>`;
  }).join('');
}

function _buildDocuments() {
  const docs = (typeof _docsCache !== 'undefined') ? _docsCache : [];
  if (!docs.length) return '<div class="d6-empty">Aucun document</div>';
  return docs.slice(0, 4).map(doc => {
    const cat = (typeof DOC_CATS !== 'undefined' && DOC_CATS[doc.categorie]) ? DOC_CATS[doc.categorie] : { ico: '📄' };
    const isNew = (typeof _docsVus !== 'undefined') ? !_docsVus.has(doc.id) : false;
    return `<div class="d6-row" onclick="nav('documents')">
      <div class="d6-row-ico">${cat.ico}</div>
      <div class="d6-row-body">
        <div class="d6-row-title">${_e(doc.titre)}</div>
        <div class="d6-row-sub">${fmtD(doc.created_at)}</div>
      </div>
      ${isNew ? '<span class="d6-badge new">Nouveau</span>' : ''}
    </div>`;
  }).join('');
}

// ── WIDGET SHELL ──────────────────────────────────────────────────────────────
function _d6Widget(label, linkText, linkFn, bodyHTML) {
  return `<div class="d6w">
    <div class="d6w-head">
      <span class="d6w-label">${label}</span>
      ${linkText ? `<button class="d6w-action" onclick="${linkFn}">${linkText} ${_svgArrow()}</button>` : ''}
    </div>
    <div>${bodyHTML}</div>
  </div>`;
}

// ── MAIN RENDER ───────────────────────────────────────────────────────────────
async function renderDashboard() {
  const el = $('page');
  if (!el) return;

  const t = cache.tickets || [];
  const ouverts = t.filter(x => x.statut !== 'résolu' && x.statut !== 'clos');
  const critiques = t.filter(x => x.urgence === 'critique' && x.statut !== 'résolu' && x.statut !== 'clos');
  const syndic = t.filter(x => x.statut === 'transmis_syndic');
  const resolus = t.filter(x => x.statut === 'résolu' || x.statut === 'clos');

  _dashFocusMode = 'tout';
  _dashFocusZone = null;

  const prenom = displayName(profile?.prenom, profile?.nom, user?.email, 'vous').split(' ')[0];
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── Hero HTML ──
  const heroHTML = `<div class="d6-hero">
    <div class="d6-hero-left">
      <div class="d6-date-badge">
        <div class="d6-date-badge-dot"></div>
        ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
      </div>
      <div class="d6-greeting">Bonjour, ${_e(prenom)}</div>
      <div class="d6-hero-pills">
        ${critiques.length > 0
          ? `<span class="d6-pill danger"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12" stroke="white" stroke-width="2.5"/><circle cx="12" cy="16" r="1.5" fill="white"/></svg> ${critiques.length} critique${critiques.length > 1 ? 's' : ''}</span>`
          : `<span class="d6-pill success"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Tout va bien</span>`}
        ${ouverts.length > 0 ? `<span class="d6-pill neutral">${ouverts.length} ouvert${ouverts.length > 1 ? 's' : ''}</span>` : ''}
        ${syndic.length > 0 ? `<span class="d6-pill info">${syndic.length} transmis</span>` : ''}
      </div>
    </div>
    <div class="d6-hero-actions">
      <button class="btn btn-primary" onclick="openNewTicket()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Signaler
      </button>
      <button class="btn btn-secondary" onclick="nav('tickets')">Signalements</button>
      <button class="btn btn-ghost btn-sm" onclick="dashToggleCustomize()" title="Personnaliser">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      </button>
    </div>
  </div>`;

  // ── KPIs ──
  const kpiData = [
    { cls: 'orange', val: ouverts.length,   label: 'Ouverts',    sub: 'Signalements actifs',   fn: `nav('tickets')` },
    { cls: 'red',    val: critiques.length,  label: 'Critiques',  sub: 'Action requise',         fn: `nav('tickets')` },
    isManager()
      ? { cls: 'blue', val: syndic.length, label: 'Transmis', sub: 'En attente syndic', fn: `nav('tickets')` }
      : { cls: 'blue', val: t.filter(x => x.auteur_id === user.id).length, label: 'Les miens', sub: 'Mes signalements', fn: `nav('tickets')` },
    { cls: 'green',  val: resolus.length,    label: 'Résolus',    sub: 'Total traités',          fn: null },
  ];
  const kpisHTML = `<div class="d6-kpi-grid">
    ${kpiData.map((k, i) => `<div class="d6-kpi ${k.cls}" ${k.fn ? `onclick="${k.fn}"` : ''}>
      <div class="d6-kpi-label"><div class="d6-kpi-label-dot"></div>${k.label}</div>
      <div class="d6-kpi-value">${k.val}</div>
      <div class="d6-kpi-sub">${k.sub}</div>
    </div>`).join('')}
  </div>`;

  // ── Focus Bar ──
  const chips = [
    { key: 'tout',     lbl: 'Tout',      cls: '' },
    { key: 'ouvert',   lbl: 'Ouverts',   cls: 'sel-warn' },
    { key: 'critique', lbl: 'Critiques', cls: 'sel-danger' },
    isManager() ? { key: 'transmis', lbl: 'Transmis', cls: '' } : { key: 'mine', lbl: 'Mes tickets', cls: '' },
    { key: 'resolu',   lbl: 'Résolus',   cls: 'sel-success' },
  ];
  const focusHTML = `<div class="d6-focusbar" id="dash-focusbar">
    <span class="d6-focuslabel">Filtre</span>
    ${chips.map(c => `<button class="d6-chip ${c.key === _dashFocusMode ? (c.cls || 'sel') : ''}" data-dash-focus="${c.key}" onclick="setDashFocus('${c.key}')">${c.lbl}</button>`).join('')}
    <button class="d6-chip" id="dash-chip-zone" style="display:none;" onclick="clearDashFocus()"></button>
  </div>`;

  // ── Left Column (Tickets) ──
  const leftHTML = `<div class="d6-left">
    <div class="d6w">
      <div class="d6w-head">
        <span class="d6w-label">Signalements récents</span>
        <button class="d6w-action" onclick="nav('tickets')">Voir tout ${_svgArrow()}</button>
      </div>
      <div id="dash-recent-list">${_buildTicketRows(t)}</div>
    </div>
  </div>`;

  // ── Right Column (Widgets) ──
  const order = _dashGetOrder();
  let rightWidgets = '';
  for (const wid of order) {
    const cfg = DASH_WIDGETS.find(w => w.id === wid);
    if (!cfg) continue;
    if (cfg.managerOnly && !isManager()) continue;
    const visible = _dashGetWidgetPref(wid, 'visible');
    if (!visible) continue;

    switch (wid) {
      case 'situation':
        rightWidgets += `<div class="d6w">
          <div class="d6w-head"><span class="d6w-label">Situation</span></div>
          ${_buildSituationRoom(ouverts, critiques, syndic)}
        </div>`;
        break;
      case 'chart':
        rightWidgets += _d6Widget('Activité · 6 mois', null, null, `<div class="d6-chart-wrap">
          <div class="d6-chart-legend">
            <div class="d6-chart-legend-item"><div class="d6-chart-legend-dot" style="background:#3b82f6;"></div>Créés</div>
            <div class="d6-chart-legend-item"><div class="d6-chart-legend-dot" style="background:#22c55e;"></div>Résolus</div>
          </div>
          <div style="position:relative;height:130px;"><canvas id="dash-chart" role="img" aria-label="Graphique d'activité sur 6 mois">Évolution des signalements créés et résolus.</canvas></div>
        </div>`);
        break;
      case 'zones':
        rightWidgets += _d6Widget('Par bâtiment', 'Carte', "nav('map')", `<div id="dash-zone-list">${_buildZones(ouverts)}</div>`);
        break;
      case 'contrats':
        rightWidgets += _d6Widget('Contrats fournisseurs', 'Gérer', "nav('contrats')", _buildContrats());
        break;
      case 'events':
        rightWidgets += _d6Widget('Événements à venir', 'Agenda', "nav('agenda')", '<div class="d6-empty" id="dash-events-list">Chargement…</div>');
        break;
      case 'annonces':
        rightWidgets += _d6Widget('Dernières annonces', 'Toutes', "nav('annonces')", '<div class="d6-empty" id="dash-annonces-list">Chargement…</div>');
        break;
      case 'votes':
        rightWidgets += _d6Widget('Votes en cours', 'Voter', "nav('votes')", _buildVotes());
        break;
      case 'documents':
        rightWidgets += _d6Widget('Documents récents', 'Voir tout', "nav('documents')", _buildDocuments());
        break;
      case 'install':
        rightWidgets += _d6Widget("Installer l'app", null, null, `<div class="d6-row" style="cursor:default;">
          <div class="d6-row-ico">📱</div>
          <div class="d6-row-body">
            <div class="d6-row-title">Accès rapide depuis votre téléphone</div>
            <div class="d6-row-sub">iPhone : Safari → Partager → Sur l'écran d'accueil</div>
          </div>
        </div>`);
        break;
    }
  }

  // ── Customize Panel ──
  const customHTML = `<div class="d6-customize" id="d5-customize">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <div style="font-family:var(--font-head);font-size:17px;font-weight:800;">Personnaliser</div>
      <button class="btn btn-ghost btn-sm" onclick="dashToggleCustomize()">✕</button>
    </div>
    <div style="font-size:12px;color:var(--text-3);margin-bottom:14px;">Activez ou masquez les widgets.</div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${DASH_WIDGETS.filter(w => !w.managerOnly || isManager()).map(w => {
        const vis = _dashGetWidgetPref(w.id, 'visible');
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2);opacity:${vis?1:.6};">
          <span style="font-size:18px;line-height:1;">${w.ico}</span>
          <span style="flex:1;font-size:13px;font-weight:600;">${w.label}</span>
          <button class="${vis?'btn btn-primary':'btn btn-secondary'} btn-sm" onclick="dashToggleWidget('${w.id}')">${vis ? 'Masquer' : 'Afficher'}</button>
        </div>`;
      }).join('')}
      <button class="btn btn-ghost btn-sm" style="margin-top:6px;" onclick="dashResetPrefs()">↺ Réinitialiser</button>
    </div>
  </div>`;

  // ── Final Render ──
  el.style.padding = '0';
  el.innerHTML = `<div class="dash6" style="animation:pageIn .22s ease both;">
    ${heroHTML}
    ${kpisHTML}
    ${focusHTML}
    <div class="d6-editbar" id="d5-editbar"></div>
    <div class="d6-grid">
      ${leftHTML}
      <div class="d6-right" id="dash-widgets-col">${rightWidgets}</div>
    </div>
    ${customHTML}
  </div>`;

  await loadDashboardWidgets();
}

// ── LOAD ASYNC WIDGETS ────────────────────────────────────────────────────────
async function loadDashboardWidgets() {
  // Events
  try {
    const { data: evts } = await sb.from('evenements').select('*').gte('date_debut', new Date().toISOString()).order('date_debut').limit(4);
    const evtEl = $('dash-events-list');
    if (evtEl) {
      if (!evts || !evts.length) {
        evtEl.innerHTML = '<div class="d6-empty">Aucun événement à venir</div>';
      } else {
        evtEl.className = '';
        evtEl.innerHTML = evts.map(e => {
          const et = (typeof EVENT_TYPES !== 'undefined' && EVENT_TYPES[e.type]) ? EVENT_TYPES[e.type] : { color: '#6b7280' };
          const d = new Date(e.date_debut);
          const isImmi = (d - new Date()) < 86400000;
          return `<div class="d6-row" onclick="nav('agenda')">
            <div style="width:4px;height:36px;border-radius:2px;background:${et.color};flex-shrink:0;"></div>
            <div class="d6-row-body">
              <div class="d6-row-title" style="${isImmi ? 'color:var(--orange);' : ''}">${_e(e.titre)}</div>
              <div class="d6-row-sub">📅 ${d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})} à ${d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}${e.lieu ? ' · ' + _e(e.lieu) : ''}</div>
            </div>
            ${isImmi ? '<span class="d6-badge soon">Bientôt</span>' : ''}
          </div>`;
        }).join('');
      }
    }
  } catch(e) {}

  // Annonces
  try {
    const { data: annsRaw } = await sb.from('annonces').select('*').order('epingle', { ascending: false }).order('created_at', { ascending: false }).limit(12);
    const anns = (annsRaw||[]).filter(a => typeof annonceReaderCanSee === 'function' ? annonceReaderCanSee(a) : true).slice(0, 3);
    const annEl = $('dash-annonces-list');
    if (annEl) {
      if (!anns.length) {
        annEl.innerHTML = '<div class="d6-empty">Aucune annonce</div>';
      } else {
        annEl.className = '';
        const icos = { urgent: '🚨', important: '⚠️', info: '📢' };
        annEl.innerHTML = anns.map(a => `<div class="d6-row" onclick="nav('annonces')">
          <div class="d6-row-ico">${a.epingle ? '📌' : (icos[a.type] || '📢')}</div>
          <div class="d6-row-body">
            <div class="d6-row-title">${_e(a.titre)}</div>
            ${a.contenu ? `<div class="d6-row-sub">${_e(a.contenu.substring(0, 55))}${a.contenu.length > 55 ? '…' : ''}</div>` : ''}
          </div>
          ${a.epingle ? '<span class="d6-badge new">Épinglé</span>' : ''}
        </div>`).join('');
      }
    }
  } catch(e) {}

  renderDashChart();
}

// ── CHART ──────────────────────────────────────────────────────────────────────
function renderDashChart() {
  const canvas = $('dash-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#6b6860' : '#9b9890';
  const gridColor = isDark ? '#2a2825' : '#f1f5f9';
  const tks = getDashTicketsForChart();
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString('fr-FR', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() });
  }
  const created = months.map(m => tks.filter(t => { const d = new Date(t.created_at); return d.getFullYear() === m.year && d.getMonth() === m.month; }).length);
  const resolved = months.map(m => tks.filter(t => { if (t.statut !== 'résolu' && t.statut !== 'clos') return false; const d = new Date(t.updated_at || t.created_at); return d.getFullYear() === m.year && d.getMonth() === m.month; }).length);
  const W = canvas.offsetWidth || 340, H = 130;
  canvas.width = W; canvas.height = H;
  const pad = { top: 8, right: 10, bottom: 24, left: 28 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const maxV = Math.max(...created, ...resolved, 1);
  const barW = (cW / months.length) * 0.30, barG = (cW / months.length) * 0.08;
  ctx.clearRect(0, 0, W, H);
  [0, 1, 2, 3].forEach(i => {
    const y = pad.top + (cH / 3) * i;
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    if (i < 3) { ctx.fillStyle = textColor; ctx.font = '9px sans-serif'; ctx.textAlign = 'right'; ctx.fillText(Math.round(maxV - (maxV / 3) * i), pad.left - 3, y + 3); }
  });
  months.forEach((m, i) => {
    const x = pad.left + (cW / months.length) * i + (cW / months.length) * 0.12;
    const h1 = (created[i] / maxV) * cH;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.roundRect(x, pad.top + cH - h1, barW, h1, [2, 2, 0, 0]); ctx.fill();
    const h2 = (resolved[i] / maxV) * cH;
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.roundRect(x + barW + barG, pad.top + cH - h2, barW, h2, [2, 2, 0, 0]); ctx.fill();
    ctx.fillStyle = textColor; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(m.label, x + barW + barG / 2, H - 6);
  });
}

// ── FOCUS / FILTRE ────────────────────────────────────────────────────────────
function clearDashFocus() { setDashFocus('tout'); }
function setDashZoneFocus(zone) { _dashFocusMode = 'zone'; _dashFocusZone = zone; refreshDashFocus(); }
function setDashFocus(mode) { _dashFocusMode = mode || 'tout'; _dashFocusZone = null; refreshDashFocus(); }

function getDashTicketsForRecent() {
  const l = cache.tickets || [], m = _dashFocusMode;
  const isOpen = t => t.statut !== 'résolu' && t.statut !== 'clos';
  if (m === 'tout')     return l;
  if (m === 'ouvert')   return l.filter(t => isOpen(t));
  if (m === 'critique') return l.filter(t => t.urgence === 'critique' && isOpen(t));
  if (m === 'resolu')   return l.filter(t => !isOpen(t));
  if (m === 'mine')     return l.filter(t => t.auteur_id === (user?.id) && isOpen(t));
  if (m === 'transmis') return l.filter(t => t.statut === 'transmis_syndic');
  if (m === 'zone')     return l.filter(t => t.batiment === _dashFocusZone && isOpen(t));
  return l;
}
function getDashTicketsForZones() { return _dashFocusMode === 'tout' ? (cache.tickets||[]).filter(t => t.statut !== 'résolu' && t.statut !== 'clos') : getDashTicketsForRecent(); }
function getDashTicketsForChart() { return _dashFocusMode === 'tout' ? (cache.tickets||[]) : getDashTicketsForRecent(); }

function refreshDashFocus() {
  const recentEl = $('dash-recent-list'), zoneEl = $('dash-zone-list');
  const bar = $('dash-focusbar');
  if (bar) {
    bar.querySelectorAll('[data-dash-focus]').forEach(btn => {
      const k = btn.getAttribute('data-dash-focus');
      const isActive = k === _dashFocusMode;
      btn.className = 'd6-chip' + (isActive ? (k === 'ouvert' ? ' sel-warn' : k === 'critique' ? ' sel-danger' : k === 'resolu' ? ' sel-success' : ' sel') : '');
    });
    const cz = $('dash-chip-zone');
    if (cz) { const show = _dashFocusMode === 'zone' && !!_dashFocusZone; cz.style.display = show ? '' : 'none'; if (show) cz.textContent = 'Zone : ' + _dashFocusZone + ' ×'; }
  }
  if (recentEl) recentEl.innerHTML = _buildTicketRows(getDashTicketsForRecent());
  if (zoneEl)   zoneEl.innerHTML   = _buildZones(getDashTicketsForZones());
  renderDashChart();
}

// ── WIDGET CONTROLS ───────────────────────────────────────────────────────────
window.dashToggleWidget = function(id) {
  const cur = _dashGetWidgetPref(id, 'visible');
  _dashSetWidgetPref(id, 'visible', !cur);
  renderDashboard();
};

window.dashToggleCustomize = function() {
  const panel = document.getElementById('d5-customize');
  if (panel) panel.classList.toggle('open');
};

window.dashResetPrefs = function() {
  if (!confirm('Réinitialiser toutes les préférences du tableau de bord ?')) return;
  try { localStorage.removeItem(DASH_LS_KEY); } catch(e) {}
  renderDashboard();
  if (typeof toast === 'function') toast('Tableau de bord réinitialisé', 'ok');
};

// ── TICKETS PAGE ──────────────────────────────────────────────────────────────
let _ticketFilters = { search: '', statut: 'all', urgence: 'all', zone: 'all' };
let _ticketSelection = new Set();

function renderTickets() {
  const page = $('page');
  if (!page) return;
  const allT = cache.tickets || [];
  const ouverts = allT.filter(t => !['résolu', 'clos'].includes(t.statut)).length;
  const byBat = allT.reduce((acc, t) => { const k = t.batiment || 'Général'; acc[k] = true; return acc; }, {});
  const batOptions = ['all', ...Object.keys(byBat).sort()];
  page.style.padding = '0';
  page.innerHTML = `<div>
    <div class="saas-toolbar">
      <div style="flex:1;min-width:0;">
        <div style="font-family:var(--font-head);font-size:20px;font-weight:800;letter-spacing:-.4px;color:var(--text);">Signalements</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:1px;">${allT.length} au total · <strong style="color:var(--text);">${ouverts} ouverts</strong></div>
      </div>
      <div style="position:relative;flex:1;min-width:180px;max-width:280px;">
        <svg style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text-3);" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="search" id="tk-search" class="saas-input" placeholder="Rechercher…" style="padding-left:34px;width:100%;" oninput="updateTicketFilters()">
      </div>
      <select id="tk-statut" class="saas-select" onchange="updateTicketFilters()">
        <option value="all">Statut</option>
        <option value="nouveau">Nouveau</option>
        <option value="en_cours">En cours</option>
        <option value="attente_intervention">En attente</option>
        <option value="transmis_syndic">Transmis</option>
        <option value="resolu_clos">Résolu / Clos</option>
      </select>
      <select id="tk-urgence" class="saas-select" onchange="updateTicketFilters()">
        <option value="all">Urgence</option>
        <option value="critique">Critique</option>
        <option value="important">Important</option>
        <option value="normal">Normal</option>
      </select>
      <select id="tk-zone" class="saas-select" onchange="updateTicketFilters()">
        <option value="all">Zone</option>
        ${batOptions.filter(b => b !== 'all').map(b => `<option value="${b}">${b}</option>`).join('')}
      </select>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-ghost btn-sm" onclick="saveTicketPreset()" title="Sauvegarder les filtres">💾</button>
        <button class="btn btn-ghost btn-sm" onclick="clearTicketPreset()">↺</button>
        <button class="btn btn-primary" onclick="openNewTicket()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Signaler
        </button>
      </div>
    </div>
    ${typeof isManager === 'function' && isManager() ? `<div id="tickets-bulk-bar" style="display:none;"></div>` : ''}
    <div class="saas-table-wrap">
      <div class="saas-grid saas-th" style="grid-template-columns:32px minmax(250px,3fr) 130px 150px minmax(100px,1.5fr) 95px 60px;background:var(--surface-2);border-bottom:1px solid var(--border);">
        <div><input type="checkbox" id="t-select-all" class="saas-checkbox" onclick="event.stopPropagation();toggleAllTicketsFromCurrentFilter()"></div>
        <div>Signalement</div><div>Urgence</div><div>Statut</div><div>Zone</div><div>Date</div><div></div>
      </div>
      <div id="tickets-list"><div style="padding:60px;text-align:center;"><div class="spinner"></div></div></div>
    </div>
  </div>`;
  _ticketSelection = new Set();
  loadTicketPreset();
  renderTicketsList();
}

function updateTicketFilters() {
  _ticketFilters.search = $('tk-search')?.value.toLowerCase().trim() || '';
  _ticketFilters.statut = $('tk-statut')?.value || 'all';
  _ticketFilters.urgence = $('tk-urgence')?.value || 'all';
  _ticketFilters.zone = $('tk-zone')?.value || 'all';
  renderTicketsList();
}

function getFilteredTickets() {
  const allT = cache.tickets || [];
  return allT.filter(t => {
    if (_ticketFilters.statut === 'resolu_clos' && t.statut !== 'résolu' && t.statut !== 'clos') return false;
    if (_ticketFilters.statut !== 'all' && _ticketFilters.statut !== 'resolu_clos' && t.statut !== _ticketFilters.statut) return false;
    if (_ticketFilters.urgence !== 'all' && t.urgence !== _ticketFilters.urgence) return false;
    if (_ticketFilters.zone !== 'all' && (t.batiment || 'Général') !== _ticketFilters.zone) return false;
    if (_ticketFilters.search) {
      const q = _ticketFilters.search;
      if (!(t.titre||'').toLowerCase().includes(q) && !(t.description||'').toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function renderTicketsList() {
  const container = $('tickets-list');
  if (!container) return;
  const filtered = getFilteredTickets();
  if (!filtered.length) {
    container.innerHTML = `<div style="padding:60px 20px;text-align:center;color:var(--text-3);font-size:14px;">Aucun signalement ne correspond à vos filtres.</div>`;
    return;
  }
  const urgBadge = u => {
    if (u === 'critique') return `<span class="saas-badge urg-critique"><span class="dot"></span>Critique</span>`;
    if (u === 'important') return `<span class="saas-badge urg-important"><span class="dot"></span>Important</span>`;
    return `<span class="saas-badge urg-normal"><span class="dot"></span>Normal</span>`;
  };
  const statBadge = s => {
    if (s === 'nouveau') return `<span class="saas-badge stat-nouveau">Nouveau</span>`;
    if (s === 'résolu' || s === 'clos') return `<span class="saas-badge stat-resolu">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`;
    if (s === 'transmis_syndic') return `<span class="saas-badge stat-transmis">Transmis</span>`;
    if (s === 'attente_intervention') return `<span class="saas-badge stat-attente">Attente</span>`;
    return `<span class="saas-badge stat-encours">En cours</span>`;
  };
  const isManagerUser = typeof isManager === 'function' ? isManager() : false;
  container.innerHTML = filtered.map(t => {
    const created = new Date(t.created_at);
    const dateStr = created.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const daysOld = Math.floor((new Date() - created) / 86400000);
    const isLate = daysOld > 14 && t.statut !== 'résolu' && t.statut !== 'clos';
    const accent = t.urgence === 'critique' ? 'var(--red)' : t.urgence === 'important' ? 'var(--orange)' : 'var(--accent)';
    return `<div class="saas-grid saas-tr" style="grid-template-columns:32px minmax(250px,3fr) 130px 150px minmax(100px,1.5fr) 95px 60px;position:relative;" onclick="openDetail('${t.id}')">
      <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${accent};"></div>
      ${isManagerUser ? `<div onclick="event.stopPropagation()"><input type="checkbox" class="saas-checkbox" ${_ticketSelection.has(t.id) ? 'checked' : ''} onchange="setTicketSelected('${t.id}', this.checked)"></div>` : '<div></div>'}
      <div style="min-width:0;">
        <div class="tk-title">${escHtml(t.titre)}</div>
        <div class="tk-sub">${escHtml((t.categorie||'autre').replace(/_/g,' '))} · ${escHtml(t.batiment || 'Général')}</div>
      </div>
      <div>${urgBadge(t.urgence)}</div>
      <div>${statBadge(t.statut)}</div>
      <div class="tk-zone">${escHtml(t.batiment || '—')}</div>
      <div>
        <div class="tk-date">${dateStr}</div>
        <div class="tk-time ${isLate ? 'late' : ''}">${daysOld}j</div>
      </div>
      <div class="tk-action" style="padding-right:16px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    </div>`;
  }).join('');
  if (isManagerUser && $('t-select-all')) {
    const allIds = filtered.map(x => x.id);
    $('t-select-all').checked = allIds.length > 0 && allIds.every(id => _ticketSelection.has(id));
  }
}

function saveTicketPreset() {
  localStorage.setItem(TK_PRESET_KEY, JSON.stringify(_ticketFilters));
  if (typeof toast === 'function') toast('Filtres sauvegardés', 'ok');
}
function loadTicketPreset() {
  try { const raw = localStorage.getItem(TK_PRESET_KEY); if (raw) { _ticketFilters = JSON.parse(raw); if ($('tk-statut')) $('tk-statut').value = _ticketFilters.statut; if ($('tk-urgence')) $('tk-urgence').value = _ticketFilters.urgence; if ($('tk-zone')) $('tk-zone').value = _ticketFilters.zone; if ($('tk-search')) $('tk-search').value = _ticketFilters.search; } } catch(e) {}
}
function clearTicketPreset() {
  localStorage.removeItem(TK_PRESET_KEY);
  _ticketFilters = { search: '', statut: 'all', urgence: 'all', zone: 'all' };
  if ($('tk-statut')) $('tk-statut').value = 'all';
  if ($('tk-urgence')) $('tk-urgence').value = 'all';
  if ($('tk-zone')) $('tk-zone').value = 'all';
  if ($('tk-search')) $('tk-search').value = '';
  renderTicketsList();
}

function setTicketSelected(id, selected) {
  if (selected) _ticketSelection.add(id); else _ticketSelection.delete(id);
  renderBulkTicketBar();
}
function toggleAllTicketsFromCurrentFilter() {
  const allChecked = $('t-select-all')?.checked;
  const ids = getFilteredTickets().map(t => t.id);
  ids.forEach(id => allChecked ? _ticketSelection.add(id) : _ticketSelection.delete(id));
  renderTicketsList(); renderBulkTicketBar();
}
function renderBulkTicketBar() {
  const bar = $('tickets-bulk-bar');
  if (!bar) return;
  const n = _ticketSelection.size;
  if (!n) { bar.style.display = 'none'; bar.innerHTML = ''; return; }
  bar.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 20px;background:var(--text);color:white;font-size:13px;font-weight:600;';
  bar.innerHTML = `<span>${n} sélectionné(s)</span>
    <select id="bulk-statut" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);color:white;padding:6px 10px;border-radius:6px;font-size:12px;">
      <option value="">Changer le statut…</option>
      <option value="en_cours" style="color:black;">En cours</option>
      <option value="transmis_syndic" style="color:black;">Transmis syndic</option>
      <option value="résolu" style="color:black;">Résolu</option>
      <option value="clos" style="color:black;">Clos</option>
    </select>
    <button class="btn btn-sm" style="background:white;color:var(--text);" onclick="applyBulkTicketStatus()">Appliquer</button>
    <button class="btn btn-ghost btn-sm" style="color:rgba(255,255,255,.6);" onclick="clearTicketSelection()">Annuler</button>`;
}
function clearTicketSelection() { _ticketSelection.clear(); renderTicketsList(); renderBulkTicketBar(); }
async function applyBulkTicketStatus() {
  const statut = $('bulk-statut')?.value;
  if (!statut) { toast('Choisir un statut', 'warn'); return; }
  const ids = Array.from(_ticketSelection);
  const { error } = await sb.from('tickets').update({ statut, updated_at: new Date().toISOString() }).in('id', ids);
  if (error) { toast('Erreur', 'err'); return; }
  cache.tickets = cache.tickets.map(t => ids.includes(t.id) ? { ...t, statut } : t);
  toast('Statuts mis à jour', 'ok'); clearTicketSelection();
}
