import React, { useState } from 'react';
import { ROLES, initials } from '../db.js';
import { useLang } from '../i18n.jsx';
import {
  LayoutDashboard, Factory, Settings, LogOut, Menu, X, Shield
} from 'lucide-react';

export default function Layout({ currentUser, activePage, go, logout, children }) {
  const { t } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_ITEMS = [
    { key: 'dashboard', label: t.nav_dashboard, icon: LayoutDashboard, roles: ['admin', 'chef'] },
    { key: 'postes', label: t.nav_postes, icon: Factory, roles: ['admin', 'chef', 'operateur'] },
    { key: 'params', label: t.nav_params, icon: Settings, roles: ['admin'] },
  ];

  const items = NAV_ITEMS.filter(i => i.roles.includes(currentUser.role));

  const nav = (
    <>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Shield size={22} strokeWidth={2.2} />
          </div>
          <div>
            <span className="sidebar-logo-text">TPM<span className="dot-green">.</span></span>
            <div className="sidebar-logo-sub">{t.layout_demo_badge}</div>
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`nav-item ${item.key === activePage ? 'active' : ''}`}
              onClick={() => { go(item.key); setMobileOpen(false); }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-spacer" />
      <button className="nav-item logout" onClick={logout}>
        <LogOut size={20} />
        <span>{t.nav_logout}</span>
      </button>
    </>
  );

  return (
    <div className="app-layout">
      <aside className="sidebar desktop-sidebar">
        {nav}
      </aside>

      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar mobile-sidebar ${mobileOpen ? 'open' : ''}`}>
        <button className="mobile-close" onClick={() => setMobileOpen(false)}>
          <X size={22} />
        </button>
        {nav}
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <button className="mobile-hamburger" onClick={() => setMobileOpen(true)}>
              <Menu size={24} />
            </button>
            <div>
              <h1 className="topbar-title" id="page-title"></h1>
            </div>
          </div>
          <div className="user-chip">
            <div className="avatar">{initials(currentUser.name)}</div>
            <div>
              <div className="user-chip-name">{currentUser.name}</div>
              <div className="user-chip-role">{ROLES[currentUser.role]}</div>
            </div>
          </div>
        </div>
        <section className="view-content">
          {children}
        </section>
      </main>
    </div>
  );
}
