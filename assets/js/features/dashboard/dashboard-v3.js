let _dashWidgetDragKey = null;
let _dashPointerDrag = null;
let _dashResizeBound = false;
const DASH_WIDGET_ORDER_KEY = 'coprosync_dash_widget_order_v3';

function isResolvedStatut(statut) {
  var value = String(statut || '').toLowerCase();
  return value === 'clos' || value.indexOf('solu') !== -1;
}
function isOpenStatut(statut) { return !isResolvedStatut(statut); }

function getDashboardZoneNames() {
  return (COPRO.tours || []).concat([
    'Parking visiteurs',
    'Parking prive',
    'Garages',
    'Aire de jeux',
    'Portails / portillons',
    'Exterieur general'
  ]);
}

function getDashboardState() {
  var tickets = cache.tickets || [];
  var ouverts = tickets.filter(function(t) { return isOpenStatut(t.statut); });
  var critiques = tickets.filter(function(t) { return t.urgence === 'critique' && isOpenStatut(t.statut); });
  var syndic = tickets.filter(function(t) { return t.statut === 'transmis_syndic'; });
  var resolus = tickets.filter(function(t) { return isResolvedStatut(t.statut); });
  var mine = tickets.filter(function(t) { return t.auteur_id === user.id; });
  var contrats = cache.contrats || [];
  var actifs = contrats.filter(function(c) { return c.actif !== false; });
  var contratsExpires = actifs.filter(function(c) { return daysUntil(c.date_echeance) < 0; });
  var contratsAlertes = actifs.filter(function(c) {
    var delta = daysUntil(c.date_echeance);
    return delta >= 0 && delta <= (c.alerte_jours ?? 90);
  });
  var votesOuverts = (typeof _votesCache !== 'undefined' ? _votesCache : []).filter(function(v) { return v.statut === 'ouvert'; });
  var votesEnAttente = votesOuverts.filter(function(v) { return !(typeof _reponsesCache !== 'undefined' && _reponsesCache[v.id]); });
  var docs = typeof _docsCache !== 'undefined' ? _docsCache : [];

  return {
    tickets: tickets,
    ouverts: ouverts,
    critiques: critiques,
    syndic: syndic,
    resolus: resolus,
    mine: mine,
    contrats: actifs,
    contratsExpires: contratsExpires,
    contratsAlertes: contratsAlertes,
    votesOuverts: votesOuverts,
    votesEnAttente: votesEnAttente,
    docs: docs
  };
}

function getDashboardGreeting() {
  var full = displayName(profile && profile.prenom, profile && profile.nom, user && user.email, 'Bienvenue');
  return (full || 'Bienvenue').split(' ')[0];
}

function getDashboardSummaryText(state) {
  if (state.critiques.length) return state.critiques.length + ' ticket' + (state.critiques.length > 1 ? 's' : '') + ' critique' + (state.critiques.length > 1 ? 's' : '') + ' a traiter sans delai.';
  if (state.ouverts.length) return state.ouverts.length + ' signalement' + (state.ouverts.length > 1 ? 's' : '') + ' en cours. La residence reste sous controle.';
  return 'Aucun incident ouvert. Le tableau de bord est propre et pret pour un suivi rapide.';
}

function getDashboardPriorityCards(state) {
  var cards = [];
  if (state.critiques.length) cards.push({ tone: 'critical', icon: '!', title: state.critiques.length + ' ticket' + (state.critiques.length > 1 ? 's' : '') + ' critique' + (state.critiques.length > 1 ? 's' : ''), subtitle: 'Ouvrir la vue critique et traiter les incidents les plus urgents.', cta: 'Traiter', action: "setDashFocus('critique')" });
  if (isManager() && state.contratsExpires.length) cards.push({ tone: 'critical', icon: 'C', title: state.contratsExpires.length + ' contrat' + (state.contratsExpires.length > 1 ? 's' : '') + ' expire' + (state.contratsExpires.length > 1 ? 's' : ''), subtitle: 'Relancer les fournisseurs et lancer le renouvellement sans attendre.', cta: 'Contrats', action: "nav('contrats')" });
  if (isManager() && state.syndic.length) cards.push({ tone: 'warning', icon: 'S', title: state.syndic.length + ' dossier' + (state.syndic.length > 1 ? 's' : '') + ' transmis au syndic', subtitle: 'Verifier les blocages et les temps de reponse pour garder le rythme.', cta: 'Suivre', action: "setDashFocus('transmis')" });
  if (state.votesEnAttente.length) cards.push({ tone: 'info', icon: 'V', title: state.votesEnAttente.length + ' vote' + (state.votesEnAttente.length > 1 ? 's' : '') + ' en attente', subtitle: 'Des decisions demandent encore une participation.', cta: 'Voter', action: "nav('votes')" });
  if (!cards.length) cards.push({ tone: 'info', icon: 'OK', title: 'Aucune urgence immediate', subtitle: 'Le pilotage du jour peut se concentrer sur le suivi courant et la prevention.', cta: 'Tickets', action: "nav('tickets')" });
  return cards.slice(0, 4);
}

function renderDashboardPriorityHTML(state) {
  return getDashboardPriorityCards(state).map(function(card) {
    return ''
      + '<button class="dash3-priority-card is-' + card.tone + '" onclick="' + card.action + '">'
      + '<span class="dash3-priority-icon">' + card.icon + '</span>'
      + '<span class="dash3-priority-copy"><strong>' + escHtml(card.title) + '</strong><span>' + escHtml(card.subtitle) + '</span></span>'
      + '<span class="dash3-priority-cta">' + escHtml(card.cta) + ' -></span>'
      + '</button>';
  }).join('');
}

function getDashboardWidgetDefaults() {
  var list = ['activity', 'events', 'annonces', 'votes', 'documents', 'install'];
  if (isManager()) list.splice(1, 0, 'contrats');
  return list;
}

function getDashboardWidgetOrder() {
  var defaults = getDashboardWidgetDefaults();
  try {
    var raw = localStorage.getItem(DASH_WIDGET_ORDER_KEY);
    if (!raw) return defaults;
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaults;
    var filtered = parsed.filter(function(key) { return defaults.includes(key); });
    defaults.forEach(function(key) { if (!filtered.includes(key)) filtered.push(key); });
    return filtered;
  } catch (e) {
    return defaults;
  }
}

function saveDashboardWidgetOrder(order) {
  try { localStorage.setItem(DASH_WIDGET_ORDER_KEY, JSON.stringify(order)); } catch (e) {}
}

saveDashboardWidgetOrderFromDOM = function() {
  var rail = $('dash-widget-rail');
  if (!rail) return;
  saveDashboardWidgetOrder(Array.from(rail.querySelectorAll('[data-widget-key]')).map(function(node) { return node.getAttribute('data-widget-key'); }));
};

function buildDashboardWidgetFrame(key, title, subtitle, body, actionHTML) {
  return ''
    + '<article class="dash3-widget" draggable="true" data-widget-key="' + key + '">'
    + '<div class="dash3-widget-head">'
    + '<div><h3>' + escHtml(title) + '</h3><p>' + escHtml(subtitle) + '</p></div>'
    + '<div class="dash3-widget-tools">'
    + (actionHTML || '')
    + '<button class="dash3-widget-handle" type="button" title="Reorganiser">::</button>'
    + '<span class="dash3-widget-tools-mobile">'
    + '<button class="dash3-widget-tool" type="button" onclick="moveDashboardWidget(\'' + key + '\', -1)" title="Monter">^</button>'
    + '<button class="dash3-widget-tool" type="button" onclick="moveDashboardWidget(\'' + key + '\', 1)" title="Descendre">v</button>'
    + '</span></div></div>'
    + '<div class="dash3-widget-body">' + body + '</div>'
    + '</article>';
}

function buildDashboardActivityWidget() {
  return buildDashboardWidgetFrame('activity', 'Activite sur 6 mois', 'Crees versus resolus, avec le filtre courant applique.', '<div class="dash3-chart-wrap"><canvas id="dash-chart" class="dash3-chart" height="130"></canvas><div id="dash-chart-tip" class="dash3-chart-tip" style="display:none;"></div></div>', '');
}

function buildDashboardContratsWidget(state) {
  var conformes = state.contrats.filter(function(c) { return daysUntil(c.date_echeance) > (c.alerte_jours ?? 90); });
  var budget = state.contrats.reduce(function(sum, c) { return sum + (c.montant_annuel || 0); }, 0);
  var urgents = state.contrats.filter(function(c) { return daysUntil(c.date_echeance) <= (c.alerte_jours ?? 90); }).sort(function(a, b) { return new Date(a.date_echeance) - new Date(b.date_echeance); }).slice(0, 4);
  var body = ''
    + '<div class="dash3-contract-kpis">'
    + '<div class="dash3-contract-kpi ' + (state.contratsExpires.length ? 'is-danger' : '') + '"><strong>' + state.contratsExpires.length + '</strong><span>Expires</span></div>'
    + '<div class="dash3-contract-kpi ' + (state.contratsAlertes.length ? 'is-warning' : '') + '"><strong>' + state.contratsAlertes.length + '</strong><span>En alerte</span></div>'
    + '<div class="dash3-contract-kpi is-ok"><strong>' + conformes.length + '</strong><span>Conformes</span></div>'
    + '</div>';
  if (!urgents.length) body += '<div class="dash3-empty">Aucun contrat a surveiller de pres pour le moment.</div>';
  else body += '<div class="dash3-list">' + urgents.map(function(c) {
    var delta = daysUntil(c.date_echeance);
    var tone = delta < 0 ? 'var(--red)' : (delta <= 30 ? 'var(--orange)' : 'var(--accent)');
    var label = delta < 0 ? 'Expire depuis ' + Math.abs(delta) + ' j' : 'Echeance dans ' + delta + ' j';
    return '<div class="dash3-list-row" onclick="nav(\'contrats\')"><span class="dash3-list-accent" style="background:' + tone + ';"></span><span class="dash3-list-copy"><strong>' + escHtml(c.fournisseur || 'Contrat') + '</strong><span>' + escHtml((c.type_contrat || 'Contrat') + (c.contact_nom ? ' · ' + c.contact_nom : '')) + '</span></span><span class="dash3-list-meta">' + escHtml(label) + '</span></div>';
  }).join('') + '</div>';
  body += '<div class="dash3-budget"><span>Budget annuel actif</span><strong>' + budget.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' EUR</strong></div>';
  return buildDashboardWidgetFrame('contrats', 'Contrats fournisseurs', 'Vue priorisee sur les echeances et le budget.', body, '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'contrats\')">Ouvrir</button>');
}

