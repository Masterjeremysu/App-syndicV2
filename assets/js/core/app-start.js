// ── INIT ──
let _initDone = false;

sb.auth.onAuthStateChange(async (event, session) => {
  dbg('[auth]', event, !!session?.user, '| initDone:', _initDone);
  if (!_initDone) return;

  if (!session?.user || event === 'SIGNED_OUT') {
    _appStarted = false;
    $('login-screen').style.display = 'flex';
    $('app').style.display = 'none';
    user = null; profile = null;
    return;
  }
  $('auth-btn').disabled = false;
  $('auth-btn-text').textContent = 'Se connecter';

  if (_appStarted) { dbg('[auth] already started, skip'); return; }
  user = session.user;
  await loadProfile();

  if (profile?.actif === false) {
    await sb.auth.signOut();
    showAuthError('⊘ Votre compte a été suspendu. Contactez le conseil syndical.');
    $('auth-btn').disabled = false;
    $('auth-btn-text').textContent = 'Se connecter';
    return;
  }

  await startApp();
});

let _appStarted = false;
let _connInitDone = false;
let _connWasOffline = false;

function initConnectionStatus() {
  if (_connInitDone) return;
  _connInitDone = true;
  let banner = $('connection-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'connection-banner';
    banner.className = 'connection-banner';
    document.body.appendChild(banner);
  }
  const update = () => {
    const online = navigator.onLine;
    if (!online) {
      _connWasOffline = true;
      banner.textContent = '⚠ Connexion perdue - mode dégradé';
      banner.classList.add('show', 'offline');
      banner.classList.remove('online');
      return;
    }
    if (_connWasOffline) {
      banner.textContent = '✓ Connexion rétablie';
      banner.classList.add('show', 'online');
      banner.classList.remove('offline');
      setTimeout(() => banner.classList.remove('show'), 2200);
      _connWasOffline = false;
    } else {
      banner.classList.remove('show');
    }
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

async function startApp() {
  if (_appStarted) return;
  _appStarted = true;
  dbg('[startApp] role:', profile?.role);
  $('auth-btn').disabled = false;
  $('auth-btn-text').textContent = 'Se connecter';
  initTheme();
  try {
    $('login-screen').style.display = 'none';
    $('app').style.display = 'flex';
    initUI();
    initConnectionStatus();
    await loadAll();
    // Page d'accueil selon le rôle
nav(Permissions.getDefaultPage());
    registerSW();
    startRealtime();
    initSwipeToClose();
    initPullToRefresh();
    setTimeout(checkOnboarding, 1500);

    // Vérifie toutes les 2 minutes si le compte est toujours actif
    setInterval(async () => {
      const { data } = await sb.from('profiles').select('actif').eq('id', user.id).single();
      if (data?.actif === false) { await sb.auth.signOut(); location.reload(); }
    }, 2 * 60 * 1000);
  } catch(e) {
    err('[startApp] ERREUR:', e);
    showAuthError('Erreur au démarrage de l\'application. Réessayez dans quelques secondes.');
    toast('Erreur démarrage: ' + (e?.message || 'inconnue'), 'err');
    _appStarted = false;
    $('login-screen').style.display = 'flex';
    $('app').style.display = 'none';
  }
}

async function loadProfile() {
  dbg('[loadProfile] start, user.id=', user?.id);
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000));
    const query = sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    const { data, error } = await Promise.race([query, timeout]);
    if (data) {
      profile = data;
    } else {
      const meta = user.user_metadata || {};
      profile = {
        id: user.id, email: user.email,
        nom: meta.nom || null, prenom: meta.prenom || null,
        role: meta.role || 'copropriétaire',
        tour: meta.tour || null, lot: meta.lot || null,
      };
    }
    dbg('[loadProfile] role =', profile.role);
  } catch(e) {
    err('[loadProfile] CRASH/TIMEOUT:', e.message);
    try {
      const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) { profile = data; return; }
    } catch {}
    const meta = user.user_metadata || {};
    profile = {
      id: user.id, email: user.email,
      nom: meta.nom || null, prenom: meta.prenom || null,
      role: meta.role || 'copropriétaire',
    };
  }
}

function initUI() {
  if (!profile) return;

  // Avatar dans la sidebar
  const init = (profile.nom || '').charAt(0).toUpperCase() + (profile.prenom || '').charAt(0).toUpperCase();
  const avEl = $('nav-av');
  avEl.textContent = init || '?';
  const roleCls = { administrateur:'role-admin', syndic:'role-syndic', membre_cs:'role-cs' };
  avEl.className = `user-av ${roleCls[profile.role] || ''}`;
  $('nav-nom').textContent = displayNameFromProfile(profile, user?.email);
  const roleLabels = {
    administrateur:'Administrateur',
    syndic:'Syndic',
    membre_cs:'Conseil Syndical',
    'copropriétaire':'Copropriétaire'
  };
  $('nav-role').textContent = roleLabels[profile.role] || profile.role;

  // ── Visibilité du menu selon le rôle (v2) ──────────────────────
  const accessible = getAccessiblePages();

  // Cache tous les items manager et admin par défaut
  document.querySelectorAll('.nav-manager-only').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-admin-only').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-syndic-only').forEach(el => el.style.display = 'none');

  // Affiche selon les pages accessibles
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    const page = el.getAttribute('data-page');
    el.style.display = accessible.includes(page) ? '' : 'none';
  });

  // Sections de menu : afficher si au moins un item enfant est visible
  document.querySelectorAll('.nav-section').forEach(section => {
    // Cherche les items de navigation qui suivent cette section
    let next = section.nextElementSibling;
    let hasVisible = false;
    while (next && !next.classList.contains('nav-section') && !next.classList.contains('sidebar-footer')) {
      if (next.classList.contains('nav-item') && next.style.display !== 'none') {
        hasVisible = true;
        break;
      }
      next = next.nextElementSibling;
    }
    section.style.display = hasVisible ? '' : 'none';
  });

  // Pour le syndic : la topbar "Signaler" ne doit pas apparaître
  if (isSyndic()) {
    const signalerBtn = document.querySelector('#topbar .btn-primary');
    if (signalerBtn) signalerBtn.style.display = 'none';
    // Masque le bouton Signaler dans la bottom nav
    const bnSignaler = document.querySelector('.bn-signaler');
    if (bnSignaler) bnSignaler.style.display = 'none';
  }
}

async function loadAll() {
  try {
    // Syndic : charge tickets, contrats, annonces, events pour son périmètre
    if (isSyndic()) {
      await Promise.all([
        loadTickets(),
        loadContrats(),
        loadAnnonceCache(),
        loadEvenementsCache(),
      ]);
      updateBadges();
      return;
    }

    // Copropriétaire et managers : chargement standard
    await loadTickets();
    if (currentPage === 'dashboard') renderDashboard();

    const tasks = [];
    if (isManager()) tasks.push(loadContrats());
    tasks.push(loadCles());
    tasks.push(loadAnnonceCache());
    tasks.push(loadEvenementsCache());
    tasks.push(loadContactsCache());
    await Promise.all(tasks);
    if (isManager()) await loadJournal();
    updateBadges();
    checkNotifications();
    if (currentPage === 'dashboard') renderDashboard();
  } catch(e) {
    err('loadAll error:', e);
  }
}
