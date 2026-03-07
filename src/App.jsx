import { useState, useEffect, useRef, useCallback } from "react";

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const LS = {
    get: (k, fallback = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } },
    del: (k) => { try { localStorage.removeItem(k); } catch { } },
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const NOTE_COLORS = {
    yellow: { bg: "#FFF176", dark: "#F9A825", text: "#1a1a1a" },
    pink: { bg: "#F48FB1", dark: "#C2185B", text: "#1a1a1a" },
    blue: { bg: "#90CAF9", dark: "#1565C0", text: "#1a1a1a" },
    green: { bg: "#A5D6A7", dark: "#2E7D32", text: "#1a1a1a" },
    purple: { bg: "#CE93D8", dark: "#6A1B9A", text: "#1a1a1a" },
    orange: { bg: "#FFCC80", dark: "#E65100", text: "#1a1a1a" },
    white: { bg: "#FAFAFA", dark: "#9E9E9E", text: "#1a1a1a" },
    coral: { bg: "#FF8A80", dark: "#C62828", text: "#1a1a1a" },
};

const FONTS = [
    { label: "Poppins", value: "'Poppins', sans-serif" },
    { label: "Nunito", value: "'Nunito', sans-serif" },
    { label: "Montserrat", value: "'Montserrat', sans-serif" },
    { label: "Open Sans", value: "'Open Sans', sans-serif" },
    { label: "Caveat", value: "'Caveat', cursive" },
    { label: "Patrick Hand", value: "'Patrick Hand', cursive" },
    { label: "Indie Flower", value: "'Indie Flower', cursive" },
    { label: "Dancing Script", value: "'Dancing Script', cursive" },
];

const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan"];
const STATES = {
    India: ["Gujarat", "Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Rajasthan", "Punjab"],
    "United States": ["California", "New York", "Texas", "Florida", "Washington", "Illinois"],
    "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
    Canada: ["Ontario", "Quebec", "British Columbia", "Alberta"],
    Australia: ["New South Wales", "Victoria", "Queensland", "Western Australia"],
    Germany: ["Bavaria", "Berlin", "Hamburg", "Saxony"],
    France: ["Île-de-France", "Provence", "Normandy", "Brittany"],
    Japan: ["Tokyo", "Osaka", "Kyoto", "Hokkaido"],
};
const CITIES = {
    Gujarat: ["Surat", "Ahmedabad", "Vadodara", "Rajkot"], Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
    Karnataka: ["Bengaluru", "Mysuru", "Mangaluru"], "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
    Delhi: ["New Delhi", "Noida", "Gurgaon"], Rajasthan: ["Jaipur", "Jodhpur", "Udaipur"],
    Punjab: ["Amritsar", "Ludhiana", "Chandigarh"], California: ["Los Angeles", "San Francisco", "San Diego"],
    "New York": ["New York City", "Buffalo", "Albany"], Texas: ["Houston", "Austin", "Dallas"],
    Florida: ["Miami", "Orlando", "Tampa"], Washington: ["Seattle", "Spokane"],
    Illinois: ["Chicago", "Springfield"], England: ["London", "Manchester", "Birmingham"],
    Scotland: ["Edinburgh", "Glasgow"], Wales: ["Cardiff", "Swansea"],
    "Northern Ireland": ["Belfast"], Ontario: ["Toronto", "Ottawa"],
    Quebec: ["Montreal", "Quebec City"], "British Columbia": ["Vancouver", "Victoria"],
    Alberta: ["Calgary", "Edmonton"], "New South Wales": ["Sydney", "Newcastle"],
    Victoria: ["Melbourne", "Geelong"], Queensland: ["Brisbane", "Gold Coast"],
    "Western Australia": ["Perth", "Fremantle"], Bavaria: ["Munich", "Nuremberg"],
    Berlin: ["Berlin"], Hamburg: ["Hamburg"], Saxony: ["Dresden", "Leipzig"],
    "Île-de-France": ["Paris", "Versailles"], Provence: ["Marseille", "Nice"],
    Normandy: ["Rouen", "Caen"], Brittany: ["Rennes", "Brest"],
    Tokyo: ["Tokyo", "Shibuya", "Shinjuku"], Osaka: ["Osaka", "Sakai"],
    Kyoto: ["Kyoto", "Uji"], Hokkaido: ["Sapporo", "Hakodate"],
};

// ─── DDCET STRUCTURE ──────────────────────────────────────────────────────────
const DDCET_SUBJECTS = [
    {
        id: "math", label: "Mathematics", emoji: "➗", color: "#6366f1", gradFrom: "#4f46e5", gradTo: "#7c3aed",
        chapters: [
            { id: "ddcet_math_1", ch: 1, label: "Determinant & Matrices", emoji: "🔢", symbol: "det" },
            { id: "ddcet_math_2", ch: 2, label: "Trigonometry", emoji: "📐", symbol: "sin" },
            { id: "ddcet_math_3", ch: 3, label: "Vectors", emoji: "➡️", symbol: "→" },
            { id: "ddcet_math_4", ch: 4, label: "Coordinate Geometry", emoji: "📊", symbol: "xy" },
            { id: "ddcet_math_5", ch: 5, label: "Limit & Function", emoji: "∞", symbol: "lim" },
            { id: "ddcet_math_6", ch: 6, label: "Integration", emoji: "∫", symbol: "∫" },
            { id: "ddcet_math_7", ch: 7, label: "Differentiation & Applications", emoji: "𝑑", symbol: "dy" },
            { id: "ddcet_math_8", ch: 8, label: "Logarithm", emoji: "🔣", symbol: "log" },
            { id: "ddcet_math_9", ch: 9, label: "Statistics", emoji: "📈", symbol: "σ" },
        ],
    },
    {
        id: "physics", label: "Physics", emoji: "⚛️", color: "#0891b2", gradFrom: "#0891b2", gradTo: "#0e7490",
        chapters: [
            { id: "ddcet_phy_1", ch: 1, label: "Units & Measurement", emoji: "📏", symbol: "m" },
            { id: "ddcet_phy_2", ch: 2, label: "Classical Mechanics", emoji: "⚙️", symbol: "F" },
            { id: "ddcet_phy_3", ch: 3, label: "Electric Current", emoji: "⚡", symbol: "I" },
            { id: "ddcet_phy_4", ch: 4, label: "Heat & Thermometry", emoji: "🌡️", symbol: "T" },
            { id: "ddcet_phy_5", ch: 5, label: "Wave Motion, Optics & Acoustics", emoji: "🌊", symbol: "λ" },
        ],
    },
    {
        id: "chemistry", label: "Chemistry", emoji: "🧪", color: "#7c3aed", gradFrom: "#7c3aed", gradTo: "#6d28d9",
        chapters: [
            { id: "ddcet_chem_1", ch: 1, label: "Chemical Reactions & Equations", emoji: "🔬", symbol: "→" },
            { id: "ddcet_chem_2", ch: 2, label: "Acids, Bases & Salts", emoji: "⚗️", symbol: "pH" },
            { id: "ddcet_chem_3", ch: 3, label: "Metals & Non-metals", emoji: "🔩", symbol: "Fe" },
        ],
    },
    {
        id: "environment", label: "Environment", emoji: "🌿", color: "#15803d", gradFrom: "#15803d", gradTo: "#166534",
        chapters: [
            { id: "ddcet_env_1", ch: 1, label: "Ecosystem & Pollution Types", emoji: "🌱", symbol: "🌱" },
            { id: "ddcet_env_2", ch: 2, label: "Climate Change", emoji: "🌍", symbol: "CO₂" },
            { id: "ddcet_env_3", ch: 3, label: "Hydro / Solar / Wind / Bio-mass Energy", emoji: "☀️", symbol: "W" },
        ],
    },
    {
        id: "computer", label: "Computer", emoji: "💻", color: "#1d4ed8", gradFrom: "#1d4ed8", gradTo: "#1e40af",
        chapters: [
            { id: "ddcet_comp_1", ch: 1, label: "Computer Generations (1–5)", emoji: "🖥️", symbol: "Gen" },
            { id: "ddcet_comp_2", ch: 2, label: "HTML-5", emoji: "🌐", symbol: "</>" },
            { id: "ddcet_comp_3", ch: 3, label: "MS Word / Excel / PowerPoint", emoji: "📝", symbol: "📋" },
        ],
    },
    {
        id: "english", label: "English", emoji: "📖", color: "#be185d", gradFrom: "#be185d", gradTo: "#9d174d",
        chapters: [
            { id: "ddcet_eng_1", ch: 1, label: "Letter Writing", emoji: "✉️", symbol: "Dear" },
            { id: "ddcet_eng_2", ch: 2, label: "Passage", emoji: "📖", symbol: "¶" },
            { id: "ddcet_eng_3", ch: 3, label: "Theory of Communication", emoji: "🗣️", symbol: "📡" },
            { id: "ddcet_eng_4", ch: 4, label: "Grammar", emoji: "📝", symbol: "Aa" },
            { id: "ddcet_eng_5", ch: 5, label: "Correction of Words", emoji: "✏️", symbol: "✓" },
        ],
    },
];

// ─── SPORTS ARENA ─────────────────────────────────────────────────────────────
const SPORTS_SUBS = [
    { id: "cricket", label: "Cricket", emoji: "🏏", color: "#f59e0b", desc: "IPL, World Cup & more" },
    { id: "football", label: "Football", emoji: "⚽", color: "#ea580c", desc: "FIFA, EPL & more" },
    { id: "f1", label: "Formula 1", emoji: "🏎️", color: "#dc2626", desc: "Race to glory" },
    { id: "basketball", label: "Basketball", emoji: "🏀", color: "#f97316", desc: "NBA & global hoops" },
    { id: "tennis", label: "Tennis", emoji: "🎾", color: "#eab308", desc: "Grand Slams & rankings" },
];

// ─── STUDY ARENA ──────────────────────────────────────────────────────────────
const STUDY_SUBS = [
    { id: "math", label: "Mathematics", emoji: "➗", color: "#6366f1", desc: "Numbers & logic" },
    { id: "physics", label: "Physics", emoji: "⚛️", color: "#8b5cf6", desc: "Science of everything" },
    { id: "logic", label: "Logical Thinking", emoji: "🧩", color: "#a78bfa", desc: "Puzzles & reasoning" },
    { id: "iq", label: "IQ Test", emoji: "🧠", color: "#6366f1", desc: "Test your intellect" },
    { id: "geo", label: "Geometry", emoji: "📐", color: "#7c3aed", desc: "Shapes & space" },
];

const DIFFICULTY_CONFIG = {
    easy: { label: "Easy", emoji: "🟢", points: 5, color: "#22c55e", desc: "Beginner friendly" },
    moderate: { label: "Moderate", emoji: "🟡", points: 10, color: "#f59e0b", desc: "Intermediate level" },
    hard: { label: "Hard", emoji: "🔴", points: 15, color: "#ef4444", desc: "Expert challenge" },
};

// ─── QUESTION BANKS ───────────────────────────────────────────────────────────
const QUESTION_BANKS = {
    math: [], physics: [], logic: [], iq: [], geo: [],
    cricket: [], football: [], f1: [], basketball: [], tennis: [],
    ddcet_math_1: [], ddcet_math_2: [], ddcet_math_3: [], ddcet_math_4: [], ddcet_math_5: [],
    ddcet_math_6: [], ddcet_math_7: [], ddcet_math_8: [], ddcet_math_9: [],
    ddcet_phy_1: [], ddcet_phy_2: [], ddcet_phy_3: [], ddcet_phy_4: [], ddcet_phy_5: [],
    ddcet_chem_1: [], ddcet_chem_2: [], ddcet_chem_3: [],
    ddcet_env_1: [], ddcet_env_2: [], ddcet_env_3: [],
    ddcet_comp_1: [], ddcet_comp_2: [], ddcet_comp_3: [],
    ddcet_eng_1: [], ddcet_eng_2: [], ddcet_eng_3: [], ddcet_eng_4: [], ddcet_eng_5: [],
};

