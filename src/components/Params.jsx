import React, { useState, useEffect, useCallback } from 'react';
import {
  ROLES, DEMO_LIMITS, FREQ_PRESETS, freqLabel, initials, nextId, saveDB, seed, initIdc,
} from '../db.js';
import { useLang } from '../i18n.jsx';
import {
  Pencil, Trash2, Plus, Factory, Wrench, Users, RotateCcw, Check, X
} from 'lucide-react';

function LimitNote({ kind, DB, t }) {
  const n = DB[kind].length;
  const max = DEMO_LIMITS[kind];
  const full = n >= max;
  return (
    <span className={`limit-note ${full ? 'full' : ''}`}>
      {n}/{max}{full ? ` — ${t.params_limitReached}` : ''}
    </span>
  );
}

function demoBlock(kind, trk) {
  trk('limit_hit', { limit: kind });
  alert('🔒 Version DÉMO — limitée à ' + DEMO_LIMITS[kind] + '.\n\nPassez à la version complète pour un usage illimité.');
}

function AddPoste({ DB, persist, trk, t }) {
  const [name, setName] = useState('');
  const add = () => {
    const n = name.trim();
    if (!n) return;
    if (DB.postes.length >= DEMO_LIMITS.postes) { demoBlock('postes', trk); return; }
    const newDB = { ...DB, postes: [...DB.postes, { id: nextId(), name: n }] };
    persist(newDB);
    trk('action', { type: 'create_poste' });
    setName('');
  };
  return (
    <div className="add-form">
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.params_addPostePlaceholder} onKeyDown={e => e.key === 'Enter' && add()} />
      <button className="btn btn-primary" onClick={add}><Plus size={18} /> {t.params_addBtn}</button>
    </div>
  );
}

function PostesTab({ DB, persist, trk, openModal, closeModal, t }) {
  const edit = (p) => {
    const [name, setName] = useState(p.name);
    openModal(
      <>
        <h3>{t.params_editPoste}</h3>
        <div className="modal-sub">{t.params_renamePoste}</div>
        <label>{t.params_posteName}</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => {
          if (e.key === 'Enter' && name.trim()) { const n = { ...DB }; n.postes = n.postes.map(x => x.id === p.id ? { ...x, name: name.trim() } : x); persist(n); closeModal(); }
        }} />
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={closeModal}>{t.params_cancel}</button>
          <button className="btn btn-primary" onClick={() => { if (name.trim()) { const n = { ...DB }; n.postes = n.postes.map(x => x.id === p.id ? { ...x, name: name.trim() } : x); persist(n); closeModal(); } }}>{t.params_save}</button>
        </div>
      </>
    );
  };

  const del = (p) => {
    const n = DB.machines.filter(m => m.posteId === p.id).length;
    if (!confirm(n ? t.params_confirmDeletePosteMachines(n) : t.params_confirmDeletePoste)) return;
    const newDB = { ...DB };
    newDB.machines = newDB.machines.filter(m => m.posteId !== p.id);
    newDB.records = newDB.records.filter(r => !newDB.machines.some(m => m.id === r.machineId));
    newDB.postes = newDB.postes.filter(x => x.id !== p.id);
    persist(newDB);
  };

  return (
    <>
      <div className="section-head">
        <h3>{t.params_tabPostes}</h3>
        <LimitNote kind="postes" DB={DB} t={t} />
      </div>
      {DB.postes.length === 0 && <div className="empty">{t.params_noPostes}</div>}
      {DB.postes.map(p => {
        const n = DB.machines.filter(m => m.posteId === p.id).length;
        return (
          <div key={p.id} className="prow">
            <div className="prow-icon"><Factory size={20} /></div>
            <div className="prow-main">
              <div className="prow-name">{p.name}</div>
              <div className="prow-sub">{n} {n > 1 ? t.params_machinesPlural : t.params_machine}</div>
            </div>
            <button className="icon-btn edit" onClick={() => edit(p)} title={t.params_edit}><Pencil size={15} /></button>
            <button className="icon-btn del" onClick={() => del(p)} title={t.params_delete}><Trash2 size={15} /></button>
          </div>
        );
      })}
      <AddPoste DB={DB} persist={persist} trk={trk} t={t} />
    </>
  );
}

