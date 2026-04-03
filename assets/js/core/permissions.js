// ════════════════════════════════════════════════════════════════
//  COPROSYNC — Système de permissions dynamiques
//  assets/js/core/permissions.js
//
//  Ce module est le SEUL endroit où les permissions sont vérifiées
//  côté client. Tous les autres modules appellent has() ou perm().
//
//  Architecture :
//  1. Au login → loadPermissions() charge la matrice depuis Supabase
//  2. Supabase Realtime → mise à jour immédiate si un admin change
//  3. has(id) → boolean : la permission est-elle accordée ?
//  4. perm(id) → alias de has(), pour la lisibilité dans les templates
// ════════════════════════════════════════════════════════════════

const Permissions = (() => {

  // Cache local des permissions {permission_id: boolean}
  let _cache = {};
  let _locked = false;           // Vrai si le rôle est verrouillé
  let _loaded = false;
  let _realtimeChannel = null;

  // ── CATALOGUE de référence (chargé une fois) ──
  let _catalog = [];

  // ── MODULES → pages accessibles (mapping statique) ──
  // Utilisé pour construire le menu de navigation.
  const MODULE_TO_PAGE = {
    dashboard:   ['dashboard'],
    tickets:     ['tickets'],
    map:         ['map'],
    messages:    ['messages'],
    annonces:    ['annonces'],
    agenda:      ['agenda'],
    contacts:    ['contacts'],
    faq:         ['faq'],
    documents:   ['documents'],
    votes:       ['votes'],
    rapport:     ['rapport'],
    contrats:    ['contrats'],
    cles:        ['cles'],
    journal:     ['journal'],
    users:       ['users'],
    permissions: ['permissions'],
  };

  // ────────────────────────────────────────────────────────────────
  //  CHARGEMENT
  // ────────────────────────────────────────────────────────────────

  /**
   * Charge les permissions de l'utilisateur connecté depuis Supabase.
   * À appeler une fois au démarrage (dans loadAll).
   */
  async function load() {
    const role = profile?.role;
    if (!role || !user?.id) return;

    // Admin → toutes les permissions accordées, pas besoin de charger
    if (role === 'administrateur') {
      _locked = false;
      _loaded = true;
      _buildAdminCache();
      return;
    }

    try {
      // Vérification du verrou de rôle
      const { data: lockData } = await sb
        .from('role_locks')
        .select('locked')
        .eq('role', role)
        .single();
      _locked = lockData?.locked === true;

      if (_locked) {
        _cache = {};
        _loaded = true;
        return;
      }

      // Chargement des permissions accordées au rôle
      const { data: rpData } = await sb
        .from('role_permissions')
        .select('permission, granted')
        .eq('role', role);

      _cache = {};
      (rpData || []).forEach(rp => { _cache[rp.permission] = rp.granted; });
      _loaded = true;

    } catch(e) {
      console.warn('[Permissions] load error:', e.message);
      _cache = {};
      _loaded = true;
    }
  }

  /**
   * Charge le catalogue complet (pour la page admin).
   */
  async function loadCatalog() {
    const { data } = await sb.from('permissions').select('*').order('module').order('action');
    _catalog = data || [];
    return _catalog;
  }

  /**
   * Pour l'admin : toutes les permissions sont true.
   */
  function _buildAdminCache() {
    // On n'a pas besoin de charger depuis la DB pour l'admin.
    // has() retourne true directement si role = administrateur.
    _cache = {};
  }

  // ────────────────────────────────────────────────────────────────
  //  VÉRIFICATION
  // ────────────────────────────────────────────────────────────────

  /**
   * Vérifie si l'utilisateur connecté a une permission.
   * @param {string} permId — ex: 'tickets.edit_status'
   * @returns {boolean}
   */
  function has(permId) {
    // Admin : toujours true (hardcodé, inattaquable)
    if (profile?.role === 'administrateur') return true;
    // Rôle verrouillé : aucune permission
    if (_locked) return false;
    // Lecture dans le cache
    return _cache[permId] === true;
  }

  /**
   * Alias lisible pour les templates HTML.
   * Usage : ${perm('tickets.create') ? '<button>Signaler</button>' : ''}
   */
  function perm(permId) { return has(permId); }

  /**
   * Retourne les pages accessibles pour le menu de navigation.
   * Une page est accessible si au moins une permission 'view' du module est accordée.
   */
  function getAccessiblePages() {
    if (profile?.role === 'administrateur') {
      return Object.values(MODULE_TO_PAGE).flat();
    }
    if (_locked) return [];

    const pages = new Set();
    Object.entries(MODULE_TO_PAGE).forEach(([module, modulePages]) => {
      const viewPerm = `${module}.view`;
      if (has(viewPerm)) {
        modulePages.forEach(p => pages.add(p));
      }
    });

    // Profil et notifications toujours accessibles
    pages.add('profile');
    pages.add('notifications');

    return [...pages];
  }

  /**
   * Page d'accueil selon les permissions.
   */
  function getDefaultPage() {
    if (has('dashboard.view')) return 'dashboard';
    if (has('tickets.view'))   return 'tickets';
    if (has('rapport.view'))   return 'rapport';
    return 'profile';
  }

  // ────────────────────────────────────────────────────────────────
  //  REALTIME — mise à jour immédiate
  // ────────────────────────────────────────────────────────────────

  /**
   * Écoute les changements de permissions en temps réel.
   * Si un admin modifie le rôle de cet utilisateur → mise à jour immédiate.
   */
  function startRealtime() {
    if (_realtimeChannel) return;
    const role = profile?.role;
    if (!role || role === 'administrateur') return;

    _realtimeChannel = sb.channel(`permissions-${role}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'role_permissions',
        filter: `role=eq.${role}`
      }, async payload => {
        dbg('[Permissions] role_permissions changed:', payload);
        await load();
        _applyToUI();
        toast('⚡ Vos permissions ont été mises à jour', 'warn');
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'role_locks',
        filter: `role=eq.${role}`
      }, async payload => {
        dbg('[Permissions] role_locks changed:', payload);
        _locked = payload.new?.locked === true;
        if (_locked) {
          _cache = {};
          toast('🔒 Votre accès a été temporairement suspendu par un administrateur', 'err');
        } else {
          await load();
          toast('🔓 Votre accès a été rétabli', 'ok');
        }
        _applyToUI();
      })
      .subscribe();
  }

  /**
   * Applique les permissions à l'UI courante sans rechargement complet.
   * Re-render la navigation et la page actuelle.
   */
  function _applyToUI() {
    // Mise à jour du menu
    if (typeof initUI === 'function') initUI();
    // Si la page courante n'est plus accessible → rediriger
    const accessible = getAccessiblePages();
    if (!accessible.includes(currentPage)) {
      nav(getDefaultPage());
    } else {
      // Re-render la page pour cacher/montrer les boutons
      renderPage(currentPage);
    }
  }

  function stopRealtime() {
    if (_realtimeChannel) {
      sb.removeChannel(_realtimeChannel);
      _realtimeChannel = null;
    }
  }

  // ────────────────────────────────────────────────────────────────
  //  API ADMIN — modification des permissions
  // ────────────────────────────────────────────────────────────────

  /**
   * Accorde ou révoque une permission pour un rôle.
   * Enregistre dans le journal.
   * @param {string} role
   * @param {string} permId
   * @param {boolean} granted
   */
  async function setPermission(role, permId, granted) {
    if (profile?.role !== 'administrateur') return false;

    const { error } = await sb.from('role_permissions').upsert({
      role,
      permission: permId,
      granted,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'role,permission' });

    if (error) { toast('Erreur : ' + error.message, 'err'); return false; }

    // Journal
    await sb.from('permission_changes_log').insert({
      admin_id:  user.id,
      admin_nom: displayNameFromProfile(profile, user?.email),
      role,
      permission: permId,
      action:    granted ? 'granted' : 'revoked'
    });

    return true;
  }

  /**
   * Verrouille ou déverrouille un rôle entier.
   */
  async function setRoleLock(role, locked, reason = '') {
    if (profile?.role !== 'administrateur') return false;

    const { error } = await sb.from('role_locks').upsert({
      role,
      locked,
      locked_by: locked ? user.id : null,
      locked_at: locked ? new Date().toISOString() : null,
      reason:    locked ? reason : null
    }, { onConflict: 'role' });

    if (error) { toast('Erreur verrou : ' + error.message, 'err'); return false; }

    await sb.from('permission_changes_log').insert({
      admin_id:  user.id,
      admin_nom: displayNameFromProfile(profile, user?.email),
      role,
      permission: '*',
      action:    locked ? 'role_locked' : 'role_unlocked'
    });

    return true;
  }

  /**
   * Charge les permissions actuelles d'un rôle (pour la page admin).
   */
  async function getPermissionsForRole(role) {
    const { data } = await sb.from('role_permissions')
      .select('permission, granted')
      .eq('role', role);
    const map = {};
    (data || []).forEach(rp => { map[rp.permission] = rp.granted; });
    return map;
  }

  /**
   * Charge les verrous de rôle actuels.
   */
  async function getRoleLocks() {
    const { data } = await sb.from('role_locks').select('*');
    const map = {};
    (data || []).forEach(rl => { map[rl.role] = rl; });
    return map;
  }

  /**
   * Charge le journal des modifications (limité aux 100 derniers).
   */
  async function getChangeLog(limit = 100) {
    const { data } = await sb.from('permission_changes_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  }

  // ────────────────────────────────────────────────────────────────
  //  API PUBLIQUE
  // ────────────────────────────────────────────────────────────────
  return {
    load,
    loadCatalog,
    has,
    perm,
    getAccessiblePages,
    getDefaultPage,
    startRealtime,
    stopRealtime,
    setPermission,
    setRoleLock,
    getPermissionsForRole,
    getRoleLocks,
    getChangeLog,
    getCatalog: () => _catalog,
    isLoaded:   () => _loaded,
    isLocked:   () => _locked,
  };
})();

// ── Aliases globaux pour compatibilité avec l'existant ──────────
// Ces fonctions sont appelées partout dans l'app.
// Elles délèguent maintenant au système de permissions dynamique.

function isAdmin()          { return profile?.role === 'administrateur'; }
function isCS()             { return profile?.role === 'membre_cs'; }
function isManager()        { return isAdmin() || isCS(); }
function isSyndic()         { return profile?.role === 'syndic'; }
function isSyndicExterne()  { return isSyndic(); }
function isCopro()          { return profile?.role === 'copropriétaire'; }

function canManageTickets() { return Permissions.has('tickets.edit_status'); }
function canManageContent() { return isManager(); }
function canManageAnnonces(){ return isManager(); }
function canViewRapport()   { return Permissions.has('rapport.view'); }

function canViewTicket(ticket) {
  if (Permissions.has('tickets.view_all')) return true;
  if (!Permissions.has('tickets.view'))    return false;
  // Sans view_all : uniquement ses tickets
  return ticket.auteur_id === user?.id;
}

function canChangeTicketStatus() { return Permissions.has('tickets.edit_status'); }

function canComment(ticketAuteurId, prive = false) {
  if (prive) return Permissions.has('tickets.comment_private');
  if (!Permissions.has('tickets.comment')) return false;
  // Copropriétaire : seulement ses tickets
  if (isCopro()) return ticketAuteurId === user?.id;
  return true;
}

function canDeleteTicket() { return Permissions.has('tickets.delete') || isAdmin(); }

// getAccessiblePages et getDefaultPage délèguent au module
function getAccessiblePages() { return Permissions.getAccessiblePages(); }
function getDefaultPage()      { return Permissions.getDefaultPage(); }
