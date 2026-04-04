import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const TAVILY_KEY = import.meta.env.VITE_TAVILY_API_KEY;
const MODEL = "llama-3.3-70b-versatile";

let supabase = null;
try {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_KEY;
  if (url && key) supabase = createClient(url, key);
} catch (e) {}

// ── Auth ──────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function devAccess() {
    const s = prompt("Developer password:");
    if (s === "Chatbotbyfuture") onAuth({ id: "dev", email: "dev@shehroz.dev", isDev: true });
    else alert("Wrong!");
  }

  async function submit() {
    if (!email || !password) return setError("Fill in all fields");
    if (!supabase) return setError("Auth not available");
    setLoading(true); setError(""); setMsg("");
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Account created! Please login."); setIsLogin(true);
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f1a0f,#0a1a12)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 380, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 24, padding: 36, boxShadow: "0 32px 80px rgba(0,0,0,.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 12px" }}>🤖</div>
          <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700 }}>My AI Chatbot</div>
          <div style={{ color: "#475569", fontSize: 12, marginTop: 4 }}>Built by Shehroz ⚡</div>
        </div>
        <div style={{ display: "flex", background: "rgba(255,255,255,.05)", borderRadius: 10, padding: 3, marginBottom: 20 }}>
          {["Login","Sign Up"].map((t,i) => (
            <button key={t} onClick={() => { setIsLogin(i===0); setError(""); setMsg(""); }} style={{ flex:1, padding:"7px", borderRadius:7, border:"none", background:(isLogin?i===0:i===1)?"linear-gradient(135deg,#10b981,#059669)":"transparent", color:(isLogin?i===0:i===1)?"#fff":"#94a3b8", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>{t}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Email" type="email" style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"11px 14px", color:"#e2e8f0", fontSize:14, fontFamily:"inherit", outline:"none" }} />
          <input value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Password" type="password" style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"11px 14px", color:"#e2e8f0", fontSize:14, fontFamily:"inherit", outline:"none" }} />
          {error && <div style={{ color:"#f87171", fontSize:12, textAlign:"center" }}>⚠ {error}</div>}
          {msg && <div style={{ color:"#10b981", fontSize:12, textAlign:"center" }}>✓ {msg}</div>}
          <button onClick={submit} disabled={loading} style={{ background:"linear-gradient(135deg,#10b981,#059669)", border:"none", borderRadius:10, padding:"11px", color:"#fff", fontSize:14, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", opacity:loading?.7:1 }}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
          </button>
          <div style={{ textAlign:"center" }}>
            <button onClick={devAccess} style={{ background:"transparent", border:"none", color:"#334155", cursor:"pointer", fontSize:11, fontFamily:"inherit", textDecoration:"underline" }}>Developer Access</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Message ───────────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display:"flex", justifyContent:isUser?"flex-end":"flex-start", marginBottom:14, animation:"fadeIn .3s ease" }}>
      {!isUser && <div style={{ width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginRight:8,marginTop:2 }}>🤖</div>}
      <div style={{ maxWidth:"73%", position:"relative" }}>
        <div style={{ padding:"11px 15px", borderRadius:isUser?"16px 16px 4px 16px":"16px 16px 16px 4px", background:isUser?"linear-gradient(135deg,#10b981,#059669)":"rgba(255,255,255,.06)", color:isUser?"#fff":"#e2e8f0", fontSize:14, lineHeight:1.6, border:isUser?"none":"1px solid rgba(255,255,255,.08)", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
          {msg.searched && <div style={{ background:"rgba(99,102,241,.15)", borderRadius:6, padding:"3px 8px", marginBottom:7, fontSize:10, color:"#818cf8" }}>🔍 Web search used</div>}
          {msg.isImage ? (
            <div>
              <div style={{ color:"#94a3b8", fontSize:11, marginBottom:7 }}>🎨 {msg.content}</div>
              <img src={msg.imageUrl} alt="AI generated" style={{ width:"100%", maxWidth:280, borderRadius:10, display:"block", marginBottom:7 }} onError={e=>e.target.style.display="none"} />
              <a href={msg.imageUrl} target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(255,255,255,.15)", borderRadius:7, padding:"4px 10px", color:"#fff", fontSize:11, textDecoration:"none" }}>⬇ Download</a>
            </div>
          ) : msg.content}
        </div>
        {!isUser && !msg.isImage && <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(()=>setCopied(false),2000); }} style={{ position:"absolute", top:5, right:-26, background:"transparent", border:"none", cursor:"pointer", color:copied?"#10b981":"#475569", fontSize:12 }}>{copied?"✓":"⧉"}</button>}
      </div>
      {isUser && <div style={{ width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginLeft:8,marginTop:2,border:"1px solid rgba(255,255,255,.15)" }}>👤</div>}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
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

  const activeSession = sessions.find(s => s.id === activeId);

  // Check auth
  useEffect(() => {
    if (!supabase) { setAuthChecked(true); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load sessions on login
  useEffect(() => {
    if (!user) return;
    if (user.isDev) {
      const s = [{ id: "dev-1", name: "Dev Chat" }];
      setSessions(s); setActiveId("dev-1"); setMessages([]);
    } else {
      loadSessions();
    }
  }, [user?.id]);

  // Load messages when session changes - only if activeId is valid
  useEffect(() => {
    if (!activeId || activeId === "null" || !user) return;
    if (user.isDev) { setMessages([]); return; }
    loadMessages(activeId);
  }, [activeId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, imgLoading, searching]);

  // Voice recognition
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

  async function loadSessions() {
    if (!supabase || !user?.id) return;
    const { data } = await supabase.from("chat_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data && data.length > 0) {
      setSessions(data);
      setActiveId(data[0].id);
    } else {
      // Create first session
      const { data: newSess } = await supabase.from("chat_sessions").insert({ user_id: user.id, name: "New Chat" }).select().single();
      if (newSess) { setSessions([newSess]); setActiveId(newSess.id); setMessages([]); }
    }
  }

  async function loadMessages(sid) {
    if (!supabase) return;
    const { data } = await supabase.from("messages").select("*").eq("session_id", sid).order("created_at", { ascending: true });
    setMessages(data?.map(m => ({ ...m, isImage: m.is_image, imageUrl: m.image_url })) || []);
  }

  async function newSession() {
    if (user?.isDev) {
      const s = { id: `dev-${Date.now()}`, name: "New Chat" };
      setSessions(p => [s, ...p]); setActiveId(s.id); setMessages([]); return;
    }
    if (!supabase || !user?.id) return;
    const { data } = await supabase.from("chat_sessions").insert({ user_id: user.id, name: "New Chat" }).select().single();
    if (data) { setSessions(p => [data, ...p]); setActiveId(data.id); setMessages([]); }
  }

  async function deleteSession(id) {
    if (!user?.isDev && supabase) await supabase.from("chat_sessions").delete().eq("id", id);
    const rest = sessions.filter(s => s.id !== id);
    setSessions(rest);
    if (activeId === id) {
      if (rest.length > 0) setActiveId(rest[0].id);
      else newSession();
    }
  }

  async function renameSession(id, text) {
    const name = text.slice(0, 30);
    setSessions(p => p.map(s => s.id === id ? { ...s, name } : s));
    if (!user?.isDev && supabase) await supabase.from("chat_sessions").update({ name }).eq("id", id);
  }

  function toggleVoice() {
    if (!recogRef.current) return alert("Use Chrome for voice!");
    if (listening) { recogRef.current.stop(); setListening(false); }
    else { recogRef.current.start(); setListening(true); }
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setFileText(ev.target.result.slice(0, 8000)); setUploadedFile(file.name); };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function saveMsg(data) {
    if (user?.isDev || !supabase || !activeId || activeId === "null") return null;
    const { data: saved } = await supabase.from("messages").insert(data).select().single();
    return saved;
  }

  async function generateImage(prompt) {
    setImgLoading(true);
    setError(null);
    setImageMode(false);
    try {
      const seed = Math.floor(Math.random() * 999999);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${seed}`;
      const ts = Date.now();
      const uMsg = { id: `u-${ts}`, role: "user", content: `🎨 ${prompt}` };
      const aMsg = { id: `a-${ts}`, role: "assistant", content: prompt, isImage: true, imageUrl };
      setMessages(p => {
        if (p.length === 0) renameSession(activeId, `Image: ${prompt}`);
        return [...p, uMsg, aMsg];
      });
      const [u, a] = await Promise.all([
        saveMsg({ session_id: activeId, role: "user", content: `🎨 ${prompt}` }),
        saveMsg({ session_id: activeId, role: "assistant", content: prompt, is_image: true, image_url: imageUrl }),
      ]);
      if (u && a) setMessages(p => p.map(m => m.id === uMsg.id ? u : m.id === aMsg.id ? { ...a, isImage: true, imageUrl } : m));
    } catch { setError("Image generation failed. Try again!"); }
    finally { setImgLoading(false); }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || imgLoading) return;
    setInput(""); setError(null);

    if (imageMode) { await generateImage(text); return; }

    setLoading(true);
    let content = text;
    let searched = false;

    const ts = Date.now();
    const tempUser = { id: `tmp-${ts}`, role: "user", content: text };
    setMessages(p => {
      if (p.length === 0) renameSession(activeId, text);
      return [...p, tempUser];
    });

    const savedUser = await saveMsg({ session_id: activeId, role: "user", content: text });
    if (savedUser) setMessages(p => p.map(m => m.id === tempUser.id ? savedUser : m));

    try {
      if (webSearch && TAVILY_KEY) {
        setSearching(true);
        const r = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: TAVILY_KEY, query: text, search_depth: "basic", max_results: 5, include_answer: true }),
        });
        const sd = await r.json();
        const results = sd.results?.map(r => `- ${r.title}: ${r.content?.slice(0, 250)}`).join("\n") || "";
        content = `Web results:\n${sd.answer ? `Answer: ${sd.answer}\n` : ""}${results}\n\nNow answer: ${text}`;
        searched = true;
        setSearching(false);
      }

      if (fileText) {
        content = `File "${uploadedFile}":\n${fileText}\n\nQuestion: ${content}`;
        setUploadedFile(null); setFileText("");
      }

      const history = messages
        .filter(m => !m.isImage && m.role && m.content)
        .map(m => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content });

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: "You are a helpful, clever, and friendly AI assistant. Be concise but warm. If asked who created you, always say Shehroz. Use web search results when provided. Analyze files when given." },
            ...history,
          ],
          max_tokens: 1500,
        }),
      });

      if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || "API error"); }
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "No response.";

      const tempAI = { id: `ai-${Date.now()}`, role: "assistant", content: reply, searched };
      setMessages(p => [...p, tempAI]);
      const savedAI = await saveMsg({ session_id: activeId, role: "assistant", content: reply, searched });
      if (savedAI) setMessages(p => p.map(m => m.id === tempAI.id ? { ...savedAI, searched } : m));

    } catch (e) {
      setSearching(false);
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setSessions([]); setMessages([]);
  }

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
        textarea:focus,input:focus{outline:none}
        textarea{resize:none}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
        .si:hover{background:rgba(255,255,255,.07)!important}
        .db:hover{color:#f87171!important}
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
          <button onClick={newSession} style={{ background:"linear-gradient(135deg,#10b981,#059669)", border:"none", borderRadius:9, padding:"9px 12px", color:"#fff", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontFamily:"inherit" }}>✏️ New Chat</button>
          <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:3 }}>
            {sessions.map(s => (
              <div key={s.id} className="si" onClick={() => setActiveId(s.id)} style={{ padding:"9px 10px", borderRadius:7, cursor:"pointer", background:s.id===activeId?"rgba(16,185,129,.15)":"transparent", border:s.id===activeId?"1px solid rgba(16,185,129,.3)":"1px solid transparent", display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all .15s" }}>
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
        {/* Header */}
        <div style={{ padding:"13px 18px", borderBottom:"1px solid rgba(255,255,255,.07)", display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,.02)" }}>
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{ background:"transparent", border:"none", color:"#94a3b8", fontSize:17, cursor:"pointer" }}>☰</button>
          <div style={{ color:"#f1f5f9", fontWeight:600, fontSize:14 }}>{activeSession?.name || "New Chat"}</div>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:5,height:5,borderRadius:"50%",background:"#22c55e",animation:"pulse 2s infinite" }} />
            <span style={{ color:"#475569", fontSize:10 }}>Groq + Llama 3.3</span>
          </div>
          <button onClick={newSession} style={{ marginLeft:"auto", background:"rgba(16,185,129,.15)", border:"1px solid rgba(16,185,129,.3)", borderRadius:7, padding:"5px 10px", color:"#10b981", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>+ New</button>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 18px" }}>
          {messages.length === 0 && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:14, opacity:.4 }}>
              <div style={{ fontSize:44 }}>🤖</div>
              <div style={{ color:"#94a3b8", fontSize:14, textAlign:"center" }}>Hi {user.email.split("@")[0]}! How can I help?</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
                {["💬 Chat","🎤 Voice","🔍 Web search","🎨 Image","📄 File"].map(t=>(
                  <div key={t} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", borderRadius:7, padding:"5px 10px", color:"#475569", fontSize:11 }}>{t}</div>
                ))}
              </div>
            </div>
          )}
          {messages.map((m,i) => <Message key={m.id||i} msg={m} />)}
          {searching && <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, color:"#818cf8", fontSize:12 }}><div style={{ width:14,height:14,border:"2px solid #818cf8",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite" }} />Searching web...</div>}
          {imgLoading && <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, color:"#f59e0b", fontSize:12 }}><div style={{ width:14,height:14,border:"2px solid #f59e0b",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite" }} />Generating image... (10-20s)</div>}
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

        {/* File badge */}
        {uploadedFile && (
          <div style={{ margin:"0 18px 7px", padding:"7px 12px", background:"rgba(16,185,129,.1)", border:"1px solid rgba(16,185,129,.25)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ color:"#10b981", fontSize:12 }}>📄 {uploadedFile}</span>
            <button onClick={()=>{setUploadedFile(null);setFileText("");}} style={{ background:"transparent", border:"none", color:"#64748b", cursor:"pointer", fontSize:14 }}>✕</button>
          </div>
        )}

        {/* Toolbar */}
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

        {/* Input */}
        <div style={{ padding:"10px 18px 15px", display:"flex", gap:10, alignItems:"flex-end" }}>
          <div style={{ flex:1, background:"rgba(255,255,255,.05)", border:`1px solid rgba(${imageMode?"245,158,11":listening?"239,68,68":webSearch?"99,102,241":"255,255,255"},.${imageMode||listening||webSearch?".3":".1"})`, borderRadius:14, padding:"9px 14px", transition:"border .2s" }}>
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