function pickQuestions(bankId, difficulty) {
    const pool = (QUESTION_BANKS[bankId] || []).filter(q => !difficulty || q.difficulty === difficulty);
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 20);
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const pad = (n) => String(n).padStart(2, "0");
const firstLetter = (name) => (name || "U").trim().charAt(0).toUpperCase();
const todayKey = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};

// ─── CLOCK ────────────────────────────────────────────────────────────────────
function useClock(fmt24 = false) {
    const [t, setT] = useState(new Date());
    useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dateStr = `${days[t.getDay()]}, ${t.getDate()} ${months[t.getMonth()]} ${t.getFullYear()}`;
    let h = t.getHours(), m = t.getMinutes(), s = t.getSeconds(), suf = "";
    if (!fmt24) { suf = h >= 12 ? " PM" : " AM"; h = h % 12 || 12; }
    return { dateStr, timeStr: `${pad(h)}:${pad(m)}:${pad(s)}${suf}` };
}

// ─── WEATHER ──────────────────────────────────────────────────────────────────
function decodeWMO(code) {
    if (code === 0) return { label: "Clear Sky", emoji: "☀️", condition: "Clear" };
    if (code <= 2) return { label: "Partly Cloudy", emoji: "⛅", condition: "Clouds" };
    if (code === 3) return { label: "Overcast", emoji: "☁️", condition: "Clouds" };
    if (code <= 49) return { label: "Fog", emoji: "🌫️", condition: "Fog" };
    if (code <= 57) return { label: "Drizzle", emoji: "🌦️", condition: "Drizzle" };
    if (code <= 67) return { label: "Rain", emoji: "🌧️", condition: "Rain" };
    if (code <= 77) return { label: "Snow", emoji: "❄️", condition: "Snow" };
    if (code <= 82) return { label: "Rain Showers", emoji: "🌦️", condition: "Rain" };
    if (code <= 99) return { label: "Thunderstorm", emoji: "⛈️", condition: "Thunderstorm" };
    return { label: "Unknown", emoji: "🌡️", condition: "Unknown" };
}

async function fetchWeather(city) {
    if (!city || !city.trim()) throw new Error("No city provided");
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json`);
    const geoData = await geoRes.json();
    if (!geoData.results?.length) throw new Error(`City "${city}" not found`);
    const { latitude, longitude, name, country_code } = geoData.results[0];
    const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh&temperature_unit=celsius&timezone=auto`);
    const wx = await wxRes.json();
    const cur = wx.current;
    const { label, emoji, condition } = decodeWMO(cur.weather_code);
    return { city: name, country: country_code || "", temp: Math.round(cur.temperature_2m), feels: Math.round(cur.apparent_temperature), humidity: cur.relative_humidity_2m, wind: Math.round(cur.wind_speed_10m), condition, description: label, emoji, updatedAt: Date.now() };
}

function useWeather(city) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const timerRef = useRef(null);
    const load = useCallback(async (c) => {
        if (!c) return;
        setLoading(true); setError(null);
        try { setWeather(await fetchWeather(c)); } catch (e) { setError(e.message); } finally { setLoading(false); }
    }, []);
    useEffect(() => {
        load(city);
        timerRef.current = setInterval(() => load(city), 60000);
        return () => clearInterval(timerRef.current);
    }, [city, load]);
    return { weather, loading, error };
}

