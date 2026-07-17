/* ------------------------------------------------------------------
   Analytics — envoie des événements vers Supabase + geo IP
------------------------------------------------------------------ */
let sb = null;

export function initAnalytics() {
  const cfg = window.TPM_ANALYTICS || {};
  try {
    if (cfg.enabled && cfg.supabaseUrl && cfg.supabaseKey &&
        cfg.supabaseUrl.indexOf("TON-PROJET") === -1 && window.supabase) {
      sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    }
  } catch (e) { sb = null; }

  fetchGeo();
}

let _geoCache = null;

function fetchGeo() {
  if (_geoCache) return Promise.resolve(_geoCache);
  return fetch("https://ipapi.co/json/")
    .then(r => r.json())
    .then(d => {
      _geoCache = { ip: d.ip, city: d.city, region: d.region, country: d.country_name, lat: d.latitude, lng: d.longitude };
      return _geoCache;
    })
    .catch(() => null);
}

function getVisitorId() {
  let v = null;
  try { v = localStorage.getItem("tpmVisitorId"); } catch (e) {}
  if (!v) {
    v = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { localStorage.setItem("tpmVisitorId", v); } catch (e) {}
  }
  return v;
}

const visitorId = getVisitorId();
const sessionId = "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
const startedAt = Date.now();

export function track(event, detail) {
  if (!sb) return;
  const d = detail || {};
  const geo = _geoCache || {};
  try {
    const payload = {
      session_id: sessionId,
      visitor_id: visitorId,
      event,
      detail: d,
      user_agent: navigator.userAgent,
      language: navigator.language,
      referrer: document.referrer || null,
      ip: d.ip || geo.ip || null,
      city: d.city || geo.city || null,
      region: d.region || geo.region || null,
      country: d.country || geo.country || null,
      lat: d.lat || geo.lat || null,
      lng: d.lng || geo.lng || null,
    };
    sb.from("demo_events").insert(payload).then(() => {}, () => {});
  } catch (e) { /* silencieux */ }
}

// visite initiale
track("visit", { screen: screen.width + "x" + screen.height });

// heartbeat toutes les 30s
setInterval(() => {
  if (document.visibilityState === "visible") {
    track("heartbeat", { seconds: Math.round((Date.now() - startedAt) / 1000) });
  }
}, 30000);

// fin de session
window.addEventListener("beforeunload", () => {
  track("session_end", { seconds: Math.round((Date.now() - startedAt) / 1000) });
});
