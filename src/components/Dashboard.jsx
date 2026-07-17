import React, { useEffect } from 'react';
import {
  machineStatus, lastRecord, userById, nokList, fmtDate, fmtDT, initials, DAY,
} from '../db.js';
import {
  TrendingUp, AlertTriangle, Clock, CheckCircle, ChevronRight
} from 'lucide-react';

const ST = {
  done: { cls: 'badge-done', label: 'TPM faite' },
  due: { cls: 'badge-due', label: 'À faire' },
  late: { cls: 'badge-late', label: 'En retard' },
};

export default function Dashboard({ DB, go }) {
  useEffect(() => {
    document.getElementById('page-title').textContent = 'Dashboard';
    document.getElementById('page-crumb') && (document.getElementById('page-crumb').textContent = "Vue d'ensemble de la maintenance premier niveau");
  }, []);

  const total = DB.machines.length;
  const done = DB.machines.filter(m => machineStatus(DB, m) === 'done').length;
  const late = DB.machines.filter(m => machineStatus(DB, m) === 'late');
  const rate = total ? Math.round(done / total * 100) : 0;
  const noks = nokList(DB, 7);
  const todayCount = DB.records.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).length;

  // Chart data
  let maxC = 1;
  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY);
    const c = DB.records.filter(r => new Date(r.date).toDateString() === d.toDateString()).length;
    counts.push({ d, c });
    if (c > maxC) maxC = c;
  }

  const acts = [...DB.records].sort((a, b) => b.date - a.date).slice(0, 7).map(r => {
    const m = DB.machines.find(x => x.id === r.machineId);
    const u = userById(DB, r.userId);
    const nok = r.results.filter(x => x.status === 'nok').length;
    return { m, u, nok, date: r.date };
  });

  return (
    <div className="dashboard">
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: rate >= 80 ? 'var(--green-bg)' : 'var(--orange-bg)' }}>
            <TrendingUp size={24} color={rate >= 80 ? 'var(--green)' : 'var(--orange)'} />
          </div>
          <div>
            <div className="kpi-value">{rate}%</div>
            <div className="kpi-label">Taux de réalisation TPM</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--red-bg)' }}>
            <AlertTriangle size={24} color="var(--red)" />
          </div>
          <div>
            <div className="kpi-value">{noks.length}</div>
            <div className="kpi-label">Anomalies (7 jours)</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--red-bg)' }}>
            <Clock size={24} color="var(--red)" />
          </div>
          <div>
            <div className="kpi-value">{late.length}</div>
            <div className="kpi-label">Machines en retard</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--green-bg)' }}>
            <CheckCircle size={24} color="var(--green)" />
          </div>
          <div>
            <div className="kpi-value">{todayCount}</div>
            <div className="kpi-label">TPM aujourd'hui</div>
          </div>
        </div>
      </div>

      <div className="grid-2col">
        <div className="col-stack">
          {/* Chart */}
          <div className="card">
            <h3>TPM réalisées — 7 derniers jours</h3>
            <div className="chart">
              {counts.map(({ d, c }, idx) => {
                const hgt = Math.max(8, Math.round(c / maxC * 120));
                const day = d.toLocaleDateString('fr-FR', { weekday: 'short' });
                return (
                  <div key={idx} className="chart-col">
                    <div className={`chart-bar ${idx === 6 ? 'hot' : ''}`} style={{ height: hgt + 'px' }}>
                      {idx === 6 && c > 0 && <span className="chart-val">{c}</span>}
                    </div>
                    <span className="chart-day">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Machines en retard */}
          <div className="card">
            <h3>Machines en retard</h3>
            {late.length === 0 && <div className="empty">Aucune machine en retard</div>}
            {late.map(m => {
              const p = DB.postes.find(x => x.id === m.posteId);
              const lr = lastRecord(DB, m.id);
              return (
                <div key={m.id} className="alert-row alert-red" onClick={() => go('machine', m.id)}>
                  <div className="alert-main">
                    <strong>{m.name}</strong>
                    <div className="alert-sub">{p ? p.name : ''} — {lr ? 'dernière TPM le ' + fmtDate(lr.date) : 'aucune TPM enregistrée'}</div>
                  </div>
                  <span className="badge badge-late">En retard</span>
                  <ChevronRight size={16} color="var(--muted)" />
                </div>
              );
            })}
          </div>

          {/* Anomalies */}
          <div className="card">
            <h3>Anomalies signalées (7 jours)</h3>
            {noks.length === 0 && <div className="empty">Aucune anomalie sur 7 jours</div>}
            {noks.slice(0, 6).map((n, i) => (
              <div key={i} className="alert-row alert-orange">
                <div className="alert-main">
                  <strong>{n.task}</strong> — {n.machine.name}
                  {n.comment && <div className="alert-sub">« {n.comment} »</div>}
                  <div className="alert-sub">{fmtDT(n.date)} par {n.user.name}</div>
                </div>
                {n.photo && (
                  <img src={n.photo} className="tl-photo-small" alt="" onClick={(e) => { e.stopPropagation(); }} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Activité récente</h3>
          {acts.length === 0 && <div className="empty">Aucune activité.</div>}
          {acts.map((a, i) => (
            <div key={i} className="act-row">
              <div className="avatar avatar-sm">{initials(a.u.name)}</div>
              <div className="act-txt">
                <span><strong>{a.u.name}</strong> a réalisé la TPM de <strong>{a.m ? a.m.name : '?'}</strong></span>
                {' '}
                {a.nok
                  ? <span className="badge badge-nok">{a.nok} NOK</span>
                  : <span className="badge badge-ok">OK</span>
                }
                <div className="act-time">{fmtDT(a.date)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
