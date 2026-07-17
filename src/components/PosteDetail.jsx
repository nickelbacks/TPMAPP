import React, { useEffect } from 'react';
import { machineStatus, lastRecord, userById, freqLabel, fmtDate } from '../db.js';
import { ChevronLeft, Wrench } from 'lucide-react';

const ST = {
  done: { cls: 'badge-done', label: 'TPM faite' },
  due: { cls: 'badge-due', label: 'À faire' },
  late: { cls: 'badge-late', label: 'En retard' },
};

export default function PosteDetail({ DB, go, id }) {
  const p = DB.postes.find(x => x.id === id);

  useEffect(() => {
    document.getElementById('page-title').textContent = p ? p.name : 'Poste';
  }, [p]);

  if (!p) { go('postes'); return null; }

  const machines = DB.machines.filter(m => m.posteId === id);

  return (
    <div>
      <button className="btn-back" onClick={() => go('postes')}>
        <ChevronLeft size={18} /> Retour aux postes
      </button>
      <div className="card">
        {machines.length === 0 && <div className="empty">Aucune machine sur ce poste.</div>}
        {machines.map(m => {
          const st = machineStatus(DB, m);
          const lr = lastRecord(DB, m.id);
          const lu = lr ? userById(DB, lr.userId) : null;
          return (
            <div key={m.id} className="machine-row" onClick={() => go('machine', m.id)}>
              <div className="machine-icon">
                <Wrench size={22} />
              </div>
              <div className="machine-main">
                <div className="machine-name">{m.name}</div>
                <div className="machine-sub">TPM {freqLabel(m.freq)} — {m.checklist.length} tâches</div>
              </div>
              <div className="machine-right">
                <span className={`badge ${ST[st].cls}`}>{ST[st].label}</span>
                <span className="machine-last">
                  {lr ? `Dernière TPM le ${fmtDate(lr.date)}${lu ? ' — ' + lu.name : ''}` : 'Aucune TPM enregistrée'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