function buildDashboardVotesWidget(state) {
  if (!state.votesOuverts.length) return buildDashboardWidgetFrame('votes', 'Votes en cours', 'Participation et decisions a suivre.', '<div class="dash3-empty">Aucun vote ouvert actuellement.</div>', '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'votes\')">Ouvrir</button>');
  var body = '<div class="dash3-list">' + state.votesOuverts.slice(0, 3).map(function(v) {
    var total = (typeof _allReponsesCache !== 'undefined' && _allReponsesCache[v.id]) ? _allReponsesCache[v.id].length : 0;
    var voted = typeof _reponsesCache !== 'undefined' && _reponsesCache[v.id];
    return '<div class="dash3-list-row" onclick="nav(\'votes\')"><span class="dash3-list-accent" style="background:' + (voted ? 'var(--green)' : 'var(--accent)') + ';"></span><span class="dash3-list-copy"><strong>' + escHtml(v.titre) + '</strong><span>' + total + ' participant' + (total > 1 ? 's' : '') + '</span></span><span class="dash3-list-meta">' + (voted ? 'Vote' : 'A faire') + '</span></div>';
  }).join('') + '</div>';
  return buildDashboardWidgetFrame('votes', 'Votes en cours', 'Participation et decisions a suivre.', body, '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'votes\')">Ouvrir</button>');
}

function buildDashboardDocumentsWidget(state) {
  if (!state.docs.length) return buildDashboardWidgetFrame('documents', 'Documents recents', 'Pieces utiles a retrouver vite depuis le tableau de bord.', '<div class="dash3-empty">Aucun document recent a afficher.</div>', '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'documents\')">Ouvrir</button>');
  var body = '<div class="dash3-list">' + state.docs.slice(0, 4).map(function(doc) {
    var isNew = typeof _docsVus !== 'undefined' ? !_docsVus.has(doc.id) : false;
    return '<div class="dash3-list-row" onclick="nav(\'documents\')"><span class="dash3-list-accent" style="background:' + (isNew ? 'var(--accent)' : 'var(--border-strong)') + ';"></span><span class="dash3-list-copy"><strong>' + escHtml(doc.titre) + '</strong><span>' + escHtml(fmtD(doc.created_at)) + '</span></span><span class="dash3-list-meta">' + (isNew ? 'Nouveau' : 'Archive') + '</span></div>';
  }).join('') + '</div>';
  return buildDashboardWidgetFrame('documents', 'Documents recents', 'Pieces utiles a retrouver vite depuis le tableau de bord.', body, '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'documents\')">Ouvrir</button>');
}

function buildDashboardInstallWidget() {
  var body = '<div class="dash3-empty" style="text-align:left;"><strong style="display:block;color:var(--text);margin-bottom:8px;">Version mobile</strong>Installe l application pour un acces plein ecran, plus stable sur iPhone et Android.<div class="dash3-widget-note">iPhone: Safari -> Partager -> Sur l ecran d accueil. Android: Chrome -> menu -> Installer l application.</div></div>';
  return buildDashboardWidgetFrame('install', 'Installer l application', 'Pour un usage quotidien plus fluide sur mobile.', body, '');
}

function buildDashboardEventsWidget() {
  return buildDashboardWidgetFrame('events', 'Prochains evenements', 'Agenda a venir avec les rendez-vous a ne pas manquer.', '<div id="dash-events-list" class="dash3-empty">Chargement des evenements...</div>', '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'agenda\')">Agenda</button>');
}

function buildDashboardAnnoncesWidget() {
  return buildDashboardWidgetFrame('annonces', 'Annonces', 'Messages prioritaires et informations utiles pour la residence.', '<div id="dash-annonces-list" class="dash3-empty">Chargement des annonces...</div>', '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'annonces\')">Toutes</button>');
}

function renderDashboardWidgetRail(state) {
  var order = getDashboardWidgetOrder();
  var widgets = {
    activity: buildDashboardActivityWidget(),
    events: buildDashboardEventsWidget(),
    annonces: buildDashboardAnnoncesWidget(),
    votes: buildDashboardVotesWidget(state),
    documents: buildDashboardDocumentsWidget(state),
    install: buildDashboardInstallWidget()
  };
  if (isManager()) widgets.contrats = buildDashboardContratsWidget(state);
  return order.map(function(key) { return widgets[key] || ''; }).join('');
}

function renderDashRecentListHTML(list) {
  if (!list.length) return '<div class="dash3-empty">Aucun ticket pour ce filtre. Le tableau de bord reste clair et disponible.</div>';
  return list.slice(0, 6).map(function(tk) {
    return '<button class="dash3-ticket" data-urgency="' + escHtml(tk.urgence || 'normal') + '" onclick="openDetail(\'' + tk.id + '\')"><span class="dash3-ticket-status"></span><span><span class="dash3-ticket-title">' + escHtml(tk.titre) + '</span><span class="dash3-ticket-meta">' + escHtml(tk.batiment || 'Residence') + (tk.zone ? ' · ' + escHtml(tk.zone) : '') + ' · ' + escHtml(depuisJours(tk.created_at)) + '</span></span><span class="dash3-ticket-tags">' + badgeStatut(tk.statut) + '<span class="dash3-inline-hint">' + escHtml(tk.urgence || 'normal') + '</span></span></button>';
  }).join('');
}

function renderDashZonesListHTML(tickets) {
  var counts = {};
  tickets.forEach(function(t) { if (t.batiment) counts[t.batiment] = (counts[t.batiment] || 0) + 1; });
  var zones = getDashboardZoneNames().map(function(zone) { return { name: zone, count: counts[zone] || 0 }; }).filter(function(zone) { return zone.count > 0 || _dashFocusZone === zone.name; });
  if (!zones.length) return '<div class="dash3-empty">Aucune zone a surveiller pour ce filtre.</div>';
  return zones.map(function(zone) {
    var tone = zone.count >= 3 ? 'var(--red)' : (zone.count >= 2 ? 'var(--orange)' : 'var(--accent)');
    var width = Math.min(100, zone.count * 24);
    return '<button class="dash3-zone ' + (_dashFocusMode === 'zone' && _dashFocusZone === zone.name ? 'is-selected' : '') + '" onclick="setDashZoneFocus(' + JSON.stringify(zone.name) + ')"><span class="dash3-zone-top"><span class="dash3-zone-name">' + escHtml(zone.name) + '</span><span class="dash3-zone-count" style="color:' + tone + ';">' + zone.count + '</span></span><span class="dash3-zone-bar"><span style="width:' + width + '%;background:' + tone + ';"></span></span><span class="dash3-zone-note">' + (zone.count === 1 ? '1 signalement ouvert' : zone.count + ' signalements ouverts') + '</span></button>';
  }).join('');
}

function getDashTicketsForRecent() {
  var list = cache.tickets || [];
  if (_dashFocusMode === 'tout') return list;
  if (_dashFocusMode === 'ouvert') return list.filter(function(t) { return isOpenStatut(t.statut); });
  if (_dashFocusMode === 'critique') return list.filter(function(t) { return t.urgence === 'critique' && isOpenStatut(t.statut); });
  if (_dashFocusMode === 'resolu') return list.filter(function(t) { return isResolvedStatut(t.statut); });
  if (_dashFocusMode === 'mine') return list.filter(function(t) { return t.auteur_id === user.id && isOpenStatut(t.statut); });
  if (_dashFocusMode === 'transmis') return list.filter(function(t) { return t.statut === 'transmis_syndic'; });
  if (_dashFocusMode === 'zone') return list.filter(function(t) { return t.batiment === _dashFocusZone && isOpenStatut(t.statut); });
  return list;
}

function getDashTicketsForZones() {
  if (_dashFocusMode === 'tout') return (cache.tickets || []).filter(function(t) { return isOpenStatut(t.statut); });
  return getDashTicketsForRecent();
}

function getDashTicketsForChart() {
  return _dashFocusMode === 'tout' ? (cache.tickets || []) : getDashTicketsForRecent();
}

function getDashboardFocusLabel() {
  if (_dashFocusMode === 'zone' && _dashFocusZone) return 'Zone: ' + _dashFocusZone;
  if (_dashFocusMode === 'ouvert') return 'Vue: tickets ouverts';
  if (_dashFocusMode === 'critique') return 'Vue: tickets critiques';
  if (_dashFocusMode === 'transmis') return 'Vue: transmis au syndic';
  if (_dashFocusMode === 'mine') return 'Vue: mes tickets';
  if (_dashFocusMode === 'resolu') return 'Vue: tickets resolus';
  return 'Vue: ensemble du parc';
}

function clearDashFocus() { setDashFocus('tout'); }

function setDashZoneFocus(zone) {
  _dashFocusMode = 'zone';
  _dashFocusZone = zone;
  refreshDashFocus();
}

function setDashFocus(mode) {
  _dashFocusMode = mode || 'tout';
  _dashFocusZone = null;
  refreshDashFocus();
}

