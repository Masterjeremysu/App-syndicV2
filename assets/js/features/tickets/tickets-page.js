let _ticketsViewState = {
  status: 'all',
  urgency: 'all',
  search: '',
  sort: 'recent'
};

function getVisibleTickets() {
  return (cache.tickets || []).filter(function(ticket) {
    return canViewTicket(ticket);
  });
}

function normalizeTicketStatus(statut) {
  var value = String(statut || '').toLowerCase();
  if (value === 'résolu') return 'resolu';
  return value;
}

function getTicketsFilteredList() {
  var list = getVisibleTickets().slice();
  if (_ticketsViewState.status !== 'all') {
    list = list.filter(function(ticket) {
      var normalized = normalizeTicketStatus(ticket.statut);
      if (_ticketsViewState.status === 'open') return normalized !== 'resolu' && normalized !== 'clos';
      if (_ticketsViewState.status === 'critical') return ticket.urgence === 'critique';
      return normalized === _ticketsViewState.status;
    });
  }
  if (_ticketsViewState.urgency !== 'all') {
    list = list.filter(function(ticket) { return String(ticket.urgence || '') === _ticketsViewState.urgency; });
  }
  if (_ticketsViewState.search) {
    var query = _ticketsViewState.search.toLowerCase();
    list = list.filter(function(ticket) {
      return [ticket.titre, ticket.description, ticket.batiment, ticket.zone, ticket.reference]
        .filter(Boolean)
        .some(function(value) { return String(value).toLowerCase().indexOf(query) !== -1; });
    });
  }
  list.sort(function(a, b) {
    if (_ticketsViewState.sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (_ticketsViewState.sort === 'urgency') {
      var score = { critique: 3, important: 2, normal: 1 };
      return (score[b.urgence] || 0) - (score[a.urgence] || 0) || new Date(b.created_at) - new Date(a.created_at);
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });
  return list;
}

function getTicketsPageCounts() {
  var list = getVisibleTickets();
  return {
    total: list.length,
    open: list.filter(function(ticket) {
      var normalized = normalizeTicketStatus(ticket.statut);
      return normalized !== 'resolu' && normalized !== 'clos';
    }).length,
    critical: list.filter(function(ticket) {
      return ticket.urgence === 'critique' && normalizeTicketStatus(ticket.statut) !== 'resolu' && normalizeTicketStatus(ticket.statut) !== 'clos';
    }).length,
    syndic: list.filter(function(ticket) { return normalizeTicketStatus(ticket.statut) === 'transmis_syndic'; }).length
  };
}

function setTicketsStatusFilter(value) {
  _ticketsViewState.status = value;
  filterTickets();
}

function setTicketsUrgencyFilter(value) {
  _ticketsViewState.urgency = value;
  filterTickets();
}

function setTicketsSort(value) {
  _ticketsViewState.sort = value;
  filterTickets();
}

function setTicketsSearch(value) {
  _ticketsViewState.search = value || '';
  filterTickets();
}

function resetTicketsFilters() {
  _ticketsViewState = { status: 'all', urgency: 'all', search: '', sort: 'recent' };
  renderTickets();
}

function renderTicketsRowsHTML(list) {
  if (!list.length) {
    return '<div class="empty-state"><div class="empty-state-ico">+</div><div class="empty-state-title">Aucun signalement pour ce filtre</div><div class="empty-state-desc">Essaie un autre statut, une autre urgence ou relance un nouveau signalement.</div><div class="empty-state-action"><button class="btn btn-primary" onclick="openNewTicket()">Nouveau signalement</button></div></div>';
  }
  return list.map(function(ticket) {
    var requester = displayName(ticket.auteur_prenom, ticket.auteur_nom, ticket.auteur_email, 'Resident');
    var location = [ticket.batiment, ticket.zone].filter(Boolean).join(' · ') || 'Residence';
    return ''
      + '<button class="tickets4-row" onclick="openDetail(\'' + ticket.id + '\')">'
      + '<span class="tickets4-row-main">'
      + '<span class="tickets4-row-title">' + escHtml(ticket.titre || 'Signalement') + '</span>'
      + '<span class="tickets4-row-meta">' + escHtml(location) + ' · ' + escHtml(depuisJours(ticket.created_at)) + ' · ' + escHtml(requester) + '</span>'
      + '</span>'
      + '<span class="tickets4-row-side">' + badgeUrgence(ticket.urgence) + badgeStatut(ticket.statut) + '</span>'
      + '</button>';
  }).join('');
}

function filterTickets() {
  var listEl = $('tickets4-list');
  var countEl = $('tickets4-count');
  var filtered = getTicketsFilteredList();
  if (countEl) countEl.textContent = filtered.length + ' signalement' + (filtered.length > 1 ? 's' : '');
  if (listEl) listEl.innerHTML = renderTicketsRowsHTML(filtered);
  var root = $('tickets4-page');
  if (!root) return;
  root.querySelectorAll('[data-ticket-status]').forEach(function(btn) {
    btn.classList.toggle('is-active', btn.getAttribute('data-ticket-status') === _ticketsViewState.status);
  });
  root.querySelectorAll('[data-ticket-urgency]').forEach(function(btn) {
    btn.classList.toggle('is-active', btn.getAttribute('data-ticket-urgency') === _ticketsViewState.urgency);
  });
  var search = $('tickets4-search');
  if (search && search.value !== _ticketsViewState.search) search.value = _ticketsViewState.search;
  var sort = $('tickets4-sort');
  if (sort && sort.value !== _ticketsViewState.sort) sort.value = _ticketsViewState.sort;
}

function renderTickets() {
  var el = $('page');
  var counts = getTicketsPageCounts();
  var filtered = getTicketsFilteredList();
  var searchValue = String(_ticketsViewState.search || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  el.innerHTML = ''
    + '<section id="tickets4-page" class="tickets4">'
    + '<div class="tickets4-hero">'
    + '<div><div class="tickets4-kicker">Signalements</div><h1>Centre de traitement copropriete</h1><p>Tout ce qui doit etre vu, trie, relance ou cloture sans perdre le fil.</p></div>'
    + '<div class="tickets4-actions"><button class="btn btn-primary" onclick="openNewTicket()">Nouveau signalement</button><button class="btn btn-secondary" onclick="nav(\'dashboard\')">Retour dashboard</button></div>'
    + '</div>'
    + '<div class="tickets4-stats">'
    + '<button class="tickets4-stat" onclick="setTicketsStatusFilter(\'all\')"><small>Total</small><strong>' + counts.total + '</strong><span>base complete</span></button>'
    + '<button class="tickets4-stat" onclick="setTicketsStatusFilter(\'open\')"><small>Ouverts</small><strong>' + counts.open + '</strong><span>a traiter</span></button>'
    + '<button class="tickets4-stat" onclick="setTicketsStatusFilter(\'critical\')"><small>Critiques</small><strong>' + counts.critical + '</strong><span>priorite haute</span></button>'
    + '<button class="tickets4-stat" onclick="setTicketsStatusFilter(\'transmis_syndic\')"><small>Transmis</small><strong>' + counts.syndic + '</strong><span>attente syndic</span></button>'
    + '</div>'
    + '<div class="card tickets4-card">'
    + '<div class="card-header tickets4-card-head"><div><div class="card-title">File signalements</div><div class="tickets4-sub">Lecture, filtrage et ouverture detail en un geste.</div></div><div class="tickets4-head-actions"><strong id="tickets4-count">' + filtered.length + ' signalement' + (filtered.length > 1 ? 's' : '') + '</strong><button class="btn btn-ghost btn-sm" onclick="resetTicketsFilters()">Reset</button></div></div>'
    + '<div class="card-body">'
    + '<div class="tickets4-toolbar">'
    + '<input id="tickets4-search" class="input" type="search" placeholder="Rechercher un titre, une zone, un batiment..." value="' + searchValue + '" oninput="setTicketsSearch(this.value)">'
    + '<select id="tickets4-sort" class="select" onchange="setTicketsSort(this.value)"><option value="recent"' + (_ticketsViewState.sort === 'recent' ? ' selected' : '') + '>Plus recents</option><option value="oldest"' + (_ticketsViewState.sort === 'oldest' ? ' selected' : '') + '>Plus anciens</option><option value="urgency"' + (_ticketsViewState.sort === 'urgency' ? ' selected' : '') + '>Urgence d abord</option></select>'
    + '</div>'
    + '<div class="tickets4-filter-group"><span>Statut</span><div class="tickets4-pills"><button class="tickets4-pill' + (_ticketsViewState.status === 'all' ? ' is-active' : '') + '" data-ticket-status="all" onclick="setTicketsStatusFilter(\'all\')">Tout</button><button class="tickets4-pill' + (_ticketsViewState.status === 'open' ? ' is-active' : '') + '" data-ticket-status="open" onclick="setTicketsStatusFilter(\'open\')">Ouverts</button><button class="tickets4-pill' + (_ticketsViewState.status === 'critical' ? ' is-active' : '') + '" data-ticket-status="critical" onclick="setTicketsStatusFilter(\'critical\')">Critiques</button><button class="tickets4-pill' + (_ticketsViewState.status === 'transmis_syndic' ? ' is-active' : '') + '" data-ticket-status="transmis_syndic" onclick="setTicketsStatusFilter(\'transmis_syndic\')">Transmis</button><button class="tickets4-pill' + (_ticketsViewState.status === 'resolu' ? ' is-active' : '') + '" data-ticket-status="resolu" onclick="setTicketsStatusFilter(\'resolu\')">Resolus</button></div></div>'
    + '<div class="tickets4-filter-group"><span>Urgence</span><div class="tickets4-pills"><button class="tickets4-pill' + (_ticketsViewState.urgency === 'all' ? ' is-active' : '') + '" data-ticket-urgency="all" onclick="setTicketsUrgencyFilter(\'all\')">Toutes</button><button class="tickets4-pill' + (_ticketsViewState.urgency === 'critique' ? ' is-active' : '') + '" data-ticket-urgency="critique" onclick="setTicketsUrgencyFilter(\'critique\')">Critique</button><button class="tickets4-pill' + (_ticketsViewState.urgency === 'important' ? ' is-active' : '') + '" data-ticket-urgency="important" onclick="setTicketsUrgencyFilter(\'important\')">Importante</button><button class="tickets4-pill' + (_ticketsViewState.urgency === 'normal' ? ' is-active' : '') + '" data-ticket-urgency="normal" onclick="setTicketsUrgencyFilter(\'normal\')">Normale</button></div></div>'
    + '<div id="tickets4-list" class="tickets4-list">' + renderTicketsRowsHTML(filtered) + '</div>'
    + '</div>'
    + '</div>'
    + '</section>';
}
