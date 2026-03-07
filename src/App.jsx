import { useState, useEffect, useRef, useCallback } from "react";

// ─── STORAGE HELPERS (localStorage for persistence) ───────────────────────────
const LS = {
  get: (k, fallback = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k)    => { try { localStorage.removeItem(k); } catch {} },
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const NOTE_COLORS = {
  yellow: { bg:"#FFF176", dark:"#F9A825", text:"#1a1a1a" },
  pink:   { bg:"#F48FB1", dark:"#C2185B", text:"#1a1a1a" },
  blue:   { bg:"#90CAF9", dark:"#1565C0", text:"#1a1a1a" },
  green:  { bg:"#A5D6A7", dark:"#2E7D32", text:"#1a1a1a" },
  purple: { bg:"#CE93D8", dark:"#6A1B9A", text:"#1a1a1a" },
  orange: { bg:"#FFCC80", dark:"#E65100", text:"#1a1a1a" },
  white:  { bg:"#FAFAFA", dark:"#9E9E9E", text:"#1a1a1a" },
  coral:  { bg:"#FF8A80", dark:"#C62828", text:"#1a1a1a" },
};

const FONTS = [
  { label:"Poppins",        value:"'Poppins', sans-serif" },
  { label:"Nunito",         value:"'Nunito', sans-serif" },
  { label:"Montserrat",     value:"'Montserrat', sans-serif" },
  { label:"Open Sans",      value:"'Open Sans', sans-serif" },
  { label:"Caveat",         value:"'Caveat', cursive" },
  { label:"Patrick Hand",   value:"'Patrick Hand', cursive" },
  { label:"Indie Flower",   value:"'Indie Flower', cursive" },
  { label:"Dancing Script", value:"'Dancing Script', cursive" },
];

const COUNTRIES = ["India","United States","United Kingdom","Canada","Australia","Germany","France","Japan"];
const STATES = {
  India:["Gujarat","Maharashtra","Karnataka","Tamil Nadu","Delhi","Rajasthan","Punjab"],
  "United States":["California","New York","Texas","Florida","Washington","Illinois"],
  "United Kingdom":["England","Scotland","Wales","Northern Ireland"],
  Canada:["Ontario","Quebec","British Columbia","Alberta"],
  Australia:["New South Wales","Victoria","Queensland","Western Australia"],
  Germany:["Bavaria","Berlin","Hamburg","Saxony"],
  France:["Île-de-France","Provence","Normandy","Brittany"],
  Japan:["Tokyo","Osaka","Kyoto","Hokkaido"],
};
const CITIES = {
  Gujarat:["Surat","Ahmedabad","Vadodara","Rajkot"],Maharashtra:["Mumbai","Pune","Nagpur","Nashik"],
  Karnataka:["Bengaluru","Mysuru","Mangaluru"],"Tamil Nadu":["Chennai","Coimbatore","Madurai"],
  Delhi:["New Delhi","Noida","Gurgaon"],Rajasthan:["Jaipur","Jodhpur","Udaipur"],
  Punjab:["Amritsar","Ludhiana","Chandigarh"],California:["Los Angeles","San Francisco","San Diego","San Jose"],
  "New York":["New York City","Buffalo","Albany"],Texas:["Houston","Austin","Dallas","San Antonio"],
  Florida:["Miami","Orlando","Tampa"],Washington:["Seattle","Spokane","Bellevue"],
  Illinois:["Chicago","Springfield"],England:["London","Manchester","Birmingham","Leeds"],
  Scotland:["Edinburgh","Glasgow"],Wales:["Cardiff","Swansea"],
  "Northern Ireland":["Belfast"],Ontario:["Toronto","Ottawa","Hamilton"],
  Quebec:["Montreal","Quebec City"],"British Columbia":["Vancouver","Victoria"],
  Alberta:["Calgary","Edmonton"],"New South Wales":["Sydney","Newcastle"],
  Victoria:["Melbourne","Geelong"],Queensland:["Brisbane","Gold Coast"],
  "Western Australia":["Perth","Fremantle"],Bavaria:["Munich","Nuremberg","Augsburg"],
  Berlin:["Berlin"],Hamburg:["Hamburg"],Saxony:["Dresden","Leipzig"],
  "Île-de-France":["Paris","Versailles"],Provence:["Marseille","Nice","Avignon"],
  Normandy:["Rouen","Caen"],Brittany:["Rennes","Brest"],
  Tokyo:["Tokyo","Shibuya","Shinjuku"],Osaka:["Osaka","Sakai"],
  Kyoto:["Kyoto","Uji"],Hokkaido:["Sapporo","Hakodate"],
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────
const uid         = () => Math.random().toString(36).slice(2, 9);
const pad         = (n) => String(n).padStart(2, "0");
const firstLetter = (name) => (name || "U").trim().charAt(0).toUpperCase();
const todayKey    = () => new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
const fmtDate     = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
};

// ─── CLOCK ────────────────────────────────────────────────────────────────────
function useClock(fmt24 = false) {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  const days   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dateStr = `${days[t.getDay()]}, ${t.getDate()} ${months[t.getMonth()]} ${t.getFullYear()}`;
  let h = t.getHours(), m = t.getMinutes(), s = t.getSeconds(), suf = "";
  if (!fmt24) { suf = h >= 12 ? " PM" : " AM"; h = h % 12 || 12; }
  return { dateStr, timeStr:`${pad(h)}:${pad(m)}:${pad(s)}${suf}` };
}

// ─── REAL-TIME WEATHER API ────────────────────────────────────────────────────
// Uses OpenWeatherMap free tier — sign up at https://openweathermap.org/api
// Replace the string below with your own API key, OR set VITE_OWM_KEY in .env
const OWM_KEY = import.meta.env?.VITE_OWM_KEY || "PASTE_YOUR_OPENWEATHERMAP_KEY_HERE";

/**
 * fetchWeather(city)
 * Calls OpenWeatherMap /data/2.5/weather endpoint with metric units.
 * Returns a normalised weather object or throws on failure.
 */
async function fetchWeather(city) {
  if (!city || !city.trim()) throw new Error("No city provided");
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.trim())}&appid=${OWM_KEY}&units=metric`;
  const res  = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) throw new Error(`City "${city}" not found`);
    if (res.status === 401) throw new Error("Invalid API key — check your OWM key");
    throw new Error(`Weather fetch failed (${res.status})`);
  }
  const d = await res.json();
  return {
    city:        d.name,
    country:     d.sys.country,
    temp:        Math.round(d.main.temp),          // °C
    feels:       Math.round(d.main.feels_like),
    humidity:    d.main.humidity,                  // %
    wind:        Math.round(d.wind.speed * 3.6),   // m/s → km/h
    condition:   d.weather[0].main,                // "Clear", "Rain", …
    description: d.weather[0].description,
    iconCode:    d.weather[0].icon,
    iconUrl:     `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`,
    updatedAt:   Date.now(),
  };
}

/**
 * useWeather(city)
 * Custom hook — fetches weather on mount & whenever `city` changes,
 * then auto-refreshes every 60 seconds.
 */
function useWeather(city) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const timerRef = useRef(null);

  const load = useCallback(async (c) => {
    if (!c) return;
    setLoading(true); setError(null);
    try {
      const data = await fetchWeather(c);
      setWeather(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(city);
    // Refresh every 60 seconds
    timerRef.current = setInterval(() => load(city), 60_000);
    return () => clearInterval(timerRef.current);
  }, [city, load]);

  return { weather, loading, error };
}

/** Maps OWM condition to a simple emoji for the topbar chip */
function weatherEmoji(condition) {
  const map = {
    Clear:"☀️", Clouds:"⛅", Rain:"🌧️", Drizzle:"🌦️",
    Thunderstorm:"⛈️", Snow:"❄️", Mist:"🌫️", Fog:"🌫️",
    Haze:"🌁", Dust:"🌪️", Sand:"🌪️", Ash:"🌋", Squall:"💨", Tornado:"🌪️",
  };
  return map[condition] || "🌡️";
}

// ─── WEATHER WIDGET (topbar chip + expandable card) ───────────────────────────
function WeatherWidget({ city, darkMode }) {
  const { weather, loading, error } = useWeather(city);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const tp  = darkMode ? "#f0f0f0" : "#1a1a2e";
  const tm  = darkMode ? "#888"    : "#999";

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Chip shown in topbar
  const chipBg  = darkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.78)";
  const chipBdr = darkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.05)";

  return (
    <div ref={ref} style={{ position:"relative" }}>
      {/* ── Topbar chip ── */}
      <div onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20,
          background:chipBg, border:chipBdr, cursor:"pointer", userSelect:"none",
          boxShadow: open ? "0 0 0 2px rgba(99,102,241,0.4)" : "none", transition:"box-shadow 0.2s" }}>
        {loading && <span style={{ fontSize:11, color:tm, fontFamily:"'Nunito',sans-serif" }}>Loading…</span>}
        {error   && <span style={{ fontSize:11, color:"#ef4444", fontFamily:"'Nunito',sans-serif" }} title={error}>⚠️ Weather</span>}
        {weather && !loading && (
          <>
            <span style={{ fontSize:17, lineHeight:1 }}>{weatherEmoji(weather.condition)}</span>
            <span style={{ fontSize:14, fontWeight:900, color:tp, fontFamily:"'Nunito',sans-serif", letterSpacing:-0.3 }}>{weather.temp}°C</span>
            <span style={{ fontSize:11, color:tm, fontFamily:"'Nunito',sans-serif" }}>{weather.city}, {weather.country}</span>
          </>
        )}
        {!weather && !loading && !error && (
          <span style={{ fontSize:11, color:tm, fontFamily:"'Nunito',sans-serif" }}>🌡️ Weather</span>
        )}
      </div>

      {/* ── Expanded card ── */}
      {open && weather && (
        <div style={{ position:"absolute", top:46, left:0, width:260, borderRadius:18,
          background:darkMode?"rgba(16,16,32,0.97)":"rgba(255,255,255,0.97)",
          border:`1px solid ${darkMode?"rgba(255,255,255,0.09)":"rgba(0,0,0,0.07)"}`,
          boxShadow:"0 20px 56px rgba(0,0,0,0.35)", zIndex:9999, overflow:"hidden",
          animation:"dropIn 0.18s ease", backdropFilter:"blur(20px)" }}>

          {/* Header */}
          <div style={{ padding:"16px 18px 12px", background: darkMode
            ? "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.15))"
            : "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))",
            borderBottom:`1px solid ${darkMode?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)"}` }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontWeight:900, fontSize:15, color:tp, fontFamily:"'Nunito',sans-serif" }}>
                  {weather.city}
                </div>
                <div style={{ fontSize:11, color:tm, fontFamily:"'Nunito',sans-serif", marginTop:1 }}>
                  {weather.description.charAt(0).toUpperCase()+weather.description.slice(1)}
                </div>
              </div>
              <img src={weather.iconUrl} alt={weather.condition}
                style={{ width:52, height:52, filter: darkMode ? "brightness(1.2)" : "none" }} />
            </div>
            <div style={{ marginTop:6 }}>
              <span style={{ fontSize:36, fontWeight:900, color:tp, fontFamily:"'Nunito',sans-serif", letterSpacing:-1 }}>{weather.temp}°C</span>
              <span style={{ fontSize:12, color:tm, fontFamily:"'Nunito',sans-serif", marginLeft:8 }}>Feels like {weather.feels}°C</span>
            </div>
          </div>

          {/* Detail rows */}
          <div style={{ padding:"12px 18px 14px" }}>
            {[
              ["💧","Humidity",     `${weather.humidity}%`],
              ["💨","Wind Speed",   `${weather.wind} km/h`],
              ["🌍","Condition",    weather.condition],
            ].map(([icon,label,val]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${darkMode?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"}` }}>
                <span style={{ fontSize:12, color:tm, fontFamily:"'Nunito',sans-serif" }}>{icon} {label}</span>
                <span style={{ fontSize:12, fontWeight:700, color:tp, fontFamily:"'Nunito',sans-serif" }}>{val}</span>
              </div>
            ))}
            <div style={{ marginTop:8, fontSize:10, color:darkMode?"#444":"#ccc", fontFamily:"'Nunito',sans-serif", textAlign:"right" }}>
              Updated {new Date(weather.updatedAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})} · auto-refreshes 60s
            </div>
          </div>
        </div>
      )}

      {/* Error card */}
      {open && error && (
        <div style={{ position:"absolute", top:46, left:0, width:240, borderRadius:14,
          background:darkMode?"rgba(16,16,32,0.97)":"#fff", border:`1px solid rgba(239,68,68,0.3)`,
          boxShadow:"0 12px 32px rgba(0,0,0,0.28)", zIndex:9999, padding:"14px 16px",
          animation:"dropIn 0.18s ease", backdropFilter:"blur(20px)" }}>
          <div style={{ fontSize:13, color:"#ef4444", fontFamily:"'Nunito',sans-serif", fontWeight:700, marginBottom:4 }}>⚠️ Weather Error</div>
          <div style={{ fontSize:11, color:tm, fontFamily:"'Nunito',sans-serif", lineHeight:1.6 }}>{error}</div>
          {error.includes("API key") && (
            <div style={{ marginTop:8, fontSize:10, color:"#6366f1", fontFamily:"'Nunito',sans-serif" }}>
              Get a free key at openweathermap.org and set VITE_OWM_KEY
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CONTACT DEVELOPER MODAL ──────────────────────────────────────────────────
function ContactDevModal({ onClose, darkMode }) {
  const bg  = darkMode ? "#16162a" : "#fff";
  const bdr = darkMode ? "rgba(255,255,255,0.09)" : "#e8e8e8";
  const txt = darkMode ? "#f0f0f0" : "#1a1a2e";
  const links = [
    { icon:"🐙", label:"GitHub",   url:"https://github.com/miteshpipaliya",                           color:"#333" },
    { icon:"💼", label:"LinkedIn", url:"https://www.linkedin.com/in/mitesh-pipaliya-225889288/",       color:"#0077b5" },
    { icon:"🐦", label:"X (Twitter)", url:"https://x.com/InfoSecMitesh",                              color:"#1da1f2" },
    { icon:"✉️", label:"Email",    url:"mailto:miteshpipaliya2202@gmail.com",                          color:"#ea4335" },
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)", zIndex:10001, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:380, background:bg, borderRadius:22, padding:32, boxShadow:"0 28px 80px rgba(0,0,0,0.4)", border:`1px solid ${bdr}`, animation:"dropIn 0.2s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:18, color:txt, margin:0 }}>Contact Developer</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#888" }}>✕</button>
        </div>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 10px" }}>M</div>
          <div style={{ fontWeight:800, fontSize:15, color:txt, fontFamily:"'Nunito',sans-serif" }}>Mitesh Pipaliya</div>
          <div style={{ fontSize:12, color:"#888", fontFamily:"'Nunito',sans-serif", marginTop:2 }}>Full Stack Developer</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {links.map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
              style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderRadius:12, border:`1px solid ${bdr}`, background:darkMode?"rgba(255,255,255,0.04)":"#f8f8f8", textDecoration:"none", transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode?"rgba(99,102,241,0.12)":"rgba(99,102,241,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = darkMode?"rgba(255,255,255,0.04)":"#f8f8f8"}>
              <span style={{ fontSize:20 }}>{l.icon}</span>
              <span style={{ fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:13, color:txt }}>{l.label}</span>
              <span style={{ marginLeft:"auto", fontSize:11, color:"#888", fontFamily:"'Nunito',sans-serif" }}>
                {l.url.replace("mailto:","").replace("https://","").split("/")[0]}
              </span>
            </a>
          ))}
        </div>
        <div style={{ marginTop:16, fontSize:11, color:"#888", fontFamily:"'Nunito',sans-serif", textAlign:"center" }}>
          miteshpipaliya2202@gmail.com
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE DROPDOWN ─────────────────────────────────────────────────────────
function ProfileDropdown({ user, onLogout, onEdit, onContactDev, darkMode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const bg  = darkMode ? "#16162a" : "#fff";
  const bdr = darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
  const txt = darkMode ? "#e0e0e0" : "#1a1a2e";
  const hvr = darkMode ? "rgba(255,255,255,0.06)" : "rgba(99,102,241,0.07)";
  const items = [
    { icon:"✏️", label:"Edit Profile",       fn:onEdit },
    { icon:"🧑‍💻", label:"Contact Developer", fn:onContactDev },
    { icon:"🚪", label:"Logout",             fn:onLogout, danger:true },
  ];
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:16, cursor:"pointer", flexShrink:0, userSelect:"none", boxShadow:open?"0 0 0 3px rgba(99,102,241,0.45)":"none", transition:"box-shadow 0.2s" }}
        title={user.name}>
        {firstLetter(user.name)}
      </div>
      {open && (
        <div style={{ position:"absolute", top:46, right:0, width:230, background:bg, borderRadius:16, border:`1px solid ${bdr}`, boxShadow:"0 20px 56px rgba(0,0,0,0.28)", zIndex:9999, overflow:"hidden", animation:"dropIn 0.18s ease" }}>
          <div style={{ padding:"14px 16px 12px", borderBottom:`1px solid ${bdr}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:15, flexShrink:0 }}>
                {firstLetter(user.name)}
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:13, color:txt, fontFamily:"'Nunito',sans-serif" }}>{user.name}</div>
                <div style={{ fontSize:11, color:"#888", fontFamily:"'Nunito',sans-serif" }}>{user.email}</div>
              </div>
            </div>
            <div style={{ marginTop:8, fontSize:11, color:"#888", fontFamily:"'Nunito',sans-serif" }}>
              📍 {[user.city,user.state,user.country].filter(Boolean).join(", ") || "Location not set"}
            </div>
          </div>
          {items.map(item => (
            <div key={item.label}
              onClick={() => { item.fn(); setOpen(false); }}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", cursor:"pointer", color:item.danger?"#ef4444":txt, fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:600, transition:"background 0.15s", background:"transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = item.danger?"rgba(239,68,68,0.08)":hvr}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontSize:16 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EDIT PROFILE MODAL ───────────────────────────────────────────────────────
function EditProfileModal({ user, onSave, onClose, darkMode }) {
  const [form, setForm] = useState({ name:user.name||"", country:user.country||"", state:user.state||"", city:user.city||"" });
  const f = (k) => (v) => setForm(p => ({...p,[k]:v}));
  const bg  = darkMode ? "#16162a" : "#fff";
  const bdr = darkMode ? "rgba(255,255,255,0.09)" : "#e8e8e8";
  const txt = darkMode ? "#f0f0f0" : "#1a1a2e";
  const inp = { width:"100%", padding:"10px 12px", borderRadius:10, border:`1px solid ${bdr}`, background:darkMode?"rgba(255,255,255,0.05)":"#f6f6f6", color:txt, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"'Nunito',sans-serif", appearance:"none" };
  const lbl = { fontSize:11, fontWeight:800, color:"#888", marginBottom:5, display:"block", fontFamily:"'Nunito',sans-serif", letterSpacing:0.5, textTransform:"uppercase" };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:400, background:bg, borderRadius:22, padding:32, boxShadow:"0 28px 80px rgba(0,0,0,0.4)", border:`1px solid ${bdr}`, animation:"dropIn 0.2s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h2 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:18, color:txt, margin:0 }}>Edit Profile</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#888", lineHeight:1 }}>✕</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div><label style={lbl}>Display Name</label><input style={inp} value={form.name} onChange={e => f("name")(e.target.value)} placeholder="Your name" /></div>
          <div>
            <label style={lbl}>Country</label>
            <select style={inp} value={form.country} onChange={e => { f("country")(e.target.value); f("state")(""); f("city")(""); }}>
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {form.country && (
            <div>
              <label style={lbl}>State / Region</label>
              <select style={inp} value={form.state} onChange={e => { f("state")(e.target.value); f("city")(""); }}>
                <option value="">Select state</option>
                {(STATES[form.country]||[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {form.state && (
            <div>
              <label style={lbl}>City</label>
              <select style={inp} value={form.city} onChange={e => f("city")(e.target.value)}>
                <option value="">Select city</option>
                {(CITIES[form.state]||[]).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <button onClick={() => { onSave(form); onClose(); }}
            style={{ marginTop:6, padding:"12px", borderRadius:12, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
            Save Changes ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STICKY NOTE ─────────────────────────────────────────────────────────────
function StickyNote({ note, onUpdate, onDelete, onDuplicate, onBringToFront }) {
  const [dragging,    setDragging]    = useState(false);
  const [resizing,    setResizing]    = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showColors,  setShowColors]  = useState(false);
  const [showFonts,   setShowFonts]   = useState(false);
  const dragStart   = useRef(null);
  const resizeStart = useRef(null);
  const color = NOTE_COLORS[note.color] || NOTE_COLORS.yellow;

  const onMouseDownDrag = (e) => {
    if (note.locked) return;
    e.preventDefault();
    onBringToFront(note.id);
    dragStart.current = { mx:e.clientX, my:e.clientY, ox:note.x, oy:note.y };
    setDragging(true);
  };
  const onMouseMoveDrag = useCallback((e) => {
    if (!dragging || !dragStart.current) return;
    onUpdate(note.id, { x:Math.max(0,dragStart.current.ox+e.clientX-dragStart.current.mx), y:Math.max(0,dragStart.current.oy+e.clientY-dragStart.current.my) });
  }, [dragging, note.id, onUpdate]);

  const onMouseDownResize = (e) => {
    e.preventDefault(); e.stopPropagation();
    resizeStart.current = { mx:e.clientX, my:e.clientY, ow:note.w, oh:note.h };
    setResizing(true);
  };
  const onMouseMoveResize = useCallback((e) => {
    if (!resizing || !resizeStart.current) return;
    onUpdate(note.id, { w:Math.max(200,resizeStart.current.ow+e.clientX-resizeStart.current.mx), h:Math.max(160,resizeStart.current.oh+e.clientY-resizeStart.current.my) });
  }, [resizing, note.id, onUpdate]);

  const onMouseUp = useCallback(() => { setDragging(false); setResizing(false); }, []);

  useEffect(() => {
    if (dragging)  { window.addEventListener("mousemove",onMouseMoveDrag);   window.addEventListener("mouseup",onMouseUp); }
    return ()      => { window.removeEventListener("mousemove",onMouseMoveDrag);  window.removeEventListener("mouseup",onMouseUp); };
  }, [dragging, onMouseMoveDrag, onMouseUp]);
  useEffect(() => {
    if (resizing)  { window.addEventListener("mousemove",onMouseMoveResize); window.addEventListener("mouseup",onMouseUp); }
    return ()      => { window.removeEventListener("mousemove",onMouseMoveResize); window.removeEventListener("mouseup",onMouseUp); };
  }, [resizing, onMouseMoveResize, onMouseUp]);

  return (
    <div
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => { setShowToolbar(false); setShowColors(false); setShowFonts(false); }}
      onClick={() => onBringToFront(note.id)}
      style={{ position:"absolute", left:note.x, top:note.y, width:note.w, height:note.h, zIndex:note.zIndex,
        borderRadius:16, background:color.bg, display:"flex", flexDirection:"column", overflow:"visible",
        userSelect:"none", fontFamily:note.font,
        transition:dragging||resizing?"none":"box-shadow 0.2s, transform 0.18s",
        transform:dragging?"rotate(-1.5deg) scale(1.03)":"rotate(0deg) scale(1)",
        boxShadow:dragging
          ?"0 28px 64px rgba(0,0,0,0.38), 0 8px 22px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.5)"
          :"0 6px 28px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.4)",
      }}>
      <div style={{ height:6, background:color.dark, borderRadius:"16px 16px 0 0", flexShrink:0 }} />
      <div onMouseDown={onMouseDownDrag} title={note.locked?"Note is locked":"Drag to move"}
        style={{ height:32, cursor:note.locked?"not-allowed":dragging?"grabbing":"grab", flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center", gap:4, userSelect:"none",
          background:"rgba(0,0,0,0.03)", borderBottom:`1px solid ${color.dark}22` }}>
        {[0,1,2,3,4,5].map(i => <div key={i} style={{ width:3.5, height:3.5, borderRadius:"50%", background:color.dark, opacity:0.35 }} />)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:3, padding:"5px 10px", opacity:showToolbar?1:0, transition:"opacity 0.2s", flexShrink:0, position:"relative" }}>
        <div style={{ position:"relative" }}>
          <button onClick={e => { e.stopPropagation(); setShowColors(!showColors); setShowFonts(false); }}
            style={{ width:17, height:17, borderRadius:"50%", background:color.bg, border:`2px solid ${color.dark}`, cursor:"pointer" }} />
          {showColors && (
            <div style={{ position:"absolute", top:24, left:0, background:"#fff", borderRadius:12, padding:8, display:"flex", flexWrap:"wrap", gap:4, width:116, boxShadow:"0 8px 24px rgba(0,0,0,0.2)", zIndex:9990 }}>
              {Object.entries(NOTE_COLORS).map(([k,v]) => (
                <div key={k} onClick={e => { e.stopPropagation(); onUpdate(note.id,{color:k}); setShowColors(false); }}
                  style={{ width:20, height:20, borderRadius:"50%", background:v.bg, border:note.color===k?"2.5px solid #333":"1px solid rgba(0,0,0,0.12)", cursor:"pointer" }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ position:"relative" }}>
          <button onClick={e => { e.stopPropagation(); setShowFonts(!showFonts); setShowColors(false); }}
            style={{ fontSize:9, fontWeight:800, padding:"2px 5px", borderRadius:5, background:"rgba(0,0,0,0.1)", border:"none", cursor:"pointer", color:color.text }}>Aa</button>
          {showFonts && (
            <div style={{ position:"absolute", top:24, left:0, background:"#fff", borderRadius:12, padding:6, width:158, boxShadow:"0 8px 24px rgba(0,0,0,0.2)", zIndex:9990 }}>
              {FONTS.map(ft => (
                <div key={ft.value} onClick={e => { e.stopPropagation(); onUpdate(note.id,{font:ft.value}); setShowFonts(false); }}
                  style={{ padding:"6px 10px", fontFamily:ft.value, cursor:"pointer", borderRadius:8, fontSize:13, background:note.font===ft.value?"rgba(99,102,241,0.1)":"transparent", color:"#1a1a2e" }}>
                  {ft.label}
                </div>
              ))}
            </div>
          )}
        </div>
        {editing && [["bold","𝐁"],["italic","𝐼"],["underline","U̲"]].map(([cmd,lbl]) => (
          <button key={cmd} onMouseDown={e => { e.preventDefault(); document.execCommand(cmd,false,null); }}
            style={{ width:18, height:18, fontSize:9, border:"none", borderRadius:4, background:"rgba(0,0,0,0.1)", cursor:"pointer", fontWeight:700, color:color.text }}>{lbl}</button>
        ))}
        <div style={{ flex:1 }} />
        <button onClick={e => { e.stopPropagation(); onUpdate(note.id,{locked:!note.locked}); }}
          style={{ fontSize:11, border:"none", background:"transparent", cursor:"pointer" }}>{note.locked?"🔒":"🔓"}</button>
        <button onClick={e => { e.stopPropagation(); onDuplicate(note.id); }}
          style={{ fontSize:12, border:"none", background:"transparent", cursor:"pointer" }}>⧉</button>
        <button onClick={e => { e.stopPropagation(); onDelete(note.id); }}
          style={{ fontSize:12, border:"none", background:"transparent", cursor:"pointer", color:"#c62828" }}>✕</button>
      </div>
      <div contentEditable={!note.locked} suppressContentEditableWarning
        onFocus={() => setEditing(true)}
        onBlur={e => { setEditing(false); onUpdate(note.id,{content:e.currentTarget.innerHTML}); }}
        style={{ flex:1, padding:"2px 14px 14px", fontSize:14, lineHeight:1.65, color:color.text, fontFamily:note.font, outline:"none", overflowY:"auto", whiteSpace:"pre-wrap", wordBreak:"break-word", cursor:note.locked?"default":"text", userSelect:"text" }}
        dangerouslySetInnerHTML={{ __html:note.content }} />
      {!note.locked && (
        <div onMouseDown={onMouseDownResize}
          style={{ position:"absolute", right:4, bottom:4, width:18, height:18, cursor:"se-resize", opacity:showToolbar?0.55:0, transition:"opacity 0.2s" }}>
          <svg viewBox="0 0 18 18" fill={color.dark}><path d="M13 7h2v2h-2zM10 10h2v2h-2zM13 10h2v2h-2zM7 13h2v2H7zM10 13h2v2h-2zM13 13h2v2h-2z"/></svg>
        </div>
      )}
    </div>
  );
}

// ─── TODO PANEL (with persistent storage + edit) ──────────────────────────────
function TodoPanel({ darkMode, userEmail }) {
  const storageKey = `visionbook_todos_${userEmail}`;
  const [todos,     setTodos]     = useState(() => LS.get(storageKey, []));
  const [input,     setInput]     = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText,  setEditText]  = useState("");

  // persist on every change
  useEffect(() => { LS.set(storageKey, todos); }, [todos, storageKey]);

  const add = () => {
    if (!input.trim()) return;
    setTodos(p => [...p, { id:uid(), title:input.trim(), done:false, createdAt:new Date().toISOString() }]);
    setInput("");
  };
  const startEdit = (t) => { setEditingId(t.id); setEditText(t.title); };
  const saveEdit  = (id) => { setTodos(p => p.map(t => t.id===id ? {...t,title:editText.trim()||t.title} : t)); setEditingId(null); };

  const inpStyle = { flex:1, padding:"8px 10px", borderRadius:8, border:darkMode?"1px solid #444":"1px solid #e0e0e0", background:darkMode?"#2a2a2a":"#f5f5f5", color:darkMode?"#fff":"#1a1a2e", fontSize:12.5, outline:"none", fontFamily:"'Nunito',sans-serif" };

  const done  = todos.filter(t => t.done);
  const active= todos.filter(t => !t.done);

  return (
    <div style={{ padding:"0 0 20px" }}>
      <h3 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:13, letterSpacing:1, textTransform:"uppercase", color:darkMode?"#aaa":"#888", margin:"0 0 14px", padding:"16px 18px 0" }}>To-Do List</h3>
      <div style={{ padding:"0 18px", display:"flex", gap:6, marginBottom:12 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&add()} placeholder="Add a task..." style={inpStyle} />
        <button onClick={add} style={{ width:30, height:30, borderRadius:8, background:"#6366f1", border:"none", color:"#fff", cursor:"pointer", fontSize:18, lineHeight:1 }}>+</button>
      </div>

      {/* Active tasks */}
      <div style={{ maxHeight:220, overflowY:"auto" }}>
        {active.length===0 && <div style={{ padding:"8px 18px", fontSize:12, color:darkMode?"#555":"#bbb", fontFamily:"'Nunito',sans-serif" }}>No active tasks 🎉</div>}
        {active.map(t => (
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 18px", borderBottom:darkMode?"1px solid #2a2a3e":"1px solid #f0f0f0" }}>
            <input type="checkbox" checked={t.done} onChange={() => setTodos(p => p.map(x => x.id===t.id?{...x,done:!x.done}:x))} style={{ cursor:"pointer", accentColor:"#6366f1", flexShrink:0 }} />
            {editingId===t.id ? (
              <>
                <input value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => e.key==="Enter"&&saveEdit(t.id)}
                  style={{ flex:1, fontSize:12.5, fontFamily:"'Nunito',sans-serif", background:"transparent", border:"none", borderBottom:`1px solid #6366f1`, outline:"none", color:darkMode?"#ddd":"#333", padding:"2px 0" }} autoFocus />
                <button onClick={() => saveEdit(t.id)} style={{ fontSize:11, border:"none", background:"transparent", cursor:"pointer", color:"#6366f1", fontWeight:700 }}>✓</button>
                <button onClick={() => setEditingId(null)} style={{ fontSize:11, border:"none", background:"transparent", cursor:"pointer", color:"#999" }}>✕</button>
              </>
            ) : (
              <>
                <span style={{ flex:1, fontSize:12.5, fontFamily:"'Nunito',sans-serif", color:darkMode?"#ddd":"#333" }}>{t.title}</span>
                <button onClick={() => startEdit(t)} style={{ fontSize:11, border:"none", background:"transparent", cursor:"pointer", color:"#6366f1" }} title="Edit">✏️</button>
                <button onClick={() => setTodos(p => p.filter(x => x.id!==t.id))} style={{ fontSize:11, border:"none", background:"transparent", cursor:"pointer", color:"#ef4444" }}>✕</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Completed tasks */}
      {done.length>0 && (
        <>
          <div style={{ padding:"10px 18px 4px", fontSize:11, fontWeight:800, color:darkMode?"#555":"#bbb", fontFamily:"'Nunito',sans-serif", letterSpacing:1, textTransform:"uppercase" }}>
            Completed ({done.length})
          </div>
          <div style={{ maxHeight:150, overflowY:"auto" }}>
            {done.map(t => (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 18px", borderBottom:darkMode?"1px solid #1e1e32":"1px solid #f8f8f8", opacity:0.6 }}>
                <input type="checkbox" checked onChange={() => setTodos(p => p.map(x => x.id===t.id?{...x,done:false}:x))} style={{ cursor:"pointer", accentColor:"#6366f1", flexShrink:0 }} />
                <span style={{ flex:1, fontSize:12, fontFamily:"'Nunito',sans-serif", textDecoration:"line-through", color:darkMode?"#888":"#999" }}>{t.title}</span>
                <button onClick={() => setTodos(p => p.filter(x => x.id!==t.id))} style={{ fontSize:11, border:"none", background:"transparent", cursor:"pointer", color:"#ef4444" }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ padding:"8px 18px" }}>
            <button onClick={() => setTodos(p => p.filter(x => !x.done))}
              style={{ fontSize:11, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontWeight:700 }}>
              Clear all completed
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── JOURNAL PANEL (persistent per date) ──────────────────────────────────────
function JournalPanel({ darkMode, userEmail }) {
  const today   = todayKey();
  const baseKey = `visionbook_journal_${userEmail}`;

  // Load all journal entries map: { "YYYY-MM-DD": "content" }
  const [entries,     setEntries]     = useState(() => LS.get(baseKey, {}));
  const [selectedDate,setSelectedDate]= useState(today);
  const [content,     setContent]     = useState(() => (LS.get(baseKey,{}))[today] || "");
  const [saved,       setSaved]       = useState(true);
  const saveTimer = useRef(null);

  // When date changes, load that day's content
  useEffect(() => {
    setContent(entries[selectedDate] || "");
    setSaved(true);
  }, [selectedDate]);

  // Auto-save with debounce 1.5s
  const handleChange = (val) => {
    setContent(val);
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setEntries(prev => {
        const next = { ...prev, [selectedDate]: val };
        LS.set(baseKey, next);
        return next;
      });
      setSaved(true);
    }, 1500);
  };

  // Sorted list of all dates that have entries
  const allDates = Object.keys(entries).filter(d => entries[d]?.trim()).sort((a,b) => b.localeCompare(a));
  const words = content.trim().split(/\s+/).filter(Boolean).length;

  const dark = darkMode;
  const inp = { width:"100%", padding:"9px 11px", borderRadius:9, border:dark?"1px solid #444":"1px solid #ddd", background:dark?"#2a2a2a":"#f5f5f5", color:dark?"#fff":"#1a1a2e", fontSize:12, outline:"none", fontFamily:"'Nunito',sans-serif", appearance:"none", cursor:"pointer" };

  return (
    <div style={{ padding:"0 0 20px" }}>
      <h3 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:13, letterSpacing:1, textTransform:"uppercase", color:dark?"#aaa":"#888", margin:"0 0 0", padding:"16px 18px 0" }}>Daily Journal</h3>

      {/* Date selector */}
      <div style={{ padding:"10px 18px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ flex:1 }}>
          <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={inp}>
            {/* Today always available */}
            {!allDates.includes(today) && <option value={today}>📅 Today — {fmtDate(today)}</option>}
            {allDates.map(d => (
              <option key={d} value={d}>{d===today?"📅 Today":"📖 "+fmtDate(d)}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setSelectedDate(today)}
          style={{ padding:"8px 12px", borderRadius:9, background:"#6366f1", border:"none", color:"#fff", fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif", flexShrink:0 }}>
          Today
        </button>
      </div>

      <div style={{ padding:"0 18px 6px", fontSize:11, color:dark?"#888":"#aaa", fontFamily:"'Nunito',sans-serif" }}>
        {fmtDate(selectedDate)}
      </div>

      <div style={{ padding:"0 18px" }}>
        <textarea value={content} onChange={e => handleChange(e.target.value)}
          disabled={selectedDate !== today}
          placeholder={selectedDate===today ? "Write your thoughts for today..." : "No entry for this day."}
          style={{ width:"100%", height:220, padding:"12px 14px", borderRadius:10, border:dark?"1px solid #444":"1px solid #e0e0e0", background:selectedDate!==today?(dark?"#1a1a2a":"#f5f5f5"):dark?"#2a2a2a":"#fafafa", color:dark?"#eee":"#222", fontSize:13, lineHeight:1.75, resize:"none", outline:"none", fontFamily:"'Caveat',cursive", boxSizing:"border-box", opacity:selectedDate!==today?0.7:1 }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
          <span style={{ fontSize:11, color:dark?"#666":"#bbb", fontFamily:"'Nunito',sans-serif" }}>{words} words</span>
          <span style={{ fontSize:11, color:saved?"#4ade80":"#f59e0b", fontFamily:"'Nunito',sans-serif", fontWeight:700 }}>
            {selectedDate!==today?"Read-only 📖":saved?"✓ Saved":"Saving…"}
          </span>
        </div>
      </div>

      {/* Past entries summary */}
      {allDates.filter(d => d!==today).length>0 && (
        <div style={{ margin:"12px 18px 0", padding:"10px 14px", borderRadius:12, background:dark?"rgba(99,102,241,0.08)":"rgba(99,102,241,0.06)", border:dark?"1px solid rgba(99,102,241,0.15)":"1px solid rgba(99,102,241,0.12)" }}>
          <div style={{ fontSize:11, fontWeight:800, color:"#6366f1", fontFamily:"'Nunito',sans-serif", marginBottom:6, textTransform:"uppercase", letterSpacing:0.8 }}>
            Past Entries ({allDates.filter(d=>d!==today).length})
          </div>
          {allDates.filter(d=>d!==today).slice(0,5).map(d => (
            <div key={d} onClick={() => setSelectedDate(d)}
              style={{ fontSize:12, color:dark?"#aaa":"#666", fontFamily:"'Nunito',sans-serif", padding:"4px 0", cursor:"pointer", borderBottom:dark?"1px solid rgba(255,255,255,0.04)":"1px solid rgba(0,0,0,0.04)", display:"flex", justifyContent:"space-between" }}>
              <span>📖 {fmtDate(d)}</span>
              <span style={{ color:"#6366f1", fontWeight:700 }}>{(entries[d]||"").trim().split(/\s+/).filter(Boolean).length}w</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────
function SettingsPanel({ settings, onSettings, darkMode, user, onUpdateUser }) {
  const [locOpen, setLocOpen] = useState(false);
  const [loc,     setLoc]     = useState({ country:user.country||"", state:user.state||"", city:user.city||"" });
  const row  = { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 18px", borderBottom:darkMode?"1px solid #1e1e32":"1px solid #f0f0f0" };
  const lbl  = { fontSize:13, fontFamily:"'Nunito',sans-serif", color:darkMode?"#ddd":"#444", fontWeight:600 };
  const sel  = { width:"100%", padding:"9px 11px", borderRadius:9, border:darkMode?"1px solid #444":"1px solid #ddd", background:darkMode?"#2a2a2a":"#f5f5f5", color:darkMode?"#fff":"#1a1a2e", fontSize:12, outline:"none", fontFamily:"'Nunito',sans-serif", appearance:"none" };
  const toggle = (key) => onSettings({...settings,[key]:!settings[key]});
  return (
    <div style={{ padding:"0 0 20px" }}>
      <h3 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:13, letterSpacing:1, textTransform:"uppercase", color:darkMode?"#aaa":"#888", margin:"0 0 4px", padding:"16px 18px 0" }}>Settings</h3>
      {[["Dark Mode","darkMode"],["24h Clock","fmt24"],["Compact Sidebar","compact"]].map(([label,key]) => (
        <div key={key} style={row}>
          <span style={lbl}>{label}</span>
          <div onClick={() => toggle(key)} style={{ width:38, height:22, borderRadius:11, background:settings[key]?"#6366f1":darkMode?"#555":"#d0d0d0", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
            <div style={{ position:"absolute", top:3, left:settings[key]?18:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.25)" }} />
          </div>
        </div>
      ))}
      <div style={row}>
        <span style={lbl}>Default Note Color</span>
        <div style={{ display:"flex", gap:5 }}>
          {["yellow","pink","blue","green","orange","purple"].map(c => (
            <div key={c} onClick={() => onSettings({...settings,defaultColor:c})}
              style={{ width:18, height:18, borderRadius:"50%", background:NOTE_COLORS[c].bg, border:settings.defaultColor===c?"2.5px solid #333":"1px solid rgba(0,0,0,0.12)", cursor:"pointer" }} />
          ))}
        </div>
      </div>
      <div style={{ ...row, flexDirection:"column", alignItems:"flex-start", gap:10 }}>
        <div style={{ display:"flex", width:"100%", justifyContent:"space-between", alignItems:"center" }}>
          <span style={lbl}>📍 Location</span>
          <button onClick={() => setLocOpen(!locOpen)}
            style={{ fontSize:11, padding:"4px 11px", borderRadius:8, background:"#6366f1", border:"none", color:"#fff", cursor:"pointer", fontWeight:700, fontFamily:"'Nunito',sans-serif" }}>
            {locOpen?"Cancel":"Change"}
          </button>
        </div>
        <div style={{ fontSize:12, color:"#888", fontFamily:"'Nunito',sans-serif" }}>
          {[user.city,user.state,user.country].filter(Boolean).join(", ")||"Not set"}
        </div>
        {locOpen && (
          <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
            <select value={loc.country} onChange={e => setLoc({country:e.target.value,state:"",city:""})} style={sel}>
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {loc.country && (
              <select value={loc.state} onChange={e => setLoc(p => ({...p,state:e.target.value,city:""}))} style={sel}>
                <option value="">Select state</option>
                {(STATES[loc.country]||[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {loc.state && (
              <select value={loc.city} onChange={e => setLoc(p => ({...p,city:e.target.value}))} style={sel}>
                <option value="">Select city</option>
                {(CITIES[loc.state]||[]).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <button onClick={() => { onUpdateUser({...user,...loc}); setLocOpen(false); }}
              style={{ padding:"9px", borderRadius:10, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              Save Location ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode,    setMode]    = useState("login");   // "login" | "register"
  const [step,    setStep]    = useState(1);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({ name:"", email:"", password:"", country:"", state:"", city:"" });
  const fv = (k) => (v) => { setForm(p => ({...p,[k]:v})); setError(""); };
  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleLogin = () => {
    if (!form.email||!form.password) { setError("Please fill in all fields."); return; }
    if (!validateEmail(form.email))   { setError("Please enter a valid email address."); return; }
    setLoading(true);
    setTimeout(() => {
      const users = LS.get("visionbook_users", []);
      const found = users.find(u => u.email.toLowerCase()===form.email.toLowerCase() && u.password===form.password);
      if (found) {
        // Save session to localStorage for auto-login
        LS.set("visionbook_session", found.email);
        onLogin(found);
      } else {
        const exists = users.find(u => u.email.toLowerCase()===form.email.toLowerCase());
        setError(exists?"Incorrect password. Please try again.":"No account found with this email. Please register first.");
      }
      setLoading(false);
    }, 700);
  };

  const handleRegister = () => {
    if (!form.name||!form.email||!form.password) { setError("Please fill all fields."); return; }
    if (!validateEmail(form.email))               { setError("Enter a valid email address."); return; }
    if (form.password.length<8)                   { setError("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(form.password))             { setError("Password must include at least one uppercase letter."); return; }
    if (!/[0-9]/.test(form.password))             { setError("Password must include at least one number."); return; }
    const users  = LS.get("visionbook_users", []);
    const exists = users.find(u => u.email.toLowerCase()===form.email.toLowerCase());
    if (exists) { setError("An account already exists with this email. Please log in."); return; }
    setLoading(true);
    setTimeout(() => {
      const nu = { email:form.email, password:form.password, name:form.name, country:form.country, state:form.state, city:form.city };
      LS.set("visionbook_users", [...users, nu]);
      LS.set("visionbook_session", nu.email);
      onLogin(nu);
      setLoading(false);
    }, 700);
  };

  const inpS = { width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.11)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"'Nunito',sans-serif" };
  const lblS = { fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.5)", marginBottom:5, display:"block", fontFamily:"'Nunito',sans-serif", letterSpacing:0.7, textTransform:"uppercase" };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)", fontFamily:"'Nunito',sans-serif", position:"relative", overflow:"hidden" }}>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}} @keyframes dropIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {[{t:"-10%",l:"-5%",s:420,c:"rgba(99,102,241,0.18)"},{b:"-10%",r:"-5%",s:360,c:"rgba(244,143,177,0.12)"},{t:"45%",l:"60%",s:180,c:"rgba(144,202,249,0.08)"}].map((b,i) => (
        <div key={i} style={{ position:"absolute", borderRadius:"50%", width:b.s, height:b.s, background:b.c, top:b.t, left:b.l, bottom:b.b, right:b.r, filter:"blur(60px)", pointerEvents:"none", animation:`float ${3+i}s ease-in-out infinite` }} />
      ))}

      <div style={{ width:430, background:"rgba(255,255,255,0.05)", backdropFilter:"blur(24px)", borderRadius:24, border:"1px solid rgba(255,255,255,0.09)", boxShadow:"0 32px 80px rgba(0,0,0,0.45)", padding:40, position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:42, marginBottom:6 }}>📒</div>
          <h1 style={{ fontSize:28, fontWeight:900, color:"#fff", margin:0, letterSpacing:-0.5 }}>VisionBook</h1>
          <p style={{ fontSize:12.5, color:"rgba(255,255,255,0.42)", margin:"6px 0 0" }}>Your smart sticky notes workspace</p>
        </div>

        {/* Tabs — "Log In" vs "Register" */}
        <div style={{ display:"flex", background:"rgba(0,0,0,0.25)", borderRadius:12, padding:4, marginBottom:24 }}>
          {[["login","Log In"],["register","Register"]].map(([m,lbl]) => (
            <button key={m} onClick={() => { setMode(m); setStep(1); setError(""); }}
              style={{ flex:1, padding:"9px 0", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:800, fontFamily:"'Nunito',sans-serif", background:mode===m?"rgba(255,255,255,0.14)":"transparent", color:mode===m?"#fff":"rgba(255,255,255,0.38)", transition:"all 0.2s" }}>
              {lbl}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background:"rgba(239,68,68,0.14)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#fca5a5", fontFamily:"'Nunito',sans-serif" }}>
            ⚠️ {error}
          </div>
        )}

        {/* LOG IN */}
        {mode==="login" && (
          <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
            <div><label style={lblS}>Email Address</label><input placeholder="your@email.com" style={inpS} value={form.email} onChange={e => fv("email")(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleLogin()} /></div>
            <div><label style={lblS}>Password</label><input type="password" placeholder="••••••••" style={inpS} value={form.password} onChange={e => fv("password")(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleLogin()} /></div>
            <button onClick={handleLogin} disabled={loading}
              style={{ padding:"13px", borderRadius:12, background:loading?"rgba(99,102,241,0.5)":"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", color:"#fff", fontSize:14, fontWeight:800, cursor:loading?"wait":"pointer" }}>
              {loading?"Logging in…":"Log In →"}
            </button>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", textAlign:"center", fontFamily:"'Nunito',sans-serif", margin:0 }}>
              Don't have an account?{" "}
              <span onClick={() => { setMode("register"); setError(""); }} style={{ color:"#a78bfa", cursor:"pointer", fontWeight:700 }}>Register here</span>
            </p>
          </div>
        )}

        {/* REGISTER */}
        {mode==="register" && (
          <div>
            {step===1 && (
              <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>Step 1 of 2 — Your account</p>
                <div><label style={lblS}>Full Name</label><input placeholder="Your full name" style={inpS} value={form.name} onChange={e => fv("name")(e.target.value)} /></div>
                <div><label style={lblS}>Email Address</label><input placeholder="your@email.com" style={inpS} value={form.email} onChange={e => fv("email")(e.target.value)} /></div>
                <div><label style={lblS}>Password</label><input type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" style={inpS} value={form.password} onChange={e => fv("password")(e.target.value)} /></div>
                <button onClick={() => {
                  if (!form.name||!form.email||!form.password) { setError("Please fill all fields."); return; }
                  if (!validateEmail(form.email)) { setError("Enter a valid email."); return; }
                  if (form.password.length<8||!/[A-Z]/.test(form.password)||!/[0-9]/.test(form.password)) { setError("Password: min 8 chars, 1 uppercase, 1 number."); return; }
                  const users=LS.get("visionbook_users",[]);
                  const ex=users.find(u=>u.email.toLowerCase()===form.email.toLowerCase());
                  if (ex) { setError("Email already registered. Please log in."); return; }
                  setError(""); setStep(2);
                }} style={{ padding:"13px", borderRadius:12, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer" }}>Continue →</button>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", textAlign:"center", fontFamily:"'Nunito',sans-serif", margin:0 }}>
                  Already registered?{" "}
                  <span onClick={() => { setMode("login"); setError(""); }} style={{ color:"#a78bfa", cursor:"pointer", fontWeight:700 }}>Log In here</span>
                </p>
              </div>
            )}
            {step===2 && (
              <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>Step 2 of 2 — Your location</p>
                <div>
                  <label style={lblS}>Country</label>
                  <select value={form.country} onChange={e => { fv("country")(e.target.value); fv("state")(""); fv("city")(""); }} style={{ ...inpS, appearance:"none" }}>
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c} style={{ background:"#302b63" }}>{c}</option>)}
                  </select>
                </div>
                {form.country && (
                  <div>
                    <label style={lblS}>State / Region</label>
                    <select value={form.state} onChange={e => { fv("state")(e.target.value); fv("city")(""); }} style={{ ...inpS, appearance:"none" }}>
                      <option value="">Select state</option>
                      {(STATES[form.country]||[]).map(s => <option key={s} value={s} style={{ background:"#302b63" }}>{s}</option>)}
                    </select>
                  </div>
                )}
                {form.state && (
                  <div>
                    <label style={lblS}>City</label>
                    <select value={form.city} onChange={e => fv("city")(e.target.value)} style={{ ...inpS, appearance:"none" }}>
                      <option value="">Select city</option>
                      {(CITIES[form.state]||[]).map(c => <option key={c} value={c} style={{ background:"#302b63" }}>{c}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => setStep(1)} style={{ flex:1, padding:"12px", borderRadius:12, background:"rgba(255,255,255,0.07)", border:"none", color:"#fff", fontSize:13, cursor:"pointer" }}>← Back</button>
                  <button onClick={handleRegister} disabled={loading}
                    style={{ flex:2, padding:"12px", borderRadius:12, background:loading?"rgba(99,102,241,0.5)":"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", color:"#fff", fontSize:13, fontWeight:800, cursor:loading?"wait":"pointer" }}>
                    {loading?"Creating…":"Create Account ✓"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user,          setUser]          = useState(null);
  const [notes,         setNotes]         = useState([]);
  const [activePanel,   setActivePanel]   = useState("notes");
  const [showEditProf,  setShowEditProf]  = useState(false);
  const [showContactDev,setShowContactDev]= useState(false);
  const [maxZ,          setMaxZ]          = useState(10);
  const [settings, setSettings] = useState(() => LS.get("visionbook_settings", { darkMode:true, fmt24:false, compact:false, defaultColor:"yellow" }));

  const dark = settings.darkMode;
  const { dateStr, timeStr } = useClock(settings.fmt24);

  // ── Auto-login from saved session ─────────────────────────────────────────
  useEffect(() => {
    const savedEmail = LS.get("visionbook_session");
    if (savedEmail) {
      const users = LS.get("visionbook_users", []);
      const found = users.find(u => u.email === savedEmail);
      if (found) setUser(found);
    }
  }, []);

  // ── Load notes per user ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const saved = LS.get(`visionbook_notes_${user.email}`, null);
    setNotes(saved || [
      { id:"n1", content:"☕ Morning routine\n• Wake up 6am\n• Meditate 10 min\n• Journal thoughts", color:"yellow", font:"'Caveat', cursive",         x:80,  y:100, w:240, h:200, locked:false, zIndex:1 },
      { id:"n2", content:"📚 Study goals\nFinish React chapter\nPractice TypeScript\nBuild side project",  color:"blue",   font:"'Poppins', sans-serif",   x:360, y:80,  w:220, h:180, locked:false, zIndex:2 },
      { id:"n3", content:"💡 App idea\nVoice-to-text notes\nAI summarizer\nShare with team",               color:"green",  font:"'Nunito', sans-serif",    x:620, y:130, w:230, h:170, locked:false, zIndex:3 },
    ]);
  }, [user]);

  // ── Persist notes & settings ──────────────────────────────────────────────
  useEffect(() => { if (user) LS.set(`visionbook_notes_${user.email}`, notes); }, [notes, user]);
  useEffect(() => { LS.set("visionbook_settings", settings); }, [settings]);

  // ── Persist user profile changes ──────────────────────────────────────────
  const handleUpdateUser = (updated) => {
    setUser(updated);
    const users = LS.get("visionbook_users", []);
    LS.set("visionbook_users", users.map(u => u.email===updated.email ? {...u,...updated} : u));
  };

  const bg        = dark?"linear-gradient(160deg,#09091a 0%,#111128 40%,#0d1a2e 100%)":"linear-gradient(160deg,#e8eaf6 0%,#ede7f6 30%,#e3f2fd 60%,#e8f5e9 100%)";
  const sidebarBg = dark?"rgba(12,12,26,0.97)":"rgba(255,255,255,0.88)";
  const topbarBg  = dark?"rgba(12,12,26,0.93)":"rgba(255,255,255,0.8)";
  const tp        = dark?"#f0f0f0":"#1a1a2e";
  const tm        = dark?"#666":"#999";

  const addNote = () => {
    if (notes.length>=25) { alert("Maximum 25 notes reached! Delete a note to add more."); return; }
    const nz=maxZ+1; setMaxZ(nz);
    setNotes(p => [...p,{ id:uid(), content:"New note ✏️\nStart writing here...", color:settings.defaultColor, font:"'Nunito', sans-serif", x:60+Math.random()*300, y:60+Math.random()*180, w:240, h:200, locked:false, zIndex:nz }]);
  };

  const updateNote    = useCallback((id,patch) => setNotes(p => p.map(n => n.id===id?{...n,...patch}:n)), []);
  const deleteNote    = useCallback((id)       => setNotes(p => p.filter(n => n.id!==id)), []);
  const duplicateNote = useCallback((id) => {
    if (notes.length>=25) { alert("Maximum 25 notes reached!"); return; }
    const n=notes.find(x=>x.id===id); if(!n) return;
    const nz=maxZ+1; setMaxZ(nz);
    setNotes(p => [...p,{...n,id:uid(),x:n.x+24,y:n.y+24,zIndex:nz}]);
  }, [notes,maxZ]);
  const bringToFront  = useCallback((id) => {
    const nz=maxZ+1; setMaxZ(nz);
    setNotes(p => p.map(n => n.id===id?{...n,zIndex:nz}:n));
  }, [maxZ]);

  const handleLogout = () => {
    LS.del("visionbook_session");
    setUser(null);
    setNotes([]);
  };

  if (!user) return <AuthScreen onLogin={setUser} />;

  const navItems = [
    { id:"notes",    icon:"📌", label:"Notes"   },
    { id:"todo",     icon:"✅", label:"To-Do"   },
    { id:"journal",  icon:"📖", label:"Journal" },
    { id:"settings", icon:"⚙️", label:"Settings"},
  ];

  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", display:"flex", flexDirection:"column", background:bg, fontFamily:"'Nunito',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Poppins:wght@400;500;600&family=Montserrat:wght@400;500;600&family=Open+Sans:wght@400;500;600&family=Caveat:wght@400;500;600;700&family=Patrick+Hand&family=Indie+Flower&family=Dancing+Script:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        [contenteditable]:focus{outline:none;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.3);border-radius:10px;}
        select option{background:#1a1a2e;}
        @keyframes dropIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        body{cursor:default!important;user-select:none;}
        [contenteditable]{cursor:text!important;user-select:text!important;}
        button,select{cursor:pointer!important;}
        input[type="text"],input[type="email"],input[type="password"],textarea{cursor:text!important;user-select:text!important;}
      `}</style>

      {/* TOP BAR */}
      <div style={{ height:60, display:"flex", alignItems:"center", padding:"0 20px", background:topbarBg, backdropFilter:"blur(20px)", borderBottom:dark?"1px solid rgba(255,255,255,0.05)":"1px solid rgba(0,0,0,0.05)", boxShadow:"0 2px 20px rgba(0,0,0,0.08)", zIndex:500, flexShrink:0, gap:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:22 }}>📒</span>
          <span style={{ fontWeight:900, fontSize:16, color:tp, letterSpacing:-0.3 }}>VisionBook</span>
        </div>
        <WeatherWidget city={user.city || user.state || user.country || "Surat"} darkMode={dark} />
        <div style={{ flex:1 }} />
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11, color:tm, fontWeight:600 }}>{dateStr}</div>
          <div style={{ fontSize:18, fontWeight:900, color:tp, letterSpacing:1.5, fontVariantNumeric:"tabular-nums" }}>{timeStr}</div>
        </div>
        <ProfileDropdown user={user} darkMode={dark} onLogout={handleLogout} onEdit={() => setShowEditProf(true)} onContactDev={() => setShowContactDev(true)} />
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* SIDEBAR */}
        <div style={{ width:settings.compact?58:196, flexShrink:0, transition:"width 0.3s", background:sidebarBg, backdropFilter:"blur(20px)", borderRight:dark?"1px solid rgba(255,255,255,0.05)":"1px solid rgba(0,0,0,0.05)", display:"flex", flexDirection:"column", paddingTop:14, overflow:"hidden" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActivePanel(item.id)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:settings.compact?"11px 0":"11px 18px", justifyContent:settings.compact?"center":"flex-start", border:"none", background:activePanel===item.id?dark?"rgba(99,102,241,0.18)":"rgba(99,102,241,0.1)":"transparent", color:activePanel===item.id?"#6366f1":tm, cursor:"pointer", borderRadius:"0 12px 12px 0", marginRight:8, marginBottom:3, transition:"all 0.18s", fontWeight:activePanel===item.id?800:600, fontSize:13, fontFamily:"'Nunito',sans-serif" }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              {!settings.compact && <span>{item.label}</span>}
            </button>
          ))}
          <div style={{ flex:1 }} />
          {activePanel==="notes" && !settings.compact && (
            <div style={{ padding:"0 18px 6px", fontSize:10, color:notes.length>=25?"#ef4444":tm, fontFamily:"'Nunito',sans-serif", fontWeight:700 }}>
              {notes.length}/25 notes {notes.length>=25&&"(max)"}
            </div>
          )}
          {activePanel==="notes" && (
            <div style={{ padding:settings.compact?"0 9px 14px":"0 12px 14px", display:"flex", justifyContent:"center" }}>
              <button onClick={addNote} disabled={notes.length>=25}
                style={{ width:settings.compact?40:"100%", height:38, borderRadius:12, background:notes.length>=25?dark?"#2a2a3e":"#e0e0e0":"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", color:notes.length>=25?"#888":"#fff", fontWeight:800, fontSize:settings.compact?20:13, cursor:notes.length>=25?"not-allowed":"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:notes.length>=25?"none":"0 4px 16px rgba(99,102,241,0.35)", transition:"all 0.2s" }}>
                {settings.compact?"+":" + New Note"}
              </button>
            </div>
          )}
          {!settings.compact && (
            <div style={{ padding:"10px 18px", borderTop:dark?"1px solid rgba(255,255,255,0.05)":"1px solid rgba(0,0,0,0.05)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:13, flexShrink:0 }}>{firstLetter(user.name)}</div>
                <div>
                  <div style={{ fontSize:11, fontWeight:800, color:"#6366f1" }}>{user.name}</div>
                  <div style={{ fontSize:9.5, color:tm }}>{user.city||"—"}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* WORKSPACE */}
        <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
          {activePanel==="notes" && (
            <div style={{ width:"100%", height:"100%", position:"relative" }}>
              <div style={{ position:"absolute", inset:0, opacity:dark?0.3:0.4, backgroundImage:"radial-gradient(circle, rgba(99,102,241,0.22) 1px, transparent 1px)", backgroundSize:"28px 28px", pointerEvents:"none" }} />
              {notes.length===0 && (
                <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center", color:tm, userSelect:"none", pointerEvents:"none" }}>
                  <div style={{ fontSize:52, marginBottom:12 }}>📌</div>
                  <div style={{ fontSize:16, fontWeight:800, color:tp }}>Workspace is empty</div>
                  <div style={{ fontSize:13, marginTop:6 }}>Click "+ New Note" to get started</div>
                </div>
              )}
              {notes.map(note => (
                <StickyNote key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} onDuplicate={duplicateNote} onBringToFront={bringToFront} darkMode={dark} />
              ))}
              <div style={{ position:"absolute", bottom:16, right:16, fontSize:11, color:tm, background:dark?"rgba(0,0,0,0.55)":"rgba(255,255,255,0.7)", backdropFilter:"blur(10px)", padding:"4px 12px", borderRadius:20, border:dark?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(0,0,0,0.06)", userSelect:"none" }}>
                {notes.length} / 25 notes
              </div>
            </div>
          )}
          {activePanel!=="notes" && (
            <div style={{ width:"100%", height:"100%", overflowY:"auto", padding:28 }}>
              <div style={{ maxWidth:620, margin:"0 auto" }}>
                <div style={{ background:dark?"rgba(18,18,34,0.9)":"rgba(255,255,255,0.88)", backdropFilter:"blur(20px)", borderRadius:20, border:dark?"1px solid rgba(255,255,255,0.07)":"1px solid rgba(0,0,0,0.06)", boxShadow:"0 8px 36px rgba(0,0,0,0.12)", overflow:"hidden" }}>
                  {activePanel==="todo"     && <TodoPanel    darkMode={dark} userEmail={user.email} />}
                  {activePanel==="journal"  && <JournalPanel darkMode={dark} userEmail={user.email} />}
                  {activePanel==="settings" && <SettingsPanel settings={settings} onSettings={setSettings} darkMode={dark} user={user} onUpdateUser={handleUpdateUser} />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditProf   && <EditProfileModal   user={user} darkMode={dark} onSave={handleUpdateUser} onClose={() => setShowEditProf(false)} />}
      {showContactDev && <ContactDevModal    darkMode={dark} onClose={() => setShowContactDev(false)} />}
    </div>
  );
}
