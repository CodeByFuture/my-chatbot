import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const TAVILY_KEY = import.meta.env.VITE_TAVILY_API_KEY;
const MODEL = "llama-3.3-70b-versatile";
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeId() { return `local-${Date.now()}-${Math.random()}`; }

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function devAccess() {
    const s = prompt("Developer password:");
    if (s === "Chatbotbyfuture") onAuth({ id:"dev", email:"dev@shehroz.dev", isDev:true });
    else alert("Wrong password!");
  }

  async function submit() {
    if (!email || !password) return setError("Please fill in all fields");
    setLoading(true); setError(""); setMsg("");
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Account created! Please login."); setIsLogin(true);
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f1a0f,#0a1a12)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif", padding:16 }}>
      <div style={{ width:"100%", maxWidth:380, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:24, padding:36, boxShadow:"0 32px 80px rgba(0,0,0,.5)" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,#10b981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, margin:"0 auto 12px" }}>🤖</div>
          <div style={{ color:"#f1f5f9", fontSize:20, fontWeight:700 }}>My AI Chatbot</div>
          <div style={{ color:"#475569", fontSize:12, marginTop:4 }}>Built by Shehroz ⚡</div>
        </div>
        <div style={{ display:"flex", background:"rgba(255,255,255,.05)", borderRadius:10, padding:3, marginBottom:20 }}>
          {["Login","Sign Up"].map((t,i) => (
            <button key={t} onClick={() => { setIsLogin(i===0); setError(""); setMsg(""); }} style={{ flex:1, padding:"7px", borderRadius:7, border:"none", background:(isLogin?i===0:i===1)?"linear-gradient(135deg,#10b981,#059669)":"transparent", color:(isLogin?i===0:i===1)?"#fff":"#94a3b8", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>{t}</button>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Email" type="email" style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"11px 14px", color:"#e2e8f0", fontSize:14, fontFamily:"inherit", outline:"none" }} />
          <input value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Password" type="password" style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"11px 14px", color:"#e2e8f0", fontSize:14, fontFamily:"inherit", outline:"none" }} />
          {error && <div style={{ color:"#f87171", fontSize:12, textAlign:"center" }}>⚠ {error}</div>}
          {msg && <div style={{ color:"#10b981", fontSize:12, textAlign:"center" }}>✓ {msg}</div>}
          <button onClick={submit} disabled={loading} style={{ background:"linear-gradient(135deg,#10b981,#059669)", border:"none", borderRadius:10, padding:"11px", color:"#fff", fontSize:14, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", opacity:loading?.7:1 }}>
            {loading?"Please wait...":isLogin?"Login":"Create Account"}
          </button>
          <div style={{ textAlign:"center" }}>
            <button onClick={devAccess} style={{ background:"transparent", border:"none", color:"#334155", cursor:"pointer", fontSize:11, fontFamily:"inherit", textDecoration:"underline" }}>Developer Access</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Message Component ─────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display:"flex", justifyContent:isUser?"flex-end":"flex-start", marginBottom:14, animation:"fadeIn .3s ease" }}>
      {!isUser && <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#10b981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0, marginRight:8, marginTop:2 }}>🤖</div>}
      <div style={{ maxWidth:"73%", position:"relative" }}>
        <div style={{ padding:"11px 15px", borderRadius:isUser?"16px 16px 4px 16px":"16px 16px 16px 4px", background:isUser?"linear-gradient(135deg,#10b981,#059669)":"rgba(255,255,255,.06)", color:isUser?"#fff":"#e2e8f0", fontSize:14, lineHeight:1.6, border:isUser?"none":"1px solid rgba(255,255,255,.08)", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
          {msg.searched && <div style={{ background:"rgba(99,102,241,.15)", borderRadius:6, padding:"3px 8px", marginBottom:7, fontSize:10, color:"#818cf8" }}>🔍 Web search used</div>}
          {msg.isImage ? (
            <div>
              <div style={{ color:"#94a3b8", fontSize:11, marginBottom:7 }}>🎨 {msg.content}</div>
              <img src={msg.imageUrl} alt="AI" style={{ width:"100%", maxWidth:280, borderRadius:10, display:"block", marginBottom:7 }} onError={e=>e.target.style.display="none"} />
              <a href={msg.imageUrl} target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(255,255,255,.15)", borderRadius:7, padding:"4px 10px", color:"#fff", fontSize:11, textDecoration:"none" }}>⬇ Download</a>
            </div>
          ) : msg.content}
        </div>
        {!isUser && !msg.isImage && <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(()=>setCopied(false),2000); }} style={{ position:"absolute", top:5, right:-26, background:"transparent", border:"none", cursor:"pointer", color:copied?"#10b981":"#475569", fontSize:12 }}>{copied?"✓":"⧉"}</button>}
      </div>
      {isUser && <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(255,255,255,.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0, marginLeft:8, marginTop:2, border:"1px solid rgba(255,255,255,.15)" }}>👤</div>}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessions, setSessions] = useState([]);   // [{ id, name, messages:[] }]
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [listening, setListening] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileText, setFileText] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recogRef = useRef(null);
  const fileRef = useRef(null);

  const activeSession = sessions.find(s => s.id === activeId) || null;
  const messages = activeSession?.messages || [];

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load on login — only once when user.id changes ────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    if (user.isDev) {
      const s = { id: makeId(), name: "New Chat", messages: [] };
      setSessions([s]); setActiveId(s.id);
    } else {
      loadSessions(user.id);
    }
  }, [user?.id]);

  // ── Voice ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = "en-US";
    r.onresult = e => { setInput(p => p + e.results[0][0].transcript); setListening(false); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recogRef.current = r;
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading, imgLoading, searching]);

  // ── Session functions ─────────────────────────────────────────────────────
  async function loadSessions(userId) {
    const { data } = await supabase.from("chat_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const withMsgs = data.map(s => ({ ...s, messages: [] }));
      setSessions(withMsgs);
      setActiveId(data[0].id);
      // load messages for first session
      const { data: msgs } = await supabase.from("messages").select("*").eq("session_id", data[0].id).order("created_at", { ascending: true });
      if (msgs) {
        setSessions(p => p.map(s => s.id === data[0].id ? { ...s, messages: msgs.map(m => ({ ...m, isImage: m.is_image, imageUrl: m.image_url })) } : s));
      }
    } else {
      // No sessions yet — create one fresh
      const { data: newSession } = await supabase
        .from("chat_sessions")
        .insert({ user_id: userId, name: "New Chat" })
        .select()
        .single();
      if (newSession) {
        setSessions([{ ...newSession, messages: [] }]);
        setActiveId(newSession.id);
      }
    }
  }

  async function createSession(uid) {
    const userId = uid || user?.id;
    if (user?.isDev) {
      const s = { id: makeId(), name: "New Chat", messages: [] };
      setSessions(p => [s, ...p]); setActiveId(s.id); return;
    }
    if (!userId) return;
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: userId, name: "New Chat" })
      .select()
      .single();
    if (error) { console.error("createSession error:", error); return; }
    if (data) { setSessions(p => [{ ...data, messages: [] }, ...p]); setActiveId(data.id); }
  }

  async function switchSession(id) {
    setActiveId(id);
    if (user?.isDev) return;
    const already = sessions.find(s => s.id === id);
    if (already?.messages?.length > 0) return; // already loaded
    const { data } = await supabase.from("messages").select("*").eq("session_id", id).order("created_at", { ascending: true });
    if (data) setSessions(p => p.map(s => s.id === id ? { ...s, messages: data.map(m => ({ ...m, isImage: m.is_image, imageUrl: m.image_url })) } : s));
  }

  async function deleteSession(id) {
    if (!user?.isDev) await supabase.from("chat_sessions").delete().eq("id", id);
    setSessions(p => {
      const rest = p.filter(s => s.id !== id);
      if (activeId === id) {
        if (rest.length > 0) { setActiveId(rest[0].id); if (!user?.isDev) switchSession(rest[0].id); }
        else createSession();
      }
      return rest;
    });
  }

  function updateSessionMessages(sessionId, newMessages, newName) {
    setSessions(p => p.map(s => {
      if (s.id !== sessionId) return s;
      return { ...s, messages: newMessages, name: newName || s.name };
    }));
  }

  // ── File upload ───────────────────────────────────────────────────────────
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setFileText(ev.target.result.slice(0, 8000)); setUploadedFile(file.name); };
    reader.readAsText(file);
    e.target.value = "";
  }

  function toggleVoice() {
    if (!recogRef.current) return alert("Use Chrome for voice!");
    if (listening) { recogRef.current.stop(); setListening(false); }
    else { recogRef.current.start(); setListening(true); }
  }

  // ── Image generation ──────────────────────────────────────────────────────
  async function generateImage(prompt) {
    const sid = activeId;
    if (!sid) return;
    setImgLoading(true); setError(null); setImageMode(false);
    try {
      const seed = Math.floor(Math.random() * 999999);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${seed}`;
      const uMsg = { id: makeId(), role:"user", content:`🎨 ${prompt}` };
      const aMsg = { id: makeId(), role:"assistant", content:prompt, isImage:true, imageUrl };
      const currentMsgs = sessions.find(s => s.id === sid)?.messages || [];
      const newMsgs = [...currentMsgs, uMsg, aMsg];
      const newName = currentMsgs.length === 0 ? `Image: ${prompt.slice(0,25)}` : null;
      updateSessionMessages(sid, newMsgs, newName);
      if (!user?.isDev) {
        const [{ data: u }, { data: a }] = await Promise.all([
          supabase.from("messages").insert({ session_id: sid, role:"user", content:`🎨 ${prompt}` }).select().single(),
          supabase.from("messages").insert({ session_id: sid, role:"assistant", content:prompt, is_image:true, image_url:imageUrl }).select().single(),
        ]);
        if (u && a) updateSessionMessages(sid, [...currentMsgs, u, { ...a, isImage:true, imageUrl }], newName);
        if (newName) await supabase.from("chat_sessions").update({ name: newName }).eq("id", sid);
      }
    } catch { setError("Image generation failed. Try again!"); }
    finally { setImgLoading(false); }
  }

  // ── Send message ──────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || imgLoading) return;
    const sid = activeId;
    if (!sid) return;

    setInput(""); setError(null);
    if (imageMode) { await generateImage(text); return; }

    setLoading(true);

    // snapshot current messages BEFORE any state updates
    const prevMsgs = sessions.find(s => s.id === sid)?.messages || [];
    const isFirstMsg = prevMsgs.length === 0;
    const sessionName = isFirstMsg ? text.slice(0, 28) : null;

    // add user msg to UI immediately
    const uMsg = { id: makeId(), role:"user", content:text };
    updateSessionMessages(sid, [...prevMsgs, uMsg], sessionName);

    // save to DB
    if (!user?.isDev) {
      const { data: savedU } = await supabase.from("messages").insert({ session_id: sid, role:"user", content:text }).select().single();
      if (savedU) {
        setSessions(p => p.map(s => s.id === sid ? { ...s, messages: s.messages.map(m => m.id === uMsg.id ? savedU : m) } : s));
      }
      if (isFirstMsg && sessionName) await supabase.from("chat_sessions").update({ name: sessionName }).eq("id", sid);
    }

    try {
      let content = text;
      let searched = false;

      // web search
      if (webSearch && TAVILY_KEY) {
        setSearching(true);
        const r = await fetch("https://api.tavily.com/search", {
          method:"POST", headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ api_key: TAVILY_KEY, query: text, search_depth:"basic", max_results:5, include_answer:true }),
        });
        const sd = await r.json();
        const results = sd.results?.map(r => `- ${r.title}: ${r.content?.slice(0,250)}`).join("\n") || "";
        content = `Web results:\n${sd.answer?`Answer: ${sd.answer}\n`:""}${results}\n\nNow answer: ${text}`;
        searched = true;
        setSearching(false);
      }

      // file context
      if (fileText) {
        content = `File "${uploadedFile}":\n${fileText}\n\nQuestion: ${content}`;
        setUploadedFile(null); setFileText("");
      }

      // build history from prevMsgs snapshot
      const history = prevMsgs
        .filter(m => !m.isImage && m.role && m.content)
        .map(m => ({ role: m.role, content: m.content }));
      history.push({ role:"user", content });

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role:"system", content:"You are a helpful, clever, and friendly AI assistant. Be concise but warm. If asked who created you, say Shehroz. Use web search results when provided. Analyze files when given." },
            ...history,
          ],
          max_tokens: 1500,
        }),
      });

      if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || "API error"); }
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "No response.";

      // add AI reply to UI
      const aMsg = { id: makeId(), role:"assistant", content:reply, searched };
      setSessions(p => p.map(s => s.id === sid ? { ...s, messages: [...s.messages, aMsg] } : s));

      // save to DB
      if (!user?.isDev) {
        const { data: savedA } = await supabase.from("messages").insert({ session_id: sid, role:"assistant", content:reply, searched }).select().single();
        if (savedA) setSessions(p => p.map(s => s.id === sid ? { ...s, messages: s.messages.map(m => m.id === aMsg.id ? { ...savedA, searched } : m) } : s));
      }

    } catch (e) {
      setSearching(false);
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null); setSessions([]); setActiveId(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (!authChecked) return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f1a0f,#0a1a12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#10b981", fontFamily:"Georgia,serif", fontSize:15 }}>Loading...</div>
  );
  if (!user) return <AuthScreen onAuth={u => setUser(u)} />;

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f1a0f,#0a1a12)", display:"flex", fontFamily:"Georgia,serif" }}>
      <style>{`
        @keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-7px);opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        *{box-sizing:border-box;margin:0;padding:0}
        input,textarea{font-family:inherit}
        textarea::placeholder,input::placeholder{color:rgba(148,163,184,.5)}
        textarea:focus,input:focus{outline:none}textarea{resize:none}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
        .si:hover{background:rgba(255,255,255,.07)!important}.db:hover{color:#f87171!important}
      `}</style>

      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{ width:255, background:"rgba(0,0,0,.35)", borderRight:"1px solid rgba(255,255,255,.07)", display:"flex", flexDirection:"column", padding:"14px 10px", gap:7 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 4px", marginBottom:4 }}>
            <div style={{ width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>🤖</div>
            <span style={{ color:"#f1f5f9", fontWeight:600, fontSize:14 }}>My AI Chatbot</span>
          </div>
          <div style={{ background:"rgba(16,185,129,.08)", border:"1px solid rgba(16,185,129,.2)", borderRadius:8, padding:"7px 10px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ color:"#94a3b8", fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>👤 {user.email}</span>
            <button onClick={logout} style={{ background:"transparent", border:"none", color:"#64748b", cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>Logout</button>
          </div>
          <button onClick={() => createSession()} style={{ background:"linear-gradient(135deg,#10b981,#059669)", border:"none", borderRadius:9, padding:"9px 12px", color:"#fff", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontFamily:"inherit" }}>✏️ New Chat</button>
          <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:3 }}>
            {sessions.map(s => (
              <div key={s.id} className="si" onClick={() => switchSession(s.id)} style={{ padding:"9px 10px", borderRadius:7, cursor:"pointer", background:s.id===activeId?"rgba(16,185,129,.15)":"transparent", border:s.id===activeId?"1px solid rgba(16,185,129,.3)":"1px solid transparent", display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all .15s" }}>
                <span style={{ color:"#cbd5e1", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>💬 {s.name}</span>
                <span className="db" onClick={e=>{e.stopPropagation();deleteSession(s.id);}} style={{ color:"#475569", fontSize:13, marginLeft:6, transition:"color .15s" }}>✕</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,.05)", paddingTop:9, display:"flex", flexDirection:"column", gap:4 }}>
            <div style={{ color:"#475569", fontSize:10, marginBottom:1 }}>FEATURES</div>
            {[["🎤","Voice"],["📄","File Upload"],["🔍","Web Search"],["🎨","Image Gen"],["🔐","Login"],["💾","Cloud History"]].map(([i,l]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:7, color:"#64748b", fontSize:11 }}><span>{i}</span><span>{l}</span></div>
            ))}
          </div>
          <div style={{ color:"#334155", fontSize:10, textAlign:"center", paddingTop:6, borderTop:"1px solid rgba(255,255,255,.05)" }}>Built by Shehroz ⚡</div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", height:"100vh" }}>
        <div style={{ padding:"13px 18px", borderBottom:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,.02)" }}>
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{ background:"transparent", border:"none", color:"#94a3b8", fontSize:17, cursor:"pointer" }}>☰</button>
          <div style={{ color:"#f1f5f9", fontWeight:600, fontSize:14 }}>{activeSession?.name || "New Chat"}</div>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:5,height:5,borderRadius:"50%",background:"#22c55e",animation:"pulse 2s infinite" }} />
            <span style={{ color:"#475569", fontSize:10 }}>Groq + Llama 3.3</span>
          </div>
          <button onClick={()=>createSession()} style={{ marginLeft:"auto", background:"rgba(16,185,129,.15)", border:"1px solid rgba(16,185,129,.3)", borderRadius:7, padding:"5px 10px", color:"#10b981", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>+ New</button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"20px 18px" }}>
          {messages.length === 0 && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:14, opacity:.4 }}>
              <div style={{ fontSize:44 }}>🤖</div>
              <div style={{ color:"#94a3b8", fontSize:14, textAlign:"center" }}>Hi {user.email.split("@")[0]}! How can I help?</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
                {["💬 Chat","🎤 Voice","🔍 Web","🎨 Image","📄 File"].map(t=>(
                  <div key={t} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", borderRadius:7, padding:"5px 10px", color:"#475569", fontSize:11 }}>{t}</div>
                ))}
              </div>
            </div>
          )}
          {messages.map((m,i) => <Message key={m.id||i} msg={m} />)}
          {searching && <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, color:"#818cf8", fontSize:12 }}><div style={{ width:14,height:14,border:"2px solid #818cf8",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite" }} />Searching web...</div>}
          {imgLoading && <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, color:"#f59e0b", fontSize:12 }}><div style={{ width:14,height:14,border:"2px solid #f59e0b",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite" }} />Generating image... (10-20 sec)</div>}
          {loading && !searching && (
            <div style={{ display:"flex", alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,marginRight:8,marginTop:2,flexShrink:0 }}>🤖</div>
              <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", borderRadius:"14px 14px 14px 4px", display:"flex", gap:4, padding:"10px 14px" }}>
                {[0,1,2].map(i=><div key={i} style={{ width:7,height:7,borderRadius:"50%",background:"#94a3b8",animation:"bounce 1.2s infinite",animationDelay:`${i*.2}s` }} />)}
              </div>
            </div>
          )}
          {error && <div style={{ textAlign:"center", color:"#f87171", fontSize:12, padding:"8px 14px", background:"rgba(248,113,113,.08)", borderRadius:8, border:"1px solid rgba(248,113,113,.2)", marginBottom:10 }}>⚠ {error}</div>}
          <div ref={bottomRef} />
        </div>

        {uploadedFile && (
          <div style={{ margin:"0 18px 7px", padding:"7px 12px", background:"rgba(16,185,129,.1)", border:"1px solid rgba(16,185,129,.25)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ color:"#10b981", fontSize:12 }}>📄 {uploadedFile}</span>
            <button onClick={()=>{setUploadedFile(null);setFileText("");}} style={{ background:"transparent", border:"none", color:"#64748b", cursor:"pointer", fontSize:14 }}>✕</button>
          </div>
        )}

        <div style={{ padding:"7px 18px 0", display:"flex", gap:6, flexWrap:"wrap" }}>
          {[
            { label:listening?"⏹ Stop":"🎤 Voice", on:listening, c:"239,68,68", fn:toggleVoice },
            { label:uploadedFile?"📄 Ready":"📄 Upload", on:!!uploadedFile, c:"16,185,129", fn:()=>fileRef.current?.click() },
            { label:webSearch?"🔍 ON ✓":"🔍 Search", on:webSearch, c:"99,102,241", fn:()=>setWebSearch(!webSearch) },
            { label:imageMode?"🎨 ON ✓":"🎨 Image", on:imageMode, c:"245,158,11", fn:()=>setImageMode(!imageMode) },
          ].map(b=>(
            <button key={b.label} onClick={b.fn} style={{ background:b.on?`rgba(${b.c},.15)`:"rgba(255,255,255,.05)", border:b.on?`1px solid rgba(${b.c},.4)`:"1px solid rgba(255,255,255,.08)", borderRadius:7, padding:"4px 9px", color:b.on?`rgb(${b.c})`:"#94a3b8", fontSize:11, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>{b.label}</button>
          ))}
          <input ref={fileRef} type="file" accept=".txt,.md,.js,.py,.csv,.html" onChange={handleFile} style={{ display:"none" }} />
        </div>

        <div style={{ padding:"10px 18px 15px", display:"flex", gap:10, alignItems:"flex-end" }}>
          <div style={{ flex:1, background:"rgba(255,255,255,.05)", border:`1px solid rgba(${imageMode?"245,158,11":listening?"239,68,68":webSearch?"99,102,241":"255,255,255"},.${imageMode||listening||webSearch?3:1})`, borderRadius:14, padding:"9px 14px", transition:"border .2s" }}>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}
              placeholder={imageMode?"🎨 Describe an image...":listening?"🎤 Listening...":webSearch?"🔍 Search anything...":"Type a message… (Enter to send)"}
              rows={1} style={{ width:"100%", background:"transparent", border:"none", color:"#e2e8f0", fontSize:14, lineHeight:1.6, fontFamily:"inherit", maxHeight:100, overflowY:"auto" }} />
          </div>
          <button onClick={sendMessage} disabled={!input.trim()||loading||imgLoading} style={{ width:42,height:42,borderRadius:"50%", background:!input.trim()||loading||imgLoading?"rgba(16,185,129,.25)":imageMode?"linear-gradient(135deg,#f59e0b,#d97706)":"linear-gradient(135deg,#10b981,#059669)", border:"none", color:"#fff", fontSize:18, cursor:!input.trim()||loading||imgLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .2s" }}>{imageMode?"🎨":"↑"}</button>
        </div>
      </div>
    </div>
  );
}
