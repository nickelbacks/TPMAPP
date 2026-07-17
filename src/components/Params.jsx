import React, { useState, useEffect, useCallback } from 'react';
import {
  ROLES, DEMO_LIMITS, FREQ_PRESETS, freqLabel, initials, nextId, saveDB, seed, initIdc,
} from '../db.js';
import {
  Pencil, Trash2, Plus, Factory, Wrench, Users, RotateCcw, Check, X
} from 'lucide-react';

function LimitNote({ kind, labelPlural, DB }) {
  const n = DB[kind].length;
  const max = DEMO_LIMITS[kind];
  const full = n >= max;
  return (
    <span className={`limit-note ${full ? 'full' : ''}`}>
      {n}/{max} {labelPlural}{full ? ' — limite atteinte' : ''}
    </span>
  );
}

function demoBlock(kind, labelPlural, trk) {
  trk('limit_hit', { limit: kind });
  alert(`🔒 Version DÉMO — limitée à ${DEMO_LIMITS[kind]} ${labelPlural}.\n\nPassez à la version complète pour un usage illimité.`);
}

function AddPoste({ DB, persist, trk }) {
  const [name, setName] = useState('');
  const add = () => {
    const n = name.trim();
    if (!n) return;
    if (DB.postes.length >= DEMO_LIMITS.postes) { demoBlock('postes', 'postes de travail', trk); return; }
    const newDB = { ...DB, postes: [...DB.postes, { id: nextId(), name: n }] };
    persist(newDB);
    trk('action', { type: 'create_poste' });
    setName('');
  };
  return (
    <div className="add-form">
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom du poste (ex : Ligne 2)" onKeyDown={e => e.key === 'Enter' && add()} />
      <button className="btn btn-primary" onClick={add}><Plus size={18} /> Ajouter</button>
    </div>
  );
}

function PostesTab({ DB, persist, trk, openModal, closeModal }) {
  const edit = (p) => {
    const [name, setName] = useState(p.name);
    openModal(
      <>
        <h3>Modifier le poste</h3>
        <div className="modal-sub">Renommer le poste de travail</div>
        <label>Nom du poste</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => {
          if (e.key === 'Enter' && name.trim()) { const n = { ...DB }; n.postes = n.postes.map(x => x.id === p.id ? { ...x, name: name.trim() } : x); persist(n); closeModal(); }
        }} />
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={closeModal}>Annuler</button>
          <button className="btn btn-primary" onClick={() => { if (name.trim()) { const n = { ...DB }; n.postes = n.postes.map(x => x.id === p.id ? { ...x, name: name.trim() } : x); persist(n); closeModal(); } }}>Enregistrer</button>
        </div>
      </>
    );
  };

  const del = (p) => {
    const n = DB.machines.filter(m => m.posteId === p.id).length;
    if (!confirm(n ? `Supprimer ce poste et ses ${n} machine(s) ?` : 'Supprimer ce poste ?')) return;
    const newDB = { ...DB };
    newDB.machines = newDB.machines.filter(m => m.posteId !== p.id);
    newDB.records = newDB.records.filter(r => !newDB.machines.some(m => m.id === r.machineId));
    newDB.postes = newDB.postes.filter(x => x.id !== p.id);
    persist(newDB);
  };

  return (
    <>
      <div className="section-head">
        <h3>Postes de travail</h3>
        <LimitNote kind="postes" labelPlural="postes" DB={DB} />
      </div>
      {DB.postes.length === 0 && <div className="empty">Aucun poste.</div>}
      {DB.postes.map(p => {
        const n = DB.machines.filter(m => m.posteId === p.id).length;
        return (
          <div key={p.id} className="prow">
            <div className="prow-icon"><Factory size={20} /></div>
            <div className="prow-main">
              <div className="prow-name">{p.name}</div>
              <div className="prow-sub">{n} machine{n > 1 ? 's' : ''}</div>
            </div>
            <button className="icon-btn edit" onClick={() => edit(p)} title="Modifier"><Pencil size={15} /></button>
            <button className="icon-btn del" onClick={() => del(p)} title="Supprimer"><Trash2 size={15} /></button>
          </div>
        );
      })}
      <AddPoste DB={DB} persist={persist} trk={trk} />
    </>
  );
}

