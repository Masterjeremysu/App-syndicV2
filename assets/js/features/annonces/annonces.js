const ANNONCE_TYPES = {
  urgent:    { label:'🚨 Urgent',    color:'red',    ico:'🚨' },
  important: { label:'⚠️ Important', color:'orange', ico:'⚠️' },
  info:      { label:'ℹ️ Info',      color:'info',   ico:'📢' },
};

async function renderAnnonces() {
  $('page').innerHTML = `<div style="padding:24px;max-width:760px;">
    <div class="ph" style="display:flex;align-items:center;justify-content:space-between;">
      <div><h1>Annonces</h1><p>Informations officielles de la résidence</p></div>
      ${isManager() ? `<button class="btn btn-primary" onclick="openNewAnnonce()">+ Nouvelle annonce</button>` : ''}
    </div>
    <div id="annonces-list"><div style="text-align:center;padding:40px;color:var(--text-3);">Chargement…</div></div>
  </div>`;
  await loadAnnonces();
}

async function loadAnnonces() {
  const { data, error } = await sb.from('annonces')
    .select('*, profiles(nom,prenom)')
    .order('epingle', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) { console.warn('[annonces]', error.message); return; }
  const el = $('annonces-list');
  if (!el) return;
  const list = data || [];
  if (!list.length) {
    el.innerHTML = emptyState('📢', 'Aucune annonce', 'Les annonces du conseil syndical et du syndic apparaîtront ici.');
    return;
  }
  el.innerHTML = list.map(a => {
    const t = ANNONCE_TYPES[a.type] || ANNONCE_TYPES.info;
    const auteur = a.profiles ? displayName(a.profiles.prenom, a.profiles.nom, null, '—') : '—';
    const date = new Date(a.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
    return `<div class="annonce-card ${a.type}${a.epingle?' epingle':''}">
      <div class="annonce-header">
        <div class="annonce-ico">${a.epingle ? '📌' : t.ico}</div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <div class="annonce-titre">${escHtml(a.titre)}</div>
            <span class="annonce-badge ${a.type}">${t.label}</span>
            ${a.epingle ? '<span class="annonce-badge info">📌 Épinglé</span>' : ''}
          </div>
          <div class="annonce-meta">Par ${auteur} · ${date}</div>
        </div>
      </div>
      ${a.contenu ? `<div class="annonce-contenu">${escHtml(a.contenu)}</div>` : ''}
      ${isManager() ? `
      <div class="annonce-actions">
        <button class="btn btn-ghost btn-sm" onclick="toggleEpingle('${a.id}',${!a.epingle})">${a.epingle ? '📌 Désépingler' : '📌 Épingler'}</button>
        <button class="btn btn-ghost btn-sm" onclick="editAnnonce('${a.id}')">✏️ Modifier</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="deleteAnnonce('${a.id}')">🗑 Supprimer</button>
      </div>` : ''}
    </div>`;
  }).join('');
}

function openNewAnnonce(existing) {
  const isEdit = !!existing;
  const html = `
    <div class="fg"><label class="label">Titre *</label>
      <input type="text" id="anc-titre" class="input" placeholder="Ex: Travaux d'ascenseur Tour 17" value="${existing?.titre||''}">
    </div>
    <div class="fg"><label class="label">Type</label>
      <select id="anc-type" class="select" style="width:100%;">
        ${Object.entries(ANNONCE_TYPES).map(([k,v]) => `<option value="${k}" ${existing?.type===k?'selected':''}>${v.label}</option>`).join('')}
      </select>
    </div>
    <div class="fg"><label class="label">Contenu</label>
      <textarea id="anc-contenu" class="textarea" rows="5" placeholder="Détails de l'annonce…">${existing?.contenu||''}</textarea>
    </div>
    <div class="fg" style="display:flex;align-items:center;gap:8px;">
      <input type="checkbox" id="anc-epingle" ${existing?.epingle?'checked':''}>
      <label for="anc-epingle" style="cursor:pointer;font-size:13px;">📌 Épingler cette annonce en haut</label>
    </div>`;

  // Réutilise une modal générique inline
  const overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-annonce';
  overlay.innerHTML = `<div class="modal" style="max-width:520px;">
    <div class="mh">
      <span class="mh-title">${isEdit ? 'Modifier l\'annonce' : 'Nouvelle annonce'}</span>
      <button class="mclose" onclick="document.getElementById('modal-annonce').remove()">×</button>
    </div>
    <div class="mb">${html}</div>
    <div class="mf">
      <button class="btn btn-secondary" onclick="document.getElementById('modal-annonce').remove()">Annuler</button>
      <button class="btn btn-primary" onclick="saveAnnonce('${existing?.id||''}')">
        ${isEdit ? 'Enregistrer' : 'Publier'}
      </button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

async function saveAnnonce(id) {
  const titre = $('anc-titre')?.value.trim();
  if (!titre) { toast('Titre requis', 'err'); return; }
  const type = $('anc-type')?.value || 'info';
  const payload = {
    titre,
    type,
    contenu: $('anc-contenu')?.value.trim() || null,
    epingle: $('anc-epingle')?.checked || false,
    auteur_id: user.id,
  };
  let error, data;
  if (id) {
    ({ error } = await sb.from('annonces').update(payload).eq('id', id));
  } else {
    ({ error, data } = await sb.from('annonces').insert(payload).select().single());
  }
  if (error) { toast('Erreur sauvegarde', 'err'); return; }
  document.getElementById('modal-annonce')?.remove();
  toast(id ? 'Annonce modifiée ✓' : 'Annonce publiée ✓', 'ok');
  // 🔔 Notif push si urgent ou important
  if (!id && data) {
    if (type === 'urgent') {
      const { data: allUsers } = await sb.from('profiles').select('id,email').eq('actif', true);
      const notifs = (allUsers||[]).filter(u => u.id !== user.id).map(u => ({
        destinataire_id: u.id, sujet: `🚨 Annonce urgente : ${titre}`, corps: `Nouvelle annonce urgente : ${titre}`, destinataire_email: u.email||'',
        corps: payload.contenu || '', type: 'urgent', reference_id: data.id, lu: false
      }));
      if (notifs.length) await sb.from('notifications').insert(notifs);
      await pushNotif('🚨 Annonce urgente', titre, 'critique', null);
      // Email à tous
      const { data: allEmails } = await sb.from('profiles').select('email').eq('actif', true);
      const emails = (allEmails||[]).map(u => u.email).filter(Boolean);
      if (emails.length) await sendEmailDirect('nouvelle_annonce', emails, { titre, type, contenu: payload.contenu });
    } else if (type === 'important') {
      const { data: managers } = await sb.from('profiles').select('id,email')
        .in('role', ['administrateur','syndic','membre_cs']).eq('actif', true);
      const notifs = (managers||[]).filter(u => u.id !== user.id).map(u => ({
        destinataire_id: u.id, sujet: `⚠️ Annonce importante : ${titre}`, corps: `Nouvelle annonce importante : ${titre}`, destinataire_email: u.email||'',
        corps: payload.contenu || '', type: 'important', reference_id: data.id, lu: false
      }));
      if (notifs.length) await sb.from('notifications').insert(notifs);
    }
  }
  await loadAnnonces();
}

async function editAnnonce(id) {
  const { data } = await sb.from('annonces').select('*').eq('id', id).single();
  if (data) openNewAnnonce(data);
}

async function toggleEpingle(id, val) {
  await sb.from('annonces').update({ epingle: val }).eq('id', id);
  await loadAnnonces();
}

async function deleteAnnonce(id) {
  if (!confirm('Supprimer cette annonce ?')) return;
  await sb.from('annonces').delete().eq('id', id);
  toast('Annonce supprimée', 'ok');
  await loadAnnonces();
}

// ── AGENDA ──
