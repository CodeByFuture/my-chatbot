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
} catch (e) { console.error("Supabase init failed", e); }

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
    if (!supabase) return setError("Auth service not available");
    setLoading(true); setError(""); setMessage("");
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user?.identities?.length === 0) throw new Error("Email already registered.");
        setMessage("Account created! You can now log in.");
        setIsLogin(true);
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f1a0f, #0a1a12)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 400, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 40, boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px", boxShadow: "0 4px 16px rgba(16,185,129,0.4)" }}>🤖</div>
          <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700 }}>My AI Chatbot</div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>Built by Shehroz ⚡</div>
        </div>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {["Login", "Sign Up"].map((tab, i) => (
            <button key={tab} onClick={() => { setIsLogin(i === 0); setError(""); setMessage(""); }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: (isLogin ? i === 0 : i === 1) ? "linear-gradient(135deg, #10b981, #059669)" : "transparent", color: (isLogin ? i === 0 : i === 1) ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>{tab}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="Email address" type="email" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="Password" type="password" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          {error && <div style={{ color: "#f87171", fontSize: 12, textAlign: "center" }}>⚠ {error}</div>}
          {message && <div style={{ color: "#10b981", fontSize: 12, textAlign: "center" }}>✓ {message}</div>}
          <button onClick={handleSubmit} disabled={loading} style={{ background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: 12, padding: "12px", color: "#fff", fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
          </button>
          <div style={{ textAlign: "center" }}>
            <button onClick={handleDevAccess} style={{ background: "transparent", border: "none", color: "#334155", cursor: "pointer", fontSize: 11, fontFamily: "inherit", textDecoration: "underline" }}>Developer Access</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "12px 16px" }}>
      {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8", animation: "bounce 1.2s infinite", animationDelay: `${i*0.2}s` }} />)}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16, animation: "fadeIn 0.3s ease" }}>
      {!isUser && <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginRight: 10, marginTop: 2 }}>🤖</div>}
      <div style={{ maxWidth: "72%", position: "relative" }}>
        <div style={{ padding: "12px 16px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isUser ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.06)", color: isUser ? "#fff" : "#e2e8f0", fontSize: 14.5, lineHeight: 1.6, border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {msg.searched && <div style={{ background: "rgba(99,102,241,0.15)", borderRadius: 8, padding: "4px 10px", marginBottom: 8, fontSize: 11, color: "#818cf8" }}>🔍 Searched the web</div>}
          {msg.isImage ? (
            <div>
              <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>🎨 {msg.content}</div>
              <img src={msg.imageUrl} alt="generated" style={{ width: "100%", maxWidth: 300, borderRadius: 12, display: "block", marginBottom: 8 }} onError={e => e.target.style.display = "none"} />
              <a href={msg.imageUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "5px 12px", color: "#fff", fontSize: 12, textDecoration: "none" }}>⬇ Download</a>
            </div>
          ) : msg.content}
        </div>
        {!isUser && !msg.isImage && (
          <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ position: "absolute", top: 6, right: -28, background: "transparent", border: "none", cursor: "pointer", color: copied ? "#10b981" : "#475569", fontSize: 13 }}>{copied ? "✓" : "⧉"}</button>
        )}
      </div>
      {isUser && <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginLeft: 10, marginTop: 2, border: "1px solid rgba(255,255,255,0.15)" }}>👤</div>}
    </div>
  );
}

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

  const activeSession = sessions.find(s => s.id === activeId);

  useEffect(() => {
    if (!supabase) { setAuthChecked(true); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthChecked(true);
    });
    supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null));
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.isDev) {
      const s = { id: "dev-1", name: "Dev Chat" };
      setSessions([s]); setActiveId("dev-1"); setMessages([]);
    } else loadSessions();
  }, [user]);

  useEffect(() => {
    if (!activeId || !user || user.isDev) return;
    loadMessages(activeId);
  }, [activeId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, searching, generatingImage]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = "en-US";
    r.onresult = e => { setInput(p => p + e.results[0][0].transcript); setListening(false); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recognitionRef.current = r;
  }, []);

  async function loadSessions() {
    if (!supabase || !user?.id) return;
    const { data } = await supabase.from("chat_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSessions(data || []);
    if (data?.length > 0) setActiveId(data[0].id);
    else createSession();
  }

  async function loadMessages(sid) {
    if (!supabase) return;
    const { data } = await supabase.from("messages").select("*").eq("session_id", sid).order("created_at", { ascending: true });
    setMessages(data?.map(m => ({ ...m, isImage: m.is_image, imageUrl: m.image_url })) || []);
  }

  async function createSession() {
    if (user?.isDev) {
      const s = { id: `dev-${Date.now()}`, name: "New Chat" };
      setSessions(p => [s, ...p]); setActiveId(s.id); setMessages([]); return s;
    }
    if (!supabase) return;
    const { data } = await supabase.from("chat_sessions").insert({ user_id: user.id, name: "New Chat" }).select().single();
    if (data) { setSessions(p => [data, ...p]); setActiveId(data.id); setMessages([]); }
    return data;
  }

  async function deleteSession(id) {
    if (!user?.isDev && supabase) await supabase.from("chat_sessions").delete().eq("id", id);
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeId === id) {
      if (updated.length > 0) setActiveId(updated[0].id);
      else createSession();
    }
  }

  async function updateSessionName(id, text) {
    const name = text.slice(0, 28) + (text.length > 28 ? "..." : "");
    if (!user?.isDev && supabase) await supabase.from("chat_sessions").update({ name }).eq("id", id);
    setSessions(p => p.map(s => s.id === id ? { ...s, name } : s));
  }

  function toggleVoice() {
    if (!recognitionRef.current) return alert("Use Chrome for voice input!");
    if (listening) { recognitionRef.current.stop(); setListening(false); }
    else { recognitionRef.current.start(); setListening(true); }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setFileText(ev.target.result.slice(0, 8000)); setUploadedFile(file.name); };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function generateImage(prompt) {
    setGeneratingImage(true);
    setError(null);
    try {
      const seed = Math.floor(Math.random() * 999999);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${seed}`;
      const timestamp = Date.now();
      const userContent = `🎨 ${prompt}`;
      const uMsg = { id: `img-user-${timestamp}`, role: "user", content: userContent };
      const aMsg = { id: `img-assistant-${timestamp}`, role: "assistant", content: prompt, isImage: true, imageUrl };

      setMessages(prev => {
        if (prev.length === 0) updateSessionName(activeId, `Image: ${prompt}`);
        return [...prev, uMsg, aMsg];
      });

      if (!user?.isDev && supabase) {
        try {
          const { data: u, error: uError } = await supabase.from("messages").insert({ session_id: activeId, role: "user", content: userContent }).select().single();
          if (uError) throw uError;

          const { data: a, error: aError } = await supabase.from("messages").insert({ session_id: activeId, role: "assistant", content: prompt, is_image: true, image_url: imageUrl }).select().single();
          if (aError) throw aError;

          setMessages(prev => prev.map(msg => {
            if (msg.id === uMsg.id) return u;
            if (msg.id === aMsg.id) return { ...a, isImage: true, imageUrl };
            return msg;
          }));
        } catch (saveError) {
          console.error("Image generated but message save failed", saveError);
        }
      }
    } catch (e) { setError("Image generation failed. Try again!"); }
    finally { setGeneratingImage(false); }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || generatingImage) return;
    setInput("");
    setError(null);

    if (imageMode) {
      await generateImage(text);
      return;
    }

    setLoading(true);
    let finalContent = text;
    let searched = false;

    // Add user message to UI immediately
    const tempMsg = { id: `temp-${Date.now()}`, role: "user", content: text };
    setMessages(p => [...p, tempMsg]);

    // Save to DB
    if (!user?.isDev && supabase) {
      const { data } = await supabase.from("messages").insert({ session_id: activeId, role: "user", content: text }).select().single();
      if (data) setMessages(p => p.map(m => m.id === tempMsg.id ? data : m));
      if (messages.length === 0) updateSessionName(activeId, text);
    }

    try {
      // Web search
      if (webSearch && TAVILY_KEY) {
        setSearching(true);
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: TAVILY_KEY, query: text, search_depth: "basic", max_results: 5, include_answer: true }),
        });
        const sd = await res.json();
        const results = sd.results?.map(r => `- ${r.title}: ${r.content?.slice(0, 300)}`).join("\n") || "";
        finalContent = `Search results:\n${sd.answer ? `Summary: ${sd.answer}\n` : ""}${results}\n\nAnswer this: ${text}`;
        searched = true;
        setSearching(false);
      }

      // File context
      if (fileText) {
        finalContent = `File "${uploadedFile}":\n${fileText}\n\nQuestion: ${finalContent}`;
        setUploadedFile(null); setFileText("");
      }

      // Build message history for API
      const history = [...messages, { role: "user", content: text }]
        .filter(m => !m.isImage)
        .map(m => ({ role: m.role, content: m.content }));
      history[history.length - 1] = { role: "user", content: finalContent };

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: "You are a helpful, clever, and friendly AI assistant. Be concise but warm. If asked who created you, say Shehroz. Use web search results for current answers. Analyze files when given." },
            ...history,
          ],
          max_tokens: 1500,
        }),
      });

      if (!response.ok) { const err = await response.json(); throw new Error(err?.error?.message || "API error"); }
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "No response.";

      const aiMsg = { id: Date.now(), role: "assistant", content: reply, searched };
      if (!user?.isDev && supabase) {
        const { data: saved } = await supabase.from("messages").insert({ session_id: activeId, role: "assistant", content: reply, searched }).select().single();
        if (saved) setMessages(p => [...p, { ...saved, searched }]);
        else setMessages(p => [...p, aiMsg]);
      } else {
        setMessages(p => [...p, aiMsg]);
      }
    } catch (e) {
      setSearching(false);
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setSessions([]); setMessages([]);
  }

  if (!authChecked) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f1a0f, #0a1a12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#10b981", fontSize: 16, fontFamily: "Georgia, serif" }}>Loading...</div>
    </div>
  );

  if (!user) return <AuthScreen onAuth={u => setUser(u)} />;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f1a0f, #0a1a12)", display: "flex", fontFamily: "Georgia, serif" }}>
      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-8px);opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.6} }
        @keyframes spin { from{transform:rotate(0)}to{transform:rotate(360deg)} }
        @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
        *{box-sizing:border-box;margin:0;padding:0}
        input,textarea{font-family:inherit}
        textarea::placeholder,input::placeholder{color:rgba(148,163,184,.5)}
        textarea:focus,input:focus{outline:none}textarea{resize:none}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
        .si:hover{background:rgba(255,255,255,.08)!important}
        .db:hover{color:#f87171!important}
      `}</style>

      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{ width: 260, background: "rgba(0,0,0,.3)", borderRight: "1px solid rgba(255,255,255,.07)", display: "flex", flexDirection: "column", padding: "16px 12px", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
            <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 15 }}>My AI Chatbot</span>
          </div>
          <div style={{ background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#94a3b8", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>👤 {user.email}</span>
            <button onClick={handleLogout} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Logout</button>
          </div>
          <button onClick={createSession} style={{ background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" }}>✏️ New Chat</button>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {sessions.map(s => (
              <div key={s.id} className="si" onClick={() => setActiveId(s.id)} style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: s.id === activeId ? "rgba(16,185,129,.15)" : "transparent", border: s.id === activeId ? "1px solid rgba(16,185,129,.3)" : "1px solid transparent", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all .2s" }}>
                <span style={{ color: "#cbd5e1", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>💬 {s.name}</span>
                <span className="db" onClick={e => { e.stopPropagation(); deleteSession(s.id); }} style={{ color: "#475569", fontSize: 14, marginLeft: 8, transition: "color .2s" }}>✕</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>FEATURES</div>
            {[["🎤","Voice"],["📄","File Upload"],["🔍","Web Search"],["🎨","Image Gen"],["🔐","Login"],["💾","Cloud History"]].map(([icon, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 12 }}><span>{icon}</span><span>{label}</span></div>
            ))}
          </div>
          <div style={{ color: "#475569", fontSize: 11, textAlign: "center", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.05)" }}>Built by Shehroz ⚡</div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.02)" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer" }}>☰</button>
          <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 15 }}>{activeSession?.name || "New Chat"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
            <span style={{ color: "#94a3b8", fontSize: 11 }}>Groq + Llama 3.3</span>
          </div>
          <button onClick={createSession} style={{ marginLeft: "auto", background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.3)", borderRadius: 8, padding: "6px 12px", color: "#10b981", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>+ New Chat</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          {messages.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, opacity: .5 }}>
              <div style={{ fontSize: 48 }}>🤖</div>
              <div style={{ color: "#94a3b8", fontSize: 15, textAlign: "center" }}>Hello, {user.email.split("@")[0]}! How can I help?</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {["🎤 Speak","📄 Upload file","🔍 Search web","🎨 Generate image"].map(t => (
                  <div key={t} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "6px 12px", color: "#64748b", fontSize: 12 }}>{t}</div>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => <Message key={msg.id || i} msg={msg} />)}
          {searching && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, color: "#818cf8", fontSize: 13 }}><div style={{ width: 16, height: 16, border: "2px solid #818cf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />Searching the web...</div>}
          {generatingImage && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, color: "#f59e0b", fontSize: 13 }}><div style={{ width: 16, height: 16, border: "2px solid #f59e0b", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />Generating image... (10-20 sec)</div>}
          {loading && !searching && (
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 10, marginTop: 2, flexShrink: 0 }}>🤖</div>
              <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "18px 18px 18px 4px" }}><TypingIndicator /></div>
            </div>
          )}
          {error && <div style={{ textAlign: "center", color: "#f87171", fontSize: 13, padding: "10px 16px", background: "rgba(248,113,113,.08)", borderRadius: 10, border: "1px solid rgba(248,113,113,.2)", marginBottom: 12 }}>⚠ {error}</div>}
          <div ref={bottomRef} />
        </div>

        {uploadedFile && (
          <div style={{ margin: "0 20px 8px", padding: "8px 14px", background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.25)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#10b981", fontSize: 13 }}>📄 {uploadedFile} — ready</span>
            <button onClick={() => { setUploadedFile(null); setFileText(""); }} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        )}

        {/* Toolbar */}
        <div style={{ padding: "8px 20px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: listening ? "⏹ Stop" : "🎤 Voice", active: listening, color: "239,68,68", onClick: toggleVoice },
            { label: uploadedFile ? "📄 Ready" : "📄 Upload", active: !!uploadedFile, color: "16,185,129", onClick: () => fileInputRef.current?.click() },
            { label: webSearch ? "🔍 ON ✓" : "🔍 Search", active: webSearch, color: "99,102,241", onClick: () => setWebSearch(!webSearch) },
            { label: imageMode ? "🎨 Image ✓" : "🎨 Image", active: imageMode, color: "245,158,11", onClick: () => setImageMode(!imageMode) },
          ].map(btn => (
            <button key={btn.label} onClick={btn.onClick} style={{ background: btn.active ? `rgba(${btn.color},.15)` : "rgba(255,255,255,.05)", border: btn.active ? `1px solid rgba(${btn.color},.4)` : "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "5px 10px", color: btn.active ? `rgb(${btn.color})` : "#94a3b8", fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>{btn.label}</button>
          ))}
          <input ref={fileInputRef} type="file" accept=".txt,.md,.js,.py,.csv" onChange={handleFileUpload} style={{ display: "none" }} />
        </div>

        {/* Input */}
        <div style={{ padding: "12px 20px 16px", display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,.05)", border: `1px solid rgba(${imageMode ? "245,158,11" : listening ? "239,68,68" : webSearch ? "99,102,241" : "255,255,255"},.${imageMode||listening||webSearch?3:1})`, borderRadius: 16, padding: "10px 16px", transition: "border .2s" }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={imageMode ? "🎨 Describe image..." : listening ? "🎤 Listening..." : webSearch ? "🔍 Search anything..." : "Type a message… (Enter to send)"}
              rows={1} style={{ width: "100%", background: "transparent", border: "none", color: "#e2e8f0", fontSize: 14.5, lineHeight: 1.6, fontFamily: "inherit", maxHeight: 120, overflowY: "auto" }} />
          </div>
          <button onClick={sendMessage} disabled={!input.trim() || loading || generatingImage} style={{ width: 44, height: 44, borderRadius: "50%", background: !input.trim() || loading || generatingImage ? "rgba(16,185,129,.3)" : imageMode ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "#fff", fontSize: 20, cursor: !input.trim() || loading || generatingImage ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{imageMode ? "🎨" : "↑"}</button>
        </div>
      </div>
    </div>
  );
}


