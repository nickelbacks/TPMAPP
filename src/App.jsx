import React, { useState, useEffect, useCallback } from 'react';
import {
  loadDB, saveDB, nextId, initIdc, seed,
  ROLES, DEMO_LIMITS, machineStatus, lastRecord, userById, nokList,
  freqLabel, fmtDate, fmtDT, initials, FREQ_PRESETS,
} from './db.js';
import './config.js';
import { initAnalytics, track as trk } from './analytics.js';
import { useLang } from './i18n.jsx';
import Login from './components/Login.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './components/Dashboard.jsx';
import Postes from './components/Postes.jsx';
import PosteDetail from './components/PosteDetail.jsx';
import MachineDetail from './components/MachineDetail.jsx';
import Params from './components/Params.jsx';
import Modal from './components/Modal.jsx';
import TpmChecklist from './components/TpmChecklist.jsx';

export default function App() {
  const { t } = useLang();
  const [DB, setDB] = useState(() => { const d = loadDB(); initIdc(d); return d; });
  const [currentUser, setCurrentUser] = useState(null);
  const [route, setRoute] = useState({ name: 'dashboard' });
  const [modalContent, setModalContent] = useState(null);
  const [photoZoom, setPhotoZoom] = useState(null);

  useEffect(() => {
    initAnalytics();
    const su = sessionStorage.getItem("tpmDemoUser");
    if (su) {
      const u = DB.users.find(x => x.id === parseInt(su, 10));
      if (u) {
        setCurrentUser(u);
        setRoute({ name: u.role === "operateur" ? "postes" : "dashboard" });
      }
    }
  }, []);

  const persist = useCallback((newDB) => {
    saveDB(newDB);
    setDB({ ...newDB });
  }, []);

  const go = useCallback((name, id) => {
    trk("page_view", { page: name });
    setRoute({ name, id });
    setModalContent(null);
    window.scrollTo(0, 0);
  }, []);

  const login = useCallback((userId, pwd) => {
    const u = DB.users.find(x => x.id === userId);
    if (!u || u.pwd !== pwd) return { error: t.login_error };
    setCurrentUser(u);
    trk("login", { role: u.role });
    try { sessionStorage.setItem("tpmDemoUser", String(u.id)); } catch (e) {}
    setRoute({ name: u.role === "operateur" ? "postes" : "dashboard" });
    return { ok: true };
  }, [DB, t]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setRoute({ name: 'dashboard' });
    try { sessionStorage.removeItem("tpmDemoUser"); } catch (e) {}
  }, []);

  const resetDemo = useCallback(() => {
    if (!confirm(t.params_reset_confirm)) return;
    try { localStorage.removeItem("tpmDemo"); } catch (e) {}
    const d = seed(); initIdc(d);
    setDB(d);
    setCurrentUser(null);
    try { sessionStorage.removeItem("tpmDemoUser"); } catch (e) {}
  }, [t]);

  const openModal = useCallback((content) => setModalContent(content), []);
  const closeModal = useCallback(() => { setModalContent(null); }, []);

  const showTpmChecklist = useCallback((machineId) => {
    const m = DB.machines.find(x => x.id === machineId);
    if (!m || !m.checklist.length) { alert("No checklist. Add tasks in settings."); return; }
    openModal(
      <TpmChecklist
        machine={m}
        currentUser={currentUser}
        DB={DB}
        persist={persist}
        trk={trk}
        go={go}
        onClose={closeModal}
      />
    );
  }, [DB, currentUser, persist, go, openModal, closeModal]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { if (photoZoom) setPhotoZoom(null); else closeModal(); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [photoZoom, closeModal]);

  if (!currentUser) {
    return <Login DB={DB} onLogin={login} />;
  }

  const activePage = (route.name === 'poste' || route.name === 'machine') ? 'postes' : route.name;

  const renderView = () => {
    switch (route.name) {
      case 'dashboard':
        return <Dashboard DB={DB} go={go} persist={persist} trk={trk} />;
      case 'postes':
        return <Postes DB={DB} go={go} />;
      case 'poste':
        return <PosteDetail DB={DB} go={go} id={route.id} />;
      case 'machine':
        return <MachineDetail DB={DB} go={go} persist={persist} id={route.id} showTpmChecklist={showTpmChecklist} openModal={openModal} closeModal={closeModal} setPhotoZoom={setPhotoZoom} />;
      case 'params':
        return <Params DB={DB} persist={persist} go={go} trk={trk} currentUser={currentUser} resetDemo={resetDemo} openModal={openModal} closeModal={closeModal} />;
      default:
        return <Dashboard DB={DB} go={go} persist={persist} trk={trk} />;
    }
  };

  return (
    <>
      <Layout
        currentUser={currentUser}
        activePage={activePage}
        go={go}
        logout={logout}
        route={route}
      >
        {renderView()}
      </Layout>
      {modalContent && (
        <Modal onClose={() => { closeModal(); setPhotoZoom(null); }}>
          {modalContent}
        </Modal>
      )}
      {photoZoom && (
        <div className="overlay" onClick={() => setPhotoZoom(null)}>
          <img src={photoZoom} className="photo-zoom" alt="zoom" />
        </div>
      )}
    </>
  );
}