function refreshDashFocus() {
  var recentEl = $('dash-recent-list');
  var zoneEl = $('dash-zone-list');
  if (!recentEl || !zoneEl) return;
  var filterBar = $('dash-focusbar');
  if (filterBar) filterBar.querySelectorAll('[data-dash-focus]').forEach(function(btn) { btn.classList.toggle('is-active', btn.getAttribute('data-dash-focus') === _dashFocusMode); });
  if ($('dash-focus-summary')) $('dash-focus-summary').textContent = getDashboardFocusLabel();
  if ($('dash-zone-reset')) $('dash-zone-reset').style.display = _dashFocusMode === 'zone' ? '' : 'none';
  recentEl.innerHTML = renderDashRecentListHTML(getDashTicketsForRecent());
  zoneEl.innerHTML = renderDashZonesListHTML(getDashTicketsForZones());
  renderDashChart();
}

function moveDashboardWidget(key, delta) {
  var rail = $('dash-widget-rail');
  if (!rail) return;
  var nodes = Array.from(rail.querySelectorAll('[data-widget-key]'));
  var index = nodes.findIndex(function(node) { return node.getAttribute('data-widget-key') === key; });
  if (index < 0) return;
  var target = index + delta;
  if (target < 0 || target >= nodes.length) return;
  var current = nodes[index];
  var pivot = nodes[target];
  if (delta > 0) rail.insertBefore(pivot, current);
  else rail.insertBefore(current, pivot);
  saveDashboardWidgetOrderFromDOM();
}

initDashboardWidgetRail = function() {
  var rail = $('dash-widget-rail');
  if (!rail || rail.__dashReady) return;
  rail.__dashReady = true;
  rail.addEventListener('dragstart', function(e) {
    var card = e.target.closest('.dash3-widget');
    if (!card) return;
    _dashWidgetDragKey = card.getAttribute('data-widget-key');
    card.classList.add('is-dragging');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', _dashWidgetDragKey); } catch (err) {}
    }
  });
  rail.addEventListener('dragend', function() {
    _dashWidgetDragKey = null;
    rail.querySelectorAll('.dash3-widget').forEach(function(node) { node.classList.remove('is-dragging'); node.removeAttribute('data-drag-over'); });
    saveDashboardWidgetOrderFromDOM();
  });
  rail.addEventListener('dragover', function(e) {
    if (!_dashWidgetDragKey) return;
    var over = e.target.closest('.dash3-widget');
    var dragging = rail.querySelector('.dash3-widget.is-dragging');
    if (!over || !dragging || over === dragging) return;
    e.preventDefault();
    rail.querySelectorAll('.dash3-widget').forEach(function(node) { node.removeAttribute('data-drag-over'); });
    over.setAttribute('data-drag-over', 'true');
    var rect = over.getBoundingClientRect();
    var after = e.clientY > rect.top + rect.height / 2;
    rail.insertBefore(dragging, after ? over.nextSibling : over);
  });
  rail.addEventListener('drop', function(e) {
    e.preventDefault();
    rail.querySelectorAll('.dash3-widget').forEach(function(node) { node.removeAttribute('data-drag-over'); });
    saveDashboardWidgetOrderFromDOM();
  });
};

function initDashboardResizeBinding() {
  if (_dashResizeBound) return;
  _dashResizeBound = true;
  window.addEventListener('resize', function() { if (currentPage === 'dashboard') renderDashChart(); });
}

async function renderDashboard() {
  var el = $('page');
  if (!cache.tickets && !isCopro()) {
    el.innerHTML = '<div style="padding:16px;">Chargement du tableau de bord...</div>';
    return;
  }

  _dashFocusMode = 'tout';
  _dashFocusZone = null;

  var state = getDashboardState();
  var firstName = getDashboardGreeting();
  var openOrMine = isManager() ? state.syndic.length : state.mine.length;

  el.innerHTML = ''
    + '<div class="dash3"><div class="dash3-shell">'
    + '<section class="dash3-overview">'
    + '<div class="dash3-hero"><div class="dash3-topline"><div class="dash3-kicker">' + new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</div><div class="dash3-sync"><span class="dash3-sync-dot"></span>Maj ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '</div></div><div class="dash3-hero-grid"><div><h1 class="dash3-title">Bonjour ' + escHtml(firstName) + ', pilotons la residence.</h1><div class="dash3-subtitle">' + escHtml(getDashboardSummaryText(state)) + '</div><div class="dash3-actions"><button class="btn btn-primary" onclick="openNewTicket()">Nouveau signalement</button><button class="btn btn-secondary" onclick="nav(\'tickets\')">Tous les signalements</button><button class="btn btn-ghost" onclick="nav(\'faq\')">FAQ</button></div></div><div class="dash3-summary-card"><div class="dash3-summary-label">Focus du jour</div><div class="dash3-summary-value">' + state.ouverts.length + '</div><div class="dash3-summary-note">tickets actifs a suivre, dont ' + state.critiques.length + ' critiques et ' + state.resolus.length + ' deja resolus.</div></div></div></div>'
    + '<aside class="dash3-panel dash3-priority-panel"><div class="dash3-panel-head"><div><div class="dash3-panel-title">Actions prioritaires</div><div class="dash3-panel-subtitle">Ce qui demande une decision ou un suivi rapide.</div></div></div><div class="dash3-priority-list">' + renderDashboardPriorityHTML(state) + '</div></aside>'
    + '</section>'
    + '<section class="dash3-kpis">'
    + '<button class="dash3-kpi" data-tone="warning" onclick="setDashFocus(\'ouvert\')"><div class="dash3-kpi-label">Ouverts</div><div class="dash3-kpi-value">' + state.ouverts.length + '</div><div class="dash3-kpi-meta">Signalements en cours</div></button>'
    + '<button class="dash3-kpi" data-tone="critical" onclick="setDashFocus(\'critique\')"><div class="dash3-kpi-label">Critiques</div><div class="dash3-kpi-value">' + state.critiques.length + '</div><div class="dash3-kpi-meta">Traitement immediat</div></button>'
    + '<button class="dash3-kpi" data-tone="info" onclick="' + (isManager() ? "setDashFocus('transmis')" : "setDashFocus('mine')") + '"><div class="dash3-kpi-label">' + (isManager() ? 'Transmis' : 'Mes tickets') + '</div><div class="dash3-kpi-value">' + openOrMine + '</div><div class="dash3-kpi-meta">' + (isManager() ? 'En attente syndic' : 'Crees par vous') + '</div></button>'
    + '<button class="dash3-kpi" data-tone="success" onclick="setDashFocus(\'resolu\')"><div class="dash3-kpi-label">Resolus</div><div class="dash3-kpi-value">' + state.resolus.length + '</div><div class="dash3-kpi-meta">Historique traite</div></button>'
    + '</section>'
    + '<section class="dash3-filterbar" id="dash-focusbar"><div class="dash3-filter-copy"><strong>Vue rapide</strong><span id="dash-focus-summary">Vue: ensemble du parc</span></div><div class="dash3-filters"><button class="dash3-filter is-active" data-dash-focus="tout" onclick="setDashFocus(\'tout\')">Tout</button><button class="dash3-filter" data-tone="warning" data-dash-focus="ouvert" onclick="setDashFocus(\'ouvert\')">Ouverts</button><button class="dash3-filter" data-tone="critical" data-dash-focus="critique" onclick="setDashFocus(\'critique\')">Critiques</button><button class="dash3-filter" data-tone="info" data-dash-focus="' + (isManager() ? 'transmis' : 'mine') + '" onclick="' + (isManager() ? "setDashFocus('transmis')" : "setDashFocus('mine')") + '">' + (isManager() ? 'Transmis' : 'Mes tickets') + '</button><button class="dash3-filter" data-tone="success" data-dash-focus="resolu" onclick="setDashFocus(\'resolu\')">Resolus</button><button class="dash3-filter" id="dash-zone-reset" style="display:none;" onclick="clearDashFocus()">Quitter la zone</button></div></section>'
    + '<section class="dash3-layout"><div class="dash3-main"><article class="dash3-card"><div class="dash3-card-head"><div><h2>File de traitement</h2><p>Les tickets les plus utiles a voir tout de suite selon le filtre courant.</p></div><button class="btn btn-ghost btn-sm dash3-card-action" onclick="nav(\'tickets\')">Ouvrir</button></div><div class="dash3-card-body"><div id="dash-recent-list" class="dash3-ticket-list">' + renderDashRecentListHTML(getDashTicketsForRecent()) + '</div></div></article><article class="dash3-card"><div class="dash3-card-head"><div><h2>Zones sous tension</h2><p>Clique une zone pour concentrer la vue. Tres utile sur mobile pour rester rapide.</p></div><button class="btn btn-ghost btn-sm dash3-card-action" onclick="nav(\'map\')">Carte</button></div><div class="dash3-card-body"><div id="dash-zone-list" class="dash3-zone-grid">' + renderDashZonesListHTML(getDashTicketsForZones()) + '</div></div></article></div><aside class="dash3-rail"><div id="dash-widget-rail" class="dash3-widget-rail">' + renderDashboardWidgetRail(state) + '</div></aside></section>'
    + '</div></div>';

  initDashboardWidgetRail();
  initDashboardResizeBinding();
  loadDashboardWidgets();
  renderDashChart();
}

