// ── RENDER ROUTER v2 ──
// Toutes les routes passent par ici. La vérification des permissions
// se fait ici ET dans chaque module (défense en profondeur).

function renderPage(p) {
  const el = $('page');
  const accessible = getAccessiblePages();

  // Vérification d'accès — redirige si la page n'est pas accessible
  if (!accessible.includes(p)) {
    dbg(`[router] page "${p}" non accessible pour rôle "${currentRole()}" → redirection`);
    p = getDefaultPage();
    currentPage = p;
  }

  // Animation de transition
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'pageIn .22s cubic-bezier(.4,0,.2,1) both';

  if (p === 'dashboard') renderDashboard();
  else if (p === 'tickets') renderTickets();
  else if (p === 'map') { renderMapPage(); setTimeout(initMap, 100); }
  else if (p === 'contrats') renderContrats();
  else if (p === 'cles') renderCles();
  else if (p === 'journal') renderJournal();
  else if (p === 'users') renderUsers();
  else if (p === 'rapport') renderRapport();
  else if (p === 'notifications') renderNotifications();
  else if (p === 'profile') renderProfile();
  else if (p === 'messages') renderMessages();
  else if (p === 'annonces') renderAnnonces();
  else if (p === 'agenda') renderAgenda();
  else if (p === 'contacts') renderContacts();
  else if (p === 'documents') renderDocuments();
  else if (p === 'votes') renderVotes();
  else if (p === 'faq') renderFAQ();
}

// ── DATA LOADERS v2 ──
// loadTickets filtre côté client selon le rôle pour les copropriétaires.
// La RLS Supabase fait le vrai filtrage ; ici on s'assure que le cache
// local est cohérent avec ce que l'utilisateur a le droit de voir.

async function loadTickets() {
  const { data, error } = await sb.from('v_tickets').select('*').order('created_at', { ascending: false });
  if (!error && data) {
    // La RLS a déjà filtré. On stocke tel quel.
    cache.tickets = data;
  }
  return data;
}

async function loadContrats() {
  const { data, error } = await sb.from('contrats').select('*').order('date_echeance', { ascending: true });
  if (error) { console.warn('loadContrats:', error.message); return; }
  if (data) cache.contrats = data;
}

async function loadCles() {
  if (!isManager()) return;   // seuls les managers ont accès aux clés
  const { data } = await sb.from('cles').select('*').order('nom');
  if (data) cache.cles = data;
}

async function loadJournal() {
  if (!isManager() && !isSyndic()) return;
  const { data } = await sb.from('journal').select('*,profiles(nom,prenom)').order('created_at', { ascending: false }).limit(200);
  if (data) cache.journal = data;
}

async function loadAnnonceCache() {
  const { data } = await sb.from('annonces').select('*').order('created_at', { ascending: false }).limit(50);
  if (data) cache.annonces = data;
}

async function loadEvenementsCache() {
  const { data } = await sb.from('evenements').select('*').order('date_debut', { ascending: true });
  if (data) cache.evenements = data;
}

async function loadContactsCache() {
  const { data } = await sb.from('contacts').select('*').eq('actif', true).order('ordre');
  if (data) _contactsCache = data;
}

async function loadStats() {
  const { data } = await sb.from('v_stats').select('*').single();
  return data;
}

function updateBadges() {
  const open = (cache.tickets||[]).filter(t => t.statut !== 'résolu' && t.statut !== 'clos').length;
  const nc = $('nc-tickets');
  if (nc) { if (open > 0) { nc.textContent = open; nc.style.display = ''; } else nc.style.display = 'none'; }
  const bnb = $('bn-badge-tickets');
  if (bnb) { if (open > 0) { bnb.textContent = open > 9 ? '9+' : open; bnb.style.display = 'flex'; } else bnb.style.display = 'none'; }

  if (isManager()) {
    const expiring = (cache.contrats||[]).filter(c => {
      const d = daysUntil(c.date_echeance);
      return d !== null && d >= 0 && d <= 90;
    }).length;
    const nc2 = $('nc-contrats');
    if (nc2) { if (expiring > 0) { nc2.style.display = ''; } else nc2.style.display = 'none'; }
  }
}
