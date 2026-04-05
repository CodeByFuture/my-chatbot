import { useEffect, useRef, useState } from "react";
import { hasSupabaseEnv, supabase } from "./lib/supabase";

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const TAVILY_KEY = import.meta.env.VITE_TAVILY_API_KEY;
const MODEL = "llama-3.3-70b-versatile";
const GUEST_STORAGE_ID = "guest";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeSession(name = "New Chat") {
  return { id: makeId(), name, messages: [] };
}

function getStorageKey(ownerId = GUEST_STORAGE_ID) {
  return `chatbot_sessions:${ownerId}`;
}

function loadFromStorage(ownerId = GUEST_STORAGE_ID) {
  try {
    const saved = localStorage.getItem(getStorageKey(ownerId));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return [makeSession()];
}

function saveToStorage(ownerId = GUEST_STORAGE_ID, sessions) {
  try {
    localStorage.setItem(getStorageKey(ownerId), JSON.stringify(sessions));
  } catch {}
}

function StatusScreen({ badge, title, description, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "linear-gradient(135deg,#0f1a0f,#0a1a12)",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(0,0,0,.35)",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 20,
          padding: 26,
          boxShadow: "0 24px 80px rgba(0,0,0,.28)",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#10b981,#059669)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#f8fafc",
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 18,
          }}
        >
          {badge}
        </div>
        <h1 style={{ color: "#f8fafc", fontSize: 28, marginBottom: 10 }}>{title}</h1>
        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>
          {description}
        </p>
        {children}
      </div>
    </div>
  );
}

