// ── ANNONCES — UI premium, filtres, brouillons, visibilité par rôle
const ANNONCE_TYPES = {
  urgent:    { label:'🚨 Urgent',    color:'red',    ico:'🚨' },
  important: { label:'⚠️ Important', color:'orange', ico:'⚠️' },
  info:      { label:'ℹ️ Info',      color:'info',   ico:'📢' },
};

const ROLE_LABELS = {
  copropriétaire: 'Copropriétaires',
  membre_cs: 'Conseil syndical',
  syndic: 'Syndic',
  administrateur: 'Administrateurs',
};

let _annTab = 'publie';
let _annFilter = 'all';
let _annSearch = '';

function onAnnonceVisModeChange() {
  const mode = $('anc-vis-mode')?.value;
  const box = $('anc-vis-roles');
  if (box) box.style.display = mode === 'roles' ? 'block' : 'none';
}

function annonceVisPreset(preset) {
  const mode = $('anc-vis-mode');
  if (mode) mode.value = 'roles';
  onAnnonceVisModeChange();
  document.querySelectorAll('.anc-role-cb').forEach(cb => { cb.checked = false; });
  const map = {
    gestion: ['membre_cs', 'syndic', 'administrateur'],
    residents: ['copropriétaire'],
    tous_roles: ['copropriétaire', 'membre_cs', 'syndic', 'administrateur'],
  };
  (map[preset] || []).forEach(r => {
    const cb = document.querySelector(`.anc-role-cb[value="${r}"]`);
    if (cb) cb.checked = true;
  });
}

function setAnnoncesTab(tab) {
  _annTab = tab;
  document.querySelectorAll('.ann2-tab').forEach(btn => {
    const t = btn.getAttribute('data-ann-tab');
    if (t) btn.classList.toggle('active', t === tab);
  });
  loadAnnonces();
}

function setAnnoncesFilter(f) {
  _annFilter = f;
  document.querySelectorAll('.ann2-chip').forEach(btn => {
    const flt = btn.getAttribute('data-ann-filter');
    if (flt) btn.classList.toggle('active', flt === f);
  });
  loadAnnonces();
}

function setAnnoncesSearch(val) {
  _annSearch = (val || '').trim().toLowerCase();
  loadAnnonces();
}

function toggleAnnonceBody(id) {
  const wrap = $('ann-body-' + id);
  const btn = wrap?.nextElementSibling;
  if (!wrap) return;
  const collapsed = wrap.classList.toggle('ann2-body-collapsed');
  if (btn && btn.classList.contains('ann2-toggle')) {
    btn.textContent = collapsed ? 'Lire la suite ↓' : 'Réduire ↑';
  }
}

function annonceContenuBlock(contenu, id) {
  if (!contenu) return '';
  const esc = escHtml(contenu);
  const long = contenu.length > 240;
  const collapsedClass = long ? 'ann2-body ann2-body-collapsed' : 'ann2-body';
  return `<div class="${collapsedClass}" id="ann-body-${id}"><div class="ann2-body-inner">${esc}</div></div>
    ${long ? `<button type="button" class="btn btn-ghost btn-sm ann2-toggle" onclick="toggleAnnonceBody('${id}')">Lire la suite ↓</button>` : ''}`;
}

