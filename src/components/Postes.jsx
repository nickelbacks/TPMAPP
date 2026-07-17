import React, { useEffect } from 'react';
import { machineStatus } from '../db.js';
import { Factory } from 'lucide-react';

export default function Postes({ DB, go }) {
  useEffect(() => {
    document.getElementById('page-title').textContent = 'Postes de travail';
  }, []);

  return (
    <div className="tiles-grid">
      {DB.postes.length === 0 && <div className="empty">Aucun poste. Créez-en un dans les paramètres.</div>}
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
              {ms.length} machine{ms.length > 1 ? 's' : ''}
              {late > 0 && <> — <span className="text-red">{late} en retard</span></>}
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
            <div className="tile-footer">
              <span>TPM du jour</span>
              <span>{done}/{ms.length} faites</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