function MachinesTab({ DB, persist, trk, openModal, closeModal }) {
  const [name, setName] = useState('');
  const [posteId, setPosteId] = useState(DB.postes[0]?.id || 0);
  const [freq, setFreq] = useState(1);
  const [freqCustom, setFreqCustom] = useState('');
  const [editTaskId, setEditTaskId] = useState(null);

  const addMachine = () => {
    const n = name.trim();
    if (!n) return;
    if (!DB.postes.length) { alert("Créez d'abord un poste de travail."); return; }
    if (DB.machines.length >= DEMO_LIMITS.machines) { demoBlock('machines', 'machines', trk); return; }
    const freqVal = freq === 'custom' ? (parseInt(freqCustom, 10) || 1) : parseInt(freq, 10);
    const newM = { id: nextId(), name: n, posteId: parseInt(posteId, 10), freq: freqVal, checklist: [] };
    const newDB = { ...DB, machines: [...DB.machines, newM] };
    persist(newDB);
    trk('action', { type: 'create_machine' });
    setName('');
    openChecklist(newM);
  };

  const openChecklist = (m) => {
    const ChecklistContent = () => {
      const [tasks, setTasks] = useState(m.checklist);
      const [newLabel, setNewLabel] = useState('');
      const [editingId, setEditingId] = useState(null);
      const [editVal, setEditVal] = useState('');

      const addTask = () => {
        const l = newLabel.trim();
        if (!l) return;
        const nt = { id: nextId(), label: l };
        const updated = [...tasks, nt];
        setTasks(updated);
        const newDB = { ...DB };
        const mm = newDB.machines.find(x => x.id === m.id);
        if (mm) mm.checklist = updated;
        persist(newDB);
        setNewLabel('');
      };

      const saveTask = (tid) => {
        const v = editVal.trim();
        if (!v) return;
        const updated = tasks.map(t => t.id === tid ? { ...t, label: v } : t);
        setTasks(updated);
        const newDB = { ...DB };
        const mm = newDB.machines.find(x => x.id === m.id);
        if (mm) mm.checklist = updated;
        persist(newDB);
        setEditingId(null);
      };

      const delTask = (tid) => {
        const updated = tasks.filter(t => t.id !== tid);
        setTasks(updated);
        const newDB = { ...DB };
        const mm = newDB.machines.find(x => x.id === m.id);
        if (mm) mm.checklist = updated;
        persist(newDB);
      };

      return (
        <>
          <h3>Checklist — {m.name}</h3>
          <div className="modal-sub">Tâches vérifiées à chaque TPM</div>
          {tasks.length === 0 && <div className="empty">Aucune tâche pour l'instant.</div>}
          {tasks.map((t, i) => (
            <div key={t.id} className="prow">
              {editingId === t.id ? (
                <>
                  <input type="text" value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus className="flex-1"
                    onKeyDown={e => { if (e.key === 'Enter') saveTask(t.id); if (e.key === 'Escape') setEditingId(null); }} />
                  <button className="icon-btn edit" onClick={() => saveTask(t.id)}><Check size={15} /></button>
                  <button className="icon-btn del" onClick={() => setEditingId(null)}><X size={15} /></button>
                </>
              ) : (
                <>
                  <div className="prow-main"><div className="prow-name">{i + 1}. {t.label}</div></div>
                  <button className="icon-btn edit" onClick={() => { setEditingId(t.id); setEditVal(t.label); }}><Pencil size={15} /></button>
                  <button className="icon-btn del" onClick={() => delTask(t.id)}><Trash2 size={15} /></button>
                </>
              )}
            </div>
          ))}
          <div className="add-form">
            <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Nouvelle tâche" onKeyDown={e => e.key === 'Enter' && addTask()} />
            <button className="btn btn-primary" onClick={addTask}><Plus size={18} /></button>
          </div>
          <div className="modal-foot">
            <button className="btn btn-primary" onClick={closeModal}>Terminer</button>
          </div>
        </>
      );
    };
    openModal(<ChecklistContent />);
  };

  const editMachine = (m) => {
    const [mName, setMName] = useState(m.name);
    const [mPoste, setMPoste] = useState(m.posteId);
    const [mFreq, setMFreq] = useState(FREQ_PRESETS.some(p => p.v === m.freq) ? m.freq : 'custom');
    const [mFreqCustom, setMFreqCustom] = useState(FREQ_PRESETS.some(p => p.v === m.freq) ? '' : String(m.freq));

    openModal(
      <>
        <h3>Modifier la machine</h3>
        <div className="modal-sub">Nom, poste et fréquence de la maintenance</div>
        <label>Nom de la machine</label>
        <input type="text" value={mName} onChange={e => setMName(e.target.value)} />
        <label>Poste de travail</label>
        <select value={mPoste} onChange={e => setMPoste(parseInt(e.target.value, 10))}>
          {DB.postes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label>Fréquence de la TPM</label>
        <select value={mFreq} onChange={e => setMFreq(e.target.value)}>
          {FREQ_PRESETS.map(p => <option key={p.v} value={p.v}>{p.full}</option>)}
          <option value="custom">Personnalisée…</option>
        </select>
        {mFreq === 'custom' && (
          <input type="number" min="1" value={mFreqCustom} onChange={e => setMFreqCustom(e.target.value)} placeholder="Nombre de jours" style={{ marginTop: 10 }} />
        )}
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={closeModal}>Annuler</button>
          <button className="btn btn-primary" onClick={() => {
            const n = mName.trim(); if (!n) return;
            const fv = mFreq === 'custom' ? (parseInt(mFreqCustom, 10) || 1) : parseInt(mFreq, 10);
            const newDB = { ...DB };
            const mm = newDB.machines.find(x => x.id === m.id);
            if (mm) { mm.name = n; mm.posteId = mPoste; mm.freq = fv; }
            persist(newDB);
            closeModal();
          }}>Enregistrer</button>
        </div>
      </>
    );
  };

  const delMachine = (m) => {
    if (!confirm('Supprimer cette machine et son historique ?')) return;
    const newDB = { ...DB };
    newDB.machines = newDB.machines.filter(x => x.id !== m.id);
    newDB.records = newDB.records.filter(r => r.machineId !== m.id);
    persist(newDB);
  };

  return (
    <>
      <div className="section-head">
        <h3>Machines</h3>
        <LimitNote kind="machines" labelPlural="machines" DB={DB} />
      </div>
      {DB.postes.map(p => {
        const ms = DB.machines.filter(m => m.posteId === p.id);
        return (
          <div key={p.id} className="param-group">
            <div className="param-group-title">{p.name}</div>
            {ms.length === 0 && <div className="empty" style={{ padding: '6px 0' }}>Aucune machine.</div>}
            {ms.map(m => (
              <div key={m.id} className="prow">
                <div className="prow-icon"><Wrench size={20} /></div>
                <div className="prow-main">
                  <div className="prow-name">{m.name}</div>
                  <div className="prow-sub">TPM {freqLabel(m.freq)} — {m.checklist.length} tâches</div>
                </div>
                <button className="icon-btn edit" onClick={() => editMachine(m)} title="Modifier"><Pencil size={15} /></button>
                <button className="icon-btn edit" onClick={() => openChecklist(m)} title="Checklist">📝</button>
                <button className="icon-btn del" onClick={() => delMachine(m)} title="Supprimer"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        );
      })}
      <div className="add-form">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom de la machine" />
        <select value={posteId} onChange={e => setPosteId(parseInt(e.target.value, 10))}>
          {DB.postes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={freq} onChange={e => setFreq(e.target.value)}>
          {FREQ_PRESETS.map(p => <option key={p.v} value={p.v}>{p.full}</option>)}
          <option value="custom">Personnalisée…</option>
        </select>
        {freq === 'custom' && <input type="number" min="1" value={freqCustom} onChange={e => setFreqCustom(e.target.value)} placeholder="Jours" />}
        <button className="btn btn-primary" onClick={addMachine}><Plus size={18} /> Ajouter</button>
      </div>
      <div className="form-hint">Après création, cliquez sur 📝 pour définir la checklist.</div>
    </>
  );
}

function UsersTab({ DB, persist, trk, currentUser, openModal, closeModal }) {
  const [name, setName] = useState('');
  const [pwd, setPwd] = useState('');
  const [role, setRole] = useState('operateur');

  const addUser = () => {
    const n = name.trim(); const p = pwd.trim();
    if (!n || !p) { alert('Nom et mot de passe requis.'); return; }
    if (DB.users.length >= DEMO_LIMITS.users) { demoBlock('users', 'utilisateurs', trk); return; }
    const newDB = { ...DB, users: [...DB.users, { id: nextId(), name: n, pwd: p, role }] };
    persist(newDB);
    trk('action', { type: 'create_user' });
    setName(''); setPwd(''); setRole('operateur');
  };

  const editUser = (u) => {
    const [eName, setEName] = useState(u.name);
    const [eRole, setERole] = useState(u.role);
    const [ePwd, setEPwd] = useState(u.pwd);

    openModal(
      <>
        <h3>Modifier l'utilisateur</h3>
        <div className="modal-sub">Nom, rôle et mot de passe{u.id === currentUser.id ? ' (votre compte)' : ''}</div>
        <label>Nom et prénom</label>
        <input type="text" value={eName} onChange={e => setEName(e.target.value)} />
        <label>Rôle</label>
        <select value={eRole} onChange={e => setERole(e.target.value)}>
          {Object.keys(ROLES).map(r => <option key={r} value={r}>{ROLES[r]}</option>)}
        </select>
        <label>Mot de passe</label>
        <input type="text" value={ePwd} onChange={e => setEPwd(e.target.value)} />
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={closeModal}>Annuler</button>
          <button className="btn btn-primary" onClick={() => {
            const n = eName.trim(); const p = ePwd.trim();
            if (!n || !p) { alert('Nom et mot de passe obligatoires.'); return; }
            if (u.role === 'admin' && eRole !== 'admin') {
              const otherAdmins = DB.users.filter(x => x.role === 'admin' && x.id !== u.id).length;
              if (!otherAdmins) { alert('Il doit rester au moins un administrateur.'); return; }
            }
            const newDB = { ...DB };
            newDB.users = newDB.users.map(x => x.id === u.id ? { ...x, name: n, pwd: p, role: eRole } : x);
            persist(newDB);
            closeModal();
          }}>Enregistrer</button>
        </div>
      </>
    );
  };

  const delUser = (u) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    const newDB = { ...DB, users: DB.users.filter(x => x.id !== u.id) };
    persist(newDB);
  };

  return (
    <>
      <div className="section-head">
        <h3>Utilisateurs</h3>
        <LimitNote kind="users" labelPlural="utilisateurs" DB={DB} />
      </div>
      {DB.users.map(u => (
        <div key={u.id} className="prow">
          <div className="avatar">{initials(u.name)}</div>
          <div className="prow-main">
            <div className="prow-name">
              {u.name}
              {u.id === currentUser.id && <span className="text-muted"> (vous)</span>}
            </div>
          </div>
          <span className="badge badge-role">{ROLES[u.role]}</span>
          <button className="icon-btn edit" onClick={() => editUser(u)}><Pencil size={15} /></button>
          {u.id !== currentUser.id && <button className="icon-btn del" onClick={() => delUser(u)}><Trash2 size={15} /></button>}
        </div>
      ))}
      <div className="add-form">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom et prénom" />
        <input type="text" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Mot de passe" />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="operateur">Opérateur</option>
          <option value="chef">Chef d'équipe</option>
          <option value="admin">Administrateur</option>
        </select>
        <button className="btn btn-primary" onClick={addUser}><Plus size={18} /> Ajouter</button>
      </div>
    </>
  );
}

export default function Params({ DB, persist, go, trk, currentUser, resetDemo, openModal, closeModal }) {
  const [tab, setTab] = useState('postes');

  useEffect(() => {
    document.getElementById('page-title').textContent = 'Paramètres';
  }, []);

  return (
    <div className="params">
      <div className="tabs">
        <button className={`tab ${tab === 'postes' ? 'active' : ''}`} onClick={() => setTab('postes')}>
          <Factory size={18} /> Postes de travail
        </button>
        <button className={`tab ${tab === 'machines' ? 'active' : ''}`} onClick={() => setTab('machines')}>
          <Wrench size={18} /> Machines & checklists
        </button>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          <Users size={18} /> Utilisateurs
        </button>
      </div>
      <div className="card param-body">
        {tab === 'postes' && <PostesTab DB={DB} persist={persist} trk={trk} openModal={openModal} closeModal={closeModal} />}
        {tab === 'machines' && <MachinesTab DB={DB} persist={persist} trk={trk} openModal={openModal} closeModal={closeModal} />}
        {tab === 'users' && <UsersTab DB={DB} persist={persist} trk={trk} currentUser={currentUser} openModal={openModal} closeModal={closeModal} />}
      </div>
      <div className="reset-wrap">
        <button className="btn btn-ghost btn-sm" onClick={resetDemo}>
          <RotateCcw size={16} /> Réinitialiser la démo
        </button>
      </div>
    </div>
  );
}
