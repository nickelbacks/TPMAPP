const ROLES = { admin: "Administrateur", chef: "Chef d'équipe", operateur: "Opérateur" };
const DAY = 86400000;
const DEMO_LIMITS = { postes: 2, machines: 3, users: 3 };

const FREQ_PRESETS = [
  { v: 1, full: "Quotidienne (tous les jours)", short: "quotidienne" },
  { v: 7, full: "Hebdomadaire (toutes les semaines)", short: "hebdomadaire" },
  { v: 14, full: "Bi-hebdomadaire (toutes les 2 semaines)", short: "bi-hebdomadaire" },
  { v: 30, full: "Mensuelle (tous les mois)", short: "mensuelle" },
  { v: 90, full: "Trimestrielle (tous les 3 mois)", short: "trimestrielle" },
];

function freqLabel(f) {
  const p = FREQ_PRESETS.find(x => x.v === f);
  return p ? p.short : "tous les " + f + " j";
}

function seed() {
  const now = Date.now();
  return {
    users: [
      { id: 1, name: "Admin", role: "admin", pwd: "admin" },
      { id: 2, name: "Jean Dupont", role: "operateur", pwd: "1234" },
      { id: 3, name: "Marie Lefèvre", role: "chef", pwd: "1234" },
    ],
    postes: [
      { id: 4, name: "Ligne d'assemblage" },
      { id: 5, name: "Zone usinage" },
    ],
    machines: [
      { id: 6, posteId: 4, name: "Presse hydraulique PH-200", freq: 1, checklist: [
        { id: 100, label: "Nettoyer la zone de travail et le bâti" },
        { id: 101, label: "Vérifier le niveau d'huile hydraulique" },
        { id: 102, label: "Contrôler l'absence de fuites" },
        { id: 103, label: "Tester l'arrêt d'urgence" },
      ]},
      { id: 7, posteId: 4, name: "Robot de soudure RS-12", freq: 1, checklist: [
        { id: 110, label: "Nettoyer la torche et les buses" },
        { id: 111, label: "Vérifier l'état des câbles" },
        { id: 112, label: "Contrôler la pression de gaz" },
      ]},
      { id: 8, posteId: 5, name: "Tour CNC T-450", freq: 1, checklist: [
        { id: 120, label: "Évacuer les copeaux et nettoyer" },
        { id: 121, label: "Vérifier le niveau de lubrifiant" },
        { id: 122, label: "Contrôler l'état des outils" },
      ]},
    ],
    records: [
      { id: 200, machineId: 6, userId: 2, date: now - 2 * 3600000, comment: "", results: [
        { taskId: 100, status: "ok", comment: "", photo: null },
        { taskId: 101, status: "ok", comment: "", photo: null },
        { taskId: 102, status: "nok", comment: "Légère fuite au vérin, resserré", photo: null },
        { taskId: 103, status: "ok", comment: "", photo: null },
      ]},
      { id: 201, machineId: 8, userId: 3, date: now - 1 * DAY, comment: "", results: [
        { taskId: 120, status: "ok", comment: "", photo: null },
        { taskId: 121, status: "ok", comment: "", photo: null },
        { taskId: 122, status: "ok", comment: "", photo: null },
      ]},
    ],
  };
}

let _idc = 0;
function initIdc(DB) {
  const scan = o => { if (o && typeof o.id === "number" && o.id > _idc) _idc = o.id; };
  DB.users.forEach(scan);
  DB.postes.forEach(scan);
  DB.machines.forEach(m => { scan(m); m.checklist.forEach(scan); });
  DB.records.forEach(scan);
}

function nextId() { return ++_idc; }

function loadDB() {
  try {
    const raw = localStorage.getItem("tpmDemo");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return seed();
}

function saveDB(DB) {
  try { localStorage.setItem("tpmDemo", JSON.stringify(DB)); }
  catch (e) { console.warn("Stockage local plein"); }
}

function lastRecord(DB, mid) {
  const recs = DB.records.filter(r => r.machineId === mid).sort((a, b) => b.date - a.date);
  return recs[0] || null;
}

function machineStatus(DB, m) {
  const last = lastRecord(DB, m.id);
  if (!last) return "late";
  const days = (Date.now() - last.date) / DAY;
  if (days < m.freq) return "done";
  if (days < m.freq * 2) return "due";
  return "late";
}

function userById(DB, id) {
  return DB.users.find(u => u.id === id) || { name: "Utilisateur supprimé", role: "operateur" };
}

function nokList(DB, sinceDays) {
  const out = [];
  DB.records.filter(r => r.date > Date.now() - sinceDays * DAY).forEach(r => {
    const m = DB.machines.find(x => x.id === r.machineId);
    if (!m) return;
    r.results.filter(x => x.status === "nok").forEach(x => {
      const t = m.checklist.find(c => c.id === x.taskId);
      out.push({
        machine: m, task: t ? t.label : "Tâche",
        comment: x.comment || "", photo: x.photo || null,
        date: r.date, user: userById(DB, r.userId),
      });
    });
  });
  return out.sort((a, b) => b.date - a.date);
}

function fmtDate(t) {
  return new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDT(t) {
  return new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) +
    " à " + new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function initials(n) {
  return n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export {
  ROLES, DAY, DEMO_LIMITS, FREQ_PRESETS,
  seed, loadDB, saveDB, nextId, initIdc,
  lastRecord, machineStatus, userById, nokList,
  freqLabel, fmtDate, fmtDT, initials,
};