function MachinesTab({ DB, persist, trk, openModal, closeModal, t }) {
  const [name, setName] = useState('');
  const [posteId, setPosteId] = useState(DB.postes[0]?.id || 0);
  const [freq, setFreq] = useState(1);
  const [freqCustom, setFreqCustom] = useState('');

  const addMachine = () => {
    const n = name.trim();
    if (!n) return;
    if (!DB.postes.length) { alert(t.params_createPosteFirst); return; }
    if (DB.machines.length >= DEMO_LIMITS.machines) { demoBlock('machines', trk); return; }
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
          <h3>{t.params_checklist} — {m.name}</h3>
          <div className="modal-sub">{t.params_checklistSub}</div>
          {tasks.length === 0 && <div className="empty">{t.params_noTasks}</div>}
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
            <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder={t.params_newTaskPlaceholder} onKeyDown={e => e.key === 'Enter' && addTask()} />
            <button className="btn btn-primary" onClick={addTask}><Plus size={18} /></button>
          </div>
          <div className="modal-foot">
            <button className="btn btn-primary" onClick={closeModal}>{t.params_done}</button>
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
        <h3>{t.params_editMachine}</h3>
        <div className="modal-sub">{t.params_editMachineSub}</div>
        <label>{t.params_machineName}</label>
        <input type="text" value={mName} onChange={e => setMName(e.target.value)} />
        <label>{t.params_machinePoste}</label>
        <select value={mPoste} onChange={e => setMPoste(parseInt(e.target.value, 10))}>
          {DB.postes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label>{t.params_machineFreq}</label>
        <select value={mFreq} onChange={e => setMFreq(e.target.value)}>
          {FREQ_PRESETS.map(p => <option key={p.v} value={p.v}>{p.full}</option>)}
          <option value="custom">{t.params_freqCustom}</option>
        </select>
        {mFreq === 'custom' && (
          <input type="number" min="1" value={mFreqCustom} onChange={e => setMFreqCustom(e.target.value)} placeholder={t.params_freqDays} style={{ marginTop: 10 }} />
        )}
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={closeModal}>{t.params_cancel}</button>
          <button className="btn btn-primary" onClick={() => {
            const n = mName.trim(); if (!n) return;
            const fv = mFreq === 'custom' ? (parseInt(mFreqCustom, 10) || 1) : parseInt(mFreq, 10);
            const newDB = { ...DB };
            const mm = newDB.machines.find(x => x.id === m.id);
            if (mm) { mm.name = n; mm.posteId = mPoste; mm.freq = fv; }
            persist(newDB);
            closeModal();
          }}>{t.params_save}</button>
        </div>
      </>
    );
  };

  const delMachine = (m) => {
    if (!confirm(t.params_confirmDeleteMachine)) return;
    const newDB = { ...DB };
    newDB.machines = newDB.machines.filter(x => x.id !== m.id);
    newDB.records = newDB.records.filter(r => r.machineId !== m.id);
    persist(newDB);
  };

  return (
    <>
      <div className="section-head">
        <h3>{t.params_tabMachines}</h3>
        <LimitNote kind="machines" DB={DB} t={t} />
      </div>
      {DB.postes.map(p => {
        const ms = DB.machines.filter(m => m.posteId === p.id);
        return (
          <div key={p.id} className="param-group">
            <div className="param-group-title">{p.name}</div>
            {ms.length === 0 && <div className="empty" style={{ padding: '6px 0' }}>{t.params_noMachines}</div>}
            {ms.map(m => (
              <div key={m.id} className="prow">
                <div className="prow-icon"><Wrench size={20} /></div>
                <div className="prow-main">
                  <div className="prow-name">{m.name}</div>
                  <div className="prow-sub">TPM {freqLabel(m.freq)} — {m.checklist.length} {t.params_tasks}</div>
                </div>
                <button className="icon-btn edit" onClick={() => editMachine(m)} title={t.params_edit}><Pencil size={15} /></button>
                <button className="icon-btn edit" onClick={() => openChecklist(m)} title="Checklist">📝</button>
                <button className="icon-btn del" onClick={() => delMachine(m)} title={t.params_delete}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        );
      })}
      <div className="add-form">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.params_addMachinePlaceholder} />
        <select value={posteId} onChange={e => setPosteId(parseInt(e.target.value, 10))}>
          {DB.postes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={freq} onChange={e => setFreq(e.target.value)}>
          {FREQ_PRESETS.map(p => <option key={p.v} value={p.v}>{p.full}</option>)}
          <option value="custom">{t.params_freqCustom}</option>
        </select>
        {freq === 'custom' && <input type="number" min="1" value={freqCustom} onChange={e => setFreqCustom(e.target.value)} placeholder={t.params_freqDays} />}
        <button className="btn btn-primary" onClick={addMachine}><Plus size={18} /> {t.params_addBtn}</button>
      </div>
      <div className="form-hint">{t.params_afterCreateHint}</div>
    </>
  );
}

function UsersTab({ DB, persist, trk, currentUser, openModal, closeModal, t }) {
  const [name, setName] = useState('');
  const [pwd, setPwd] = useState('');
  const [role, setRole] = useState('operateur');

  const addUser = () => {
    const n = name.trim(); const p = pwd.trim();
    if (!n || !p) { alert(t.params_namePwdRequired); return; }
    if (DB.users.length >= DEMO_LIMITS.users) { demoBlock('users', trk); return; }
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
        <h3>{t.params_editUser}</h3>
        <div className="modal-sub">{t.params_editUserSub}{u.id === currentUser.id ? t.params_yourAccount : ''}</div>
        <label>{t.params_fullName}</label>
        <input type="text" value={eName} onChange={e => setEName(e.target.value)} />
        <label>{t.params_role}</label>
        <select value={eRole} onChange={e => setERole(e.target.value)}>
          {Object.keys(ROLES).map(r => <option key={r} value={r}>{t[`role_${r}`] || ROLES[r]}</option>)}
        </select>
        <label>{t.params_password}</label>
        <input type="text" value={ePwd} onChange={e => setEPwd(e.target.value)} />
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={closeModal}>{t.params_cancel}</button>
          <button className="btn btn-primary" onClick={() => {
            const n = eName.trim(); const p = ePwd.trim();
            if (!n || !p) { alert(t.params_namePwdRequired); return; }
            if (u.role === 'admin' && eRole !== 'admin') {
              const otherAdmins = DB.users.filter(x => x.role === 'admin' && x.id !== u.id).length;
              if (!otherAdmins) { alert(t.params_mustKeepAdmin); return; }
            }
            const newDB = { ...DB };
            newDB.users = newDB.users.map(x => x.id === u.id ? { ...x, name: n, pwd: p, role: eRole } : x);
            persist(newDB);
            closeModal();
          }}>{t.params_save}</button>
        </div>
      </>
    );
  };

  const delUser = (u) => {
    if (!confirm(t.params_confirmDeleteUser)) return;
    const newDB = { ...DB, users: DB.users.filter(x => x.id !== u.id) };
    persist(newDB);
  };

  return (
    <>
      <div className="section-head">
        <h3>{t.params_tabUsers}</h3>
        <LimitNote kind="users" DB={DB} t={t} />
      </div>
      {DB.users.map(u => (
        <div key={u.id} className="prow">
          <div className="avatar">{initials(u.name)}</div>
          <div className="prow-main">
            <div className="prow-name">
              {u.name}
              {u.id === currentUser.id && <span className="text-muted"> ({t.params_you})</span>}
            </div>
          </div>
          <span className="badge badge-role">{t[`role_${u.role}`] || ROLES[u.role]}</span>
          <button className="icon-btn edit" onClick={() => editUser(u)}><Pencil size={15} /></button>
          {u.id !== currentUser.id && <button className="icon-btn del" onClick={() => delUser(u)}><Trash2 size={15} /></button>}
        </div>
      ))}
      <div className="add-form">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.params_fullName} />
        <input type="text" value={pwd} onChange={e => setPwd(e.target.value)} placeholder={t.params_password} />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="operateur">{t.role_operateur}</option>
          <option value="chef">{t.role_chef}</option>
          <option value="admin">{t.role_admin}</option>
        </select>
        <button className="btn btn-primary" onClick={addUser}><Plus size={18} /> {t.params_addBtn}</button>
      </div>
    </>
  );
}

export default function Params({ DB, persist, go, trk, currentUser, resetDemo, openModal, closeModal }) {
  const [tab, setTab] = useState('postes');
  const { t } = useLang();

  useEffect(() => {
    document.getElementById('page-title').textContent = t.params_title;
  }, [t]);

  return (
    <div className="params">
      <div className="tabs">
        <button className={`tab ${tab === 'postes' ? 'active' : ''}`} onClick={() => setTab('postes')}>
          <Factory size={18} /> {t.params_tabPostes}
        </button>
        <button className={`tab ${tab === 'machines' ? 'active' : ''}`} onClick={() => setTab('machines')}>
          <Wrench size={18} /> {t.params_tabMachines}
        </button>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          <Users size={18} /> {t.params_tabUsers}
        </button>
      </div>
      <div className="card param-body">
        {tab === 'postes' && <PostesTab DB={DB} persist={persist} trk={trk} openModal={openModal} closeModal={closeModal} t={t} />}
        {tab === 'machines' && <MachinesTab DB={DB} persist={persist} trk={trk} openModal={openModal} closeModal={closeModal} t={t} />}
        {tab === 'users' && <UsersTab DB={DB} persist={persist} trk={trk} currentUser={currentUser} openModal={openModal} closeModal={closeModal} t={t} />}
      </div>
      <div className="reset-wrap">
        <button className="btn btn-ghost btn-sm" onClick={resetDemo}>
          <RotateCcw size={16} /> {t.params_resetDemo}
        </button>
      </div>
    </div>
  );
}