async function loadDashboardWidgets() {
  var evtEl = $('dash-events-list');
  var annEl = $('dash-annonces-list');
  var now = new Date().toISOString();
  var evtRes = await sb.from('evenements').select('*').gte('date_debut', now).order('date_debut').limit(4);
  var events = evtRes.data || [];
  if (evtEl) {
    if (!events.length) evtEl.innerHTML = '<div class="dash3-empty">Aucun evenement a venir.</div>';
    else evtEl.innerHTML = '<div class="dash3-list">' + events.map(function(e) {
      var type = (typeof EVENT_TYPES !== 'undefined' && EVENT_TYPES[e.type]) ? EVENT_TYPES[e.type] : { color: '#6b7280' };
      var date = new Date(e.date_debut);
      var soon = (date - new Date()) < 86400000;
      return '<div class="dash3-list-row" onclick="nav(\'agenda\')"><span class="dash3-list-accent" style="background:' + (type.color || 'var(--accent)') + ';"></span><span class="dash3-list-copy"><strong>' + escHtml(e.titre) + '</strong><span>' + date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' · ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + (e.lieu ? ' · ' + escHtml(e.lieu) : '') + '</span></span><span class="dash3-list-meta">' + (soon ? 'Bientot' : 'Agenda') + '</span></div>';
    }).join('') + '</div>';
    events.filter(function(e) { var diff = new Date(e.date_debut) - new Date(); return diff > 0 && diff < 86400000; }).forEach(function(e) {
      pushNotif('Rappel agenda', e.titre + ' demain a ' + new Date(e.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), 'statut_change', null);
    });
  }
  var annRes = await sb.from('annonces').select('*').order('epingle', { ascending: false }).order('created_at', { ascending: false }).limit(12);
  var annonces = (annRes.data || []).filter(function(a) { return annonceReaderCanSee(a); }).slice(0, 3);
  if (annEl) {
    if (!annonces.length) annEl.innerHTML = '<div class="dash3-empty">Aucune annonce recente.</div>';
    else annEl.innerHTML = '<div class="dash3-list">' + annonces.map(function(a) {
      var level = a.type === 'urgent' ? 'var(--red)' : (a.type === 'important' ? 'var(--orange)' : 'var(--accent)');
      var snippet = a.contenu ? a.contenu.substring(0, 92) + (a.contenu.length > 92 ? '...' : '') : 'Annonce sans apercu.';
      return '<div class="dash3-list-row" onclick="nav(\'annonces\')"><span class="dash3-list-accent" style="background:' + level + ';"></span><span class="dash3-list-copy"><strong>' + escHtml(a.titre) + '</strong><span>' + escHtml(snippet) + '</span></span><span class="dash3-list-meta">' + (a.epingle ? 'Epinglee' : fmtD(a.created_at)) + '</span></div>';
    }).join('') + '</div>';
  }
  renderDashChart();
}

function renderDashChart() {
  var canvas = $('dash-chart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var tipEl = $('dash-chart-tip');
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  var months = [];
  var now = new Date();
  for (var i = 5; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString('fr-FR', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() });
  }
  var source = getDashTicketsForChart();
  var created = months.map(function(m) { return source.filter(function(t) { var d = new Date(t.created_at); return d.getFullYear() === m.year && d.getMonth() === m.month; }).length; });
  var resolved = months.map(function(m) { return source.filter(function(t) { if (!isResolvedStatut(t.statut)) return false; var d = new Date(t.updated_at || t.created_at); return d.getFullYear() === m.year && d.getMonth() === m.month; }).length; });
  var width = canvas.offsetWidth || 300;
  var height = 130;
  canvas.width = width;
  canvas.height = height;
  var pad = { top: 18, right: 14, bottom: 28, left: 28 };
  var chartW = width - pad.left - pad.right;
  var chartH = height - pad.top - pad.bottom;
  var maxValue = Math.max.apply(null, created.concat(resolved).concat([1]));
  var textColor = isDark ? '#a8a49e' : '#6b6860';
  var gridColor = isDark ? '#2e2c29' : '#ece8e1';
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridColor;
  ctx.fillStyle = textColor;
  ctx.font = '10px sans-serif';
  for (var gy = 0; gy <= 3; gy++) {
    var y = pad.top + (chartH / 3) * gy;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
    if (gy < 3) ctx.fillText(String(Math.round(maxValue - (maxValue / 3) * gy)), 4, y + 3);
  }
  months.forEach(function(m, index) {
    var slot = chartW / months.length;
    var x = pad.left + slot * index;
    var barWidth = slot * 0.24;
    var createdHeight = (created[index] / maxValue) * chartH;
    var resolvedHeight = (resolved[index] / maxValue) * chartH;
    ctx.fillStyle = '#2563eb'; ctx.beginPath(); ctx.roundRect(x + slot * 0.18, pad.top + chartH - createdHeight, barWidth, createdHeight, [4, 4, 0, 0]); ctx.fill();
    ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.roundRect(x + slot * 0.52, pad.top + chartH - resolvedHeight, barWidth, resolvedHeight, [4, 4, 0, 0]); ctx.fill();
    ctx.fillStyle = textColor; ctx.textAlign = 'center'; ctx.fillText(m.label, x + slot / 2, height - 8);
  });
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2563eb'; ctx.fillRect(width - 120, 6, 10, 8);
  ctx.fillStyle = textColor; ctx.fillText('Crees', width - 105, 13);
  ctx.fillStyle = '#16a34a'; ctx.fillRect(width - 58, 6, 10, 8);
  ctx.fillStyle = textColor; ctx.fillText('Resolus', width - 43, 13);
  if (tipEl) {
    var wrapper = canvas.closest('.dash3-chart-wrap') || canvas.parentElement;
    if (canvas.__dashMoveHandler) canvas.removeEventListener('mousemove', canvas.__dashMoveHandler);
    if (canvas.__dashLeaveHandler) canvas.removeEventListener('mouseleave', canvas.__dashLeaveHandler);
    canvas.__dashMoveHandler = function(e) {
      if (!wrapper) return;
      var rect = wrapper.getBoundingClientRect();
      var localX = e.clientX - rect.left;
      if (localX < pad.left || localX > pad.left + chartW) { tipEl.style.display = 'none'; return; }
      var idx = Math.floor((localX - pad.left) / (chartW / months.length));
      if (idx < 0 || idx >= months.length) { tipEl.style.display = 'none'; return; }
      tipEl.style.display = 'block';
      tipEl.style.left = localX + 'px';
      tipEl.style.top = Math.max(16, e.clientY - rect.top) + 'px';
      tipEl.innerHTML = '<strong>' + months[idx].label + '</strong>Crees: ' + created[idx] + '<br>Resolus: ' + resolved[idx];
    };
    canvas.__dashLeaveHandler = function() { tipEl.style.display = 'none'; };
    canvas.addEventListener('mousemove', canvas.__dashMoveHandler);
    canvas.addEventListener('mouseleave', canvas.__dashLeaveHandler);
  }
}

const DASH_WIDGET_VISIBILITY_KEY = 'coprosync_dash_widget_visibility_v4';
const DASH_WIDGET_SIZE_KEY = 'coprosync_dash_widget_sizes_v4';
const DASH_EDIT_MODE_KEY = 'coprosync_dash_edit_mode_v1';

function getDashboardEditMode() {
  try { return localStorage.getItem(DASH_EDIT_MODE_KEY) === '1'; } catch (e) { return false; }
}

function setDashboardEditMode(enabled) {
  try { localStorage.setItem(DASH_EDIT_MODE_KEY, enabled ? '1' : '0'); } catch (e) {}
}

function toggleDashboardEditMode() {
  setDashboardEditMode(!getDashboardEditMode());
  renderDashboard();
}

function resetDashboardLayout() {
  try { localStorage.removeItem(DASH_WIDGET_ORDER_KEY); } catch (e) {}
  try { localStorage.removeItem(DASH_WIDGET_SIZE_KEY); } catch (e) {}
  try { localStorage.removeItem(DASH_WIDGET_VISIBILITY_KEY); } catch (e) {}
  setDashboardEditMode(false);
  renderDashboard();
  if (typeof toast === 'function') toast('Cockpit reinitialise', 'ok');
}

function getDashboardWidgetSizes() {
  try { return JSON.parse(localStorage.getItem(DASH_WIDGET_SIZE_KEY) || '{}') || {}; } catch (e) { return {}; }
}

function setDashboardWidgetSizes(sizes) {
  try { localStorage.setItem(DASH_WIDGET_SIZE_KEY, JSON.stringify(sizes)); } catch (e) {}
}

function getDashboardCardSize(config) {
  var sizes = getDashboardWidgetSizes();
  return sizes[config.key] || config.defaultSize || 'standard';
}

function getDashboardCardSpan(config) {
  var size = getDashboardCardSize(config);
  if (config.spans && config.spans[size]) return config.spans[size];
  return config.span || 6;
}

function cycleDashboardWidgetSize(key) {
  var state = getDashboardState();
  var config = getDashboardWidgetCatalog(state).find(function(item) { return item.key === key; });
  if (!config || !config.spans) return;
  var order = ['compact', 'standard', 'hero'].filter(function(size) { return !!config.spans[size]; });
  var sizes = getDashboardWidgetSizes();
  var current = sizes[key] || config.defaultSize || order[0];
  var next = order[(order.indexOf(current) + 1) % order.length];
  sizes[key] = next;
  setDashboardWidgetSizes(sizes);
  renderDashboard();
}

function nudgeDashboardWidget(key, direction) {
  var board = $('dash-board');
  if (!board) return;
  var cards = Array.from(board.querySelectorAll('[data-widget-key]'));
  var index = cards.findIndex(function(card) { return card.getAttribute('data-widget-key') === key; });
  if (index < 0) return;
  var target = index + direction;
  if (target < 0 || target >= cards.length) return;
  var current = cards[index];
  var pivot = cards[target];
  if (direction > 0) board.insertBefore(pivot, current);
  else board.insertBefore(current, pivot);
  saveDashboardWidgetOrderFromDOM();
}

