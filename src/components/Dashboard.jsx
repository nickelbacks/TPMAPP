import React, { useEffect } from 'react';
import {
  machineStatus, lastRecord, userById, nokList, fmtDate, fmtDT, initials, DAY,
} from '../db.js';
import { useLang } from '../i18n.jsx';
import {
  TrendingUp, AlertTriangle, Clock, CheckCircle, ChevronRight
} from 'lucide-react';

export default function Dashboard({ DB, go }) {
  const { t, lang } = useLang();

  useEffect(() => {
    document.getElementById('page-title').textContent = t.dash_title;
  }, [t]);

  const total = DB.machines.length;
  const done = DB.machines.filter(m => machineStatus(DB, m) === 'done').length;
  const late = DB.machines.filter(m => machineStatus(DB, m) === 'late');
  const rate = total ? Math.round(done / total * 100) : 0;
  const noks = nokList(DB, 7);
  const todayCount = DB.records.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).length;

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

  const ST = {
    done: { cls: 'badge-done', label: t.badge_done },
    due: { cls: 'badge-due', label: t.badge_due },
    late: { cls: 'badge-late', label: t.badge_late },
  };

  return (
    <div className="dashboard">
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: rate >= 80 ? 'var(--green-bg)' : 'var(--orange-bg)' }}>
            <TrendingUp size={24} color={rate >= 80 ? 'var(--green)' : 'var(--orange)'} />
          </div>
          <div>
            <div className="kpi-value">{rate}%</div>
            <div className="kpi-label">{t.dash_kpi_rate}</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--red-bg)' }}>
            <AlertTriangle size={24} color="var(--red)" />
          </div>
          <div>
            <div className="kpi-value">{noks.length}</div>
            <div className="kpi-label">{t.dash_kpi_anomalies}</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--red-bg)' }}>
            <Clock size={24} color="var(--red)" />
          </div>
          <div>
            <div className="kpi-value">{late.length}</div>
            <div className="kpi-label">{t.dash_kpi_late}</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--green-bg)' }}>
            <CheckCircle size={24} color="var(--green)" />
          </div>
          <div>
            <div className="kpi-value">{todayCount}</div>
            <div className="kpi-label">{t.dash_kpi_today}</div>
          </div>
        </div>
      </div>

      <div className="grid-2col">
        <div className="col-stack">
          <div className="card">
            <h3>{t.dash_chart_title}</h3>
            <div className="chart">
              {counts.map(({ d, c }, idx) => {
                const hgt = Math.max(8, Math.round(c / maxC * 120));
                const day = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' });
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

          <div className="card">
            <h3>{t.dash_late_title}</h3>
            {late.length === 0 && <div className="empty">{t.dash_late_empty}</div>}
            {late.map(m => {
              const p = DB.postes.find(x => x.id === m.posteId);
              const lr = lastRecord(DB, m.id);
              return (
                <div key={m.id} className="alert-row alert-red" onClick={() => go('machine', m.id)}>
                  <div className="alert-main">
                    <strong>{m.name}</strong>
                    <div className="alert-sub">{p ? p.name : ''} — {lr ? t.dash_late_last + fmtDate(lr.date) : t.dash_late_none}</div>
                  </div>
                  <span className="badge badge-late">{t.badge_late}</span>
                  <ChevronRight size={16} color="var(--muted)" />
                </div>
              );
            })}
          </div>

          <div className="card">
            <h3>{t.dash_anomaly_title}</h3>
            {noks.length === 0 && <div className="empty">{t.dash_anomaly_empty}</div>}
            {noks.slice(0, 6).map((n, i) => (
              <div key={i} className="alert-row alert-orange">
                <div className="alert-main">
                  <strong>{n.task}</strong> — {n.machine.name}
                  {n.comment && <div className="alert-sub">« {n.comment} »</div>}
                  <div className="alert-sub">{fmtDT(n.date)}{t.dash_anomaly_par}{n.user.name}</div>
                </div>
                {n.photo && (
                  <img src={n.photo} className="tl-photo-small" alt="" onClick={(e) => e.stopPropagation()} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>{t.dash_activity_title}</h3>
          {acts.length === 0 && <div className="empty">{t.dash_activity_empty}</div>}
          {acts.map((a, i) => (
            <div key={i} className="act-row">
              <div className="avatar avatar-sm">{initials(a.u.name)}</div>
              <div className="act-txt">
                <span><strong>{a.u.name}</strong> {t.dash_activity_tpm} <strong>{a.m ? a.m.name : '?'}</strong></span>
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
