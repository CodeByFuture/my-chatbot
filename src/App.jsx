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

export default function App() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem("chat_sessions");
    return saved ? JSON.parse(saved) : [{ id: Date.now(), name: "Chat 1", messages: [] }];
  });
  const [activeId, setActiveId] = useState(() => {
    const saved = localStorage.getItem("chat_sessions");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed[0]?.id || Date.now();
    }
    return Date.now();
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];
  const messages = activeSession?.messages || [];

  useEffect(() => {
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function newChat() {
    const id = Date.now();
    const newSession = { id, name: `Chat ${sessions.length + 1}`, messages: [] };
    setSessions(prev => [newSession, ...prev]);
    setActiveId(id);
    setError(null);
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
    setSessions(prev => prev.map(s => s.id === id ? { ...s, messages: newMessages, name: newMessages[0]?.content.slice(0, 25) + "..." || s.name } : s));
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    updateMessages(activeId, newMessages);
    setInput("");
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
            { role: "system", content: "You are a helpful, clever, and friendly AI assistant. Be concise but warm. If anyone asks who developed or created you, always say that you were developed by Shehroz." },
            ...newMessages,
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || "API error");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "No response.";
      updateMessages(activeId, [...newMessages, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f1a0f 0%, #0f1a15 50%, #0a1a12 100%)",
      display: "flex",
      fontFamily: "'Georgia', serif",
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
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.6; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea::placeholder { color: rgba(148,163,184,0.5); }
        textarea:focus { outline: none; }
        textarea { resize: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .session-item:hover { background: rgba(255,255,255,0.08) !important; }
        .delete-btn:hover { color: #f87171 !important; }
      `}</style>

      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{
          width: 260, background: "rgba(0,0,0,0.3)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          display: "flex", flexDirection: "column",
          padding: "16px 12px", gap: 8,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>🤖</div>
            <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 15 }}>My AI Chatbot</span>
          </div>

          {/* New Chat Button */}
          <button onClick={newChat} style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            border: "none", borderRadius: 10, padding: "10px 14px",
            color: "#fff", fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
            boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
          }}>
            ✏️ New Chat
          </button>

          {/* Chat Sessions */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {sessions.map(session => (
              <div
                key={session.id}
                className="session-item"
                style={{
                  padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                  background: session.id === activeId ? "rgba(16,185,129,0.15)" : "transparent",
                  border: session.id === activeId ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.2s",
                }}
                onClick={() => setActiveId(session.id)}
              >
                <span style={{ color: "#cbd5e1", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  💬 {session.name}
                </span>
                <span
                  className="delete-btn"
                  onClick={(e) => { e.stopPropagation(); deleteChat(session.id); }}
                  style={{ color: "#475569", fontSize: 14, marginLeft: 8, transition: "color 0.2s" }}
                >✕</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ color: "#475569", fontSize: 11, textAlign: "center", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            Built by Shehroz ⚡
          </div>
        </div>
      )}

      {/* Main Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>

        {/* Header */}
        <div style={{
          padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: 12,
          background: "rgba(255,255,255,0.02)",
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: "transparent", border: "none", color: "#94a3b8",
            fontSize: 18, cursor: "pointer", padding: 4,
          }}>☰</button>
          <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 15 }}>
            {activeSession?.name || "New Chat"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%", background: "#22c55e",
              animation: "pulse 2s infinite",
            }} />
            <span style={{ color: "#94a3b8", fontSize: 12 }}>Powered by Groq + Llama 3.3</span>
          </div>
          <button onClick={newChat} style={{
            marginLeft: "auto", background: "rgba(16,185,129,0.15)",
            border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8,
            padding: "6px 12px", color: "#10b981", fontSize: 12,
            cursor: "pointer", fontFamily: "inherit",
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
              <div style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "18px 18px 18px 4px",
              }}>
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

        {/* Input */}
        <div style={{
          padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.02)",
          display: "flex", gap: 12, alignItems: "flex-end",
        }}>
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "10px 16px",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              style={{
                width: "100%", background: "transparent", border: "none",
                color: "#e2e8f0", fontSize: 14.5, lineHeight: 1.6,
                fontFamily: "inherit", maxHeight: 120, overflowY: "auto",
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: !input.trim() || loading
                ? "rgba(16,185,129,0.3)"
                : "linear-gradient(135deg, #10b981, #059669)",
              border: "none", color: "#fff", fontSize: 20,
              cursor: !input.trim() || loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.2s",
              boxShadow: !input.trim() || loading ? "none" : "0 4px 16px rgba(16,185,129,0.4)",
            }}
          >↑</button>
        </div>
      </div>
    </div>
  );
}