function getDashboardWidgetCatalog(state) {
  return [
    { key: 'hero', title: 'Pilotage', subtitle: 'Entree de tableau de bord', hideable: false, defaultSize: 'hero', spans: { standard: 8, hero: 12 }, render: function() { return renderDashboardHeroCard(state); } },
    { key: 'priorities', title: 'Actions prioritaires', subtitle: 'Urgences et arbitrages', hideable: true, defaultSize: 'standard', spans: { compact: 4, standard: 4, hero: 6 }, render: function() { return renderDashboardPrioritiesCard(state); } },
    { key: 'alerts', title: 'Centre d alertes', subtitle: 'Ce qui peut deraper vite', hideable: true, defaultSize: 'standard', spans: { compact: 4, standard: 5, hero: 8 }, render: function() { return renderDashboardAlertsCard(state); } },
    { key: 'pulse', title: 'Pulse copro', subtitle: 'Suivi quotidien ultra rapide', hideable: true, defaultSize: 'compact', spans: { compact: 4, standard: 4, hero: 6 }, render: function() { return renderDashboardPulseCard(state); } },
    { key: 'care', title: 'Sante residence', subtitle: 'Niveau de tension de la copropriete', hideable: true, defaultSize: 'compact', spans: { compact: 4, standard: 4, hero: 6 }, render: function() { return renderDashboardCareCard(state); } },
    { key: 'metrics', title: 'Chiffres clefs', subtitle: 'Synthese instantanee', hideable: true, defaultSize: 'standard', spans: { compact: 6, standard: 12, hero: 12 }, render: function() { return renderDashboardMetricsCard(state); } },
    { key: 'tickets', title: 'File de traitement', subtitle: 'Tickets a lire maintenant', hideable: true, defaultSize: 'hero', spans: { compact: 5, standard: 7, hero: 12 }, render: function() { return renderDashboardTicketsCard(state); } },
    { key: 'zones', title: 'Zones sous tension', subtitle: 'Focus batiment et zone', hideable: true, defaultSize: 'standard', spans: { compact: 4, standard: 5, hero: 8 }, render: function() { return renderDashboardZonesCard(state); } },
    ...(isManager() ? [{ key: 'contrats', title: 'Contrats fournisseurs', subtitle: 'Echeances et budget', hideable: true, defaultSize: 'standard', spans: { compact: 4, standard: 5, hero: 8 }, render: function() { return renderDashboardContratsCard(state); } }] : []),
    { key: 'activity', title: 'Activite sur 6 mois', subtitle: 'Crees vs resolus', hideable: true, defaultSize: 'standard', spans: { compact: 4, standard: 7, hero: 8 }, render: function() { return renderDashboardActivityCard(state); } },
    { key: 'events', title: 'Prochains evenements', subtitle: 'Agenda residence', hideable: true, defaultSize: 'standard', spans: { compact: 4, standard: 6, hero: 8 }, render: function() { return renderDashboardEventsCard(); } },
    { key: 'annonces', title: 'Annonces', subtitle: 'Messages prioritaires', hideable: true, defaultSize: 'standard', spans: { compact: 4, standard: 6, hero: 8 }, render: function() { return renderDashboardAnnoncesCard(); } },
    { key: 'documents', title: 'Documents recents', subtitle: 'Acces rapide', hideable: true, defaultSize: 'standard', spans: { compact: 4, standard: 6, hero: 8 }, render: function() { return renderDashboardDocumentsCard(state); } },
    { key: 'votes', title: 'Votes en cours', subtitle: 'Participation et decisions', hideable: true, defaultSize: 'standard', spans: { compact: 4, standard: 6, hero: 8 }, render: function() { return renderDashboardVotesCard(state); } },
    { key: 'install', title: 'Installer l application', subtitle: 'Optimisee mobile', hideable: true, defaultSize: 'compact', spans: { compact: 4, standard: 6, hero: 8 }, render: function() { return renderDashboardInstallCard(); } }
  ];
}

function getDashboardVisibility() {
  try {
    return JSON.parse(localStorage.getItem(DASH_WIDGET_VISIBILITY_KEY) || '{}') || {};
  } catch (e) {
    return {};
  }
}

function setDashboardVisibility(visibility) {
  try { localStorage.setItem(DASH_WIDGET_VISIBILITY_KEY, JSON.stringify(visibility)); } catch (e) {}
}

function getDashboardBoardOrder(state) {
  var defaults = getDashboardWidgetCatalog(state).map(function(item) { return item.key; });
  try {
    var raw = localStorage.getItem(DASH_WIDGET_ORDER_KEY);
    if (!raw) return defaults;
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaults;
    var filtered = parsed.filter(function(key) { return defaults.includes(key); });
    defaults.forEach(function(key) { if (!filtered.includes(key)) filtered.push(key); });
    return filtered;
  } catch (e) {
    return defaults;
  }
}

function toggleDashboardCustomizer() {
  var panel = $('dash-customize-panel');
  if (panel) panel.classList.toggle('is-open');
}

function toggleDashboardWidgetVisibility(key) {
  var visibility = getDashboardVisibility();
  visibility[key] = !visibility[key];
  setDashboardVisibility(visibility);
  renderDashboard();
}

function buildDashboardCardShell(config, body, actionHTML) {
  var isEdit = getDashboardEditMode();
  var size = getDashboardCardSize(config);
  var moveTools = isEdit ? '<button class="dash4-icon-btn dash4-move-btn" type="button" onclick="nudgeDashboardWidget(\'' + config.key + '\', -1)" title="Monter">↑</button><button class="dash4-icon-btn dash4-move-btn" type="button" onclick="nudgeDashboardWidget(\'' + config.key + '\', 1)" title="Descendre">↓</button>' : '';
  return ''
    + '<article class="dash4-card" draggable="false" data-widget-key="' + config.key + '" data-span="' + getDashboardCardSpan(config) + '" data-size="' + size + '" data-editing="' + (isEdit ? 'true' : 'false') + '">'
    + '<div class="dash4-card-head">'
    + '<div><h3>' + escHtml(config.title) + '</h3><p>' + escHtml(config.subtitle) + '</p></div>'
    + '<div class="dash4-card-tools">' + (actionHTML || '') + (isEdit ? '<button class="dash4-icon-btn" type="button" onclick="cycleDashboardWidgetSize(\'' + config.key + '\')" title="Taille">' + size.charAt(0).toUpperCase() + '</button>' : '') + moveTools + '<button class="dash4-handle" type="button" draggable="' + (isEdit ? 'true' : 'false') + '" title="Deplacer">::</button></div>'
    + '</div>'
    + '<div class="dash4-card-body">' + body + '</div>'
    + '</article>';
}

function renderDashboardHeroCard(state) {
  var isEdit = getDashboardEditMode();
  var heroConfig = { key: 'hero', title: 'Pilotage residence', subtitle: 'Vue generale premium, orientee action et mobile.', spans: { standard: 8, hero: 12 }, defaultSize: 'hero' };
  var moveTools = isEdit ? '<button class="dash4-icon-btn dash4-move-btn" type="button" onclick="nudgeDashboardWidget(\'hero\', -1)" title="Monter">↑</button><button class="dash4-icon-btn dash4-move-btn" type="button" onclick="nudgeDashboardWidget(\'hero\', 1)" title="Descendre">↓</button>' : '';
  var body = ''
    + '<div class="dash4-date">' + new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</div>'
    + '<div class="dash4-hero-grid">'
    + '<div><div class="dash4-hero-title">Bonjour ' + escHtml(getDashboardGreeting()) + ', pilotons la residence.</div><div class="dash4-hero-sub">' + escHtml(getDashboardSummaryText(state)) + '</div><div class="dash4-action-row"><button class="btn btn-primary" onclick="openNewTicket()">Nouveau signalement</button><button class="btn btn-secondary" onclick="nav(\'tickets\')">Tous les signalements</button><button class="btn btn-ghost" onclick="toggleDashboardCustomizer()">Personnaliser</button></div></div>'
    + '<div class="dash4-highlight"><span>Focus du jour</span><strong>' + state.ouverts.length + '</strong><p>tickets actifs a suivre, dont ' + state.critiques.length + ' critiques et ' + state.resolus.length + ' deja resolus.</p></div>'
    + '</div>';
  return '<article class="dash4-card dash4-board-hero" draggable="false" data-widget-key="hero" data-span="' + getDashboardCardSpan(heroConfig) + '" data-size="' + getDashboardCardSize(heroConfig) + '" data-editing="' + (isEdit ? 'true' : 'false') + '"><div class="dash4-card-head"><div><h2>Pilotage residence</h2><p>Vue generale premium, orientee action et mobile.</p></div><div class="dash4-card-tools"><button class="dash4-icon-btn" type="button" onclick="toggleDashboardCustomizer()" title="Personnaliser">+</button>' + (isEdit ? '<button class="dash4-icon-btn" type="button" onclick="cycleDashboardWidgetSize(\'hero\')" title="Taille">H</button>' : '') + moveTools + '<button class="dash4-handle" type="button" draggable="' + (isEdit ? 'true' : 'false') + '" title="Deplacer">::</button></div></div><div class="dash4-card-body">' + body + '</div></article>';
}

function renderDashboardPrioritiesCard(state) {
  var items = getDashboardPriorityCards(state).map(function(card) {
    return '<button class="dash4-priority" data-tone="' + card.tone + '" onclick="' + card.action + '"><span class="dash4-priority-badge">' + card.icon + '</span><span class="dash4-priority-copy"><strong>' + escHtml(card.title) + '</strong><span>' + escHtml(card.subtitle) + '</span></span><span class="dash4-priority-cta">' + escHtml(card.cta) + ' -></span></button>';
  }).join('');
  return buildDashboardCardShell({ key: 'priorities', title: 'Actions prioritaires', subtitle: 'Ce qui demande une decision ou un suivi rapide.', span: 4 }, '<div class="dash4-priority-stack">' + items + '</div>', '');
}

