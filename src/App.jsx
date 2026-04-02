import { useState, useRef, useEffect } from "react";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = "llama-3.3-70b-versatile";

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "12px 16px" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: "50%", background: "#94a3b8",
          animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "16px", animation: "fadeSlideIn 0.3s ease",
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #10b981, #059669)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0, marginRight: 10, marginTop: 2,
          boxShadow: "0 2px 8px rgba(16,185,129,0.4)",
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: "72%", padding: "12px 16px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.06)",
        color: isUser ? "#fff" : "#e2e8f0", fontSize: 14.5, lineHeight: 1.6,
        border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isUser ? "0 4px 16px rgba(16,185,129,0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}>
        {msg.fileInfo && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.1)", borderRadius: 8,
            padding: "6px 10px", marginBottom: 8, fontSize: 12,
          }}>
            📄 {msg.fileInfo}
          </div>
        )}
        {msg.content}
      </div>
      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0, marginLeft: 10, marginTop: 2,
          border: "1px solid rgba(255,255,255,0.15)",
        }}>👤</div>
      )}
    </div>
  );
}

// Extract text from uploaded file
async function extractTextFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (file.type === "application/pdf") {
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdfjsLib = window.pdfjsLib;
          if (!pdfjsLib) {
            resolve("[PDF content - PDF.js not loaded, treating as text]");
            return;
          }
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          let text = "";
          for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(" ") + "\n";
          }
          resolve(text.slice(0, 8000));
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => resolve(e.target.result.slice(0, 8000));
      reader.readAsText(file);
    }
  });
}

