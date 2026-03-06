import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const NOTE_COLORS = {
  yellow: { bg: "#FFF176", dark: "#F9A825", text: "#1a1a1a" },
  pink:   { bg: "#F48FB1", dark: "#C2185B", text: "#1a1a1a" },
  blue:   { bg: "#90CAF9", dark: "#1565C0", text: "#1a1a1a" },
  green:  { bg: "#A5D6A7", dark: "#2E7D32", text: "#1a1a1a" },
  purple: { bg: "#CE93D8", dark: "#6A1B9A", text: "#1a1a1a" },
  orange: { bg: "#FFCC80", dark: "#E65100", text: "#1a1a1a" },
  white:  { bg: "#FAFAFA", dark: "#9E9E9E", text: "#1a1a1a" },
  coral:  { bg: "#FF8A80", dark: "#C62828", text: "#1a1a1a" },
};

const FONTS = [
  { label: "Poppins",        value: "'Poppins', sans-serif" },
  { label: "Nunito",         value: "'Nunito', sans-serif" },
  { label: "Montserrat",     value: "'Montserrat', sans-serif" },
  { label: "Open Sans",      value: "'Open Sans', sans-serif" },
  { label: "Caveat",         value: "'Caveat', cursive" },
  { label: "Patrick Hand",   value: "'Patrick Hand', cursive" },
  { label: "Indie Flower",   value: "'Indie Flower', cursive" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
];

const COUNTRIES = ["India","United States","United Kingdom","Canada","Australia","Germany","France","Japan"];
const STATES = {
  India: ["Gujarat","Maharashtra","Karnataka","Tamil Nadu","Delhi","Rajasthan","Punjab"],
  "United States": ["California","New York","Texas","Florida","Washington","Illinois"],
  "United Kingdom": ["England","Scotland","Wales","Northern Ireland"],
  Canada: ["Ontario","Quebec","British Columbia","Alberta"],
  Australia: ["New South Wales","Victoria","Queensland","Western Australia"],
  Germany: ["Bavaria","Berlin","Hamburg","Saxony"],
  France: ["Île-de-France","Provence","Normandy","Brittany"],
  Japan: ["Tokyo","Osaka","Kyoto","Hokkaido"],
};
const CITIES = {
  Gujarat:["Surat","Ahmedabad","Vadodara","Rajkot"], Maharashtra:["Mumbai","Pune","Nagpur","Nashik"],
  Karnataka:["Bengaluru","Mysuru","Mangaluru"], "Tamil Nadu":["Chennai","Coimbatore","Madurai"],
  Delhi:["New Delhi","Noida","Gurgaon"], Rajasthan:["Jaipur","Jodhpur","Udaipur"],
  Punjab:["Amritsar","Ludhiana","Chandigarh"], California:["Los Angeles","San Francisco","San Diego","San Jose"],
  "New York":["New York City","Buffalo","Albany"], Texas:["Houston","Austin","Dallas","San Antonio"],
  Florida:["Miami","Orlando","Tampa"], Washington:["Seattle","Spokane","Bellevue"],
  Illinois:["Chicago","Springfield"], England:["London","Manchester","Birmingham","Leeds"],
  Scotland:["Edinburgh","Glasgow"], Wales:["Cardiff","Swansea"],
  "Northern Ireland":["Belfast"], Ontario:["Toronto","Ottawa","Hamilton"],
  Quebec:["Montreal","Quebec City"], "British Columbia":["Vancouver","Victoria"],
  Alberta:["Calgary","Edmonton"], "New South Wales":["Sydney","Newcastle"],
  Victoria:["Melbourne","Geelong"], Queensland:["Brisbane","Gold Coast"],
  "Western Australia":["Perth","Fremantle"], Bavaria:["Munich","Nuremberg","Augsburg"],
  Berlin:["Berlin"], Hamburg:["Hamburg"], Saxony:["Dresden","Leipzig"],
  "Île-de-France":["Paris","Versailles"], Provence:["Marseille","Nice","Avignon"],
  Normandy:["Rouen","Caen"], Brittany:["Rennes","Brest"],
  Tokyo:["Tokyo","Shibuya","Shinjuku"], Osaka:["Osaka","Sakai"],
  Kyoto:["Kyoto","Uji"], Hokkaido:["Sapporo","Hakodate"],
};

const REGISTERED_USERS = [
  { email:"mitesh@gmail.com",    password:"Mitesh@123", name:"Mitesh Pipaliya", country:"India",         state:"Gujarat",    city:"Surat"         },
  { email:"demo@visiondesk.app", password:"Demo@1234",  name:"Demo User",       country:"India",         state:"Maharashtra",city:"Mumbai"        },
  { email:"test@example.com",    password:"Test@1234",  name:"Test Account",    country:"United States", state:"California", city:"San Francisco" },
];

const uid  = () => Math.random().toString(36).slice(2, 9);
const pad  = (n) => String(n).padStart(2, "0");
const firstLetter = (name) => (name || "U").trim().charAt(0).toUpperCase();

const SAMPLE_NOTES = [
  { id:"n1", content:"☕ Morning routine\n• Wake up 6am\n• Meditate 10 min\n• Journal thoughts", color:"yellow", font:"'Caveat', cursive",         x:80,  y:100, w:240, h:200, locked:false, zIndex:1 },
  { id:"n2", content:"📚 Study goals\nFinish React chapter\nPractice TypeScript\nBuild side project",  color:"blue",   font:"'Poppins', sans-serif",   x:360, y:80,  w:220, h:180, locked:false, zIndex:2 },
  { id:"n3", content:"💡 App idea\nVoice-to-text notes\nAI summarizer\nShare with team",               color:"green",  font:"'Nunito', sans-serif",    x:620, y:130, w:230, h:170, locked:false, zIndex:3 },
  { id:"n4", content:"🎯 Today's focus\nDeep work 9–12\nNo social media\nShip one feature",            color:"orange", font:"'Indie Flower', cursive",  x:180, y:340, w:210, h:160, locked:false, zIndex:4 },
  { id:"n5", content:"Remember:\nYou are capable\nof amazing things ✨\n\nBelieve in the process.",    color:"pink",   font:"'Dancing Script', cursive", x:500, y:320, w:250, h:190, locked:false, zIndex:5 },
];
const SAMPLE_TODOS = [
  { id:"t1", title:"Review design mockups",   done:true  },
  { id:"t2", title:"Update project README",   done:false },
  { id:"t3", title:"Fix responsive layout bug",done:false},
  { id:"t4", title:"Write unit tests",         done:false },
  { id:"t5", title:"Deploy to staging",        done:false },
];

function useClock(fmt24 = false) {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  const days   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dateStr = `${days[t.getDay()]}, ${t.getDate()} ${months[t.getMonth()]} ${t.getFullYear()}`;
  let h = t.getHours(), m = t.getMinutes(), s = t.getSeconds(), suf = "";
  if (!fmt24) { suf = h >= 12 ? " PM" : " AM"; h = h % 12 || 12; }
  return { dateStr, timeStr: `${pad(h)}:${pad(m)}:${pad(s)}${suf}` };
}

function ProfileDropdown({ user, onLogout, onEdit, darkMode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const bg   = darkMode ? "#16162a" : "#fff";
  const bdr  = darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
  const txt  = darkMode ? "#e0e0e0" : "#1a1a2e";
  const hvr  = darkMode ? "rgba(255,255,255,0.06)" : "rgba(99,102,241,0.07)";
  const items = [
    { icon:"✏️", label:"Edit Profile",       fn: onEdit },
    { icon:"🔗", label:"Contact Developer",  fn: () => window.open("https://github.com/miteshpipaliya","_blank"), badge:"GitHub" },
    { icon:"🚪", label:"Logout",             fn: onLogout, danger: true },
  ];
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:16, cursor:"pointer", flexShrink:0, userSelect:"none", boxShadow: open ? "0 0 0 3px rgba(99,102,241,0.45)" : "none", transition:"box-shadow 0.2s", letterSpacing:-0.5 }}
        title={user.name}
      >
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
              📍 {[user.city, user.state, user.country].filter(Boolean).join(", ") || "Location not set"}
            </div>
          </div>
          {items.map(item => (
            <div key={item.label}
              onClick={() => { item.fn(); setOpen(false); }}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", cursor:"pointer", color:item.danger ? "#ef4444" : txt, fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:600, transition:"background 0.15s", background:"transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = item.danger ? "rgba(239,68,68,0.08)" : hvr}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize:16 }}>{item.icon}</span>
              {item.label}
              {item.badge && <span style={{ marginLeft:"auto", fontSize:10, color:"#6366f1", background:"rgba(99,102,241,0.12)", padding:"2px 7px", borderRadius:6, fontWeight:700 }}>{item.badge}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditProfileModal({ user, onSave, onClose, darkMode }) {
  const [form, setForm] = useState({ name:user.name||"", country:user.country||"", state:user.state||"", city:user.city||"" });
  const f = (k) => (v) => setForm(p => ({ ...p, [k]:v }));
  const bg  = darkMode ? "#16162a" : "#fff";
  const bdr = darkMode ? "rgba(255,255,255,0.09)" : "#e8e8e8";
  const txt = darkMode ? "#f0f0f0" : "#1a1a2e";
  const inp = { width:"100%", padding:"10px 12px", borderRadius:10, border:`1px solid ${bdr}`, background:darkMode?"rgba(255,255,255,0.05)":"#f6f6f6", color:txt, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"'Nunito',sans-serif", appearance:"none" };
  const lbl = { fontSize:11, fontWeight:800, color:"#888", marginBottom:5, display:"block", fontFamily:"'Nunito',sans-serif", letterSpacing:0.5, textTransform:"uppercase" };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
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

function StickyNote({ note, onUpdate, onDelete, onDuplicate, onBringToFront, darkMode }) {
  const [dragging,     setDragging]     = useState(false);
  const [resizing,     setResizing]     = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [showToolbar,  setShowToolbar]  = useState(false);
  const [showColors,   setShowColors]   = useState(false);
  const [showFonts,    setShowFonts]    = useState(false);
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
    onUpdate(note.id, { x:Math.max(0, dragStart.current.ox + e.clientX - dragStart.current.mx), y:Math.max(0, dragStart.current.oy + e.clientY - dragStart.current.my) });
  }, [dragging, note.id, onUpdate]);

  const onMouseDownResize = (e) => {
    e.preventDefault(); e.stopPropagation();
    resizeStart.current = { mx:e.clientX, my:e.clientY, ow:note.w, oh:note.h };
    setResizing(true);
  };
  const onMouseMoveResize = useCallback((e) => {
    if (!resizing || !resizeStart.current) return;
    onUpdate(note.id, { w:Math.max(200, resizeStart.current.ow + e.clientX - resizeStart.current.mx), h:Math.max(160, resizeStart.current.oh + e.clientY - resizeStart.current.my) });
  }, [resizing, note.id, onUpdate]);

  const onMouseUp = useCallback(() => { setDragging(false); setResizing(false); }, []);

  useEffect(() => {
    if (dragging)  { window.addEventListener("mousemove", onMouseMoveDrag);   window.addEventListener("mouseup", onMouseUp); }
    return ()      => { window.removeEventListener("mousemove", onMouseMoveDrag);  window.removeEventListener("mouseup", onMouseUp); };
  }, [dragging, onMouseMoveDrag, onMouseUp]);
  useEffect(() => {
    if (resizing)  { window.addEventListener("mousemove", onMouseMoveResize); window.addEventListener("mouseup", onMouseUp); }
    return ()      => { window.removeEventListener("mousemove", onMouseMoveResize); window.removeEventListener("mouseup", onMouseUp); };
  }, [resizing, onMouseMoveResize, onMouseUp]);

  return (
    <div
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => { setShowToolbar(false); setShowColors(false); setShowFonts(false); }}
      onClick={() => onBringToFront(note.id)}
      style={{ position:"absolute", left:note.x, top:note.y, width:note.w, height:note.h, zIndex:note.zIndex,
        borderRadius:16, background:color.bg, display:"flex", flexDirection:"column", overflow:"visible",
        userSelect:"none", fontFamily:note.font,
        transition: dragging||resizing ? "none" : "box-shadow 0.2s, transform 0.18s",
        transform: dragging ? "rotate(-1.5deg) scale(1.03)" : "rotate(0deg) scale(1)",
        boxShadow: dragging
          ? "0 28px 64px rgba(0,0,0,0.38), 0 8px 22px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.5)"
          : "0 6px 28px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.4)",
      }}
    >
      <div style={{ height:6, background:color.dark, borderRadius:"16px 16px 0 0", flexShrink:0 }} />
      <div
        onMouseDown={onMouseDownDrag}
        title={note.locked ? "Note is locked" : "Drag to move"}
        style={{ height:32, cursor: note.locked ? "not-allowed" : dragging ? "grabbing" : "grab", flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center", gap:4, userSelect:"none",
          background:"rgba(0,0,0,0.03)", borderBottom:`1px solid ${color.dark}22`,
        }}
      >
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ width:3.5, height:3.5, borderRadius:"50%", background:color.dark, opacity:0.35 }} />
        ))}
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
              {FONTS.map(f => (
                <div key={f.value} onClick={e => { e.stopPropagation(); onUpdate(note.id,{font:f.value}); setShowFonts(false); }}
                  style={{ padding:"6px 10px", fontFamily:f.value, cursor:"pointer", borderRadius:8, fontSize:13, background:note.font===f.value?"rgba(99,102,241,0.1)":"transparent", color:"#1a1a2e" }}>
                  {f.label}
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
      <div
        contentEditable={!note.locked}
        suppressContentEditableWarning
        onFocus={() => setEditing(true)}
        onBlur={e => { setEditing(false); onUpdate(note.id,{content:e.currentTarget.innerHTML}); }}
        style={{ flex:1, padding:"2px 14px 14px", fontSize:14, lineHeight:1.65, color:color.text, fontFamily:note.font, outline:"none", overflowY:"auto", whiteSpace:"pre-wrap", wordBreak:"break-word", cursor:note.locked?"default":"text", userSelect:"text" }}
        dangerouslySetInnerHTML={{ __html:note.content }}
      />
      {!note.locked && (
        <div onMouseDown={onMouseDownResize}
          style={{ position:"absolute", right:4, bottom:4, width:18, height:18, cursor:"se-resize", opacity:showToolbar?0.55:0, transition:"opacity 0.2s" }}>
          <svg viewBox="0 0 18 18" fill={color.dark}><path d="M13 7h2v2h-2zM10 10h2v2h-2zM13 10h2v2h-2zM7 13h2v2H7zM10 13h2v2h-2zM13 13h2v2h-2z"/></svg>
        </div>
      )}
    </div>
  );
}

function TodoPanel({ darkMode }) {
  const [todos, setTodos] = useState(SAMPLE_TODOS);
  const [input, setInput] = useState("");
  const add = () => { if (!input.trim()) return; setTodos(p => [...p, {id:uid(), title:input.trim(), done:false}]); setInput(""); };
  const inpStyle = { flex:1, padding:"8px 10px", borderRadius:8, border:darkMode?"1px solid #444":"1px solid #e0e0e0", background:darkMode?"#2a2a2a":"#f5f5f5", color:darkMode?"#fff":"#1a1a2e", fontSize:12.5, outline:"none", fontFamily:"'Nunito',sans-serif" };
  return (
    <div style={{ padding:"0 0 20px" }}>
      <h3 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:13, letterSpacing:1, textTransform:"uppercase", color:darkMode?"#aaa":"#888", margin:"0 0 14px", padding:"16px 18px 0" }}>To-Do List</h3>
      <div style={{ padding:"0 18px", display:"flex", gap:6, marginBottom:12 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&add()} placeholder="Add a task..." style={inpStyle} />
        <button onClick={add} style={{ width:30, height:30, borderRadius:8, background:"#6366f1", border:"none", color:"#fff", cursor:"pointer", fontSize:18, lineHeight:1 }}>+</button>
      </div>
      <div style={{ maxHeight:300, overflowY:"auto" }}>
        {todos.map(t => (
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 18px", borderBottom:darkMode?"1px solid #2a2a3e":"1px solid #f0f0f0" }}>
            <input type="checkbox" checked={t.done} onChange={() => setTodos(p => p.map(x => x.id===t.id?{...x,done:!x.done}:x))} style={{ cursor:"pointer", accentColor:"#6366f1" }} />
            <span style={{ flex:1, fontSize:12.5, fontFamily:"'Nunito',sans-serif", textDecoration:t.done?"line-through":"none", color:t.done?"#999":darkMode?"#ddd":"#333" }}>{t.title}</span>
            <button onClick={() => setTodos(p => p.filter(x => x.id!==t.id))} style={{ fontSize:11, border:"none", background:"transparent", cursor:"pointer", color:"#ef4444" }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function JournalPanel({ darkMode }) {
  const [content, setContent] = useState("Today I want to focus on...\n\n");
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div style={{ padding:"0 0 20px" }}>
      <h3 style={{ fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:13, letterSpacing:1, textTransform:"uppercase", color:darkMode?"#aaa":"#888", margin:"0 0 6px", padding:"16px 18px 0" }}>Daily Journal</h3>
      <div style={{ padding:"0 18px 8px", fontSize:11, color:darkMode?"#888":"#aaa", fontFamily:"'Nunito',sans-serif" }}>
        {new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
      </div>
      <div style={{ padding:"0 18px" }}>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          style={{ width:"100%", height:220, padding:"12px 14px", borderRadius:10, border:darkMode?"1px solid #444":"1px solid #e0e0e0", background:darkMode?"#2a2a2a":"#fafafa", color:darkMode?"#eee":"#222", fontSize:13, lineHeight:1.75, resize:"none", outline:"none", fontFamily:"'Caveat',cursive", boxSizing:"border-box" }} />
        <div style={{ fontSize:11, color:darkMode?"#666":"#bbb", fontFamily:"'Nunito',sans-serif", marginTop:4 }}>{words} words · Auto-saved ✓</div>
      </div>
    </div>
  );
}

function SettingsPanel({ settings, onSettings, darkMode, user, onUpdateUser }) {
  const [locOpen, setLocOpen] = useState(false);
  const [loc,     setLoc]     = useState({ country:user.country||"", state:user.state||"", city:user.city||"" });
  const row  = { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 18px", borderBottom:darkMode?"1px solid #1e1e32":"1px solid #f0f0f0" };
  const lbl  = { fontSize:13, fontFamily:"'Nunito',sans-serif", color:darkMode?"#ddd":"#444", fontWeight:600 };
  const sel  = { width:"100%", padding:"9px 11px", borderRadius:9, border:darkMode?"1px solid #444":"1px solid #ddd", background:darkMode?"#2a2a2a":"#f5f5f5", color:darkMode?"#fff":"#1a1a2e", fontSize:12, outline:"none", fontFamily:"'Nunito',sans-serif", appearance:"none" };
  const toggle = (key) => onSettings({ ...settings, [key]:!settings[key] });
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
            {locOpen ? "Cancel" : "Change"}
          </button>
        </div>
        <div style={{ fontSize:12, color:"#888", fontFamily:"'Nunito',sans-serif" }}>
          {[user.city, user.state, user.country].filter(Boolean).join(", ") || "Not set"}
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

function AuthScreen({ onLogin }) {
  const [mode,    setMode]    = useState("signin");
  const [step,    setStep]    = useState(1);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({ name:"", email:"", password:"", country:"", state:"", city:"" });
  const fv = (k) => (v) => { setForm(p => ({...p,[k]:v})); setError(""); };
  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const handleSignIn = () => {
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    if (!validateEmail(form.email)) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    setTimeout(() => {
      const found = REGISTERED_USERS.find(u => u.email.toLowerCase()===form.email.toLowerCase() && u.password===form.password);
      if (found) { onLogin(found); }
      else {
        const exists = REGISTERED_USERS.find(u => u.email.toLowerCase()===form.email.toLowerCase());
        setError(exists ? "Incorrect password. Please try again." : "No account found with this email address.");
      }
      setLoading(false);
    }, 700);
  };
  const handleSignUp = () => {
    if (!form.name || !form.email || !form.password) { setError("Please fill all fields."); return; }
    if (!validateEmail(form.email)) { setError("Enter a valid email address."); return; }
    if (form.password.length < 8)   { setError("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(form.password)) { setError("Password must include at least one uppercase letter."); return; }
    if (!/[0-9]/.test(form.password)) { setError("Password must include at least one number."); return; }
    const exists = REGISTERED_USERS.find(u => u.email.toLowerCase()===form.email.toLowerCase());
    if (exists) { setError("An account already exists with this email. Please sign in."); return; }
    setLoading(true);
    setTimeout(() => {
      const nu = { email:form.email, password:form.password, name:form.name, country:form.country, state:form.state, city:form.city };
      REGISTERED_USERS.push(nu);
      onLogin(nu);
      setLoading(false);
    }, 700);
  };
  const inpS = { width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.11)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"'Nunito',sans-serif" };
  const lblS = { fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.5)", marginBottom:5, display:"block", fontFamily:"'Nunito',sans-serif", letterSpacing:0.7, textTransform:"uppercase" };
  const OAuthBtn = ({ icon, label }) => (
    <button onClick={() => setError("OAuth requires a backend server. Use a demo account below.")}
      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(255,255,255,0.11)", color:"rgba(255,255,255,0.7)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
      <span style={{ fontSize:16 }}>{icon}</span>{label}
    </button>
  );
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)", fontFamily:"'Nunito',sans-serif", position:"relative", overflow:"hidden" }}>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}} @keyframes dropIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {[{t:"-10%",l:"-5%",s:420,c:"rgba(99,102,241,0.18)"},{b:"-10%",r:"-5%",s:360,c:"rgba(244,143,177,0.12)"},{t:"45%",l:"60%",s:180,c:"rgba(144,202,249,0.08)"}].map((b,i) => (
        <div key={i} style={{ position:"absolute", borderRadius:"50%", width:b.s, height:b.s, background:b.c, top:b.t, left:b.l, bottom:b.b, right:b.r, filter:"blur(60px)", pointerEvents:"none", animation:`float ${3+i}s ease-in-out infinite` }} />
      ))}
      <div style={{ width:420, background:"rgba(255,255,255,0.05)", backdropFilter:"blur(24px)", borderRadius:24, border:"1px solid rgba(255,255,255,0.09)", boxShadow:"0 32px 80px rgba(0,0,0,0.45)", padding:40, position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:42, marginBottom:6 }}>🗒️</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:"#fff", margin:0, letterSpacing:-0.5 }}>VisionDesk</h1>
          <p style={{ fontSize:12.5, color:"rgba(255,255,255,0.42)", margin:"6px 0 0" }}>Your smart sticky notes workspace</p>
        </div>
        <div style={{ display:"flex", background:"rgba(0,0,0,0.25)", borderRadius:12, padding:4, marginBottom:22 }}>
          {["signin","signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setStep(1); setError(""); }}
              style={{ flex:1, padding:"8px 0", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"'Nunito',sans-serif", background:mode===m?"rgba(255,255,255,0.13)":"transparent", color:mode===m?"#fff":"rgba(255,255,255,0.35)", transition:"all 0.2s" }}>
              {m==="signin"?"Sign In":"Sign Up"}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          <OAuthBtn icon="🔵" label="Google" />
          <OAuthBtn icon="⬛" label="GitHub" />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }} />
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.32)", fontWeight:700 }}>or with email</span>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }} />
        </div>
        {error && (
          <div style={{ background:"rgba(239,68,68,0.14)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#fca5a5", fontFamily:"'Nunito',sans-serif" }}>
            ⚠️ {error}
          </div>
        )}
        {mode==="signin" && (
          <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
            <div><label style={lblS}>Email</label><input placeholder="your@email.com" style={inpS} value={form.email} onChange={e => fv("email")(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleSignIn()} /></div>
            <div><label style={lblS}>Password</label><input type="password" placeholder="••••••••" style={inpS} value={form.password} onChange={e => fv("password")(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleSignIn()} /></div>
            <div style={{ textAlign:"right" }}><span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>Forgot password?</span></div>
            <button onClick={handleSignIn} disabled={loading}
              style={{ padding:"13px", borderRadius:12, background:loading?"rgba(99,102,241,0.5)":"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", color:"#fff", fontSize:14, fontWeight:800, cursor:loading?"wait":"pointer" }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
            <div style={{ background:"rgba(99,102,241,0.09)", border:"1px solid rgba(99,102,241,0.18)", borderRadius:10, padding:"10px 14px", fontSize:11, color:"rgba(255,255,255,0.48)", fontFamily:"'Nunito',sans-serif", lineHeight:1.75 }}>
              <strong style={{ color:"rgba(255,255,255,0.65)" }}>Demo accounts:</strong><br/>
              mitesh@gmail.com / Mitesh@123<br/>
              demo@visiondesk.app / Demo@1234<br/>
              test@example.com / Test@1234
            </div>
          </div>
        )}
        {mode==="signup" && (
          <div>
            {step===1 && (
              <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                <div><label style={lblS}>Full Name</label><input placeholder="Your full name" style={inpS} value={form.name} onChange={e => fv("name")(e.target.value)} /></div>
                <div><label style={lblS}>Email</label><input placeholder="your@email.com" style={inpS} value={form.email} onChange={e => fv("email")(e.target.value)} /></div>
                <div><label style={lblS}>Password</label><input type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" style={inpS} value={form.password} onChange={e => fv("password")(e.target.value)} /></div>
                <button onClick={() => {
                  if (!form.name||!form.email||!form.password) { setError("Please fill all fields."); return; }
                  if (!validateEmail(form.email)) { setError("Enter a valid email."); return; }
                  if (form.password.length<8||!/[A-Z]/.test(form.password)||!/[0-9]/.test(form.password)) { setError("Password: min 8 chars, 1 uppercase, 1 number."); return; }
                  const ex = REGISTERED_USERS.find(u => u.email.toLowerCase()===form.email.toLowerCase());
                  if (ex) { setError("Email already registered. Please sign in."); return; }
                  setError(""); setStep(2);
                }} style={{ padding:"13px", borderRadius:12, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer" }}>Continue →</button>
              </div>
            )}
            {step===2 && (
              <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>Step 2 of 2 — Set your location</p>
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
                  <button onClick={handleSignUp} disabled={loading}
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

export default function App() {
  const [user,         setUser]         = useState(null);
  const [notes,        setNotes]        = useState(SAMPLE_NOTES);
  const [activePanel,  setActivePanel]  = useState("notes");
  const [showEditProf, setShowEditProf] = useState(false);
  const [maxZ,         setMaxZ]         = useState(10);
  const [settings, setSettings] = useState({ darkMode:true, fmt24:false, compact:false, defaultColor:"yellow" });

  const dark = settings.darkMode;
  const { dateStr, timeStr } = useClock(settings.fmt24);

  const bg        = dark ? "linear-gradient(160deg,#09091a 0%,#111128 40%,#0d1a2e 100%)" : "linear-gradient(160deg,#e8eaf6 0%,#ede7f6 30%,#e3f2fd 60%,#e8f5e9 100%)";
  const sidebarBg = dark ? "rgba(12,12,26,0.97)"  : "rgba(255,255,255,0.88)";
  const topbarBg  = dark ? "rgba(12,12,26,0.93)"  : "rgba(255,255,255,0.8)";
  const tp        = dark ? "#f0f0f0" : "#1a1a2e";
  const tm        = dark ? "#666"    : "#999";

  const addNote = () => {
    if (notes.length >= 25) { alert("Maximum 25 notes reached! Delete a note to add more."); return; }
    const nz = maxZ + 1; setMaxZ(nz);
    setNotes(p => [...p, { id:uid(), content:"New note ✏️\nStart writing here...", color:settings.defaultColor, font:"'Nunito', sans-serif", x:60+Math.random()*300, y:60+Math.random()*180, w:240, h:200, locked:false, zIndex:nz }]);
  };

  const updateNote    = useCallback((id, patch) => setNotes(p => p.map(n => n.id===id?{...n,...patch}:n)), []);
  const deleteNote    = useCallback((id) => setNotes(p => p.filter(n => n.id!==id)), []);
  const duplicateNote = useCallback((id) => {
    if (notes.length>=25) { alert("Maximum 25 notes reached!"); return; }
    const n = notes.find(x => x.id===id); if (!n) return;
    const nz = maxZ+1; setMaxZ(nz);
    setNotes(p => [...p, {...n, id:uid(), x:n.x+24, y:n.y+24, zIndex:nz}]);
  }, [notes, maxZ]);
  const bringToFront  = useCallback((id) => {
    const nz = maxZ+1; setMaxZ(nz);
    setNotes(p => p.map(n => n.id===id?{...n,zIndex:nz}:n));
  }, [maxZ]);

  if (!user) return <AuthScreen onLogin={setUser} />;

  const navItems = [
    { id:"notes",    icon:"📌", label:"Notes"    },
    { id:"todo",     icon:"✅", label:"To-Do"    },
    { id:"journal",  icon:"📖", label:"Journal"  },
    { id:"settings", icon:"⚙️", label:"Settings" },
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

      <div style={{ height:60, display:"flex", alignItems:"center", padding:"0 20px", background:topbarBg, backdropFilter:"blur(20px)", borderBottom:dark?"1px solid rgba(255,255,255,0.05)":"1px solid rgba(0,0,0,0.05)", boxShadow:"0 2px 20px rgba(0,0,0,0.08)", zIndex:500, flexShrink:0, gap:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:22 }}>🗒️</span>
          <span style={{ fontWeight:900, fontSize:16, color:tp, letterSpacing:-0.3 }}>VisionDesk</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, background:dark?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.78)", border:dark?"1px solid rgba(255,255,255,0.07)":"1px solid rgba(0,0,0,0.05)" }}>
          <span>☀️</span>
          <span style={{ fontSize:13, fontWeight:700, color:tp }}>32°C</span>
          <span style={{ fontSize:12, color:tm }}>{user.city||"Surat"}, {user.country||"India"}</span>
        </div>
        <div style={{ flex:1 }} />
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11, color:tm, fontWeight:600 }}>{dateStr}</div>
          <div style={{ fontSize:18, fontWeight:900, color:tp, letterSpacing:1.5, fontVariantNumeric:"tabular-nums" }}>{timeStr}</div>
        </div>
        <ProfileDropdown user={user} darkMode={dark} onLogout={() => setUser(null)} onEdit={() => setShowEditProf(true)} />
      </div>

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
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
              <div style={{ maxWidth:600, margin:"0 auto" }}>
                <div style={{ background:dark?"rgba(18,18,34,0.9)":"rgba(255,255,255,0.88)", backdropFilter:"blur(20px)", borderRadius:20, border:dark?"1px solid rgba(255,255,255,0.07)":"1px solid rgba(0,0,0,0.06)", boxShadow:"0 8px 36px rgba(0,0,0,0.12)", overflow:"hidden" }}>
                  {activePanel==="todo"     && <TodoPanel    darkMode={dark} />}
                  {activePanel==="journal"  && <JournalPanel darkMode={dark} />}
                  {activePanel==="settings" && <SettingsPanel settings={settings} onSettings={setSettings} darkMode={dark} user={user} onUpdateUser={setUser} />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditProf && (
        <EditProfileModal user={user} darkMode={dark} onSave={updated => setUser(u => ({...u,...updated}))} onClose={() => setShowEditProf(false)} />
      )}
    </div>
  );
}