function renderDashboardAlertsCard(state) {
  var oldTickets = state.ouverts.filter(function(t) { return Math.floor((Date.now() - new Date(t.created_at).getTime()) / 864e5) >= 7; });
  var upcomingEvents = (cache.evenements || []).filter(function(e) {
    var diff = new Date(e.date_debut) - new Date();
    return diff > 0 && diff < (72 * 60 * 60 * 1000);
  });
  var newDocs = state.docs.filter(function(doc) { return typeof _docsVus !== 'undefined' ? !_docsVus.has(doc.id) : false; });
  var alerts = [
    { tone: 'critical', label: 'Critiques actives', value: state.critiques.length, note: 'tickets a traiter sans delai', action: "setDashFocus('critique')" },
    { tone: 'warning', label: 'Tickets a relancer', value: oldTickets.length, note: 'ouverts depuis au moins 7 jours', action: "setDashFocus('ouvert')" },
    { tone: 'info', label: 'Evenements a venir', value: upcomingEvents.length, note: 'dans les 72 prochaines heures', action: "nav('agenda')" },
    { tone: 'success', label: 'Nouveaux documents', value: newDocs.length, note: 'pieces a consulter rapidement', action: "nav('documents')" }
  ];
  if (isManager()) alerts.splice(2, 0, { tone: 'warning', label: 'Contrats sensibles', value: state.contratsExpires.length + state.contratsAlertes.length, note: 'echeances a surveiller', action: "nav('contrats')" });
  var body = '<div class="dash4-alert-grid">' + alerts.map(function(item) {
    return '<button class="dash4-alert" data-tone="' + item.tone + '" onclick="' + item.action + '"><small>' + escHtml(item.label) + '</small><strong>' + item.value + '</strong><span>' + escHtml(item.note) + '</span></button>';
  }).join('') + '</div>';
  body += '<div class="dash4-alert-ribbon"><span>Raccourcis</span><div class="dash4-alert-actions"><button class="btn btn-ghost btn-sm" onclick="openNewTicket()">Nouveau ticket</button><button class="btn btn-ghost btn-sm" onclick="nav(\'agenda\')">Agenda</button><button class="btn btn-ghost btn-sm" onclick="nav(\'annonces\')">Annonces</button></div></div>';
  return buildDashboardCardShell({ key: 'alerts', title: 'Centre d alertes', subtitle: 'Ce qui peut deraper vite, pour garder la residence sous controle.', span: 5 }, body, '<button class="btn btn-ghost btn-sm" type="button" onclick="toggleDashboardCustomizer()">Regler</button>');
}

function renderDashboardPulseCard(state) {
  var oldTickets = state.ouverts.filter(function(t) { return Math.floor((Date.now() - new Date(t.created_at).getTime()) / 864e5) >= 3; }).length;
  var unseenDocs = state.docs.filter(function(doc) { return typeof _docsVus !== 'undefined' ? !_docsVus.has(doc.id) : false; }).length;
  var openVotes = state.votesEnAttente.length;
  var nextEvent = (cache.evenements || []).filter(function(e) { return new Date(e.date_debut) > new Date(); }).sort(function(a, b) { return new Date(a.date_debut) - new Date(b.date_debut); })[0];
  var body = ''
    + '<div class="dash4-pulse"><span>A relancer</span><strong>' + oldTickets + '</strong><small>tickets ouverts depuis plus de 3 jours</small></div>'
    + '<div class="dash4-pulse"><span>A lire</span><strong>' + unseenDocs + '</strong><small>documents recents non consultes</small></div>'
    + '<div class="dash4-pulse"><span>A voter</span><strong>' + openVotes + '</strong><small>votes encore sans reponse</small></div>'
    + '<div class="dash4-pulse dash4-pulse-event"><span>Prochain rdv</span><strong>' + (nextEvent ? nextEvent.titre : 'Rien de prevu') + '</strong><small>' + (nextEvent ? fmtD(nextEvent.date_debut) : 'Agenda calme') + '</small></div>';
  return buildDashboardCardShell({ key: 'pulse', title: 'Pulse copro', subtitle: 'Quatre indicateurs simples pour agir tout de suite.', span: 4 }, '<div class="dash4-pulse-grid">' + body + '</div>', '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'notifications\')">Historique</button>');
}

function renderDashboardCareCard(state) {
  var unresolvedCritical = state.critiques.length;
  var syndicPending = state.syndic.length;
  var contractWatch = state.contratsExpires.length + state.contratsAlertes.length;
  var votesWaiting = state.votesEnAttente.length;
  var total = unresolvedCritical * 4 + syndicPending * 2 + contractWatch * 2 + votesWaiting;
  var level = total >= 12 ? 'Alerte haute' : (total >= 6 ? 'Sous tension' : 'Stable');
  var body = ''
    + '<div class="dash4-care-score"><span>Sante residence</span><strong>' + Math.max(0, 100 - total * 4) + '</strong><small>' + level + '</small></div>'
    + '<div class="dash4-care-bars">'
    + '<div class="dash4-care-row"><span>Incidents critiques</span><i><b style="width:' + Math.min(100, unresolvedCritical * 20) + '%;background:var(--dash4-danger);"></b></i><strong>' + unresolvedCritical + '</strong></div>'
    + '<div class="dash4-care-row"><span>Dossiers syndic</span><i><b style="width:' + Math.min(100, syndicPending * 18) + '%;background:var(--dash4-warning);"></b></i><strong>' + syndicPending + '</strong></div>'
    + '<div class="dash4-care-row"><span>Contrats sensibles</span><i><b style="width:' + Math.min(100, contractWatch * 18) + '%;background:var(--dash4-accent);"></b></i><strong>' + contractWatch + '</strong></div>'
    + '<div class="dash4-care-row"><span>Votes en attente</span><i><b style="width:' + Math.min(100, votesWaiting * 18) + '%;background:var(--dash4-success);"></b></i><strong>' + votesWaiting + '</strong></div>'
    + '</div>';
  return buildDashboardCardShell({ key: 'care', title: 'Sante residence', subtitle: 'Lecture globale du niveau de tension de la copropriete.', span: 4 }, body, '<button class="btn btn-ghost btn-sm" type="button" onclick="setDashFocus(\'critique\')">Prioriser</button>');
}

function renderDashboardMetricsCard(state) {
  var openOrMine = isManager() ? state.syndic.length : state.mine.length;
  var body = ''
    + '<div class="dash4-kpi-grid">'
    + '<button class="dash4-kpi" data-tone="warning" onclick="setDashFocus(\'ouvert\')"><small>Ouverts</small><strong>' + state.ouverts.length + '</strong><span>Signalements en cours</span></button>'
    + '<button class="dash4-kpi" data-tone="critical" onclick="setDashFocus(\'critique\')"><small>Critiques</small><strong>' + state.critiques.length + '</strong><span>Traitement immediat</span></button>'
    + '<button class="dash4-kpi" data-tone="info" onclick="' + (isManager() ? "setDashFocus('transmis')" : "setDashFocus('mine')") + '"><small>' + (isManager() ? 'Transmis' : 'Mes tickets') + '</small><strong>' + openOrMine + '</strong><span>' + (isManager() ? 'En attente syndic' : 'Crees par vous') + '</span></button>'
    + '<button class="dash4-kpi" data-tone="success" onclick="setDashFocus(\'resolu\')"><small>Resolus</small><strong>' + state.resolus.length + '</strong><span>Historique traite</span></button>'
    + '</div>';
  return buildDashboardCardShell({ key: 'metrics', title: 'Vue rapide', subtitle: getDashboardFocusLabel(), span: 12 }, body, '');
}

function renderDashboardTicketsCard(state) {
  var body = '<div class="dash4-filterbar"><div class="dash4-filterbar-copy"><strong>Lecture rapide</strong><span id="dash-focus-summary">' + escHtml(getDashboardFocusLabel()) + '</span></div><div class="dash4-filter-row"><button class="dash4-pill is-active" data-dash-focus="tout" onclick="setDashFocus(\'tout\')">Tout</button><button class="dash4-pill" data-dash-focus="ouvert" onclick="setDashFocus(\'ouvert\')">Ouverts</button><button class="dash4-pill" data-dash-focus="critique" onclick="setDashFocus(\'critique\')">Critiques</button><button class="dash4-pill" data-dash-focus="' + (isManager() ? 'transmis' : 'mine') + '" onclick="' + (isManager() ? "setDashFocus('transmis')" : "setDashFocus('mine')") + '">' + (isManager() ? 'Transmis' : 'Mes tickets') + '</button><button class="dash4-pill" data-dash-focus="resolu" onclick="setDashFocus(\'resolu\')">Resolus</button><button class="dash4-pill" id="dash-zone-reset" style="display:none;" onclick="clearDashFocus()">Quitter la zone</button></div></div>';
  body += '<div id="dash-recent-list" class="dash4-ticket-stack" style="margin-top:14px;">' + renderDashRecentListHTML(getDashTicketsForRecent()) + '</div>';
  return buildDashboardCardShell({ key: 'tickets', title: 'File de traitement', subtitle: 'Les tickets les plus utiles a voir tout de suite selon le filtre courant.', span: 7 }, body, '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'tickets\')">Ouvrir</button>');
}

function renderDashboardZonesCard() {
  return buildDashboardCardShell({ key: 'zones', title: 'Zones sous tension', subtitle: 'Clique une zone pour concentrer la vue. Tres utile sur mobile pour rester rapide.', span: 5 }, '<div id="dash-zone-list" class="dash4-zones">' + renderDashZonesListHTML(getDashTicketsForZones()) + '</div>', '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'map\')">Carte</button>');
}

