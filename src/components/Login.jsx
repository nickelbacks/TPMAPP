import React, { useState } from 'react';
import { ROLES } from '../db.js';
import { useLang } from '../i18n.jsx';
import { Lock, User, ArrowRight, Globe } from 'lucide-react';

export default function Login({ DB, onLogin }) {
  const { lang, setLang, t } = useLang();
  const [userId, setUserId] = useState(DB.users[0]?.id || 0);
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = onLogin(userId, pwd);
    if (result.error) setError(result.error);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-top-row">
          <div className="lang-switcher">
            <Globe size={16} />
            <button className={`lang-btn ${lang === 'fr' ? 'active' : ''}`} onClick={() => setLang('fr')}>FR</button>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>

        <div className="login-logo">
          <div className="login-logo-icon">
            <Lock size={28} strokeWidth={2.2} />
          </div>
          <div>
            <span className="login-logo-text">TPM</span>
            <div className="login-logo-sub">{t.login_subtitle_top}</div>
          </div>
        </div>

        <h2>{t.login_title}</h2>
        <p className="login-subtitle">{t.login_subtitle}</p>

        <form onSubmit={handleSubmit}>
          <label>{t.login_user}</label>
          <div className="input-icon-wrap">
            <User size={18} className="input-icon" />
            <select value={userId} onChange={e => { setUserId(parseInt(e.target.value, 10)); setError(''); }}>
              {DB.users.map(u => (
                <option key={u.id} value={u.id}>{u.name} — {ROLES[u.role]}</option>
              ))}
            </select>
          </div>

          <label>{t.login_pwd}</label>
          <div className="input-icon-wrap">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              value={pwd}
              onChange={e => { setPwd(e.target.value); setError(''); }}
              placeholder="••••••"
              autoFocus
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-full">
            {t.login_btn} <ArrowRight size={18} />
          </button>
        </form>

        <div className="demo-creds">
          <strong>{t.login_demo}</strong><br />
          Admin — mdp : <strong>admin</strong><br />
          Jean Dupont (opérateur) — mdp : <strong>1234</strong><br />
          Marie Lefèvre (chef d'équipe) — mdp : <strong>1234</strong>
        </div>

        <div className="login-footer">
          {t.footer_developed} <strong>Omar Ghechi</strong>
        </div>
      </div>
    </div>
  );
}
