import React, { useState, useEffect } from 'react';
import {
  machineStatus, lastRecord, userById, freqLabel, fmtDate, fmtDT, initials, saveDB, nextId,
} from '../db.js';
import { useLang } from '../i18n.jsx';
import { ChevronLeft, Wrench, Plus, ChevronDown } from 'lucide-react';

function HistoryRow({ r, m, DB, setPhotoZoom, t }) {
  const [open, setOpen] = useState(false);
  const u = userById(DB, r.userId);
  const nok = r.results.filter(x => x.status === 'nok').length;
  const ok = r.results.length - nok;

  return (
    <div className="hrow">
      <div className="hrow-head" onClick={() => setOpen(!open)}>
        <div className="avatar avatar-sm">{initials(u.name)}</div>
        <div className="hrow-main">
          <div className="hrow-date">{fmtDT(r.date)}</div>
          <div className="hrow-by">{t.machine_by}{u.name}</div>
        </div>
        <span className={`badge ${nok ? 'badge-nok' : 'badge-ok'}`}>
          {nok ? `${ok} OK / ${nok} NOK` : t.machine_all_ok}
        </span>
        <ChevronDown size={16} className={`chevron ${open ? 'open' : ''}`} />
      </div>
      {open && (
        <div className="hrow-detail">
          {r.results.map((x, i) => {
            const task = m.checklist.find(c => c.id === x.taskId);
            return (
              <div key={i} className="task-line">
                <span className={`badge ${x.status === 'ok' ? 'badge-ok' : 'badge-nok'}`}>
                  {x.status === 'ok' ? 'OK' : 'NOK'}
                </span>
                <div className="tl-label">
                  {task ? task.label : t.machine_deleted_task}
                  {x.comment && <div className="tl-comment">« {x.comment} »</div>}
                  {x.photo && (
                    <img src={x.photo} className="tl-photo" alt="" onClick={(e) => { e.stopPropagation(); setPhotoZoom(x.photo); }} />
                  )}
                </div>
              </div>
            );
          })}
          {r.comment && (
            <div className="task-line" style={{ borderTop: '1px dashed var(--line)', marginTop: 8, paddingTop: 10 }}>
              <strong style={{ fontSize: 13 }}>{t.machine_comment}</strong>&nbsp;{r.comment}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MachineDetail({ DB, go, persist, id, showTpmChecklist, openModal, closeModal, setPhotoZoom }) {
  const { t } = useLang();
  const m = DB.machines.find(x => x.id === id);
  const p = m ? DB.postes.find(x => x.id === m.posteId) : null;

  useEffect(() => {
    document.getElementById('page-title').textContent = m ? m.name : '';
  }, [m]);

  if (!m) { go('postes'); return null; }

  const st = machineStatus(DB, m);
  const recs = DB.records.filter(r => r.machineId === id).sort((a, b) => b.date - a.date);

  const ST = {
    done: { cls: 'badge-done', label: t.badge_done },
    due: { cls: 'badge-due', label: t.badge_due },
    late: { cls: 'badge-late', label: t.badge_late },
  };

  return (
    <div>
      <button className="btn-back" onClick={() => go('poste', m.posteId)}>
        <ChevronLeft size={18} /> {t.machine_back} {p ? p.name : ''}
      </button>
      <div className="card machine-header">
        <div className="machine-icon lg">
          <Wrench size={28} />
        </div>
        <div className="machine-header-info">
          <div className="machine-header-name">{m.name}</div>
          <div className="machine-sub">TPM {freqLabel(m.freq)} — {m.checklist.length}{t.machine_checklist}</div>
        </div>
        <span className={`badge ${ST[st].cls} badge-lg`}>{ST[st].label}</span>
        <button className="btn btn-primary" onClick={() => showTpmChecklist(m.id)}>
          <Plus size={18} /> {t.machine_do_tpm}
        </button>
      </div>
      <div className="card">
        <h3>{t.machine_history} ({recs.length})</h3>
        {recs.length === 0 && <div className="empty">{t.machine_history_empty}</div>}
        {recs.map(r => (
          <HistoryRow key={r.id} r={r} m={m} DB={DB} setPhotoZoom={setPhotoZoom} t={t} />
        ))}
      </div>
    </div>
  );
}