function renderDashboardContratsCard(state) {
  var conformes = state.contrats.filter(function(c) { return daysUntil(c.date_echeance) > (c.alerte_jours ?? 90); });
  var budget = state.contrats.reduce(function(sum, c) { return sum + (c.montant_annuel || 0); }, 0);
  var urgents = state.contrats.filter(function(c) { return daysUntil(c.date_echeance) <= (c.alerte_jours ?? 90); }).sort(function(a, b) { return new Date(a.date_echeance) - new Date(b.date_echeance); }).slice(0, 4);
  var body = '<div class="dash4-contract-grid"><div class="dash4-contract-box"><strong>' + state.contratsExpires.length + '</strong><span>Expires</span></div><div class="dash4-contract-box"><strong>' + state.contratsAlertes.length + '</strong><span>En alerte</span></div><div class="dash4-contract-box" data-tone="ok"><strong>' + conformes.length + '</strong><span>Conformes</span></div></div>';
  body += urgents.length ? '<div class="dash4-list-stack">' + urgents.map(function(c) {
    var delta = daysUntil(c.date_echeance);
    var tone = delta < 0 ? 'var(--dash4-danger)' : (delta <= 30 ? 'var(--dash4-warning)' : 'var(--dash4-accent)');
    var label = delta < 0 ? 'Expire depuis ' + Math.abs(delta) + ' j' : 'Echeance dans ' + delta + ' j';
    return '<div class="dash4-list-item" onclick="nav(\'contrats\')"><span class="dash4-list-mark" style="background:' + tone + ';"></span><span class="dash4-list-copy"><strong>' + escHtml(c.fournisseur || 'Contrat') + '</strong><span>' + escHtml((c.type_contrat || 'Contrat') + (c.contact_nom ? ' · ' + c.contact_nom : '')) + '</span></span><span class="dash4-list-meta">' + escHtml(label) + '</span></div>';
  }).join('') + '</div>' : '<div class="dash4-empty">Aucun contrat a surveiller de pres pour le moment.</div>';
  body += '<div class="dash4-budget-row"><span>Budget annuel actif</span><strong>' + budget.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' EUR</strong></div>';
  return buildDashboardCardShell({ key: 'contrats', title: 'Contrats fournisseurs', subtitle: 'Vue priorisee sur les echeances et le budget.', span: 5 }, body, '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'contrats\')">Ouvrir</button>');
}

function renderDashboardActivityCard() {
  return buildDashboardCardShell({ key: 'activity', title: 'Activite sur 6 mois', subtitle: 'Crees versus resolus, avec le filtre courant applique.', span: 7 }, '<div class="dash3-chart-wrap"><canvas id="dash-chart" class="dash3-chart" height="130"></canvas><div id="dash-chart-tip" class="dash3-chart-tip" style="display:none;"></div></div>', '');
}

function renderDashboardEventsCard() {
  return buildDashboardCardShell({ key: 'events', title: 'Prochains evenements', subtitle: 'Agenda a venir avec les rendez-vous a ne pas manquer.', span: 6 }, '<div id="dash-events-list" class="dash4-empty">Chargement des evenements...</div>', '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'agenda\')">Agenda</button>');
}

function renderDashboardAnnoncesCard() {
  return buildDashboardCardShell({ key: 'annonces', title: 'Annonces', subtitle: 'Messages prioritaires et informations utiles pour la residence.', span: 6 }, '<div id="dash-annonces-list" class="dash4-empty">Chargement des annonces...</div>', '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'annonces\')">Toutes</button>');
}

function renderDashboardDocumentsCard(state) {
  var body = !state.docs.length ? '<div class="dash4-empty">Aucun document recent a afficher.</div>' : '<div class="dash4-list-stack">' + state.docs.slice(0, 4).map(function(doc) {
    var isNew = typeof _docsVus !== 'undefined' ? !_docsVus.has(doc.id) : false;
    return '<div class="dash4-list-item" onclick="nav(\'documents\')"><span class="dash4-list-mark" style="background:' + (isNew ? 'var(--dash4-accent)' : 'var(--dash4-info)') + ';"></span><span class="dash4-list-copy"><strong>' + escHtml(doc.titre) + '</strong><span>' + escHtml(fmtD(doc.created_at)) + '</span></span><span class="dash4-list-meta">' + (isNew ? 'Nouveau' : 'Archive') + '</span></div>';
  }).join('') + '</div>';
  return buildDashboardCardShell({ key: 'documents', title: 'Documents recents', subtitle: 'Pieces utiles a retrouver vite depuis le tableau de bord.', span: 6 }, body, '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'documents\')">Ouvrir</button>');
}

function renderDashboardVotesCard(state) {
  var body = !state.votesOuverts.length ? '<div class="dash4-empty">Aucun vote ouvert actuellement.</div>' : '<div class="dash4-list-stack">' + state.votesOuverts.slice(0, 3).map(function(v) {
    var total = (typeof _allReponsesCache !== 'undefined' && _allReponsesCache[v.id]) ? _allReponsesCache[v.id].length : 0;
    var voted = typeof _reponsesCache !== 'undefined' && _reponsesCache[v.id];
    return '<div class="dash4-list-item" onclick="nav(\'votes\')"><span class="dash4-list-mark" style="background:' + (voted ? 'var(--dash4-success)' : 'var(--dash4-warning)') + ';"></span><span class="dash4-list-copy"><strong>' + escHtml(v.titre) + '</strong><span>' + total + ' participant' + (total > 1 ? 's' : '') + '</span></span><span class="dash4-list-meta">' + (voted ? 'Vote' : 'A faire') + '</span></div>';
  }).join('') + '</div>';
  return buildDashboardCardShell({ key: 'votes', title: 'Votes en cours', subtitle: 'Participation et decisions a suivre.', span: 6 }, body, '<button class="btn btn-ghost btn-sm" type="button" onclick="nav(\'votes\')">Ouvrir</button>');
}

function renderDashboardInstallCard() {
  var body = '<div class="dash4-empty" style="text-align:left;"><strong style="display:block;color:var(--text);margin-bottom:8px;">Version mobile</strong>Installe l application pour un acces plein ecran, plus stable sur iPhone et Android.<div class="dash3-widget-note">iPhone: Safari -> Partager -> Sur l ecran d accueil. Android: Chrome -> menu -> Installer l application.</div></div>';
  return buildDashboardCardShell({ key: 'install', title: 'Installer l application', subtitle: 'Pour un usage quotidien plus fluide sur mobile.', span: 6 }, body, '');
}

function renderDashboardCustomizer(state) {
  var visibility = getDashboardVisibility();
  var toggles = getDashboardWidgetCatalog(state).filter(function(item) { return item.hideable; }).map(function(item) {
    var hidden = !!visibility[item.key];
    var size = getDashboardCardSize(item);
    return '<div class="dash4-toggle ' + (hidden ? 'is-hidden' : '') + '"><button class="dash4-toggle-main" onclick="toggleDashboardWidgetVisibility(\'' + item.key + '\')"><span class="dash4-toggle-text"><strong>' + escHtml(item.title) + '</strong><span>' + escHtml(item.subtitle) + '</span></span><span class="dash4-toggle-indicator"></span></button>' + (item.spans ? '<button class="dash4-size-chip" onclick="cycleDashboardWidgetSize(\'' + item.key + '\')">' + escHtml(size) + '</button>' : '') + '</div>';
  }).join('');
  return '<section id="dash-customize-panel" class="dash4-customize"><div class="dash4-customize-head"><div><h2>Composer votre dashboard</h2><p>Masque les blocs secondaires, choisis leur taille et active le vrai mode edition pour reorganiser le cockpit.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="btn ' + (getDashboardEditMode() ? 'btn-primary' : 'btn-secondary') + ' btn-sm" onclick="toggleDashboardEditMode()">' + (getDashboardEditMode() ? 'Quitter edition' : 'Mode edition') + '</button><button class="btn btn-ghost btn-sm" onclick="toggleDashboardCustomizer()">Fermer</button></div></div><div class="dash4-toggle-grid">' + toggles + '</div></section>';
}

function renderDashboardEditDock() {
  if (!getDashboardEditMode()) return '';
  return '<aside class="dash4-edit-dock"><div class="dash4-edit-chip">Edition du cockpit</div><div class="dash4-edit-copy"><strong>Glisse les cartes, change leur taille, ou masque les secondaires.</strong><span>Le drag fonctionne en desktop. Sur mobile, utilise les boutons monter / descendre.</span></div><div class="dash4-edit-actions"><button class="btn btn-secondary btn-sm" onclick="toggleDashboardCustomizer()">Widgets</button><button class="btn btn-ghost btn-sm" onclick="resetDashboardLayout()">Reset layout</button><button class="btn btn-primary btn-sm" onclick="toggleDashboardEditMode()">Terminer</button></div></aside>';
}

function renderDashboardBoard(state) {
  var catalog = getDashboardWidgetCatalog(state);
  var byKey = {};
  catalog.forEach(function(item) { byKey[item.key] = item; });
  var visibility = getDashboardVisibility();
  return getDashboardBoardOrder(state).filter(function(key) { return byKey[key] && !(byKey[key].hideable && visibility[key]); }).map(function(key) { return byKey[key].render(); }).join('');
}

function saveDashboardWidgetOrderFromDOM() {
  var board = $('dash-board');
  if (!board) return;
  saveDashboardWidgetOrder(Array.from(board.querySelectorAll('[data-widget-key]')).map(function(node) { return node.getAttribute('data-widget-key'); }));
}