async function renderAnnonces() {
  _annTab = 'publie';
  _annFilter = 'all';
  _annSearch = '';
  $('page').innerHTML = `
    <div class="ann2-page">
      <div class="ann2-head">
        <div class="ann2-head-text">
          <h1>Annonces</h1>
          <p>Fil d’infos officiel — visible selon les rôles que vous choisissez à la publication.</p>
        </div>
        ${canManageAnnonces() ? `<button type="button" class="btn btn-primary" onclick="openNewAnnonce()">+ Nouvelle annonce</button>` : ''}
      </div>

      ${canManageAnnonces() ? `
      <div class="ann2-tabs">
        <button type="button" class="ann2-tab ${_annTab === 'publie' ? 'active' : ''}" data-ann-tab="publie" onclick="setAnnoncesTab('publie')">Publiées</button>
        <button type="button" class="ann2-tab ${_annTab === 'brouillon' ? 'active' : ''}" data-ann-tab="brouillon" onclick="setAnnoncesTab('brouillon')">Brouillons</button>
      </div>` : ''}

      <div class="ann2-toolbar">
        <div class="ann2-chips">
          <button type="button" class="ann2-chip ${_annFilter === 'all' ? 'active' : ''}" data-ann-filter="all" onclick="setAnnoncesFilter('all')">Toutes</button>
          <button type="button" class="ann2-chip ${_annFilter === 'epingle' ? 'active' : ''}" data-ann-filter="epingle" onclick="setAnnoncesFilter('epingle')">📌 Épinglées</button>
          <button type="button" class="ann2-chip ${_annFilter === 'urgent' ? 'active' : ''}" data-ann-filter="urgent" onclick="setAnnoncesFilter('urgent')">🚨 Urgentes</button>
          <button type="button" class="ann2-chip ${_annFilter === 'important' ? 'active' : ''}" data-ann-filter="important" onclick="setAnnoncesFilter('important')">⚠️ Importantes</button>
          <button type="button" class="ann2-chip ${_annFilter === 'info' ? 'active' : ''}" data-ann-filter="info" onclick="setAnnoncesFilter('info')">ℹ️ Infos</button>
        </div>
        <input type="search" class="input ann2-search" id="ann-inline-search" placeholder="Filtrer par mot-clé…" value="">
      </div>

      <div id="annonces-list"><div class="ann2-loading">Chargement…</div></div>
    </div>`;
  const si = $('ann-inline-search');
  if (si) {
    si.addEventListener('input', e => setAnnoncesSearch(e.target.value));
  }
  await loadAnnonces();
}

function annoncesApplyFilters(list) {
  let out = list.filter(a => annonceReaderCanSee(a));
  if (canManageAnnonces()) {
    if (_annTab === 'brouillon') {
      out = out.filter(a => a.brouillon === true || a.brouillon === 'true');
    } else {
      out = out.filter(a => !(a.brouillon === true || a.brouillon === 'true'));
    }
  }
  if (_annFilter === 'epingle') out = out.filter(a => a.epingle);
  else if (_annFilter !== 'all') out = out.filter(a => a.type ===  _annFilter);
  if (_annSearch) {
    const s = _annSearch;
    out = out.filter(a =>
      (a.titre || '').toLowerCase().includes(s) ||
      (a.contenu || '').toLowerCase().includes(s)
    );
  }
  out.sort((a, b) => {
    if (a.epingle !== b.epingle) return a.epingle ? -1 : 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });
  return out;
}

