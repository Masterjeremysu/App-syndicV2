// ── INIT — Restaure la session si elle existe ──
(async () => {
  // 🔥 FIX REGISTRE : Intercepter le mode Scan QR (Accès public sans compte)
  const urlParams = new URLSearchParams(window.location.search);
  const zoneToken = urlParams.get('zone');
  if (window.location.pathname.includes('/scan') || zoneToken) {
    $('login-screen').style.display = 'none';
    $('app').style.display = 'block';
    $('sidebar').style.display = 'none'; // Cacher le menu
    $('topbar').style.display = 'none';  // Cacher la topbar
    $('bottom-nav').style.display = 'none'; // Cacher la barre du bas
    
    // Attendre que le module registre soit chargé s'il est asynchrone
    setTimeout(() => {
      if (typeof renderScanPage === 'function') {
        renderScanPage(zoneToken);
      } else {
        alert("Erreur: Le module de scan n'est pas accessible.");
      }
    }, 100);
    return; // On bloque l'initialisation classique de la session
  }

  // Mode inscription public
  if (typeof checkRegisterMode === 'function' && checkRegisterMode()) return;

  // Mode FAQ public (sans connexion requise)
  if (typeof checkFaqMode === 'function' && checkFaqMode()) return;

  const authBtn     = $('auth-btn');
  const authBtnText = $('auth-btn-text');
  if (authBtn) { authBtn.disabled = true; authBtnText.textContent = 'Chargement…'; }

  // Vérifie si une session valide existe déjà (retour sur l'app, PWA)
  const { data: { session } } = await sb.auth.getSession();

  if (session?.user) {
    dbg('[init] session restauree pour', session.user.email);
    _initDone = true;
    user = session.user;
    await loadProfile();
    await startApp();
  } else {
    dbg('[init] aucune session, affichage login');
    _initDone = true;
    if (authBtn) { authBtn.disabled = false; authBtnText.textContent = 'Se connecter'; }
    $('login-screen').style.display = 'flex';
  }
})();