function initDashboardWidgetRail() {
  var board = $('dash-board');
  if (!board || board.__dashReady) return;
  board.__dashReady = true;
  function clearDragState() {
    _dashWidgetDragKey = null;
    _dashPointerDrag = null;
    board.querySelectorAll('.dash4-card').forEach(function(node) {
      node.classList.remove('is-dragging');
      node.removeAttribute('data-drag-over');
    });
    saveDashboardWidgetOrderFromDOM();
  }
  function moveCardAtPoint(clientX, clientY) {
    if (!getDashboardEditMode() || !_dashPointerDrag || !_dashPointerDrag.card || !_dashPointerDrag.board) return;
    var overNode = document.elementFromPoint(clientX, clientY);
    if (!overNode) return;
    var over = overNode.closest('.dash4-card');
    var dragging = _dashPointerDrag.card;
    if (!over || !board.contains(over) || over === dragging) return;
    board.querySelectorAll('.dash4-card').forEach(function(node) { node.removeAttribute('data-drag-over'); });
    over.setAttribute('data-drag-over', 'true');
    var rect = over.getBoundingClientRect();
    var horizontal = Math.abs(rect.width) > Math.abs(rect.height) * 1.1;
    var after = horizontal ? (clientX > rect.left + rect.width / 2) : (clientY > rect.top + rect.height / 2);
    board.insertBefore(dragging, after ? over.nextSibling : over);
  }
  board.addEventListener('pointerdown', function(e) {
    if (!getDashboardEditMode()) return;
    var handle = e.target.closest('.dash4-handle');
    if (!handle) return;
    var card = handle.closest('.dash4-card');
    if (!card) return;
    _dashWidgetDragKey = card.getAttribute('data-widget-key');
    _dashPointerDrag = { key: _dashWidgetDragKey, card: card, board: board, pointerId: e.pointerId };
    card.classList.add('is-dragging');
    try { handle.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  board.addEventListener('pointermove', function(e) {
    if (!getDashboardEditMode() || !_dashPointerDrag) return;
    moveCardAtPoint(e.clientX, e.clientY);
    e.preventDefault();
  });
  board.addEventListener('pointerup', function(e) {
    if (!_dashPointerDrag) return;
    var handle = e.target.closest('.dash4-handle');
    if (handle) {
      try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    clearDragState();
  });
  board.addEventListener('pointercancel', function() {
    if (!_dashPointerDrag) return;
    clearDragState();
  });
  board.addEventListener('dragstart', function(e) {
    if (!getDashboardEditMode()) return;
    var handle = e.target.closest('.dash4-handle');
    if (!handle) return;
    var card = handle.closest('.dash4-card');
    if (!card) return;
    _dashWidgetDragKey = card.getAttribute('data-widget-key');
    card.classList.add('is-dragging');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', _dashWidgetDragKey); } catch (err) {}
    }
  });
  board.addEventListener('dragend', function() {
    if (!getDashboardEditMode()) return;
    clearDragState();
  });
  board.addEventListener('dragover', function(e) {
    if (!getDashboardEditMode() || !_dashWidgetDragKey) return;
    var over = e.target.closest('.dash4-card');
    var dragging = board.querySelector('.dash4-card.is-dragging');
    if (!over || !dragging || over === dragging) return;
    e.preventDefault();
    board.querySelectorAll('.dash4-card').forEach(function(node) { node.removeAttribute('data-drag-over'); });
    over.setAttribute('data-drag-over', 'true');
    var rect = over.getBoundingClientRect();
    var after = e.clientY > rect.top + rect.height / 2;
    board.insertBefore(dragging, after ? over.nextSibling : over);
  });
  board.addEventListener('drop', function(e) {
    if (!getDashboardEditMode()) return;
    e.preventDefault();
    clearDragState();
  });
}

renderDashRecentListHTML = function(list) {
  if (!list.length) return '<div class="dash4-empty">Aucun ticket pour ce filtre. Le tableau de bord reste clair et disponible.</div>';
  return list.slice(0, 6).map(function(tk) {
    return '<button class="dash4-ticket" data-urgency="' + escHtml(tk.urgence || 'normal') + '" onclick="openDetail(\'' + tk.id + '\')"><span class="dash4-ticket-dot"></span><span class="dash4-ticket-main"><strong>' + escHtml(tk.titre) + '</strong><span>' + escHtml(tk.batiment || 'Residence') + (tk.zone ? ' · ' + escHtml(tk.zone) : '') + ' · ' + escHtml(depuisJours(tk.created_at)) + '</span></span><span class="dash4-ticket-side">' + badgeStatut(tk.statut) + '<span class="dash3-inline-hint">' + escHtml(tk.urgence || 'normal') + '</span></span></button>';
  }).join('');
};

renderDashZonesListHTML = function(tickets) {
  var counts = {};
  tickets.forEach(function(t) { if (t.batiment) counts[t.batiment] = (counts[t.batiment] || 0) + 1; });
  var zones = getDashboardZoneNames().map(function(zone) { return { name: zone, count: counts[zone] || 0 }; }).filter(function(zone) { return zone.count > 0 || _dashFocusZone === zone.name; });
  if (!zones.length) return '<div class="dash4-empty">Aucune zone a surveiller pour ce filtre.</div>';
  return zones.map(function(zone) {
    var tone = zone.count >= 3 ? 'var(--dash4-danger)' : (zone.count >= 2 ? 'var(--dash4-warning)' : 'var(--dash4-accent)');
    var width = Math.max(18, Math.min(100, zone.count * 23));
    return '<button class="dash4-zone ' + (_dashFocusMode === 'zone' && _dashFocusZone === zone.name ? 'is-selected' : '') + '" onclick="setDashZoneFocus(' + JSON.stringify(zone.name) + ')"><span class="dash4-zone-top"><strong>' + escHtml(zone.name) + '</strong><span style="color:' + tone + ';">' + zone.count + '</span></span><span class="dash4-zone-track"><i style="width:' + width + '%;background:' + tone + ';"></i></span><span class="dash4-zone-note">' + (zone.count === 1 ? '1 signalement ouvert' : zone.count + ' signalements ouverts') + '</span></button>';
  }).join('');
};

refreshDashFocus = function() {
  var recentEl = $('dash-recent-list');
  var zoneEl = $('dash-zone-list');
  if (!recentEl || !zoneEl) return;
  var filterBar = $('dash-focusbar');
  if (filterBar) filterBar.querySelectorAll('[data-dash-focus]').forEach(function(btn) { btn.classList.toggle('is-active', btn.getAttribute('data-dash-focus') === _dashFocusMode); });
  if ($('dash-focus-summary')) $('dash-focus-summary').textContent = getDashboardFocusLabel();
  if ($('dash-zone-reset')) $('dash-zone-reset').style.display = _dashFocusMode === 'zone' ? '' : 'none';
  recentEl.innerHTML = renderDashRecentListHTML(getDashTicketsForRecent());
  zoneEl.innerHTML = renderDashZonesListHTML(getDashTicketsForZones());
  renderDashChart();
};

renderDashboard = async function() {
  var el = $('page');
  if (!cache.tickets && !isCopro()) {
    el.innerHTML = '<div style="padding:16px;">Chargement du tableau de bord...</div>';
    return;
  }
  _dashFocusMode = 'tout';
  _dashFocusZone = null;
  var state = getDashboardState();
  var editMode = getDashboardEditMode();
  el.innerHTML = '<div class="dash4" data-editing="' + (editMode ? 'true' : 'false') + '"><div class="dash4-shell"><section class="dash4-toolbar"><div class="dash4-toolbar-copy"><strong>Workspace dashboard</strong><span>' + (editMode ? 'Mode edition actif: glisse, redimensionne et masque les widgets a ta guise.' : 'Reorganisable, masquable et coherent en light comme en dark.') + '</span></div><div class="dash4-toolbar-actions"><button class="btn ' + (editMode ? 'btn-primary' : 'btn-secondary') + '" onclick="toggleDashboardEditMode()">' + (editMode ? 'Edition active' : 'Mode edition') + '</button><button class="btn btn-secondary" onclick="toggleDashboardCustomizer()">Personnaliser</button><button class="btn btn-ghost" onclick="nav(\'faq\')">Aide</button></div></section>' + renderDashboardEditDock() + renderDashboardCustomizer(state) + '<section id="dash-board" class="dash4-board">' + renderDashboardBoard(state) + '</section></div></div>';
  initDashboardWidgetRail();
  initDashboardResizeBinding();
  loadDashboardWidgets();
  renderDashChart();
};

loadDashboardWidgets = async function() {
  var evtEl = $('dash-events-list');
  var annEl = $('dash-annonces-list');
  var now = new Date().toISOString();
  var evtRes = await sb.from('evenements').select('*').gte('date_debut', now).order('date_debut').limit(4);
  var events = evtRes.data || [];
  if (evtEl) {
    if (!events.length) evtEl.innerHTML = '<div class="dash4-empty">Aucun evenement a venir.</div>';
    else evtEl.innerHTML = '<div class="dash4-list-stack">' + events.map(function(e) {
      var type = (typeof EVENT_TYPES !== 'undefined' && EVENT_TYPES[e.type]) ? EVENT_TYPES[e.type] : { color: '#6b7280' };
      var date = new Date(e.date_debut);
      var soon = (date - new Date()) < 86400000;
      return '<div class="dash4-list-item" onclick="nav(\'agenda\')"><span class="dash4-list-mark" style="background:' + (type.color || 'var(--dash4-accent)') + ';"></span><span class="dash4-list-copy"><strong>' + escHtml(e.titre) + '</strong><span>' + date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' · ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + (e.lieu ? ' · ' + escHtml(e.lieu) : '') + '</span></span><span class="dash4-list-meta">' + (soon ? 'Bientot' : 'Agenda') + '</span></div>';
    }).join('') + '</div>';
  }
  if (evtEl) events.filter(function(e) { var diff = new Date(e.date_debut) - new Date(); return diff > 0 && diff < 86400000; }).forEach(function(e) { pushNotif('Rappel agenda', e.titre + ' demain a ' + new Date(e.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), 'statut_change', null); });
  var annRes = await sb.from('annonces').select('*').order('epingle', { ascending: false }).order('created_at', { ascending: false }).limit(12);
  var annonces = (annRes.data || []).filter(function(a) { return annonceReaderCanSee(a); }).slice(0, 3);
  if (annEl) {
    if (!annonces.length) annEl.innerHTML = '<div class="dash4-empty">Aucune annonce recente.</div>';
    else annEl.innerHTML = '<div class="dash4-list-stack">' + annonces.map(function(a) {
      var level = a.type === 'urgent' ? 'var(--dash4-danger)' : (a.type === 'important' ? 'var(--dash4-warning)' : 'var(--dash4-accent)');
      var snippet = a.contenu ? a.contenu.substring(0, 92) + (a.contenu.length > 92 ? '...' : '') : 'Annonce sans apercu.';
      return '<div class="dash4-list-item" onclick="nav(\'annonces\')"><span class="dash4-list-mark" style="background:' + level + ';"></span><span class="dash4-list-copy"><strong>' + escHtml(a.titre) + '</strong><span>' + escHtml(snippet) + '</span></span><span class="dash4-list-meta">' + (a.epingle ? 'Epinglee' : fmtD(a.created_at)) + '</span></div>';
    }).join('') + '</div>';
  }
  renderDashChart();
};