// ─── WEATHER WIDGET ───────────────────────────────────────────────────────────
function WeatherWidget({ city, darkMode }) {
    const { weather, loading, error } = useWeather(city);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const tp = darkMode ? "#f0f0f0" : "#1a1a2e";
    const tm = darkMode ? "#888" : "#999";
    useEffect(() => {
        const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);
    return (
        <div ref={ref} style={{ position: "relative" }}>
            <div onClick={() => setOpen(o => !o)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.78)", border: darkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.05)", cursor: "pointer", userSelect: "none" }}>
                {loading && <span style={{ fontSize: 11, color: tm, fontFamily: "'Nunito',sans-serif" }}>Loading…</span>}
                {error && <span style={{ fontSize: 11, color: "#ef4444", fontFamily: "'Nunito',sans-serif" }}>⚠️ Weather</span>}
                {weather && !loading && (<>
                    <span style={{ fontSize: 17 }}>{weather.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif" }}>{weather.temp}°C</span>
                    <span style={{ fontSize: 11, color: tm, fontFamily: "'Nunito',sans-serif" }}>{weather.city}</span>
                </>)}
                {!weather && !loading && !error && <span style={{ fontSize: 11, color: tm }}>🌡️ Weather</span>}
            </div>
            {open && weather && (
                <div style={{ position: "absolute", top: 46, left: 0, width: 260, borderRadius: 18, background: darkMode ? "rgba(16,16,32,0.97)" : "rgba(255,255,255,0.97)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)"}`, boxShadow: "0 20px 56px rgba(0,0,0,0.35)", zIndex: 9999, overflow: "hidden", backdropFilter: "blur(20px)" }}>
                    <div style={{ padding: "16px 18px 12px", background: darkMode ? "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.15))" : "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))", borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"}` }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                                <div style={{ fontWeight: 900, fontSize: 15, color: tp, fontFamily: "'Nunito',sans-serif" }}>{weather.city}</div>
                                <div style={{ fontSize: 11, color: tm, fontFamily: "'Nunito',sans-serif" }}>{weather.description}</div>
                            </div>
                            <span style={{ fontSize: 44 }}>{weather.emoji}</span>
                        </div>
                        <div style={{ marginTop: 6 }}>
                            <span style={{ fontSize: 36, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif" }}>{weather.temp}°C</span>
                            <span style={{ fontSize: 12, color: tm, fontFamily: "'Nunito',sans-serif", marginLeft: 8 }}>Feels like {weather.feels}°C</span>
                        </div>
                    </div>
                    <div style={{ padding: "12px 18px 14px" }}>
                        {[["💧", "Humidity", `${weather.humidity}%`], ["💨", "Wind", `${weather.wind} km/h`]].map(([icon, label, val]) => (
                            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}` }}>
                                <span style={{ fontSize: 12, color: tm, fontFamily: "'Nunito',sans-serif" }}>{icon} {label}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: tp, fontFamily: "'Nunito',sans-serif" }}>{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── LEADERBOARD WIDGET (topbar) ─────────────────────────────────────────────
function LeaderboardWidget({ darkMode, userEmail }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const tp = darkMode ? "#f0f0f0" : "#1a1a2e";
    const tm = darkMode ? "#888" : "#999";

    useEffect(() => {
        const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    // Aggregate scores across all banks
    const allScores = [];
    [...SPORTS_SUBS, ...STUDY_SUBS].forEach(sub => {
        const lb = LS.get(`thinkly_arena_lb_${sub.id}`, []);
        lb.forEach(e => {
            const existing = allScores.find(x => x.name === e.name);
            if (existing) existing.score += e.score;
            else allScores.push({ name: e.name, score: e.score });
        });
    });
    allScores.sort((a, b) => b.score - a.score);
    const top5 = allScores.slice(0, 5);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <div onClick={() => setOpen(o => !o)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: darkMode ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", cursor: "pointer", userSelect: "none" }}>
                <span style={{ fontSize: 14 }}>🏅</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b", fontFamily: "'Nunito',sans-serif" }}>Leaderboard</span>
            </div>
            {open && (
                <div style={{ position: "absolute", top: 46, left: 0, width: 280, borderRadius: 18, background: darkMode ? "rgba(16,16,32,0.97)" : "rgba(255,255,255,0.97)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)"}`, boxShadow: "0 20px 56px rgba(0,0,0,0.35)", zIndex: 9999, overflow: "hidden", backdropFilter: "blur(20px)" }}>
                    <div style={{ padding: "14px 18px 10px", borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"}`, background: "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(251,191,36,0.08))" }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif" }}>🏅 Top Players</div>
                        <div style={{ fontSize: 10, color: tm, fontFamily: "'Nunito',sans-serif", marginTop: 2 }}>Combined quiz scores</div>
                    </div>
                    <div style={{ padding: "8px 0 12px" }}>
                        {top5.length === 0 ? (
                            <div style={{ padding: "20px 18px", textAlign: "center", fontSize: 12, color: tm, fontFamily: "'Nunito',sans-serif" }}>No scores yet — play a quiz!</div>
                        ) : top5.map((entry, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 18px" }}>
                                <span style={{ fontSize: i < 3 ? 20 : 12, fontWeight: 900, color: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : i === 2 ? "#b45309" : "#555", minWidth: 24, textAlign: "center" }}>
                                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                                </span>
                                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: tp, fontFamily: "'Nunito',sans-serif" }}>{entry.name}</span>
                                <span style={{ fontSize: 13, fontWeight: 900, color: "#f59e0b", fontFamily: "'Nunito',sans-serif" }}>{entry.score} pts</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── PROFILE DROPDOWN ─────────────────────────────────────────────────────────
function ProfileDropdown({ user, onLogout, onEdit, onContactDev, darkMode }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);
    const bg = darkMode ? "#16162a" : "#fff";
    const bdr = darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
    const txt = darkMode ? "#e0e0e0" : "#1a1a2e";
    const hvr = darkMode ? "rgba(255,255,255,0.06)" : "rgba(99,102,241,0.07)";
    return (
        <div ref={ref} style={{ position: "relative" }}>
            <div onClick={() => setOpen(o => !o)}
                style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 16, cursor: "pointer", userSelect: "none", boxShadow: open ? "0 0 0 3px rgba(99,102,241,0.45)" : "none", transition: "box-shadow 0.2s" }}>
                {firstLetter(user.nickname || user.name)}
            </div>
            {open && (
                <div style={{ position: "absolute", top: 46, right: 0, width: 230, background: bg, borderRadius: 16, border: `1px solid ${bdr}`, boxShadow: "0 20px 56px rgba(0,0,0,0.28)", zIndex: 9999, overflow: "hidden", animation: "dropIn 0.18s ease" }}>
                    <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${bdr}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 15, flexShrink: 0 }}>
                                {firstLetter(user.nickname || user.name)}
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 13, color: txt, fontFamily: "'Nunito',sans-serif" }}>{user.nickname || user.name}</div>
                                <div style={{ fontSize: 11, color: "#888", fontFamily: "'Nunito',sans-serif" }}>{user.email}</div>
                            </div>
                        </div>
                    </div>
                    {[{ icon: "✏️", label: "Edit Profile", fn: onEdit }, { icon: "🧑‍💻", label: "Contact Developer", fn: onContactDev }, { icon: "🚪", label: "Logout", fn: onLogout, danger: true }].map(item => (
                        <div key={item.label} onClick={() => { item.fn(); setOpen(false); }}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", cursor: "pointer", color: item.danger ? "#ef4444" : txt, fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 600, transition: "background 0.15s", background: "transparent" }}
                            onMouseEnter={e => e.currentTarget.style.background = item.danger ? "rgba(239,68,68,0.08)" : hvr}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── EDIT PROFILE MODAL ───────────────────────────────────────────────────────
function EditProfileModal({ user, onSave, onClose, darkMode }) {
    const [form, setForm] = useState({
        nickname: user.nickname || "", name: user.name || "",
        bio: user.bio || "", instagram: user.instagram || "",
        hobbies: user.hobbies || [],
        country: user.country || "", state: user.state || "", city: user.city || ""
    });
    const [newHobby, setNewHobby] = useState("");
    const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
    const bg = darkMode ? "#16162a" : "#fff";
    const bdr = darkMode ? "rgba(255,255,255,0.09)" : "#e8e8e8";
    const txt = darkMode ? "#f0f0f0" : "#1a1a2e";
    const inp = { width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${bdr}`, background: darkMode ? "rgba(255,255,255,0.05)" : "#f6f6f6", color: txt, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'Nunito',sans-serif", appearance: "none" };
    const lbl = { fontSize: 11, fontWeight: 800, color: "#888", marginBottom: 5, display: "block", fontFamily: "'Nunito',sans-serif", letterSpacing: 0.5, textTransform: "uppercase" };
    const bioWords = (form.bio || "").trim().split(/\s+/).filter(Boolean).length;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", overflowY: "auto" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ width: 440, background: bg, borderRadius: 22, padding: 32, boxShadow: "0 28px 80px rgba(0,0,0,0.4)", border: `1px solid ${bdr}`, animation: "dropIn 0.2s ease", margin: "20px auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 18, color: txt, margin: 0 }}>Edit Profile</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div><label style={lbl}>Nickname <span style={{ color: "#ef4444" }}>*</span></label><input style={inp} value={form.nickname} onChange={e => f("nickname")(e.target.value)} placeholder="Your nickname" /></div>
                    <div><label style={lbl}>Full Name <span style={{ color: "#ef4444" }}>*</span></label><input style={inp} value={form.name} onChange={e => f("name")(e.target.value)} placeholder="Your full name" /></div>
                    <div>
                        <label style={lbl}>Bio <span style={{ color: bioWords > 20 ? "#ef4444" : "#888", fontWeight: 700 }}>({bioWords}/20 words)</span></label>
                        <textarea style={{ ...inp, height: 68, resize: "none", lineHeight: 1.6 }} value={form.bio} onChange={e => f("bio")(e.target.value)} placeholder="Tell the world about yourself (max 20 words)..." />
                    </div>
                    <div><label style={lbl}>Instagram Handle</label><input style={inp} value={form.instagram} onChange={e => f("instagram")(e.target.value)} placeholder="@yourhandle (optional)" /></div>
                    <div>
                        <label style={lbl}>Hobbies</label>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                            <input value={newHobby} onChange={e => setNewHobby(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && newHobby.trim()) { f("hobbies")([...form.hobbies, newHobby.trim()]); setNewHobby(""); } }}
                                placeholder="Type a hobby & press Enter" style={{ ...inp, flex: 1 }} />
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {form.hobbies.map((h, i) => (
                                <span key={i} onClick={() => f("hobbies")(form.hobbies.filter((_, j) => j !== i))}
                                    style={{ padding: "4px 12px", borderRadius: 99, cursor: "pointer", background: "rgba(99,102,241,0.15)", color: "#a78bfa", fontSize: 11, fontWeight: 700, fontFamily: "'Nunito',sans-serif" }}>
                                    {h} ✕
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label style={lbl}>Country</label>
                        <select style={inp} value={form.country} onChange={e => { f("country")(e.target.value); f("state")(""); f("city")(""); }}>
                            <option value="">Select country</option>
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    {form.country && (<div><label style={lbl}>State</label><select style={inp} value={form.state} onChange={e => { f("state")(e.target.value); f("city")(""); }}><option value="">Select state</option>{(STATES[form.country] || []).map(s => <option key={s} value={s}>{s}</option>)}</select></div>)}
                    {form.state && (<div><label style={lbl}>City</label><select style={inp} value={form.city} onChange={e => f("city")(e.target.value)}><option value="">Select city</option>{(CITIES[form.state] || []).map(c => <option key={c} value={c}>{c}</option>)}</select></div>)}
                    <button onClick={() => { if (!form.nickname.trim() || !form.name.trim()) { alert("Nickname and Full Name are required."); return; } if (bioWords > 20) { alert("Bio must be 20 words or less."); return; } onSave(form); onClose(); }}
                        style={{ marginTop: 6, padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
                        Save Changes ✓
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── STUDENT PROFILE PAGE ─────────────────────────────────────────────────────
function StudentProfile({ user, darkMode, onEdit }) {
    const tp = darkMode ? "#f0f0f0" : "#1a1a2e";
    const tm = darkMode ? "#888" : "#999";
    const stats = LS.get(`thinkly_arena_stats_${user.email}`, { totalSessions: 0, totalPoints: 0, highestScore: 0, bestAccuracy: 0 });

    return (
        <div style={{ padding: "32px 32px 48px", maxWidth: 640, margin: "0 auto" }}>
            {/* Profile Card */}
            <div style={{ borderRadius: 24, overflow: "hidden", marginBottom: 24, background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.88)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`, boxShadow: "0 8px 36px rgba(99,102,241,0.1)" }}>
                {/* Header banner */}
                <div style={{ height: 90, background: "linear-gradient(135deg,#4f46e5,#7c3aed,#a78bfa)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                </div>
                <div style={{ padding: "0 28px 28px" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: -32, marginBottom: 20 }}>
                        <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 30, border: "3px solid " + (darkMode ? "#16162a" : "#fff"), boxShadow: "0 8px 28px rgba(99,102,241,0.5)", flexShrink: 0 }}>
                            {firstLetter(user.nickname || user.name)}
                        </div>
                        <div style={{ flex: 1, paddingBottom: 4 }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif" }}>{user.nickname || user.name}</div>
                            <div style={{ fontSize: 12, color: tm, fontFamily: "'Nunito',sans-serif" }}>{user.name}</div>
                        </div>
                        <button onClick={onEdit} style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.1)", color: "#6366f1", fontSize: 12, fontWeight: 800, fontFamily: "'Nunito',sans-serif", cursor: "pointer" }}>✏️ Edit</button>
                    </div>
                    {user.bio && <div style={{ fontSize: 14, color: tp, fontFamily: "'Caveat',cursive", lineHeight: 1.7, marginBottom: 14, padding: "10px 14px", borderRadius: 12, background: darkMode ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.05)", borderLeft: "3px solid #6366f1", fontStyle: "italic" }}>"{user.bio}"</div>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                        {user.instagram && <div style={{ fontSize: 13, color: "#e1306c", fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>📸 {user.instagram}</div>}
                        {user.city && <div style={{ fontSize: 12, color: tm, fontFamily: "'Nunito',sans-serif" }}>📍 {[user.city, user.state, user.country].filter(Boolean).join(", ")}</div>}
                        <div style={{ fontSize: 12, color: tm, fontFamily: "'Nunito',sans-serif" }}>✉️ {user.email}</div>
                    </div>
                    {user.hobbies?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                            {user.hobbies.map((h, i) => (
                                <span key={i} style={{ padding: "4px 14px", borderRadius: 99, background: "rgba(99,102,241,0.12)", color: "#a78bfa", fontSize: 12, fontWeight: 700, fontFamily: "'Nunito',sans-serif" }}>{h}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {[{ label: "Quizzes", val: stats.totalSessions, emoji: "🎮", color: "#6366f1" }, { label: "Points", val: stats.totalPoints, emoji: "💎", color: "#f59e0b" }, { label: "Best Score", val: stats.highestScore, emoji: "⭐", color: "#22c55e" }, { label: "Accuracy", val: `${stats.bestAccuracy}%`, emoji: "🎯", color: "#a78bfa" }].map(s => (
                    <div key={s.label} style={{ padding: "16px 12px", borderRadius: 16, textAlign: "center", background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.8)", border: darkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)" }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{s.emoji}</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: s.color, fontFamily: "'Nunito',sans-serif" }}>{s.val}</div>
                        <div style={{ fontSize: 10, color: tm, fontFamily: "'Nunito',sans-serif", marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── STICKY NOTE ─────────────────────────────────────────────────────────────
function StickyNote({ note, onUpdate, onDelete, onDuplicate, onBringToFront }) {
    const [dragging, setDragging] = useState(false);
    const [resizing, setResizing] = useState(false);
    const [editing, setEditing] = useState(false);
    const [showToolbar, setShowToolbar] = useState(false);
    const [showColors, setShowColors] = useState(false);
    const [showFonts, setShowFonts] = useState(false);
    const dragStart = useRef(null);
    const resizeStart = useRef(null);
    const color = NOTE_COLORS[note.color] || NOTE_COLORS.yellow;
    const onMouseDownDrag = (e) => {
        if (note.locked) return;
        e.preventDefault(); onBringToFront(note.id);
        dragStart.current = { mx: e.clientX, my: e.clientY, ox: note.x, oy: note.y }; setDragging(true);
    };
    const onMouseMoveDrag = useCallback((e) => {
        if (!dragging || !dragStart.current) return;
        onUpdate(note.id, { x: Math.max(0, dragStart.current.ox + e.clientX - dragStart.current.mx), y: Math.max(0, dragStart.current.oy + e.clientY - dragStart.current.my) });
    }, [dragging, note.id, onUpdate]);
    const onMouseDownResize = (e) => {
        e.preventDefault(); e.stopPropagation();
        resizeStart.current = { mx: e.clientX, my: e.clientY, ow: note.w, oh: note.h }; setResizing(true);
    };
    const onMouseMoveResize = useCallback((e) => {
        if (!resizing || !resizeStart.current) return;
        onUpdate(note.id, { w: Math.max(200, resizeStart.current.ow + e.clientX - resizeStart.current.mx), h: Math.max(160, resizeStart.current.oh + e.clientY - resizeStart.current.my) });
    }, [resizing, note.id, onUpdate]);
    const onMouseUp = useCallback(() => { setDragging(false); setResizing(false); }, []);
    useEffect(() => {
        if (dragging) { window.addEventListener("mousemove", onMouseMoveDrag); window.addEventListener("mouseup", onMouseUp); }
        return () => { window.removeEventListener("mousemove", onMouseMoveDrag); window.removeEventListener("mouseup", onMouseUp); };
    }, [dragging, onMouseMoveDrag, onMouseUp]);
    useEffect(() => {
        if (resizing) { window.addEventListener("mousemove", onMouseMoveResize); window.addEventListener("mouseup", onMouseUp); }
        return () => { window.removeEventListener("mousemove", onMouseMoveResize); window.removeEventListener("mouseup", onMouseUp); };
    }, [resizing, onMouseMoveResize, onMouseUp]);
    return (
        <div onMouseEnter={() => setShowToolbar(true)} onMouseLeave={() => { setShowToolbar(false); setShowColors(false); setShowFonts(false); }} onClick={() => onBringToFront(note.id)}
            style={{ position: "absolute", left: note.x, top: note.y, width: note.w, height: note.h, zIndex: note.zIndex, borderRadius: 16, background: color.bg, display: "flex", flexDirection: "column", overflow: "visible", userSelect: "none", fontFamily: note.font, transition: dragging || resizing ? "none" : "box-shadow 0.2s, transform 0.18s", transform: dragging ? "rotate(-1.5deg) scale(1.03)" : "rotate(0deg) scale(1)", boxShadow: dragging ? "0 28px 64px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.5)" : "0 6px 28px rgba(0,0,0,0.13), inset 0 1px 0 rgba(255,255,255,0.4)" }}>
            <div style={{ height: 6, background: color.dark, borderRadius: "16px 16px 0 0", flexShrink: 0 }} />
            <div onMouseDown={onMouseDownDrag} style={{ height: 32, cursor: note.locked ? "not-allowed" : dragging ? "grabbing" : "grab", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, background: "rgba(0,0,0,0.03)", borderBottom: `1px solid ${color.dark}22` }}>
                {[0, 1, 2, 3, 4, 5].map(i => <div key={i} style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: color.dark, opacity: 0.35 }} />)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "5px 10px", opacity: showToolbar ? 1 : 0, transition: "opacity 0.2s", flexShrink: 0, position: "relative" }}>
                <div style={{ position: "relative" }}>
                    <button onClick={e => { e.stopPropagation(); setShowColors(!showColors); setShowFonts(false); }} style={{ width: 17, height: 17, borderRadius: "50%", background: color.bg, border: `2px solid ${color.dark}`, cursor: "pointer" }} />
                    {showColors && (
                        <div style={{ position: "absolute", top: 24, left: 0, background: "#fff", borderRadius: 12, padding: 8, display: "flex", flexWrap: "wrap", gap: 4, width: 116, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", zIndex: 9990 }}>
                            {Object.entries(NOTE_COLORS).map(([k, v]) => (
                                <div key={k} onClick={e => { e.stopPropagation(); onUpdate(note.id, { color: k }); setShowColors(false); }} style={{ width: 20, height: 20, borderRadius: "50%", background: v.bg, border: note.color === k ? "2.5px solid #333" : "1px solid rgba(0,0,0,0.12)", cursor: "pointer" }} />
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ position: "relative" }}>
                    <button onClick={e => { e.stopPropagation(); setShowFonts(!showFonts); setShowColors(false); }} style={{ fontSize: 9, fontWeight: 800, padding: "2px 5px", borderRadius: 5, background: "rgba(0,0,0,0.1)", border: "none", cursor: "pointer", color: color.text }}>Aa</button>
                    {showFonts && (
                        <div style={{ position: "absolute", top: 24, left: 0, background: "#fff", borderRadius: 12, padding: 6, width: 158, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", zIndex: 9990 }}>
                            {FONTS.map(ft => <div key={ft.value} onClick={e => { e.stopPropagation(); onUpdate(note.id, { font: ft.value }); setShowFonts(false); }} style={{ padding: "6px 10px", fontFamily: ft.value, cursor: "pointer", borderRadius: 8, fontSize: 13, background: note.font === ft.value ? "rgba(99,102,241,0.1)" : "transparent", color: "#1a1a2e" }}>{ft.label}</div>)}
                        </div>
                    )}
                </div>
                <div style={{ flex: 1 }} />
                <button onClick={e => { e.stopPropagation(); onUpdate(note.id, { locked: !note.locked }); }} style={{ fontSize: 11, border: "none", background: "transparent", cursor: "pointer" }}>{note.locked ? "🔒" : "🔓"}</button>
                <button onClick={e => { e.stopPropagation(); onDuplicate(note.id); }} style={{ fontSize: 12, border: "none", background: "transparent", cursor: "pointer" }}>⧉</button>
                <button onClick={e => { e.stopPropagation(); onDelete(note.id); }} style={{ fontSize: 12, border: "none", background: "transparent", cursor: "pointer", color: "#c62828" }}>✕</button>
            </div>
            <div contentEditable={!note.locked} suppressContentEditableWarning onFocus={() => setEditing(true)} onBlur={e => { setEditing(false); onUpdate(note.id, { content: e.currentTarget.innerHTML }); }} style={{ flex: 1, padding: "2px 14px 14px", fontSize: 14, lineHeight: 1.65, color: color.text, fontFamily: note.font, outline: "none", overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", cursor: note.locked ? "default" : "text", userSelect: "text" }} dangerouslySetInnerHTML={{ __html: note.content }} />
            {!note.locked && (
                <div onMouseDown={onMouseDownResize} style={{ position: "absolute", right: 4, bottom: 4, width: 18, height: 18, cursor: "se-resize", opacity: showToolbar ? 0.55 : 0, transition: "opacity 0.2s" }}>
                    <svg viewBox="0 0 18 18" fill={color.dark}><path d="M13 7h2v2h-2zM10 10h2v2h-2zM13 10h2v2h-2zM7 13h2v2H7zM10 13h2v2h-2zM13 13h2v2h-2z" /></svg>
                </div>
            )}
        </div>
    );
}

// ─── TODO PANEL ───────────────────────────────────────────────────────────────
function TodoPanel({ darkMode, userEmail }) {
    const storageKey = `thinkly_todos_${userEmail}`;
    const [todos, setTodos] = useState(() => LS.get(storageKey, []));
    const [input, setInput] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    useEffect(() => { LS.set(storageKey, todos); }, [todos, storageKey]);
    const add = () => { if (!input.trim()) return; setTodos(p => [...p, { id: uid(), title: input.trim(), done: false, createdAt: new Date().toISOString() }]); setInput(""); };
    const saveEdit = (id) => { setTodos(p => p.map(t => t.id === id ? { ...t, title: editText.trim() || t.title } : t)); setEditingId(null); };
    const inpStyle = { flex: 1, padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #444" : "1px solid #e0e0e0", background: darkMode ? "#2a2a2a" : "#f5f5f5", color: darkMode ? "#fff" : "#1a1a2e", fontSize: 12.5, outline: "none", fontFamily: "'Nunito',sans-serif" };
    const done = todos.filter(t => t.done), active = todos.filter(t => !t.done);
    return (
        <div style={{ padding: "0 0 20px" }}>
            <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: darkMode ? "#aaa" : "#888", margin: "0 0 14px", padding: "16px 18px 0" }}>To-Do List</h3>
            <div style={{ padding: "0 18px", display: "flex", gap: 6, marginBottom: 12 }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Add a task..." style={inpStyle} />
                <button onClick={add} style={{ width: 30, height: 30, borderRadius: 8, background: "#6366f1", border: "none", color: "#fff", cursor: "pointer", fontSize: 18 }}>+</button>
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
                {active.length === 0 && <div style={{ padding: "8px 18px", fontSize: 12, color: darkMode ? "#555" : "#bbb", fontFamily: "'Nunito',sans-serif" }}>No active tasks 🎉</div>}
                {active.map(t => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderBottom: darkMode ? "1px solid #2a2a3e" : "1px solid #f0f0f0" }}>
                        <input type="checkbox" checked={t.done} onChange={() => setTodos(p => p.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} style={{ cursor: "pointer", accentColor: "#6366f1" }} />
                        {editingId === t.id ? (<>
                            <input value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit(t.id)} style={{ flex: 1, fontSize: 12.5, fontFamily: "'Nunito',sans-serif", background: "transparent", border: "none", borderBottom: "1px solid #6366f1", outline: "none", color: darkMode ? "#ddd" : "#333", padding: "2px 0" }} autoFocus />
                            <button onClick={() => saveEdit(t.id)} style={{ fontSize: 11, border: "none", background: "transparent", cursor: "pointer", color: "#6366f1", fontWeight: 700 }}>✓</button>
                            <button onClick={() => setEditingId(null)} style={{ fontSize: 11, border: "none", background: "transparent", cursor: "pointer", color: "#999" }}>✕</button>
                        </>) : (<>
                            <span style={{ flex: 1, fontSize: 12.5, fontFamily: "'Nunito',sans-serif", color: darkMode ? "#ddd" : "#333" }}>{t.title}</span>
                            <button onClick={() => { setEditingId(t.id); setEditText(t.title); }} style={{ fontSize: 11, border: "none", background: "transparent", cursor: "pointer", color: "#6366f1" }}>✏️</button>
                            <button onClick={() => setTodos(p => p.filter(x => x.id !== t.id))} style={{ fontSize: 11, border: "none", background: "transparent", cursor: "pointer", color: "#ef4444" }}>✕</button>
                        </>)}
                    </div>
                ))}
            </div>
            {done.length > 0 && (<>
                <div style={{ padding: "10px 18px 4px", fontSize: 11, fontWeight: 800, color: darkMode ? "#555" : "#bbb", fontFamily: "'Nunito',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>Completed ({done.length})</div>
                <div style={{ maxHeight: 150, overflowY: "auto" }}>
                    {done.map(t => (
                        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 18px", opacity: 0.6 }}>
                            <input type="checkbox" checked onChange={() => setTodos(p => p.map(x => x.id === t.id ? { ...x, done: false } : x))} style={{ cursor: "pointer", accentColor: "#6366f1" }} />
                            <span style={{ flex: 1, fontSize: 12, textDecoration: "line-through", color: darkMode ? "#888" : "#999", fontFamily: "'Nunito',sans-serif" }}>{t.title}</span>
                            <button onClick={() => setTodos(p => p.filter(x => x.id !== t.id))} style={{ fontSize: 11, border: "none", background: "transparent", cursor: "pointer", color: "#ef4444" }}>✕</button>
                        </div>
                    ))}
                </div>
                <div style={{ padding: "8px 18px" }}><button onClick={() => setTodos(p => p.filter(x => !x.done))} style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>Clear all completed</button></div>
            </>)}
        </div>
    );
}

// ─── JOURNAL PANEL ────────────────────────────────────────────────────────────
const JOURNAL_FONTS = [
    { label: "Caveat", value: "'Caveat', cursive", preview: "Handwritten" },
    { label: "Patrick Hand", value: "'Patrick Hand', cursive", preview: "Neat hand" },
    { label: "Nunito", value: "'Nunito', sans-serif", preview: "Clean" },
    { label: "Poppins", value: "'Poppins', sans-serif", preview: "Modern" },
];

function JournalPanel({ darkMode, userEmail }) {
    const today = todayKey();
    const baseKey = `thinkly_journal_${userEmail}`;
    const fontKey = `thinkly_journal_font_${userEmail}`;
    const [entries, setEntries] = useState(() => LS.get(baseKey, {}));
    const [selectedDate, setSelectedDate] = useState(today);
    const [content, setContent] = useState(() => (LS.get(baseKey, {}))[today] || "");
    const [saved, setSaved] = useState(true);
    const [journalFont, setJournalFont] = useState(() => LS.get(fontKey, "'Caveat', cursive"));
    const saveTimer = useRef(null);
    useEffect(() => { setContent(entries[selectedDate] || ""); setSaved(true); }, [selectedDate]);
    useEffect(() => { LS.set(fontKey, journalFont); }, [journalFont, fontKey]);
    const handleChange = (val) => {
        setContent(val); setSaved(false); clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            setEntries(prev => { const next = { ...prev, [selectedDate]: val }; LS.set(baseKey, next); return next; });
            setSaved(true);
        }, 1500);
    };
    const allDates = Object.keys(entries).filter(d => entries[d]?.trim()).sort((a, b) => b.localeCompare(a));
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const dark = darkMode;
    const selStyle = { width: "100%", padding: "9px 11px", borderRadius: 9, border: dark ? "1px solid #444" : "1px solid #ddd", background: dark ? "#2a2a2a" : "#f5f5f5", color: dark ? "#fff" : "#1a1a2e", fontSize: 12, outline: "none", fontFamily: "'Nunito',sans-serif", appearance: "none", cursor: "pointer" };
    return (
        <div style={{ padding: "0 0 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 0" }}>
                <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: dark ? "#aaa" : "#888", margin: 0 }}>Daily Journal</h3>
                <select value={journalFont} onChange={e => setJournalFont(e.target.value)} style={{ ...selStyle, width: "auto", fontSize: 11, padding: "4px 10px" }}>
                    {JOURNAL_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
            </div>
            <div style={{ padding: "10px 18px", display: "flex", gap: 10 }}>
                <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ ...selStyle, flex: 1 }}>
                    {!allDates.includes(today) && <option value={today}>📅 Today — {fmtDate(today)}</option>}
                    {allDates.map(d => <option key={d} value={d}>{d === today ? "📅 Today" : "📖 " + fmtDate(d)}</option>)}
                </select>
                <button onClick={() => setSelectedDate(today)} style={{ padding: "8px 12px", borderRadius: 9, background: "#6366f1", border: "none", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>Today</button>
            </div>
            <div style={{ padding: "0 18px" }}>
                <textarea value={content} onChange={e => handleChange(e.target.value)} disabled={selectedDate !== today} placeholder={selectedDate === today ? "Write your thoughts for today..." : "No entry for this day."} style={{ width: "100%", height: 220, padding: "12px 14px", borderRadius: 10, border: dark ? "1px solid #444" : "1px solid #e0e0e0", background: selectedDate !== today ? (dark ? "#1a1a2a" : "#f5f5f5") : dark ? "#2a2a2a" : "#fafafa", color: dark ? "#eee" : "#222", fontSize: 14, lineHeight: 1.75, resize: "none", outline: "none", fontFamily: journalFont, boxSizing: "border-box", opacity: selectedDate !== today ? 0.7 : 1 }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: dark ? "#666" : "#bbb", fontFamily: "'Nunito',sans-serif" }}>{words} words</span>
                    <span style={{ fontSize: 11, color: saved ? "#4ade80" : "#f59e0b", fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>{selectedDate !== today ? "Read-only 📖" : saved ? "✓ Saved" : "Saving…"}</span>
                </div>
            </div>
        </div>
    );
}

// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────
function SettingsPanel({ settings, onSettings, darkMode, user, onUpdateUser }) {
    const row = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: darkMode ? "1px solid #1e1e32" : "1px solid #f0f0f0" };
    const lbl = { fontSize: 13, fontFamily: "'Nunito',sans-serif", color: darkMode ? "#ddd" : "#444", fontWeight: 600 };
    const toggle = (key) => onSettings({ ...settings, [key]: !settings[key] });
    return (
        <div style={{ padding: "0 0 20px" }}>
            <h3 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: darkMode ? "#aaa" : "#888", margin: "0 0 4px", padding: "16px 18px 0" }}>Settings</h3>
            {[["Dark Mode", "darkMode"], ["24h Clock", "fmt24"], ["Compact Sidebar", "compact"]].map(([label, key]) => (
                <div key={key} style={row}>
                    <span style={lbl}>{label}</span>
                    <div onClick={() => toggle(key)} style={{ width: 38, height: 22, borderRadius: 11, background: settings[key] ? "#6366f1" : darkMode ? "#555" : "#d0d0d0", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                        <div style={{ position: "absolute", top: 3, left: settings[key] ? 18 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
                    </div>
                </div>
            ))}
            <div style={row}>
                <span style={lbl}>Default Note Color</span>
                <div style={{ display: "flex", gap: 5 }}>
                    {["yellow", "pink", "blue", "green", "orange", "purple"].map(c => (
                        <div key={c} onClick={() => onSettings({ ...settings, defaultColor: c })} style={{ width: 18, height: 18, borderRadius: "50%", background: NOTE_COLORS[c].bg, border: settings.defaultColor === c ? "2.5px solid #333" : "1px solid rgba(0,0,0,0.12)", cursor: "pointer" }} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── DDCET SECTION ────────────────────────────────────────────────────────────
function DDCETSection({ darkMode, user }) {
    const [selectedChapter, setSelectedChapter] = useState(null);
    const tp = darkMode ? "#f0f0f0" : "#1a1a2e";
    const tm = darkMode ? "#888" : "#999";

    if (selectedChapter) {
        const subj = DDCET_SUBJECTS.find(s => s.chapters.some(c => c.id === selectedChapter));
        const chap = subj?.chapters.find(c => c.id === selectedChapter);
        const qCount = (QUESTION_BANKS[selectedChapter] || []).length;
        return (
            <div style={{ padding: "32px 32px 48px", maxWidth: 600, margin: "0 auto" }}>
                <button onClick={() => setSelectedChapter(null)} style={{ padding: "8px 18px", borderRadius: 10, border: `1px solid ${subj?.color}44`, background: "transparent", color: subj?.color, fontSize: 12, fontWeight: 800, fontFamily: "'Nunito',sans-serif", cursor: "pointer", marginBottom: 28 }}>← Back to DDCET</button>
                <div style={{ textAlign: "center", padding: "36px", borderRadius: 22, background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.85)", border: `2px solid ${subj?.color}33`, marginBottom: 28 }}>
                    <div style={{ fontSize: 56, marginBottom: 12, animation: "float 3s ease-in-out infinite" }}>{chap?.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: subj?.color, fontFamily: "'Nunito',sans-serif", marginBottom: 8 }}>Ch. {chap?.ch} · {subj?.label}</div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif", margin: "0 0 8px" }}>{chap?.label}</h2>
                    <p style={{ fontSize: 13, color: tm, fontFamily: "'Nunito',sans-serif" }}>{qCount} questions available</p>
                </div>
                <div style={{ padding: "20px 22px", borderRadius: 18, background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.8)", border: darkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
                    {qCount === 0 ? (
                        <div>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: tp, fontFamily: "'Nunito',sans-serif", marginBottom: 6 }}>Questions Coming Soon</div>
                            <div style={{ fontSize: 12, color: tm, fontFamily: "'Nunito',sans-serif", lineHeight: 1.7 }}>
                                Add questions to <code style={{ background: "rgba(99,102,241,0.15)", padding: "2px 8px", borderRadius: 6, color: "#a78bfa", fontSize: 11 }}>QUESTION_BANKS["{selectedChapter}"]</code>
                            </div>
                        </div>
                    ) : (
                        <button style={{ padding: "14px 36px", borderRadius: 14, background: `linear-gradient(135deg,${subj?.gradFrom},${subj?.gradTo})`, border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
                            Start Quiz (20 Questions) 🚀
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: "32px 32px 48px" }}>
            <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: "#10b981", fontFamily: "'Nunito',sans-serif", marginBottom: 8 }}>🎓 DDCET PREPARATION</div>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif", margin: "0 0 8px", letterSpacing: -0.5 }}>
                    Chapter-wise <span style={{ background: "linear-gradient(135deg,#10b981,#0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Prep</span>
                </h1>
                <p style={{ fontSize: 13, color: tm, fontFamily: "'Nunito',sans-serif", margin: 0 }}>
                    {DDCET_SUBJECTS.reduce((a, s) => a + s.chapters.length, 0)} chapters across {DDCET_SUBJECTS.length} subjects
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                {DDCET_SUBJECTS.map(subj => (
                    <div key={subj.id}>
                        {/* Subject header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${subj.gradFrom},${subj.gradTo})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, boxShadow: `0 4px 14px ${subj.color}44` }}>{subj.emoji}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 16, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif" }}>{subj.label}</div>
                                <div style={{ fontSize: 11, color: subj.color, fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>{subj.chapters.length} chapters</div>
                            </div>
                            <div style={{ height: 1, flex: 2, background: `linear-gradient(90deg,${subj.color}44,transparent)` }} />
                        </div>
                        {/* Chapter cards */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10, paddingLeft: 8 }}>
                            {subj.chapters.map((chap, i) => {
                                const qCount = (QUESTION_BANKS[chap.id] || []).length;
                                const [hov, setHov] = useState(false);
                                return (
                                    <div key={chap.id} onClick={() => setSelectedChapter(chap.id)}
                                        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                                        style={{ padding: "14px 16px", borderRadius: 14, cursor: "pointer", position: "relative", overflow: "hidden", background: darkMode ? (hov ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)") : (hov ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)"), border: `1.5px solid ${hov ? subj.color + "88" : subj.color + "22"}`, transform: hov ? "translateY(-2px)" : "none", transition: "all 0.2s", boxShadow: hov ? `0 8px 28px ${subj.color}33` : "none", animation: `dropIn 0.2s ease ${i * 0.03}s both` }}>
                                        {hov && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${subj.gradFrom},${subj.gradTo})`, borderRadius: "14px 14px 0 0" }} />}
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: hov ? `linear-gradient(135deg,${subj.gradFrom}33,${subj.gradTo}11)` : `${subj.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{chap.emoji}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: subj.color, fontFamily: "'Nunito',sans-serif", marginBottom: 2 }}>Ch. {chap.ch}</div>
                                                <div style={{ fontSize: 12, fontWeight: 800, color: hov ? subj.color : tp, fontFamily: "'Nunito',sans-serif", lineHeight: 1.3 }}>{chap.label}</div>
                                            </div>
                                            {hov && <span style={{ fontSize: 14, color: subj.color, flexShrink: 0 }}>→</span>}
                                        </div>
                                        <div style={{ marginTop: 8, fontSize: 10, color: qCount > 0 ? "#22c55e" : tm, fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>
                                            {qCount > 0 ? `✓ ${qCount} questions ready` : "⏳ Questions coming soon"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── ARENA (Sports + Study) ───────────────────────────────────────────────────
function ArenaSection({ darkMode, user }) {
    const [tab, setTab] = useState("sports"); // "sports" | "study"
    const [activeSub, setActiveSub] = useState(null);
    const [activeDiff, setActiveDiff] = useState(null);
    const [screen, setScreen] = useState("home"); // "home" | "difficulty" | "quiz" | "result"
    const [quizResult, setQuizResult] = useState(null);

    const tp = darkMode ? "#f0f0f0" : "#1a1a2e";
    const tm = darkMode ? "#888" : "#999";

    const goHome = () => { setScreen("home"); setActiveSub(null); setActiveDiff(null); setQuizResult(null); };

    const handleSubSelect = (subId) => {
        setActiveSub(subId);
        if (tab === "sports") { setScreen("quiz"); } // no difficulty for sports
        else { setScreen("difficulty"); }
    };

    const handleComplete = (result) => { setQuizResult(result); setScreen("result"); };

    if (screen === "difficulty" && activeSub) {
        const sub = STUDY_SUBS.find(s => s.id === activeSub);
        return (
            <div style={{ padding: "32px 32px 48px", maxWidth: 480, margin: "0 auto" }}>
                <button onClick={goHome} style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#888", fontSize: 12, fontWeight: 800, fontFamily: "'Nunito',sans-serif", cursor: "pointer", marginBottom: 28 }}>← Back</button>
                <div style={{ textAlign: "center", padding: "28px", borderRadius: 20, background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 28 }}>
                    <div style={{ fontSize: 52, marginBottom: 10, animation: "float 3s ease-in-out infinite" }}>{sub?.emoji}</div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif", margin: "0 0 6px" }}>{sub?.label}</h2>
                    <p style={{ fontSize: 12, color: tm, fontFamily: "'Nunito',sans-serif", margin: 0 }}>20 questions will be selected randomly</p>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: tm, fontFamily: "'Nunito',sans-serif", marginBottom: 12, textAlign: "center" }}>CHOOSE DIFFICULTY</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                    {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => {
                        const [sel, setSel] = useState(false);
                        return (
                            <div key={key} onClick={() => { setActiveDiff(key); setScreen("quiz"); }}
                                style={{ padding: "18px 20px", borderRadius: 16, cursor: "pointer", border: `2px solid ${cfg.color}44`, background: darkMode ? `${cfg.color}11` : `${cfg.color}08`, transition: "all 0.2s" }}
                                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.01)"; e.currentTarget.style.boxShadow = `0 6px 24px ${cfg.color}44`; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${cfg.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{cfg.emoji}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 15, fontWeight: 900, color: cfg.color, fontFamily: "'Nunito',sans-serif" }}>{cfg.label}</div>
                                        <div style={{ fontSize: 12, color: tm, fontFamily: "'Nunito',sans-serif" }}>{cfg.desc} · <span style={{ color: cfg.color, fontWeight: 700 }}>{cfg.points} pts/question</span></div>
                                    </div>
                                    <span style={{ fontSize: 16, color: cfg.color }}>→</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (screen === "quiz" && activeSub) {
        const questions = pickQuestions(activeSub, activeDiff || null);
        const allSubs = [...SPORTS_SUBS, ...STUDY_SUBS];
        const sub = allSubs.find(s => s.id === activeSub);
        const cfg = activeDiff ? DIFFICULTY_CONFIG[activeDiff] : DIFFICULTY_CONFIG.moderate;
        const [qIdx, setQIdx] = useState(0);
        const [selected, setSelected] = useState(null);
        const [confirmed, setConfirmed] = useState(false);
        const [answers, setAnswers] = useState([]);
        const [elapsed, setElapsed] = useState(0);
        const timerRef = useRef(null);
        useEffect(() => { timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(timerRef.current); }, []);

        if (questions.length === 0) return (
            <div style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%" }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>📭</div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif", marginBottom: 8 }}>No Questions Yet</h2>
                <p style={{ fontSize: 13, color: tm, fontFamily: "'Nunito',sans-serif", marginBottom: 28, lineHeight: 1.7 }}>Questions for <strong>{sub?.label}</strong> are coming soon!</p>
                <button onClick={goHome} style={{ padding: "11px 26px", borderRadius: 12, border: "2px solid #6366f1", background: "transparent", color: "#6366f1", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>← Go Back</button>
            </div>
        );

        const q = questions[qIdx];
        const labels = ["A", "B", "C", "D"];
        const confirm = () => { if (!selected) return; setAnswers(p => [...p, { q: q.id, selected, correct: selected === q.answer }]); setConfirmed(true); };
        const next = () => {
            if (qIdx + 1 >= questions.length) {
                clearInterval(timerRef.current);
                const finalAnswers = [...answers, { q: q.id, selected, correct: selected === q.answer }];
                const correct = finalAnswers.filter(a => a.correct).length;
                handleComplete({ subId: activeSub, difficulty: activeDiff, questions, answers: finalAnswers, elapsed, correct });
            } else { setQIdx(p => p + 1); setSelected(null); setConfirmed(false); }
        };
        const getOptStyle = (opt) => {
            if (!confirmed) return { border: `2px solid ${selected === opt ? cfg.color : darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.09)"}`, background: selected === opt ? `${cfg.color}18` : darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.75)" };
            if (opt === q.answer) return { border: "2px solid #22c55e", background: "rgba(34,197,94,0.12)" };
            if (opt === selected) return { border: "2px solid #ef4444", background: "rgba(239,68,68,0.12)", opacity: 0.8 };
            return { border: `2px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`, background: darkMode ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.5)", opacity: 0.5 };
        };

        return (
            <div style={{ padding: "24px 28px", maxWidth: 620, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 18 }}>{sub?.emoji}</span><div style={{ fontSize: 13, fontWeight: 800, color: tp, fontFamily: "'Nunito',sans-serif" }}>{sub?.label}</div></div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ padding: "5px 12px", borderRadius: 99, background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", fontSize: 12, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif" }}>⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</div>
                        <div style={{ padding: "5px 12px", borderRadius: 99, background: `${cfg.color}22`, color: cfg.color, fontSize: 11, fontWeight: 900, fontFamily: "'Nunito',sans-serif" }}>{qIdx + 1}/{questions.length}</div>
                    </div>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: 20 }}>
                    <div style={{ height: "100%", width: `${(qIdx / questions.length) * 100}%`, borderRadius: 99, background: `linear-gradient(90deg,${cfg.color},${cfg.color}cc)`, transition: "width 0.4s ease" }} />
                </div>
                <div style={{ padding: "24px 22px", borderRadius: 18, marginBottom: 16, background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: cfg.color, fontFamily: "'Nunito',sans-serif", marginBottom: 8 }}>QUESTION {qIdx + 1}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: tp, fontFamily: "'Nunito',sans-serif", lineHeight: 1.6 }}>{q.question}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                    {q.options.map((opt, i) => (
                        <div key={i} onClick={() => !confirmed && setSelected(opt)}
                            style={{ padding: "14px 18px", borderRadius: 12, cursor: confirmed ? "default" : "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.18s", ...getOptStyle(opt) }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, fontFamily: "'Nunito',sans-serif", background: confirmed ? (opt === q.answer ? "#22c55e" : opt === selected ? "#ef4444" : "rgba(255,255,255,0.08)") : selected === opt ? cfg.color : "rgba(255,255,255,0.08)", color: confirmed ? (opt === q.answer || opt === selected ? "#fff" : "#666") : selected === opt ? "#fff" : "#888" }}>{labels[i]}</div>
                            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Nunito',sans-serif", color: confirmed ? (opt === q.answer ? "#22c55e" : opt === selected ? "#ef4444" : darkMode ? "#555" : "#aaa") : selected === opt ? cfg.color : tp }}>{opt}</span>
                            {confirmed && opt === q.answer && <span style={{ marginLeft: "auto", fontSize: 16 }}>✅</span>}
                            {confirmed && opt === selected && opt !== q.answer && <span style={{ marginLeft: "auto", fontSize: 16 }}>❌</span>}
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    {!confirmed ? (
                        <button onClick={confirm} disabled={!selected} style={{ padding: "11px 26px", borderRadius: 12, border: `2px solid ${cfg.color}`, background: selected ? cfg.color : "transparent", color: selected ? "#fff" : cfg.color, fontSize: 13, fontWeight: 800, cursor: selected ? "pointer" : "not-allowed", fontFamily: "'Nunito',sans-serif", opacity: selected ? 1 : 0.5 }}>Confirm Answer →</button>
                    ) : (
                        <button onClick={next} style={{ padding: "11px 26px", borderRadius: 12, border: `2px solid ${cfg.color}`, background: cfg.color, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>{qIdx + 1 < questions.length ? "Next Question →" : "See Results 🎉"}</button>
                    )}
                </div>
            </div>
        );
    }

    if (screen === "result" && quizResult) {
        const cfg = quizResult.difficulty ? DIFFICULTY_CONFIG[quizResult.difficulty] : DIFFICULTY_CONFIG.moderate;
        const { correct, questions, elapsed } = quizResult;
        const total = questions.length, wrong = total - correct;
        const accuracy = Math.round((correct / total) * 100);
        const score = correct * cfg.points;
        const grade = accuracy === 100 ? { label: "PERFECT! 🌟", color: "#f59e0b" } : accuracy >= 80 ? { label: "Excellent! 🎯", color: "#22c55e" } : accuracy >= 60 ? { label: "Good Job! 👍", color: "#6366f1" } : { label: "Keep Going 💪", color: "#f59e0b" };
        useEffect(() => {
            const stats = LS.get(`thinkly_arena_stats_${user.email}`, { totalSessions: 0, totalPoints: 0, highestScore: 0, bestAccuracy: 0 });
            stats.totalSessions++; stats.totalPoints += score; stats.highestScore = Math.max(stats.highestScore, score); stats.bestAccuracy = Math.max(stats.bestAccuracy, accuracy);
            LS.set(`thinkly_arena_stats_${user.email}`, stats);
            const lb = LS.get(`thinkly_arena_lb_${quizResult.subId}`, []);
            lb.push({ name: user.nickname || user.name, score, accuracy, date: new Date().toLocaleDateString() });
            lb.sort((a, b) => b.score - a.score);
            LS.set(`thinkly_arena_lb_${quizResult.subId}`, lb.slice(0, 20));
        }, []);
        return (
            <div style={{ padding: "32px 28px 48px", maxWidth: 560, margin: "0 auto" }}>
                <div style={{ textAlign: "center", padding: "28px", borderRadius: 22, marginBottom: 24, background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.85)", border: `2px solid ${grade.color}44`, boxShadow: `0 16px 56px ${grade.color}22`, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg,${cfg.color},${grade.color})` }} />
                    <div style={{ fontSize: 26, fontWeight: 900, color: grade.color, fontFamily: "'Nunito',sans-serif", marginBottom: 8 }}>{grade.label}</div>
                    <div style={{ fontSize: 52, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif", letterSpacing: -2 }}>{score}</div>
                    <div style={{ fontSize: 12, color: tm, fontFamily: "'Nunito',sans-serif" }}>points earned</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
                    {[{ label: "Correct", val: correct, color: "#22c55e", emoji: "✅" }, { label: "Wrong", val: wrong, color: "#ef4444", emoji: "❌" }, { label: "Accuracy", val: `${accuracy}%`, color: grade.color, emoji: "🎯" }, { label: "Time", val: `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`, color: "#6366f1", emoji: "⏱" }].map(s => (
                        <div key={s.label} style={{ padding: "12px 8px", borderRadius: 14, textAlign: "center", background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.8)", border: darkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)" }}>
                            <div style={{ fontSize: 16, marginBottom: 4 }}>{s.emoji}</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: "'Nunito',sans-serif" }}>{s.val}</div>
                            <div style={{ fontSize: 10, color: tm, fontFamily: "'Nunito',sans-serif" }}>{s.label}</div>
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button onClick={() => { setScreen("quiz"); setActiveSub(quizResult.subId); }} style={{ padding: "11px 22px", borderRadius: 12, border: `2px solid ${cfg.color}`, background: cfg.color, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>🔄 Play Again</button>
                    <button onClick={goHome} style={{ padding: "11px 22px", borderRadius: 12, border: "2px solid #6366f1", background: "transparent", color: "#6366f1", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>🏠 Arena Home</button>
                </div>
            </div>
        );
    }

    // Home screen
    const subs = tab === "sports" ? SPORTS_SUBS : STUDY_SUBS;
    return (
        <div style={{ padding: "32px 32px 48px" }}>
            <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: "#6366f1", fontFamily: "'Nunito',sans-serif", marginBottom: 8 }}>⚡ KNOWLEDGE ARENA</div>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif", margin: "0 0 6px", letterSpacing: -0.5 }}>
                    Test Your <span style={{ background: "linear-gradient(135deg,#6366f1,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Limits</span>
                </h1>
                <p style={{ fontSize: 13, color: tm, fontFamily: "'Nunito',sans-serif", margin: 0 }}>Sports quiz & academic study challenges</p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderRadius: 14, padding: 4, gap: 4, marginBottom: 28, width: "fit-content" }}>
                {[{ id: "sports", label: "🏆 Sports", color: "#f59e0b" }, { id: "study", label: "📚 Study", color: "#6366f1" }].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        style={{ padding: "9px 24px", borderRadius: 11, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "'Nunito',sans-serif", background: tab === t.id ? (darkMode ? "rgba(255,255,255,0.12)" : "#fff") : "transparent", color: tab === t.id ? t.color : tm, transition: "all 0.2s", boxShadow: tab === t.id ? "0 2px 10px rgba(0,0,0,0.1)" : "none" }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "study" && (
                <div style={{ padding: "12px 16px", borderRadius: 12, background: darkMode ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 12, color: "#f59e0b", fontFamily: "'Nunito',sans-serif", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>💡</span> Study quizzes include Easy / Moderate / Hard difficulty levels
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
                {subs.map((sub, i) => {
                    const [hov, setHov] = useState(false);
                    return (
                        <div key={sub.id} onClick={() => handleSubSelect(sub.id)}
                            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                            style={{ borderRadius: 20, padding: "22px 20px", cursor: "pointer", position: "relative", overflow: "hidden", background: darkMode ? (hov ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)") : (hov ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.75)"), border: `1.5px solid ${hov ? sub.color + "88" : sub.color + "33"}`, transform: hov ? "translateY(-5px) scale(1.01)" : "translateY(0)", boxShadow: hov ? `0 16px 48px ${sub.color}44` : "none", transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)", animation: `dropIn 0.25s ease ${i * 0.06}s both` }}>
                            {hov && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${sub.color},${sub.color}88)` }} />}
                            <div style={{ fontSize: 36, marginBottom: 12, display: "inline-block", transform: hov ? "scale(1.1)" : "scale(1)", transition: "transform 0.2s", filter: hov ? `drop-shadow(0 4px 12px ${sub.color}88)` : "none" }}>{sub.emoji}</div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: hov ? sub.color : tp, fontFamily: "'Nunito',sans-serif", marginBottom: 4 }}>{sub.label}</div>
                            <div style={{ fontSize: 11, color: tm, fontFamily: "'Nunito',sans-serif", marginBottom: 10 }}>{sub.desc}</div>
                            <div style={{ fontSize: 11, color: sub.color, fontWeight: 800, fontFamily: "'Nunito',sans-serif" }}>{hov ? "Let's Play! →" : "Start Quiz"}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── CONTACT DEVELOPER SECTION ────────────────────────────────────────────────
function ContactDeveloper({ darkMode }) {
    const tp = darkMode ? "#f0f0f0" : "#1a1a2e";
    const tm = darkMode ? "#888" : "#999";
    const links = [
        { icon: "🐙", label: "GitHub", url: "https://github.com/miteshpipaliya", color: "#333", sub: "github.com/miteshpipaliya" },
        { icon: "💼", label: "LinkedIn", url: "https://www.linkedin.com/in/mitesh-pipaliya-225889288/", color: "#0077b5", sub: "Mitesh Pipaliya" },
        { icon: "🐦", label: "X (Twitter)", url: "https://x.com/InfoSecMitesh", color: "#1da1f2", sub: "@InfoSecMitesh" },
        { icon: "✉️", label: "Email", url: "mailto:miteshpipaliya2202@gmail.com", color: "#ea4335", sub: "miteshpipaliya2202@gmail.com" },
    ];
    return (
        <div style={{ padding: "48px 32px", borderTop: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", background: darkMode ? "rgba(0,0,0,0.3)" : "rgba(99,102,241,0.02)" }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: "#6366f1", fontFamily: "'Nunito',sans-serif", marginBottom: 8 }}>👨‍💻 DEVELOPER</div>
                    <h2 style={{ fontSize: 26, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif", margin: "0 0 6px" }}>Contact the Developer</h2>
                    <p style={{ fontSize: 13, color: tm, fontFamily: "'Nunito',sans-serif", margin: 0 }}>Have feedback, suggestions, or want to collaborate? Reach out!</p>
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ width: 80, height: 80, borderRadius: 22, background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 12px", boxShadow: "0 10px 32px rgba(99,102,241,0.5)" }}>M</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: tp, fontFamily: "'Nunito',sans-serif" }}>Mitesh Pipaliya</div>
                        <div style={{ fontSize: 12, color: tm, fontFamily: "'Nunito',sans-serif", marginTop: 3 }}>Full Stack Developer</div>
                    </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                    {links.map(l => (
                        <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14, border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)", background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.8)", textDecoration: "none", transition: "all 0.18s" }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${l.color}15`, border: `1px solid ${l.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{l.icon}</div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: tp, fontFamily: "'Nunito',sans-serif" }}>{l.label}</div>
                                <div style={{ fontSize: 11, color: tm, fontFamily: "'Nunito',sans-serif", marginTop: 2 }}>{l.sub}</div>
                            </div>
                            <span style={{ marginLeft: "auto", fontSize: 14, color: l.color }}>↗</span>
                        </a>
                    ))}
                </div>
                <div style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: tm, fontFamily: "'Nunito',sans-serif" }}>
                    Built with ❤️ by Mitesh Pipaliya · Thinkly v2.0
                </div>
            </div>
        </div>
    );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
    const [mode, setMode] = useState("login");
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ nickname: "", name: "", email: "", password: "", country: "", state: "", city: "" });
    const fv = (k) => (v) => { setForm(p => ({ ...p, [k]: v })); setError(""); };
    const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const handleLogin = () => {
        if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
        if (!validateEmail(form.email)) { setError("Enter a valid email."); return; }
        setLoading(true);
        setTimeout(() => {
            const users = LS.get("thinkly_users", []);
            const found = users.find(u => u.email.toLowerCase() === form.email.toLowerCase() && u.password === form.password);
            if (found) { LS.set("thinkly_session", found.email); onLogin(found); }
            else {
                const exists = users.find(u => u.email.toLowerCase() === form.email.toLowerCase());
                setError(exists ? "Incorrect password." : "No account found. Please register first.");
            }
            setLoading(false);
        }, 700);
    };

    const handleRegister = () => {
        if (!form.nickname || !form.name || !form.email || !form.password) { setError("Please fill all required fields."); return; }
        if (!validateEmail(form.email)) { setError("Enter a valid email."); return; }
        if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) { setError("Password: min 8 chars, 1 uppercase, 1 number."); return; }
        const users = LS.get("thinkly_users", []);
        if (users.find(u => u.email.toLowerCase() === form.email.toLowerCase())) { setError("Email already registered."); return; }
        setLoading(true);
        setTimeout(() => {
            const nu = { ...form };
            LS.set("thinkly_users", [...users, nu]);
            LS.set("thinkly_session", nu.email);
            onLogin(nu);
            setLoading(false);
        }, 700);
    };

    const inpS = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.11)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'Nunito',sans-serif" };
    const lblS = { fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 5, display: "block", fontFamily: "'Nunito',sans-serif", letterSpacing: 0.7, textTransform: "uppercase" };

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)", fontFamily: "'Nunito',sans-serif", position: "relative", overflow: "hidden" }}>
            <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}} @keyframes dropIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
            {[{ t: "-10%", l: "-5%", s: 420, c: "rgba(99,102,241,0.18)" }, { b: "-10%", r: "-5%", s: 360, c: "rgba(244,143,177,0.12)" }].map((b, i) => (
                <div key={i} style={{ position: "absolute", borderRadius: "50%", width: b.s, height: b.s, background: b.c, top: b.t, left: b.l, bottom: b.b, right: b.r, filter: "blur(60px)", pointerEvents: "none", animation: `float ${3 + i}s ease-in-out infinite` }} />
            ))}
            <div style={{ width: 440, background: "rgba(255,255,255,0.05)", backdropFilter: "blur(24px)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 32px 80px rgba(0,0,0,0.45)", padding: 40, position: "relative", zIndex: 1 }}>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <div style={{ fontSize: 48, marginBottom: 6 }}>🧠</div>
                    <h1 style={{ fontSize: 30, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: -0.5 }}>Thinkly</h1>
                    <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.42)", margin: "6px 0 0" }}>Your smart thinking & learning workspace</p>
                </div>
                <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
                    {[["login", "Log In"], ["register", "Register"]].map(([m, lbl]) => (
                        <button key={m} onClick={() => { setMode(m); setStep(1); setError(""); }} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "'Nunito',sans-serif", background: mode === m ? "rgba(255,255,255,0.14)" : "transparent", color: mode === m ? "#fff" : "rgba(255,255,255,0.38)", transition: "all 0.2s" }}>{lbl}</button>
                    ))}
                </div>
                {error && <div style={{ background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#fca5a5", fontFamily: "'Nunito',sans-serif" }}>⚠️ {error}</div>}
                {mode === "login" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                        <div><label style={lblS}>Email</label><input placeholder="your@email.com" style={inpS} value={form.email} onChange={e => fv("email")(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
                        <div><label style={lblS}>Password</label><input type="password" placeholder="••••••••" style={inpS} value={form.password} onChange={e => fv("password")(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
                        <button onClick={handleLogin} disabled={loading} style={{ padding: "13px", borderRadius: 12, background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: loading ? "wait" : "pointer" }}>{loading ? "Logging in…" : "Log In →"}</button>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center", fontFamily: "'Nunito',sans-serif", margin: 0 }}>Don't have an account? <span onClick={() => { setMode("register"); setError(""); }} style={{ color: "#a78bfa", cursor: "pointer", fontWeight: 700 }}>Register here</span></p>
                    </div>
                )}
                {mode === "register" && step === 1 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>Step 1 of 2 — Your account</p>
                        <div><label style={lblS}>Nickname <span style={{ color: "#f87171" }}>*</span></label><input placeholder="Your nickname" style={inpS} value={form.nickname} onChange={e => fv("nickname")(e.target.value)} /></div>
                        <div><label style={lblS}>Full Name <span style={{ color: "#f87171" }}>*</span></label><input placeholder="Your full name" style={inpS} value={form.name} onChange={e => fv("name")(e.target.value)} /></div>
                        <div><label style={lblS}>Email <span style={{ color: "#f87171" }}>*</span></label><input placeholder="your@email.com" style={inpS} value={form.email} onChange={e => fv("email")(e.target.value)} /></div>
                        <div><label style={lblS}>Password <span style={{ color: "#f87171" }}>*</span></label><input type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" style={inpS} value={form.password} onChange={e => fv("password")(e.target.value)} /></div>
                        <button onClick={() => {
                            if (!form.nickname || !form.name || !form.email || !form.password) { setError("Please fill all fields."); return; }
                            if (!validateEmail(form.email)) { setError("Enter a valid email."); return; }
                            if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) { setError("Password: min 8 chars, 1 uppercase, 1 number."); return; }
                            const users = LS.get("thinkly_users", []);
                            if (users.find(u => u.email.toLowerCase() === form.email.toLowerCase())) { setError("Email already registered."); return; }
                            setError(""); setStep(2);
                        }} style={{ padding: "13px", borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Continue →</button>
                    </div>
                )}
                {mode === "register" && step === 2 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>Step 2 of 2 — Location (optional)</p>
                        <div><label style={lblS}>Country</label><select value={form.country} onChange={e => { fv("country")(e.target.value); fv("state")(""); fv("city")(""); }} style={{ ...inpS, appearance: "none" }}><option value="">Select country</option>{COUNTRIES.map(c => <option key={c} value={c} style={{ background: "#302b63" }}>{c}</option>)}</select></div>
                        {form.country && <div><label style={lblS}>State</label><select value={form.state} onChange={e => { fv("state")(e.target.value); fv("city")(""); }} style={{ ...inpS, appearance: "none" }}><option value="">Select state</option>{(STATES[form.country] || []).map(s => <option key={s} value={s} style={{ background: "#302b63" }}>{s}</option>)}</select></div>}
                        {form.state && <div><label style={lblS}>City</label><select value={form.city} onChange={e => fv("city")(e.target.value)} style={{ ...inpS, appearance: "none" }}><option value="">Select city</option>{(CITIES[form.state] || []).map(c => <option key={c} value={c} style={{ background: "#302b63" }}>{c}</option>)}</select></div>}
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setStep(1)} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer" }}>← Back</button>
                            <button onClick={handleRegister} disabled={loading} style={{ flex: 2, padding: "12px", borderRadius: 12, background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontSize: 13, fontWeight: 800, cursor: loading ? "wait" : "pointer" }}>{loading ? "Creating…" : "Create Account ✓"}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
    const [user, setUser] = useState(null);
    const [notes, setNotes] = useState([]);
    const [activePanel, setActivePanel] = useState("notes");
    const [showEditProf, setShowEditProf] = useState(false);
    const [showContactDev, setShowContactDev] = useState(false);
    const [maxZ, setMaxZ] = useState(10);
    const [settings, setSettings] = useState(() => LS.get("thinkly_settings", { darkMode: true, fmt24: false, compact: false, defaultColor: "yellow" }));

    const dark = settings.darkMode;
    const { dateStr, timeStr } = useClock(settings.fmt24);

    useEffect(() => { document.title = "Thinkly — Think. Learn. Grow."; }, []);

    useEffect(() => {
        const savedEmail = LS.get("thinkly_session");
        if (savedEmail) {
            const users = LS.get("thinkly_users", []);
            const found = users.find(u => u.email === savedEmail);
            if (found) setUser(found);
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        const saved = LS.get(`thinkly_notes_${user.email}`, null);
        setNotes(saved || [
            { id: "n1", content: "☕ Morning routine\n• Wake up 6am\n• Meditate 10 min\n• Journal thoughts", color: "yellow", font: "'Caveat', cursive", x: 80, y: 100, w: 240, h: 200, locked: false, zIndex: 1 },
            { id: "n2", content: "📚 Study goals\nFinish React chapter\nPractice TypeScript", color: "blue", font: "'Poppins', sans-serif", x: 360, y: 80, w: 220, h: 180, locked: false, zIndex: 2 },
            { id: "n3", content: "💡 App idea\nVoice-to-text notes\nAI summarizer", color: "green", font: "'Nunito', sans-serif", x: 620, y: 130, w: 230, h: 170, locked: false, zIndex: 3 },
        ]);
    }, [user]);

    useEffect(() => { if (user) LS.set(`thinkly_notes_${user.email}`, notes); }, [notes, user]);
    useEffect(() => { LS.set("thinkly_settings", settings); }, [settings]);

    const handleUpdateUser = (updated) => {
        setUser(updated);
        const users = LS.get("thinkly_users", []);
        LS.set("thinkly_users", users.map(u => u.email === updated.email ? { ...u, ...updated } : u));
    };

    const bg = dark ? "linear-gradient(160deg,#09091a 0%,#111128 40%,#0d1a2e 100%)" : "linear-gradient(160deg,#e8eaf6 0%,#ede7f6 30%,#e3f2fd 60%,#e8f5e9 100%)";
    const sidebarBg = dark ? "rgba(12,12,26,0.97)" : "rgba(255,255,255,0.88)";
    const topbarBg = dark ? "rgba(12,12,26,0.93)" : "rgba(255,255,255,0.8)";
    const tp = dark ? "#f0f0f0" : "#1a1a2e";
    const tm = dark ? "#666" : "#999";

    const addNote = () => {
        if (notes.length >= 25) { alert("Maximum 25 notes reached!"); return; }
        const nz = maxZ + 1; setMaxZ(nz);
        setNotes(p => [...p, { id: uid(), content: "New note ✏️\nStart writing here...", color: settings.defaultColor, font: "'Nunito', sans-serif", x: 60 + Math.random() * 300, y: 60 + Math.random() * 180, w: 240, h: 200, locked: false, zIndex: nz }]);
    };
    const updateNote = useCallback((id, patch) => setNotes(p => p.map(n => n.id === id ? { ...n, ...patch } : n)), []);
    const deleteNote = useCallback((id) => setNotes(p => p.filter(n => n.id !== id)), []);
    const duplicateNote = useCallback((id) => {
        if (notes.length >= 25) return;
        const n = notes.find(x => x.id === id); if (!n) return;
        const nz = maxZ + 1; setMaxZ(nz);
        setNotes(p => [...p, { ...n, id: uid(), x: n.x + 24, y: n.y + 24, zIndex: nz }]);
    }, [notes, maxZ]);
    const bringToFront = useCallback((id) => {
        const nz = maxZ + 1; setMaxZ(nz);
        setNotes(p => p.map(n => n.id === id ? { ...n, zIndex: nz } : n));
    }, [maxZ]);
    const handleLogout = () => { LS.del("thinkly_session"); setUser(null); setNotes([]); };

    if (!user) return <AuthScreen onLogin={setUser} />;

    const navItems = [
        { id: "notes", icon: "📌", label: "Notes" },
        { id: "todo", icon: "✅", label: "To-Do" },
        { id: "journal", icon: "📖", label: "Journal" },
        { id: "arena", icon: "⚡", label: "Arena" },
        { id: "ddcet", icon: "🎓", label: "DDCET" },
        { id: "profile", icon: "👤", label: "Profile" },
        { id: "settings", icon: "⚙️", label: "Settings" },
    ];

    const showContactBottom = ["notes", "arena", "ddcet", "profile"].includes(activePanel);

    return (
        <div style={{ width: "100vw", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", background: bg, fontFamily: "'Nunito',sans-serif" }}>
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
        input,textarea{cursor:text!important;user-select:text!important;}
      `}</style>

            {/* TOP BAR */}
            <div style={{ height: 60, display: "flex", alignItems: "center", padding: "0 20px", background: topbarBg, backdropFilter: "blur(20px)", borderBottom: dark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)", boxShadow: "0 2px 20px rgba(0,0,0,0.08)", zIndex: 500, flexShrink: 0, gap: 12 }}>
                {/* Logo + Name */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}>🧠</div>
                    <span style={{ fontWeight: 900, fontSize: 18, color: tp, letterSpacing: -0.5, fontFamily: "'Nunito',sans-serif" }}>Thinkly</span>
                </div>

                {/* Leaderboard widget — left of timer */}
                <LeaderboardWidget darkMode={dark} userEmail={user.email} />

                {/* Weather */}
                <WeatherWidget city={user.city || user.state || user.country || "Surat"} darkMode={dark} />

                <div style={{ flex: 1 }} />

                {/* Date + Time */}
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: tm, fontWeight: 600, fontFamily: "'Nunito',sans-serif" }}>{dateStr}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: tp, letterSpacing: 1.5, fontVariantNumeric: "tabular-nums", fontFamily: "'Nunito',sans-serif" }}>{timeStr}</div>
                </div>

                <ProfileDropdown user={user} darkMode={dark} onLogout={handleLogout} onEdit={() => setShowEditProf(true)} onContactDev={() => setShowContactDev(true)} />
            </div>

            {/* MAIN */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* SIDEBAR */}
                <div style={{ width: settings.compact ? 58 : 200, flexShrink: 0, transition: "width 0.3s", background: sidebarBg, backdropFilter: "blur(20px)", borderRight: dark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", paddingTop: 14, overflow: "hidden" }}>
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => setActivePanel(item.id)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: settings.compact ? "11px 0" : "11px 18px", justifyContent: settings.compact ? "center" : "flex-start", border: "none", background: activePanel === item.id ? (dark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.1)") : "transparent", color: activePanel === item.id ? "#6366f1" : tm, cursor: "pointer", borderRadius: "0 12px 12px 0", marginRight: 8, marginBottom: 3, transition: "all 0.18s", fontWeight: activePanel === item.id ? 800 : 600, fontSize: 13, fontFamily: "'Nunito',sans-serif" }}>
                            <span style={{ fontSize: 18 }}>{item.icon}</span>
                            {!settings.compact && <span>{item.label}</span>}
                        </button>
                    ))}
                    <div style={{ flex: 1 }} />
                    {activePanel === "notes" && !settings.compact && (
                        <div style={{ padding: "0 18px 6px", fontSize: 10, color: notes.length >= 25 ? "#ef4444" : tm, fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>
                            {notes.length}/25 notes {notes.length >= 25 && "(max)"}
                        </div>
                    )}
                    {activePanel === "notes" && (
                        <div style={{ padding: settings.compact ? "0 9px 14px" : "0 12px 14px", display: "flex", justifyContent: "center" }}>
                            <button onClick={addNote} disabled={notes.length >= 25}
                                style={{ width: settings.compact ? 40 : "100%", height: 38, borderRadius: 12, background: notes.length >= 25 ? (dark ? "#2a2a3e" : "#e0e0e0") : "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: notes.length >= 25 ? "#888" : "#fff", fontWeight: 800, fontSize: settings.compact ? 20 : 13, cursor: notes.length >= 25 ? "not-allowed" : "pointer", fontFamily: "'Nunito',sans-serif", boxShadow: notes.length >= 25 ? "none" : "0 4px 16px rgba(99,102,241,0.35)" }}>
                                {settings.compact ? "+" : "+ New Note"}
                            </button>
                        </div>
                    )}
                    {!settings.compact && (
                        <div style={{ padding: "10px 18px", borderTop: dark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{firstLetter(user.nickname || user.name)}</div>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: "#6366f1", fontFamily: "'Nunito',sans-serif" }}>{user.nickname || user.name}</div>
                                    <div style={{ fontSize: 9.5, color: tm, fontFamily: "'Nunito',sans-serif" }}>{user.city || "—"}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* WORKSPACE */}
                <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                        {activePanel === "notes" && (
                            <div style={{ width: "100%", height: "100%", position: "relative" }}>
                                <div style={{ position: "absolute", inset: 0, opacity: dark ? 0.3 : 0.4, backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.22) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
                                {notes.length === 0 && (
                                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", color: tm, userSelect: "none", pointerEvents: "none" }}>
                                        <div style={{ fontSize: 52, marginBottom: 12 }}>📌</div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: tp, fontFamily: "'Nunito',sans-serif" }}>Workspace is empty</div>
                                        <div style={{ fontSize: 13, marginTop: 6, fontFamily: "'Nunito',sans-serif" }}>Click "+ New Note" to get started</div>
                                    </div>
                                )}
                                {notes.map(note => <StickyNote key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} onDuplicate={duplicateNote} onBringToFront={bringToFront} />)}
                                <div style={{ position: "absolute", bottom: 16, right: 16, fontSize: 11, color: tm, background: dark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)", padding: "4px 12px", borderRadius: 20, border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)", userSelect: "none", fontFamily: "'Nunito',sans-serif" }}>
                                    {notes.length} / 25 notes
                                </div>
                            </div>
                        )}
                        {activePanel === "arena" && (
                            <div style={{ width: "100%", height: "100%", overflowY: "auto" }}>
                                <ArenaSection darkMode={dark} user={user} />
                            </div>
                        )}
                        {activePanel === "ddcet" && (
                            <div style={{ width: "100%", height: "100%", overflowY: "auto" }}>
                                <DDCETSection darkMode={dark} user={user} />
                            </div>
                        )}
                        {activePanel === "profile" && (
                            <div style={{ width: "100%", height: "100%", overflowY: "auto" }}>
                                <StudentProfile user={user} darkMode={dark} onEdit={() => setShowEditProf(true)} />
                            </div>
                        )}
                        {(activePanel === "todo" || activePanel === "journal" || activePanel === "settings") && (
                            <div style={{ width: "100%", height: "100%", overflowY: "auto", padding: 28 }}>
                                <div style={{ maxWidth: 620, margin: "0 auto" }}>
                                    <div style={{ background: dark ? "rgba(18,18,34,0.9)" : "rgba(255,255,255,0.88)", backdropFilter: "blur(20px)", borderRadius: 20, border: dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)", boxShadow: "0 8px 36px rgba(0,0,0,0.12)", overflow: "hidden" }}>
                                        {activePanel === "todo" && <TodoPanel darkMode={dark} userEmail={user.email} />}
                                        {activePanel === "journal" && <JournalPanel darkMode={dark} userEmail={user.email} />}
                                        {activePanel === "settings" && <SettingsPanel settings={settings} onSettings={setSettings} darkMode={dark} user={user} onUpdateUser={handleUpdateUser} />}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contact Developer - bottom strip for scrollable panels */}
                    {(activePanel === "arena" || activePanel === "ddcet" || activePanel === "profile") && (
                        <div style={{ flexShrink: 0, overflowY: "auto", maxHeight: "none" }}>
                            <ContactDeveloper darkMode={dark} />
                        </div>
                    )}
                </div>
            </div>

            {showEditProf && <EditProfileModal user={user} darkMode={dark} onSave={handleUpdateUser} onClose={() => setShowEditProf(false)} />}
            {showContactDev && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={e => { if (e.target === e.currentTarget) setShowContactDev(false); }}>
                    <div style={{ width: 420, background: dark ? "#16162a" : "#fff", borderRadius: 22, padding: 32, boxShadow: "0 28px 80px rgba(0,0,0,0.4)", border: dark ? "1px solid rgba(255,255,255,0.09)" : "1px solid #e8e8e8", animation: "dropIn 0.2s ease" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 18, color: dark ? "#f0f0f0" : "#1a1a2e", margin: 0 }}>Contact Developer</h2>
                            <button onClick={() => setShowContactDev(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
                        </div>
                        <ContactDeveloper darkMode={dark} />
                    </div>
                </div>
            )}
        </div>
    );
}