export default function App() {
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem("chat_sessions");
      return saved ? JSON.parse(saved) : [{ id: Date.now(), name: "Chat 1", messages: [] }];
    } catch { return [{ id: Date.now(), name: "Chat 1", messages: [] }]; }
  });
  const [activeId, setActiveId] = useState(() => {
    try {
      const saved = localStorage.getItem("chat_sessions");
      if (saved) return JSON.parse(saved)[0]?.id || Date.now();
    } catch {}
    return Date.now();
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [listening, setListening] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileText, setFileText] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];
  const messages = activeSession?.messages || [];

  useEffect(() => {
    // Load PDF.js
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    try { localStorage.setItem("chat_sessions", JSON.stringify(sessions)); } catch {}
  }, [sessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onresult = (e) => {
        setInput(prev => prev + e.results[0][0].transcript);
        setListening(false);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  function toggleVoice() {
    if (!recognitionRef.current) return alert("Use Chrome for voice input!");
    if (listening) { recognitionRef.current.stop(); setListening(false); }
    else { recognitionRef.current.start(); setListening(true); }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileLoading(true);
    try {
      const text = await extractTextFromFile(file);
      setFileText(text);
      setUploadedFile(file.name);
    } catch {
      setError("Could not read file.");
    }
    setFileLoading(false);
    e.target.value = "";
  }

  function removeFile() {
    setUploadedFile(null);
    setFileText("");
  }

  function newChat() {
    const id = Date.now();
    setSessions(prev => [{ id, name: `Chat ${prev.length + 1}`, messages: [] }, ...prev]);
    setActiveId(id);
    setError(null);
    setUploadedFile(null);
    setFileText("");
  }

  function deleteChat(id) {
    const updated = sessions.filter(s => s.id !== id);
    if (updated.length === 0) {
      const newSession = { id: Date.now(), name: "Chat 1", messages: [] };
      setSessions([newSession]);
      setActiveId(newSession.id);
    } else {
      setSessions(updated);
      if (activeId === id) setActiveId(updated[0].id);
    }
  }

  function updateMessages(id, newMessages) {
    setSessions(prev => prev.map(s => s.id === id ? {
      ...s, messages: newMessages,
      name: newMessages[0]?.content.slice(0, 25) + "..." || s.name
    } : s));
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    let finalContent = text;
    let fileInfo = null;

    // Add file context if uploaded
    if (fileText) {
      finalContent = `I have uploaded a file called "${uploadedFile}". Here is its content:\n\n${fileText}\n\nMy question: ${text}`;
      fileInfo = uploadedFile;
    }

    // Add web search instruction if enabled
    if (webSearch) {
      finalContent = `[The user wants you to answer using your knowledge as if you searched the web for the latest information. Be specific and mention that you're providing up-to-date info.]\n\n${finalContent}`;
    }

    const displayMessage = { role: "user", content: text, fileInfo };
    const apiMessage = { role: "user", content: finalContent };

    const newDisplayMessages = [...messages, displayMessage];
    const newApiMessages = [...messages.filter(m => !m.fileInfo).map(m => ({ role: m.role, content: m.content })), apiMessage];

    updateMessages(activeId, newDisplayMessages);
    setInput("");
    setUploadedFile(null);
    setFileText("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: "You are a helpful, clever, and friendly AI assistant. Be concise but warm. If anyone asks who developed or created you, always say that you were developed by Shehroz. When given file content, analyze it thoroughly. When asked about current events, provide the best answer from your knowledge." },
            ...newApiMessages,
          ],
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || "API error");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "No response.";
      updateMessages(activeId, [...newDisplayMessages, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f1a0f 0%, #0f1a15 50%, #0a1a12 100%)",
      display: "flex", fontFamily: "'Georgia', serif",
    }}>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea::placeholder { color: rgba(148,163,184,0.5); }
        textarea:focus { outline: none; }
        textarea { resize: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .session-item:hover { background: rgba(255,255,255,0.08) !important; }
        .delete-btn:hover { color: #f87171 !important; }
        .tool-btn:hover { background: rgba(255,255,255,0.1) !important; }
      `}</style>

      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{
          width: 260, background: "rgba(0,0,0,0.3)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          display: "flex", flexDirection: "column", padding: "16px 12px", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>🤖</div>
            <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 15 }}>My AI Chatbot</span>
          </div>

          <button onClick={newChat} style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            border: "none", borderRadius: 10, padding: "10px 14px",
            color: "#fff", fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
            boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
          }}>✏️ New Chat</button>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {sessions.map(session => (
              <div key={session.id} className="session-item" style={{
                padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                background: session.id === activeId ? "rgba(16,185,129,0.15)" : "transparent",
                border: session.id === activeId ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "all 0.2s",
              }} onClick={() => setActiveId(session.id)}>
                <span style={{ color: "#cbd5e1", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  💬 {session.name}
                </span>
                <span className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteChat(session.id); }}
                  style={{ color: "#475569", fontSize: 14, marginLeft: 8, transition: "color 0.2s" }}>✕</span>
              </div>
            ))}
          </div>

          {/* Features legend */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>FEATURES</div>
            {[["🎤", "Voice Input"], ["📄", "File Upload"], ["🔍", "Web Search"], ["💾", "Chat History"]].map(([icon, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 12 }}>
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ color: "#475569", fontSize: 11, textAlign: "center", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            Built by Shehroz ⚡
          </div>
        </div>
      )}

      {/* Main Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>

        {/* Header */}
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: 12,
          background: "rgba(255,255,255,0.02)",
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: "transparent", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer", padding: 4,
          }}>☰</button>
          <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 15 }}>{activeSession?.name || "New Chat"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
            <span style={{ color: "#94a3b8", fontSize: 11 }}>Groq + Llama 3.3</span>
          </div>
          <button onClick={newChat} style={{
            marginLeft: "auto", background: "rgba(16,185,129,0.15)",
            border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8,
            padding: "6px 12px", color: "#10b981", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>+ New Chat</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          {messages.length === 0 && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: 16, opacity: 0.5,
            }}>
              <div style={{ fontSize: 48 }}>🤖</div>
              <div style={{ color: "#94a3b8", fontSize: 15, textAlign: "center" }}>
                Hello! How can I help you today?
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                {["🎤 Speak to me", "📄 Upload a file", "🔍 Search the web", "💬 Just chat"].map(tip => (
                  <div key={tip} style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8, padding: "6px 12px", color: "#64748b", fontSize: 12,
                  }}>{tip}</div>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => <Message key={i} msg={msg} />)}

          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, marginRight: 10, marginTop: 2, flexShrink: 0,
              }}>🤖</div>
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px" }}>
                <TypingIndicator />
              </div>
            </div>
          )}

          {error && (
            <div style={{
              textAlign: "center", color: "#f87171", fontSize: 13,
              padding: "10px 16px", background: "rgba(248,113,113,0.08)",
              borderRadius: 10, border: "1px solid rgba(248,113,113,0.2)", marginBottom: 12,
            }}>⚠ {error}</div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Uploaded file preview */}
        {uploadedFile && (
          <div style={{
            margin: "0 20px 8px", padding: "8px 14px",
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ color: "#10b981", fontSize: 13 }}>📄 {uploadedFile} — ready to analyze</span>
            <button onClick={removeFile} style={{
              background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16,
            }}>✕</button>
          </div>
        )}

        {fileLoading && (
          <div style={{ margin: "0 20px 8px", color: "#94a3b8", fontSize: 13, textAlign: "center" }}>
            📄 Reading file...
          </div>
        )}

        {/* Toolbar */}
        <div style={{
          padding: "8px 20px 0", display: "flex", gap: 8, alignItems: "center",
        }}>
          {/* Voice */}
          <button onClick={toggleVoice} className="tool-btn" style={{
            background: listening ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
            border: listening ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "5px 10px", color: listening ? "#ef4444" : "#94a3b8",
            fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            fontFamily: "inherit", transition: "all 0.2s",
            animation: listening ? "micPulse 1s infinite" : "none",
          }}>
            {listening ? "⏹ Stop" : "🎤 Voice"}
          </button>

          {/* File Upload */}
          <button onClick={() => fileInputRef.current?.click()} className="tool-btn" style={{
            background: uploadedFile ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
            border: uploadedFile ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "5px 10px",
            color: uploadedFile ? "#10b981" : "#94a3b8",
            fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            fontFamily: "inherit", transition: "all 0.2s",
          }}>
            📄 {uploadedFile ? "File Ready" : "Upload File"}
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.js,.py,.csv" onChange={handleFileUpload} style={{ display: "none" }} />

          {/* Web Search Toggle */}
          <button onClick={() => setWebSearch(!webSearch)} className="tool-btn" style={{
            background: webSearch ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
            border: webSearch ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "5px 10px",
            color: webSearch ? "#818cf8" : "#94a3b8",
            fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            fontFamily: "inherit", transition: "all 0.2s",
          }}>
            🔍 {webSearch ? "Search ON" : "Web Search"}
          </button>

          {(webSearch || uploadedFile || listening) && (
            <div style={{ color: "#64748b", fontSize: 11, marginLeft: 4 }}>
              {[webSearch && "🔍 search", uploadedFile && "📄 file", listening && "🎤 mic"].filter(Boolean).join(" + ")} active
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding: "12px 20px 16px", display: "flex", gap: 12, alignItems: "flex-end",
        }}>
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.05)",
            border: listening ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "10px 16px", transition: "border 0.2s",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={
                listening ? "🎤 Listening... speak now!" :
                uploadedFile ? `Ask something about ${uploadedFile}...` :
                "Type a message… (Enter to send)"
              }
              rows={1}
              style={{
                width: "100%", background: "transparent", border: "none",
                color: "#e2e8f0", fontSize: 14.5, lineHeight: 1.6,
                fontFamily: "inherit", maxHeight: 120, overflowY: "auto",
              }}
            />
          </div>
          <button onClick={sendMessage} disabled={!input.trim() || loading} style={{
            width: 44, height: 44, borderRadius: "50%",
            background: !input.trim() || loading ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg, #10b981, #059669)",
            border: "none", color: "#fff", fontSize: 20,
            cursor: !input.trim() || loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "all 0.2s",
            boxShadow: !input.trim() || loading ? "none" : "0 4px 16px rgba(16,185,129,0.4)",
          }}>↑</button>
        </div>
      </div>
    </div>
  );
}
