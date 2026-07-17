import React, { useEffect } from 'react';
import { machineStatus } from '../db.js';
import { useLang } from '../i18n.jsx';
import { Factory } from 'lucide-react';

export default function Postes({ DB, go }) {
  const { t } = useLang();

  useEffect(() => {
    document.getElementById('page-title').textContent = t.postes_title;
  }, [t]);

  return (
    <div className="tiles-grid">
      {DB.postes.length === 0 && <div className="empty">{t.postes_empty}</div>}
      {DB.postes.map(p => {
        const ms = DB.machines.filter(m => m.posteId === p.id);
        const done = ms.filter(m => machineStatus(DB, m) === 'done').length;
        const late = ms.filter(m => machineStatus(DB, m) === 'late').length;
        const pct = ms.length ? Math.round(done / ms.length * 100) : 0;
        return (
          <div key={p.id} className="card tile" onClick={() => go('poste', p.id)}>
            <div className="tile-icon">
              <Factory size={28} />
            </div>
            <h4>{p.name}</h4>
            <div className="tile-sub">
              {ms.length}{ms.length > 1 ? t.postes_machines : t.postes_machine}
              {late > 0 && <> — <span className="text-red">{late}{t.postes_en_retard}</span></>}
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
            <div className="tile-footer">
              <span>{t.postes_tpm_day}</span>
              <span>{done}/{ms.length}{t.postes_done}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