async function loadAnnonces() {
  const { data, error } = await sb.from('annonces')
    .select('*, profiles(nom,prenom)')
    .order('epingle', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) { console.warn('[annonces]', error.message); return; }
  const el = $('annonces-list');
  if (!el) return;
  const list = annoncesApplyFilters(data || []);
  if (cache) cache.annonces = data || [];
  if (typeof updateBadges === 'function') updateBadges();

  if (!list.length) {
    el.innerHTML = emptyState('📢', _annSearch ? 'Aucun résultat' : (_annTab === 'brouillon' ? 'Aucun brouillon' : 'Aucune annonce'),
      _annSearch ? 'Essayez un autre mot-clé ou réinitialisez les filtres.' : 'Les annonces officielles apparaîtront ici. Les brouillons restent visibles uniquement pour la gestion.',
      canManageAnnonces() && _annTab !== 'brouillon' ? '<button type="button" class="btn btn-primary btn-sm" onclick="openNewAnnonce()">+ Publier une annonce</button>' : '');
    return;
  }

  el.innerHTML = list.map(a => {
    const t = ANNONCE_TYPES[a.type] || ANNONCE_TYPES.info;
    const auteur = a.profiles ? displayName(a.profiles.prenom, a.profiles.nom, null, '—') : '—';
    const date = new Date(a.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
    const vis = annonceVisibilityLabel(a);
    return `<article class="ann2-card ann2-type-${a.type} ${a.epingle ? 'ann2-epingle' : ''} ${a.brouillon ? 'ann2-is-draft' : ''}">
      <div class="ann2-card-top">
        <div class="ann2-card-ico">${a.epingle ? '📌' : t.ico}</div>
        <div class="ann2-card-main">
          <div class="ann2-card-titre-row">
            <h2 class="ann2-card-titre">${escHtml(a.titre)}</h2>
            <span class="ann2-badge-type ${a.type}">${t.label}</span>
          </div>
          <div class="ann2-meta">
            <span>Par ${escHtml(auteur)}</span>
            <span class="ann2-meta-dot">·</span>
            <span>${date}</span>
            <span class="${vis.cls}">${vis.text}</span>
          </div>
        </div>
      </div>
      ${a.contenu ? annonceContenuBlock(a.contenu, a.id) : ''}
      ${canManageAnnonces() ? `
      <div class="ann2-actions no-print">
        <button type="button" class="btn btn-ghost btn-sm" onclick="toggleEpingle('${a.id}',${!a.epingle})">${a.epingle ? '📌 Désépingler' : '📌 Épingler'}</button>
        <button type="button" class="btn btn-ghost btn-sm" onclick="editAnnonce('${a.id}')">✏️ Modifier</button>
        <button type="button" class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="deleteAnnonce('${a.id}')">🗑 Supprimer</button>
      </div>` : ''}
    </article>`;
  }).join('');
}

function openNewAnnonce(existing) {
  const isEdit = !!existing;
  const mode = existing?.visibility_mode || 'public';
  const roles = normalizeAnnonceRoles(existing?.visibility_roles);
  const roleChecks = ['copropriétaire', 'membre_cs', 'syndic', 'administrateur'].map(r =>
    `<label class="ann2-role-label"><input type="checkbox" class="anc-role-cb" value="${r}" ${roles.includes(r) ? 'checked' : ''}>
      <span>${ROLE_LABELS[r] || r}</span></label>`
  ).join('');

  const safeTitre = (existing?.titre || '').replace(/"/g, '&quot;');
  const safeContenu = existing?.contenu || '';
  const html = `
    <div class="fg"><label class="label">Titre *</label>
  <input type="text" id="anc-titre" class="input" placeholder="Ex: Travaux ascenseur Tour 17" value="${safeTitre}">
</div>
<div class="fg-row">
  <div class="fg" style="margin:0;flex:1;">
    <label class="label">Type</label>
    <select id="anc-type" class="select" style="width:100%;">
      ${Object.entries(ANNONCE_TYPES).map(([k,v]) => `<option value="${k}" ${existing?.type===k?'selected':''}>${v.label}</option>`).join('')}
    </select>
  </div>
  ${canManageAnnonces() ? `<div class="fg" style="margin:0;flex:1;">
    <label class="label">Visibilité</label>
    <select id="anc-vis-mode" class="select" style="width:100%;" onchange="onAnnonceVisModeChange()">
      <option value="public" ${mode === 'public' ? 'selected' : ''}>Tous les résidents connectés</option>
      <option value="roles" ${mode === 'roles' ? 'selected' : ''}>Restreindre à certains rôles…</option>
    </select>
  </div>` : ''}
</div>
${canManageAnnonces() ? `
<div class="fg ann2-vis-box" id="anc-vis-roles" style="display:${mode === 'roles' ? 'block' : 'none'};">
  <label class="label">Rôles autorisés à lire</label>
  <div class="ann2-role-grid">${roleChecks}</div>
  <div class="ann2-presets">
    <span class="ann2-presets-label">Préréglages :</span>
    <button type="button" class="btn btn-ghost btn-xs" onclick="annonceVisPreset('tous_roles')">Tous les rôles</button>
    <button type="button" class="btn btn-ghost btn-xs" onclick="annonceVisPreset('gestion')">Gestion seulement</button>
    <button type="button" class="btn btn-ghost btn-xs" onclick="annonceVisPreset('residents')">Copropriétaires seulement</button>
  </div>
</div>` : ''}
<div class="fg"><label class="label">Contenu</label>
  <textarea id="anc-contenu" class="textarea" rows="6" placeholder="Détails, dates, consignes…">${safeContenu.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</textarea>
</div>
<div class="fg ann2-modal-foot-opts" style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;">
  <label class="ann2-check"><input type="checkbox" id="anc-epingle" ${existing?.epingle?'checked':''}><span>📌 Épingler en tête de liste</span></label>
  ${canManageAnnonces() ? `<label class="ann2-check ann2-check-draft"><input type="checkbox" id="anc-brouillon" ${existing?.brouillon?'checked':''}><span>📝 Enregistrer comme brouillon (invisible résidents)</span></label>` : ''}
</div>`;

  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-annonce';
  overlay.innerHTML = `<div class="modal ann2-modal" style="max-width:560px;">
    <div class="mh">
      <span class="mh-title">${isEdit ? 'Modifier l\'annonce' : 'Nouvelle annonce'}</span>
      <button type="button" class="mclose" onclick="document.getElementById('modal-annonce')?.remove()">×</button>
    </div>
    <div class="mb">${html}</div>
    <div class="mf">
      <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-annonce')?.remove()">Annuler</button>
      <button type="button" class="btn btn-primary" onclick="saveAnnonce('${existing?.id||''}')">
        ${isEdit ? 'Enregistrer' : 'Publier'}
      </button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  onAnnonceVisModeChange();
}

async function saveAnnonce(id) {
  const titre = $('anc-titre')?.value.trim();
  if (!titre) { toast('Titre requis', 'err'); return; }
  const type = $('anc-type')?.value || 'info';
  const visMode = canManageAnnonces() ? ($('anc-vis-mode')?.value || 'public') : 'public';
  let visRoles = [];
  if (visMode === 'roles') {
    visRoles = [...document.querySelectorAll('.anc-role-cb:checked')].map(cb => cb.value);
    if (!visRoles.length) {
      toast('Choisis au moins un rôle pour une annonce restreinte.', 'warn');
      return;
    }
  }
  const payload = {
    titre,
    type,
    contenu: $('anc-contenu')?.value.trim() || null,
    epingle: $('anc-epingle')?.checked || false,
    auteur_id: user.id,
    visibility_mode: visMode,
    visibility_roles: visRoles,
    visible_pour: annonceVisiblePourFromForm(visMode, visRoles),
    brouillon: canManageAnnonces() ? ($('anc-brouillon')?.checked || false) : false,
  };
  let error, data;
  if (id) {
    ({ error, data } = await sb.from('annonces').update(payload).eq('id', id).select().single());
  } else {
    ({ error, data } = await sb.from('annonces').insert(payload).select().single());
  }
  if (error) {
    console.warn('[annonces save]', error);
    toast(error.message?.includes('column') ? 'Mise à jour BDD requise : exécutez le SQL « annonces » du schéma (visibilité).' : 'Erreur sauvegarde', 'err');
    return;
  }
  document.getElementById('modal-annonce')?.remove();
  toast(id ? 'Annonce modifiée ✓' : 'Annonce enregistrée ✓', 'ok');

  const row = data || { ...payload, id };

  if (!id && row && !payload.brouillon) {
    const annMeta = {
      visibility_mode: payload.visibility_mode,
      visibility_roles: payload.visibility_roles,
      brouillon: false,
    };
    const targetRoles = new Set(annonceTargetRoles(annMeta));
    if (type === 'urgent') {
      const { data: allUsers } = await sb.from('profiles').select('id,email,role').eq('actif', true);
      const notifs = (allUsers || []).filter(u =>
        u.id !== user.id && targetRoles.has(u.role)
      ).map(u => ({
        destinataire_id: u.id,
        destinataire_email: u.email || '',
        sujet: `🚨 Annonce urgente : ${titre}`,
        corps: payload.contenu || '',
        type: 'urgent',
        reference_id: row.id,
        lu: false
      }));
      if (notifs.length) await sb.from('notifications').insert(notifs);
      await pushNotif('🚨 Annonce urgente', titre, 'critique', null);
      const { data: allEmails } = await sb.from('profiles').select('email,role').eq('actif', true);
      const emails = (allEmails || []).filter(u => targetRoles.has(u.role)).map(u => u.email).filter(Boolean);
      if (emails.length) await sendEmailDirect('nouvelle_annonce', emails, { titre, type, contenu: payload.contenu });
    } else if (type === 'important') {
      const { data: managers } = await sb.from('profiles').select('id,email,role')
        .in('role', ['administrateur', 'syndic', 'membre_cs']).eq('actif', true);
      const notifs = (managers || []).filter(u =>
        u.id !== user.id && targetRoles.has(u.role)
      ).map(u => ({
        destinataire_id: u.id,
        destinataire_email: u.email || '',
        sujet: `⚠️ Annonce importante : ${titre}`,
        corps: payload.contenu || '',
        type: 'important',
        reference_id: row.id,
        lu: false
      }));
      if (notifs.length) await sb.from('notifications').insert(notifs);
    }
  }
  await loadAnnonces();
}

async function editAnnonce(annonceId) {
  const { data } = await sb.from('annonces').select('*').eq('id', annonceId).single();
  if (data) openNewAnnonce(data);
}

async function toggleEpingle(annonceId, val) {
  await sb.from('annonces').update({ epingle: val }).eq('id', annonceId);
  await loadAnnonces();
}

async function deleteAnnonce(annonceId) {
  if (!confirm('Supprimer cette annonce ?')) return;
  await sb.from('annonces').delete().eq('id', annonceId);
  toast('Annonce supprimée', 'ok');
  await loadAnnonces();
}

// ── AGENDA ──