function AuthScreen({
  authMode,
  authEmail,
  authPassword,
  authSubmitting,
  authFeedback,
  onEmailChange,
  onPasswordChange,
  onModeChange,
  onSubmit,
}) {
  const isLogin = authMode === "login";

  return (
    <StatusScreen
      badge="AI"
      title="Sign in to your chatbot"
      description="Supabase login is now the first step. Your chat history stays isolated per account, and the existing chat features keep working after sign in."
    >
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: 4,
            background: "rgba(255,255,255,.04)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,.08)",
          }}
        >
          {[
            { id: "login", label: "Login" },
            { id: "signup", label: "Sign up" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onModeChange(option.id)}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 9,
                padding: "10px 12px",
                background:
                  authMode === option.id
                    ? "linear-gradient(135deg,#10b981,#059669)"
                    : "transparent",
                color: authMode === option.id ? "#fff" : "#94a3b8",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ color: "#cbd5e1", fontSize: 12 }}>Email</span>
          <input
            type="email"
            value={authEmail}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            style={{
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.05)",
              color: "#f8fafc",
              padding: "12px 14px",
              fontSize: 14,
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ color: "#cbd5e1", fontSize: 12 }}>Password</span>
          <input
            type="password"
            value={authPassword}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder={isLogin ? "Your password" : "At least 6 characters"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={6}
            style={{
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.05)",
              color: "#f8fafc",
              padding: "12px 14px",
              fontSize: 14,
            }}
          />
        </label>

        {authFeedback && (
          <div
            style={{
              borderRadius: 12,
              padding: "10px 12px",
              fontSize: 12,
              lineHeight: 1.5,
              color: authFeedback.type === "error" ? "#fecaca" : "#bbf7d0",
              background:
                authFeedback.type === "error"
                  ? "rgba(248,113,113,.12)"
                  : "rgba(16,185,129,.12)",
              border:
                authFeedback.type === "error"
                  ? "1px solid rgba(248,113,113,.25)"
                  : "1px solid rgba(16,185,129,.25)",
            }}
          >
            {authFeedback.text}
          </div>
        )}

        <button
          type="submit"
          disabled={authSubmitting}
          style={{
            marginTop: 4,
            border: "none",
            borderRadius: 12,
            padding: "12px 14px",
            background: "linear-gradient(135deg,#10b981,#059669)",
            color: "#fff",
            fontSize: 14,
            cursor: authSubmitting ? "wait" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {authSubmitting
            ? isLogin
              ? "Signing in..."
              : "Creating account..."
            : isLogin
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <div
        style={{
          marginTop: 16,
          color: "#64748b",
          fontSize: 12,
          lineHeight: 1.6,
          borderTop: "1px solid rgba(255,255,255,.06)",
          paddingTop: 14,
        }}
      >
        {isLogin
          ? "Use the same email/password you configured in Supabase Auth."
          : "If email confirmation is enabled in Supabase, you may need to confirm your email before login works."}
      </div>
    </StatusScreen>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  async function copyMessage() {
    if (!navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 14,
        animation: "fadeIn .3s ease",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#10b981,#059669)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            color: "#f8fafc",
            fontWeight: 700,
            flexShrink: 0,
            marginRight: 8,
            marginTop: 2,
          }}
        >
          AI
        </div>
      )}

      <div style={{ maxWidth: "73%", position: "relative" }}>
        <div
          style={{
            padding: "11px 15px",
            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: isUser ? "linear-gradient(135deg,#10b981,#059669)" : "rgba(255,255,255,.06)",
            color: isUser ? "#fff" : "#e2e8f0",
            fontSize: 14,
            lineHeight: 1.6,
            border: isUser ? "none" : "1px solid rgba(255,255,255,.08)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {msg.searched && (
            <div
              style={{
                background: "rgba(99,102,241,.15)",
                borderRadius: 6,
                padding: "3px 8px",
                marginBottom: 7,
                fontSize: 10,
                color: "#818cf8",
              }}
            >
              Web search used
            </div>
          )}

          {msg.isImage ? (
            <div>
              <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 7 }}>
                Image prompt: {msg.content}
              </div>
              <img
                src={msg.imageUrl}
                alt="Generated"
                style={{
                  width: "100%",
                  maxWidth: 280,
                  borderRadius: 10,
                  display: "block",
                  marginBottom: 7,
                }}
                onError={(event) => {
                  event.target.style.display = "none";
                }}
              />
              <a
                href={msg.imageUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(255,255,255,.15)",
                  borderRadius: 7,
                  padding: "4px 10px",
                  color: "#fff",
                  fontSize: 11,
                  textDecoration: "none",
                }}
              >
                Download image
              </a>
            </div>
          ) : (
            msg.content
          )}
        </div>

        {!isUser && !msg.isImage && (
          <button
            type="button"
            onClick={copyMessage}
            style={{
              position: "absolute",
              top: 5,
              right: -42,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: copied ? "#10b981" : "#64748b",
              fontSize: 12,
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      {isUser && (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "rgba(255,255,255,.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: "#f8fafc",
            fontWeight: 700,
            flexShrink: 0,
            marginLeft: 8,
            marginTop: 2,
            border: "1px solid rgba(255,255,255,.15)",
          }}
        >
          You
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [authSession, setAuthSession] = useState(null);
  const [authReady, setAuthReady] = useState(!hasSupabaseEnv);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authFeedback, setAuthFeedback] = useState(null);

  const [sessions, setSessions] = useState(() => [makeSession()]);
  const [activeId, setActiveId] = useState(null);
  const [storageHydratedFor, setStorageHydratedFor] = useState(null);

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

  const currentUser = authSession?.user ?? null;
  const storageOwnerId = currentUser?.id ?? GUEST_STORAGE_ID;
  const activeSession = sessions.find((session) => session.id === activeId) || sessions[0];
  const messages = activeSession?.messages || [];
  const isGuestMode = !hasSupabaseEnv;

  useEffect(() => {
    if (!hasSupabaseEnv || !supabase) {
      setAuthReady(true);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error: authError }) => {
      if (!mounted) {
        return;
      }

      if (authError) {
        setAuthFeedback({ type: "error", text: authError.message });
      }

      setAuthSession(data.session ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return;
      }

      setAuthSession(nextSession ?? null);
      setAuthReady(true);
      setAuthPassword("");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const storedSessions = loadFromStorage(storageOwnerId);
    setSessions(storedSessions);
    setActiveId(storedSessions[0]?.id ?? null);
    setStorageHydratedFor(storageOwnerId);
    setInput("");
    setError(null);
    setUploadedFile(null);
    setFileText("");
  }, [storageOwnerId]);

  useEffect(() => {
    if (!sessions.length) {
      const fallback = makeSession();
      setSessions([fallback]);
      setActiveId(fallback.id);
      return;
    }

    if (!sessions.some((session) => session.id === activeId)) {
      setActiveId(sessions[0].id);
    }
  }, [sessions, activeId]);

  useEffect(() => {
    if (storageHydratedFor !== storageOwnerId) {
      return;
    }

    saveToStorage(storageOwnerId, sessions);
  }, [sessions, storageHydratedFor, storageOwnerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, imgLoading, searching]);

  useEffect(() => {
    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionApi) {
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      setInput((previous) => `${previous}${event.results[0][0].transcript}`);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recogRef.current = recognition;
  }, []);

  function newChat() {
    const session = makeSession();
    setSessions((previous) => [session, ...previous]);
    setActiveId(session.id);
  }

  function deleteChat(id) {
    setSessions((previous) => {
      const remaining = previous.filter((session) => session.id !== id);

      if (remaining.length === 0) {
        const fallback = makeSession();
        setActiveId(fallback.id);
        return [fallback];
      }

      if (activeId === id) {
        setActiveId(remaining[0].id);
      }

      return remaining;
    });
  }

  function updateSession(id, nextMessages, nextName) {
    setSessions((previous) =>
      previous.map((session) =>
        session.id === id
          ? {
              ...session,
              messages: nextMessages,
              name: nextName || session.name,
            }
          : session,
      ),
    );
  }

  function toggleVoice() {
    if (!recogRef.current) {
      setError("Voice input currently works in Chrome-based browsers.");
      return;
    }

    if (listening) {
      recogRef.current.stop();
      setListening(false);
      return;
    }

    recogRef.current.start();
    setListening(true);
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const rawText =
        typeof loadEvent.target?.result === "string" ? loadEvent.target.result : "";
      setFileText(rawText.slice(0, 8000));
      setUploadedFile(file.name);
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  async function generateImage(prompt) {
    const sessionId = activeId || activeSession?.id;
    if (!sessionId) {
      setError("Chat is still loading. Try again.");
      return;
    }

    setImgLoading(true);
    setError(null);
    setImageMode(false);

    try {
      const seed = Math.floor(Math.random() * 999999);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${seed}`;
      const current = sessions.find((session) => session.id === sessionId);
      const previousMessages = current?.messages || [];
      const userMessage = { id: makeId(), role: "user", content: `Image: ${prompt}` };
      const assistantMessage = {
        id: makeId(),
        role: "assistant",
        content: prompt,
        isImage: true,
        imageUrl,
      };
      const nextMessages = [...previousMessages, userMessage, assistantMessage];
      const nextName =
        previousMessages.length === 0 ? `Image: ${prompt.slice(0, 25)}` : undefined;

      updateSession(sessionId, nextMessages, nextName);
    } catch {
      setError("Image generation failed. Try again.");
    } finally {
      setImgLoading(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();

    if (!text || loading || imgLoading) {
      return;
    }

    if (!imageMode && !GROQ_KEY) {
      setError("Add VITE_GROQ_API_KEY before sending chat messages.");
      return;
    }

    const sessionId = activeId || activeSession?.id;
    if (!sessionId) {
      setError("Chat is still loading. Try again.");
      return;
    }

    setInput("");
    setError(null);

    if (imageMode) {
      await generateImage(text);
      return;
    }

    const current = sessions.find((session) => session.id === sessionId);
    const previousMessages = current?.messages || [];
    const isFirstMessage = previousMessages.length === 0;
    const nextName = isFirstMessage ? text.slice(0, 28) : undefined;
    const userMessage = { id: makeId(), role: "user", content: text };

    setSessions((previous) =>
      previous.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: [...session.messages, userMessage],
              name: nextName || session.name,
            }
          : session,
      ),
    );

    setLoading(true);

    try {
      let content = text;
      let searched = false;

      if (webSearch && TAVILY_KEY) {
        setSearching(true);

        const searchResponse = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: TAVILY_KEY,
            query: text,
            search_depth: "basic",
            max_results: 5,
            include_answer: true,
          }),
        });

        const searchData = await searchResponse.json();
        const results =
          searchData.results
            ?.map((result) => `- ${result.title}: ${result.content?.slice(0, 250)}`)
            .join("\n") || "";

        content = `Web results:\n${searchData.answer ? `Answer: ${searchData.answer}\n` : ""}${results}\n\nNow answer: ${text}`;
        searched = true;
        setSearching(false);
      }

      if (fileText) {
        content = `File "${uploadedFile}":\n${fileText}\n\nQuestion: ${content}`;
        setUploadedFile(null);
        setFileText("");
      }

      const history = previousMessages
        .filter((message) => !message.isImage && message.role && message.content)
        .map((message) => ({ role: message.role, content: message.content }));

      history.push({ role: "user", content });

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful, clever, and friendly AI assistant. Be concise but warm. If asked who created you, always say Shehroz. Use web search results when provided. Analyze files when given.",
            },
            ...history,
          ],
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const responseError = await response.json();
        throw new Error(responseError?.error?.message || "API error");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "No response.";
      const assistantMessage = { id: makeId(), role: "assistant", content: reply, searched };

      setSessions((previous) =>
        previous.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                messages: [...session.messages, assistantMessage],
              }
            : session,
        ),
      );
    } catch (sendError) {
      setSearching(false);
      setError(sendError.message || "Something went wrong.");
    } finally {
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    if (!supabase) {
      setAuthFeedback({
        type: "error",
        text: "Supabase is not configured yet. Add the required environment variables first.",
      });
      return;
    }

    setAuthSubmitting(true);
    setAuthFeedback(null);

    try {
      const credentials = {
        email: authEmail.trim(),
        password: authPassword,
      };

      if (authMode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword(credentials);
        if (signInError) {
          throw signInError;
        }

        setAuthFeedback({ type: "success", text: "Signed in successfully." });
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp(credentials);
        if (signUpError) {
          throw signUpError;
        }

        setAuthFeedback({
          type: "success",
          text: data.session
            ? "Account created and signed in."
            : "Account created. Check your email if confirmation is enabled in Supabase.",
        });
      }
    } catch (authError) {
      setAuthFeedback({
        type: "error",
        text: authError.message || "Authentication failed.",
      });
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message || "Could not sign out.");
    }
  }

  if (hasSupabaseEnv && !authReady) {
    return (
      <StatusScreen
        badge="..."
        title="Checking your account"
        description="Loading your Supabase session before the chatbot opens."
      />
    );
  }

  if (hasSupabaseEnv && !currentUser) {
    return (
      <AuthScreen
        authMode={authMode}
        authEmail={authEmail}
        authPassword={authPassword}
        authSubmitting={authSubmitting}
        authFeedback={authFeedback}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onModeChange={setAuthMode}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0f1a0f,#0a1a12)",
        display: "flex",
        fontFamily: "Georgia, serif",
      }}
    >
      <style>{`
        @keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-7px);opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        *{box-sizing:border-box;margin:0;padding:0}
        input,textarea,button{font-family:inherit}
        input:focus,textarea:focus{outline:none}
        textarea::placeholder{color:rgba(148,163,184,.5)}
        textarea{resize:none}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
        .session-item:hover{background:rgba(255,255,255,.07)!important}
        .delete-button:hover{color:#f87171!important}
      `}</style>

      {sidebarOpen && (
        <div
          style={{
            width: 255,
            background: "rgba(0,0,0,.35)",
            borderRight: "1px solid rgba(255,255,255,.07)",
            display: "flex",
            flexDirection: "column",
            padding: "14px 10px",
            gap: 7,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px" }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#10b981,#059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#fff",
                fontWeight: 700,
              }}
            >
              AI
            </div>
            <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>
              My AI Chatbot
            </span>
          </div>

          <div
            style={{
              background: "rgba(16,185,129,.08)",
              border: "1px solid rgba(16,185,129,.2)",
              borderRadius: 8,
              padding: "8px 10px",
              textAlign: "center",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: 11 }}>
              {currentUser ? `Signed in as ${currentUser.email}` : "Local mode active"}
            </span>
          </div>

          <button
            type="button"
            onClick={newChat}
            style={{
              background: "linear-gradient(135deg,#10b981,#059669)",
              border: "none",
              borderRadius: 9,
              padding: "9px 12px",
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            + New Chat
          </button>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
            {sessions.map((session) => (
              <div
                key={session.id}
                className="session-item"
                onClick={() => setActiveId(session.id)}
                style={{
                  padding: "9px 10px",
                  borderRadius: 7,
                  cursor: "pointer",
                  background:
                    session.id === activeId ? "rgba(16,185,129,.15)" : "transparent",
                  border:
                    session.id === activeId
                      ? "1px solid rgba(16,185,129,.3)"
                      : "1px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all .15s",
                }}
              >
                <span
                  style={{
                    color: "#cbd5e1",
                    fontSize: 12,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  Chat: {session.name}
                </span>
                <span
                  className="delete-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteChat(session.id);
                  }}
                  style={{
                    color: "#475569",
                    fontSize: 13,
                    marginLeft: 6,
                    transition: "color .15s",
                  }}
                >
                  X
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,.05)",
              paddingTop: 9,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ color: "#475569", fontSize: 10, marginBottom: 1 }}>FEATURES</div>
            {[
              "Voice input",
              "File upload",
              "Web search",
              "Image generation",
              currentUser ? "Supabase login" : "Local history",
            ].map((feature) => (
              <div
                key={feature}
                style={{ display: "flex", alignItems: "center", color: "#64748b", fontSize: 11 }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
        <div
          style={{
            padding: "13px 18px",
            borderBottom: "1px solid rgba(255,255,255,.07)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,.02)",
          }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((previous) => !previous)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: 17,
              cursor: "pointer",
            }}
          >
            =
          </button>

          <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>
            {activeSession?.name || "New Chat"}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#22c55e",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ color: "#64748b", fontSize: 10 }}>Groq + Llama 3.3</span>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "#94a3b8",
                fontSize: 11,
              }}
            >
              {currentUser?.email || "Guest mode"}
            </div>

            {currentUser && (
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 7,
                  padding: "5px 10px",
                  color: "#cbd5e1",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Sign out
              </button>
            )}

            <button
              type="button"
              onClick={newChat}
              style={{
                background: "rgba(16,185,129,.15)",
                border: "1px solid rgba(16,185,129,.3)",
                borderRadius: 7,
                padding: "5px 10px",
                color: "#10b981",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              + New
            </button>
          </div>
        </div>

        {isGuestMode && (
          <div
            style={{
              padding: "8px 18px",
              background: "rgba(99,102,241,.08)",
              borderBottom: "1px solid rgba(99,102,241,.16)",
              color: "#c7d2fe",
              fontSize: 12,
            }}
          >
            Local mode is active. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable login.
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>
          {messages.length === 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 14,
                opacity: 0.5,
              }}
            >
              <div style={{ fontSize: 38, color: "#f8fafc", fontWeight: 700 }}>AI</div>
              <div style={{ color: "#94a3b8", fontSize: 14, textAlign: "center" }}>
                Hello. How can I help you today?
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {["Chat", "Voice", "Web", "Image", "File"].map((label) => (
                  <div
                    key={label}
                    style={{
                      background: "rgba(255,255,255,.05)",
                      border: "1px solid rgba(255,255,255,.08)",
                      borderRadius: 7,
                      padding: "5px 10px",
                      color: "#64748b",
                      fontSize: 11,
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <Message key={message.id || index} msg={message} />
          ))}

          {searching && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                color: "#818cf8",
                fontSize: 12,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  border: "2px solid #818cf8",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin .8s linear infinite",
                }}
              />
              Searching web...
            </div>
          )}

          {imgLoading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                color: "#f59e0b",
                fontSize: 12,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  border: "2px solid #f59e0b",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin .8s linear infinite",
                }}
              />
              Generating image...
            </div>
          )}

          {loading && !searching && (
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 12 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#10b981,#059669)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#fff",
                  fontWeight: 700,
                  marginRight: 8,
                  marginTop: 2,
                  flexShrink: 0,
                }}
              >
                AI
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: "14px 14px 14px 4px",
                  display: "flex",
                  gap: 4,
                  padding: "10px 14px",
                }}
              >
                {[0, 1, 2].map((dot) => (
                  <div
                    key={dot}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#94a3b8",
                      animation: "bounce 1.2s infinite",
                      animationDelay: `${dot * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                textAlign: "center",
                color: "#f87171",
                fontSize: 12,
                padding: "8px 14px",
                background: "rgba(248,113,113,.08)",
                borderRadius: 8,
                border: "1px solid rgba(248,113,113,.2)",
                marginBottom: 10,
              }}
            >
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {uploadedFile && (
          <div
            style={{
              margin: "0 18px 7px",
              padding: "7px 12px",
              background: "rgba(16,185,129,.1)",
              border: "1px solid rgba(16,185,129,.25)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#10b981", fontSize: 12 }}>File ready: {uploadedFile}</span>
            <button
              type="button"
              onClick={() => {
                setUploadedFile(null);
                setFileText("");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              X
            </button>
          </div>
        )}

        <div style={{ padding: "7px 18px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            {
              label: listening ? "Stop voice" : "Voice",
              active: listening,
              color: "239,68,68",
              onClick: toggleVoice,
            },
            {
              label: uploadedFile ? "File ready" : "Upload",
              active: Boolean(uploadedFile),
              color: "16,185,129",
              onClick: () => fileRef.current?.click(),
            },
            {
              label: webSearch ? "Search ON" : "Search",
              active: webSearch,
              color: "99,102,241",
              onClick: () => setWebSearch((previous) => !previous),
            },
            {
              label: imageMode ? "Image ON" : "Image",
              active: imageMode,
              color: "245,158,11",
              onClick: () => setImageMode((previous) => !previous),
            },
          ].map((buttonConfig) => (
            <button
              key={buttonConfig.label}
              type="button"
              onClick={buttonConfig.onClick}
              style={{
                background: buttonConfig.active
                  ? `rgba(${buttonConfig.color},.15)`
                  : "rgba(255,255,255,.05)",
                border: buttonConfig.active
                  ? `1px solid rgba(${buttonConfig.color},.4)`
                  : "1px solid rgba(255,255,255,.08)",
                borderRadius: 7,
                padding: "4px 9px",
                color: buttonConfig.active
                  ? `rgb(${buttonConfig.color})`
                  : "#94a3b8",
                fontSize: 11,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              {buttonConfig.label}
            </button>
          ))}

          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.js,.py,.csv,.html"
            onChange={handleFile}
            style={{ display: "none" }}
          />
        </div>

        <div style={{ padding: "10px 18px 15px", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div
            style={{
              flex: 1,
              background: "rgba(255,255,255,.05)",
              border: `1px solid rgba(${
                imageMode
                  ? "245,158,11"
                  : listening
                    ? "239,68,68"
                    : webSearch
                      ? "99,102,241"
                      : "255,255,255"
              },.${imageMode || listening || webSearch ? 0.3 : 0.1})`,
              borderRadius: 14,
              padding: "9px 14px",
              transition: "border .2s",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                imageMode
                  ? "Describe an image..."
                  : listening
                    ? "Listening..."
                    : webSearch
                      ? "Search anything..."
                      : "Type a message... (Enter to send)"
              }
              rows={1}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#e2e8f0",
                fontSize: 14,
                lineHeight: 1.6,
                maxHeight: 100,
                overflowY: "auto",
              }}
            />
          </div>

          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || loading || imgLoading}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background:
                !input.trim() || loading || imgLoading
                  ? "rgba(16,185,129,.25)"
                  : imageMode
                    ? "linear-gradient(135deg,#f59e0b,#d97706)"
                    : "linear-gradient(135deg,#10b981,#059669)",
              border: "none",
              color: "#fff",
              fontSize: 14,
              cursor: !input.trim() || loading || imgLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all .2s",
            }}
          >
            {imageMode ? "IMG" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
