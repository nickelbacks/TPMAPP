import React, { useEffect } from 'react';
import { machineStatus, lastRecord, userById, freqLabel, fmtDate } from '../db.js';
import { useLang } from '../i18n.jsx';
import { ChevronLeft, Wrench } from 'lucide-react';

export default function PosteDetail({ DB, go, id }) {
  const { t } = useLang();
  const p = DB.postes.find(x => x.id === id);

  useEffect(() => {
    document.getElementById('page-title').textContent = p ? p.name : t.nav_postes;
  }, [p, t]);

  if (!p) { go('postes'); return null; }

  const machines = DB.machines.filter(m => m.posteId === id);

  const ST = {
    done: { cls: 'badge-done', label: t.badge_done },
    due: { cls: 'badge-due', label: t.badge_due },
    late: { cls: 'badge-late', label: t.badge_late },
  };

  return (
    <div>
      <button className="btn-back" onClick={() => go('postes')}>
        <ChevronLeft size={18} /> {t.poste_back}
      </button>
      <div className="card">
        {machines.length === 0 && <div className="empty">{t.poste_no_machine}</div>}
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
                <div className="machine-sub">TPM {freqLabel(m.freq)} — {m.checklist.length}{t.poste_tasks}</div>
              </div>
              <div className="machine-right">
                <span className={`badge ${ST[st].cls}`}>{ST[st].label}</span>
                <span className="machine-last">
                  {lr ? t.poste_last_tpm + fmtDate(lr.date) + (lu ? ' — ' + lu.name : '') : t.poste_no_tpm}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
