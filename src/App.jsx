import { useState, useRef, useEffect } from "react";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const TAVILY_KEY = import.meta.env.VITE_TAVILY_API_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const MODEL = "llama-3.3-70b-versatile";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleDevAccess() {
    const secret = prompt("Enter developer password:");
    if (secret === "Chatbotbyfuture") {
      onAuth({ id: "dev-user", email: "developer@shehroz.dev", isDev: true });
    } else {
      alert("Wrong password!");
    }
  }

  async function handleSubmit() {
    if (!email || !password) return setError("Please fill in all fields");
    setLoading(true); setError(""); setMessage("");
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user?.identities?.length === 0) throw new Error("Email already registered. Please login.");
        setMessage("Account created! You can now log in.");
        setIsLogin(true);
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function handleKey(e) { if (e.key === "Enter") handleSubmit(); }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f1a0f 0%, #0f1a15 50%, #0a1a12 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 400, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 40, boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px", boxShadow: "0 4px 16px rgba(16,185,129,0.4)" }}>🤖</div>
          <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700 }}>My AI Chatbot</div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>Built by Shehroz ⚡</div>
        </div>

        <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {["Login", "Sign Up"].map((tab, i) => (
            <button key={tab} onClick={() => { setIsLogin(i === 0); setError(""); setMessage(""); }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: (isLogin ? i === 0 : i === 1) ? "linear-gradient(135deg, #10b981, #059669)" : "transparent", color: (isLogin ? i === 0 : i === 1) ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 13, fontFamily: "inherit", transition: "all 0.2s" }}>{tab}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} placeholder="Email address" type="email" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} placeholder="Password" type="password" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          {error && <div style={{ color: "#f87171", fontSize: 12, textAlign: "center" }}>⚠ {error}</div>}
          {message && <div style={{ color: "#10b981", fontSize: 12, textAlign: "center" }}>✓ {message}</div>}
          <button onClick={handleSubmit} disabled={loading} style={{ background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: 12, padding: "12px", color: "#fff", fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 4, boxShadow: "0 4px 16px rgba(16,185,129,0.3)", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
          </button>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={handleDevAccess} style={{ background: "transparent", border: "none", color: "#334155", cursor: "pointer", fontSize: 11, fontFamily: "inherit", textDecoration: "underline" }}>Developer Access</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Typing Indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "12px 16px" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

// ─── Message ───────────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  function copyMsg() { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: "16px", animation: "fadeSlideIn 0.3s ease" }}>
      {!isUser && (<div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginRight: 10, marginTop: 2, boxShadow: "0 2px 8px rgba(16,185,129,0.4)" }}>🤖</div>)}
      <div style={{ maxWidth: "72%", position: "relative" }}>
        <div style={{ padding: "12px 16px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isUser ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.06)", color: isUser ? "#fff" : "#e2e8f0", fontSize: 14.5, lineHeight: 1.6, border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {msg.searched && (<div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,0.15)", borderRadius: 8, padding: "4px 10px", marginBottom: 8, fontSize: 11, color: "#818cf8" }}>🔍 Searched the web</div>)}
          {msg.isImage ? (
            <div>
              <div style={{ color: isUser ? "rgba(255,255,255,0.8)" : "#94a3b8", fontSize: 12, marginBottom: 8 }}>🎨 {msg.content}</div>
              <img src={msg.imageUrl} alt="generated" style={{ width: "100%", maxWidth: 300, borderRadius: 12, display: "block" }} onError={e => e.target.style.display = "none"} />
            </div>
          ) : msg.content}
        </div>
        {!isUser && !msg.isImage && (<button onClick={copyMsg} style={{ position: "absolute", top: 6, right: -28, background: "transparent", border: "none", cursor: "pointer", color: copied ? "#10b981" : "#475569", fontSize: 13, padding: 2 }}>{copied ? "✓" : "⧉"}</button>)}
      </div>
      {isUser && (<div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginLeft: 10, marginTop: 2, border: "1px solid rgba(255,255,255,0.15)" }}>👤</div>)}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [listening, setListening] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileText, setFileText] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [searching, setSearching] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check auth on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthChecked(true);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  // Load sessions when user logs in
  useEffect(() => {
    if (user) {
      if (user.isDev) {
        const devSession = { id: "dev-session-1", name: "Dev Chat", user_id: "dev-user" };
        setSessions([devSession]);
        setActiveId("dev-session-1");
      } else {
        loadSessions();
      }
    }
  }, [user]);

  // Load messages when session changes
  useEffect(() => {
    if (activeId) {
      if (user?.isDev) setMessages([]);
      else loadMessages(activeId);
    }
  }, [activeId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, searching]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = false; r.interimResults = false; r.lang = "en-US";
      r.onresult = (e) => { setInput(prev => prev + e.results[0][0].transcript); setListening(false); };
      r.onerror = () => setListening(false);
      r.onend = () => setListening(false);
      recognitionRef.current = r;
    }
  }, []);

  async function loadSessions() {
    const { data } = await supabase.from("chat_sessions").select("*").order("created_at", { ascending: false });
    setSessions(data || []);
    if (data?.length > 0) setActiveId(data[0].id);
    else await createSession();
  }

  async function loadMessages(sessionId) {
    const { data } = await supabase.from("messages").select("*").eq("session_id", sessionId).order("created_at", { ascending: true });
    setMessages(data || []);
  }

  async function createSession() {
    if (user?.isDev) {
      const devSession = { id: `dev-session-${Date.now()}`, name: "Dev Chat", user_id: "dev-user" };
      setSessions(prev => [devSession, ...prev]);
      setActiveId(devSession.id);
      setMessages([]);
      return devSession;
    }
    const { data } = await supabase.from("chat_sessions").insert({ user_id: user.id, name: "New Chat" }).select().single();
    if (data) { setSessions(prev => [data, ...prev]); setActiveId(data.id); setMessages([]); }
    return data;
  }

  async function deleteSession(id) {
    await supabase.from("chat_sessions").delete().eq("id", id);
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeId === id) {
      if (updated.length > 0) setActiveId(updated[0].id);
      else await createSession();
    }
  }

  async function updateSessionName(id, firstMessage) {
    const name = firstMessage.slice(0, 28) + (firstMessage.length > 28 ? "..." : "");
    await supabase.from("chat_sessions").update({ name }).eq("id", id);
    setSessions(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  }

  function toggleVoice() {
    if (!recognitionRef.current) return alert("Use Chrome for voice input!");
    if (listening) { recognitionRef.current.stop(); setListening(false); }
    else { recognitionRef.current.start(); setListening(true); }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = (ev) => { setFileText(ev.target.result.slice(0, 8000)); setUploadedFile(file.name); };
      reader.readAsText(file);
    } catch { setError("Could not read file."); }
    e.target.value = "";
  }

  async function generateImage(prompt) {
    setGeneratingImage(true);
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;
    const userMsg = { session_id: activeId, role: "user", content: `Generate image: ${prompt}` };
    const aiMsg = { session_id: activeId, role: "assistant", content: prompt, isImage: true, imageUrl };
    const { data: uData } = await supabase.from("messages").insert(userMsg).select().single();
    const { data: aData } = await supabase.from("messages").insert(aiMsg).select().single();
    if (uData && aData) setMessages(prev => [...prev, { ...uData, content: `Generate image: ${prompt}` }, { ...aData, isImage: true, imageUrl }]);
    if (messages.length === 0) await updateSessionName(activeId, `Image: ${prompt}`);
    setGeneratingImage(false);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    setError(null);

    // Image generation mode
    if (imageMode) {
      await generateImage(text);
      setLoading(false);
      return;
    }

    let finalContent = text;
    let searched = false;

    // Save user message to DB (skip for dev)
    let userMsg = { id: Date.now(), session_id: activeId, role: "user", content: text };
    if (!user?.isDev) {
      const { data } = await supabase.from("messages").insert({ session_id: activeId, role: "user", content: text }).select().single();
      if (data) userMsg = data;
    }
    setMessages(prev => [...prev, userMsg]);
    if (messages.length === 0 && !user?.isDev) await updateSessionName(activeId, text);

    try {
      if (webSearch) {
        setSearching(true);
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: TAVILY_KEY, query: text, search_depth: "basic", max_results: 5, include_answer: true }),
        });
        const sData = await res.json();
        const results = sData.results?.map(r => `- ${r.title}: ${r.content?.slice(0, 300)}`).join("\n") || "";
        finalContent = `Search results:\n${sData.answer ? `Summary: ${sData.answer}\n` : ""}${results}\n\nAnswer: ${text}`;
        searched = true;
        setSearching(false);
      }

      if (fileText) {
        finalContent = `File "${uploadedFile}":\n${fileText}\n\nQuestion: ${finalContent}`;
        setUploadedFile(null); setFileText("");
      }

      const allMessages = [...messages, userMsg].filter(Boolean);
      const apiMessages = allMessages.map(m => ({ role: m.role, content: m.content }));
      apiMessages[apiMessages.length - 1] = { role: "user", content: finalContent };

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: "You are a helpful, clever, and friendly AI assistant. Be concise but warm. If asked who created you, say Shehroz. Use web search results for current answers. Analyze files when given." },
            ...apiMessages,
          ],
          max_tokens: 1500,
        }),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err?.error?.message || "API error"); }
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "No response.";

      const { data: aiMsg } = user?.isDev
        ? { data: { id: Date.now() + 1, session_id: activeId, role: "assistant", content: reply, searched } }
        : await supabase.from("messages").insert({ session_id: activeId, role: "assistant", content: reply, searched }).select().single();
      if (aiMsg) setMessages(prev => [...prev, { ...aiMsg, searched }]);
    } catch (e) { setSearching(false); setError(e.message || "Something went wrong."); }
    finally { setLoading(false); setTimeout(() => inputRef.current?.focus(), 50); }
  }

  function handleKey(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }

  async function handleLogout() { await supabase.auth.signOut(); setUser(null); setSessions([]); setMessages([]); }

  if (!authChecked) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f1a0f, #0a1a12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#10b981", fontSize: 16, fontFamily: "Georgia, serif" }}>Loading...</div>
    </div>
  );

  if (!user) return <AuthScreen onAuth={(u) => setUser(u)} />;

  const activeSession = sessions.find(s => s.id === activeId);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f1a0f 0%, #0f1a15 50%, #0a1a12 100%)", display: "flex", fontFamily: "'Georgia', serif" }}>
      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:0.5}30%{transform:translateY(-8px);opacity:1} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.6} }
        @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
        @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
        *{box-sizing:border-box;margin:0;padding:0}
        input,textarea{font-family:inherit}
        textarea::placeholder,input::placeholder{color:rgba(148,163,184,0.5)}
        textarea:focus,input:focus{outline:none}textarea{resize:none}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
        .si:hover{background:rgba(255,255,255,0.08)!important}.db:hover{color:#f87171!important}.tb:hover{opacity:0.8!important}
      `}</style>

      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{ width: 260, background: "rgba(0,0,0,0.3)", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", padding: "16px 12px", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
            <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 15 }}>My AI Chatbot</span>
          </div>

          {/* User info */}
          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#94a3b8", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>👤 {user.email}</span>
            <button onClick={handleLogout} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Logout</button>
          </div>

          <button onClick={createSession} style={{ background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>✏️ New Chat</button>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {sessions.map(session => (
              <div key={session.id} className="si" style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: session.id === activeId ? "rgba(16,185,129,0.15)" : "transparent", border: session.id === activeId ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s" }} onClick={() => setActiveId(session.id)}>
                <span style={{ color: "#cbd5e1", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>💬 {session.name}</span>
                <span className="db" onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }} style={{ color: "#475569", fontSize: 14, marginLeft: 8, transition: "color 0.2s" }}>✕</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>FEATURES</div>
            {[["🎤","Voice Input"],["📄","File Upload"],["🔍","Live Web Search"],["🎨","Image Generation"],["🔐","User Login"],["💾","Cloud History"]].map(([icon,label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 12 }}><span>{icon}</span><span>{label}</span></div>
            ))}
          </div>
          <div style={{ color: "#475569", fontSize: 11, textAlign: "center", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>Built by Shehroz ⚡</div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.02)" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer", padding: 4 }}>☰</button>
          <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 15 }}>{activeSession?.name || "New Chat"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
            <span style={{ color: "#94a3b8", fontSize: 11 }}>Groq + Llama 3.3</span>
          </div>
          <button onClick={createSession} style={{ marginLeft: "auto", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "6px 12px", color: "#10b981", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>+ New Chat</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          {messages.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, opacity: 0.5 }}>
              <div style={{ fontSize: 48 }}>🤖</div>
              <div style={{ color: "#94a3b8", fontSize: 15, textAlign: "center" }}>Hello, {user.email.split("@")[0]}! How can I help?</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {["🎤 Speak to me","📄 Upload a file","🔍 Search web","🎨 Generate image"].map(tip => (
                  <div key={tip} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", color: "#64748b", fontSize: 12 }}>{tip}</div>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => <Message key={msg.id || i} msg={msg} />)}
          {searching && (<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, color: "#818cf8", fontSize: 13 }}><div style={{ width: 16, height: 16, border: "2px solid #818cf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Searching the web...</div>)}
          {generatingImage && (<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, color: "#f59e0b", fontSize: 13 }}><div style={{ width: 16, height: 16, border: "2px solid #f59e0b", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Generating image...</div>)}
          {loading && !searching && !generatingImage && (
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 10, marginTop: 2, flexShrink: 0 }}>🤖</div>
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px" }}><TypingIndicator /></div>
            </div>
          )}
          {error && (<div style={{ textAlign: "center", color: "#f87171", fontSize: 13, padding: "10px 16px", background: "rgba(248,113,113,0.08)", borderRadius: 10, border: "1px solid rgba(248,113,113,0.2)", marginBottom: 12 }}>⚠ {error}</div>)}
          <div ref={bottomRef} />
        </div>

        {/* File preview */}
        {uploadedFile && (
          <div style={{ margin: "0 20px 8px", padding: "8px 14px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#10b981", fontSize: 13 }}>📄 {uploadedFile} — ready</span>
            <button onClick={() => { setUploadedFile(null); setFileText(""); }} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        )}

        {/* Toolbar */}
        <div style={{ padding: "8px 20px 0", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={toggleVoice} className="tb" style={{ background: listening ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)", border: listening ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 10px", color: listening ? "#ef4444" : "#94a3b8", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", transition: "all 0.2s", animation: listening ? "micPulse 1s infinite" : "none" }}>{listening ? "⏹ Stop" : "🎤 Voice"}</button>
          <button onClick={() => fileInputRef.current?.click()} className="tb" style={{ background: uploadedFile ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: uploadedFile ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 10px", color: uploadedFile ? "#10b981" : "#94a3b8", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", transition: "all 0.2s" }}>📄 {uploadedFile ? "File Ready" : "Upload"}</button>
          <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.js,.py,.csv" onChange={handleFileUpload} style={{ display: "none" }} />
          <button onClick={() => setWebSearch(!webSearch)} className="tb" style={{ background: webSearch ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)", border: webSearch ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 10px", color: webSearch ? "#818cf8" : "#94a3b8", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", transition: "all 0.2s" }}>🔍 {webSearch ? "Search ON ✓" : "Web Search"}</button>
          <button onClick={() => setImageMode(!imageMode)} className="tb" style={{ background: imageMode ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)", border: imageMode ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 10px", color: imageMode ? "#f59e0b" : "#94a3b8", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", transition: "all 0.2s" }}>🎨 {imageMode ? "Image Mode ✓" : "Image Gen"}</button>
        </div>

        {/* Input */}
        <div style={{ padding: "12px 20px 16px", display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: imageMode ? "1px solid rgba(245,158,11,0.3)" : listening ? "1px solid rgba(239,68,68,0.3)" : webSearch ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "10px 16px", transition: "border 0.2s" }}>
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder={imageMode ? "🎨 Describe an image to generate..." : listening ? "🎤 Listening..." : webSearch ? "🔍 Ask anything — searching web..." : "Type a message… (Enter to send)"}
              rows={1} style={{ width: "100%", background: "transparent", border: "none", color: "#e2e8f0", fontSize: 14.5, lineHeight: 1.6, fontFamily: "inherit", maxHeight: 120, overflowY: "auto" }} />
          </div>
          <button onClick={sendMessage} disabled={!input.trim() || loading} style={{ width: 44, height: 44, borderRadius: "50%", background: !input.trim() || loading ? "rgba(16,185,129,0.3)" : imageMode ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "#fff", fontSize: 20, cursor: !input.trim() || loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>{imageMode ? "🎨" : "↑"}</button>
        </div>
      </div>
    </div>
  );
}
