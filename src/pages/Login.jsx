import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login({ onSwitchToRegister }) {
  const { signIn } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true);
    setError("");
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        className="glass-card"
        style={{ width: "100%", maxWidth: "420px", padding: "2.5rem" }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              margin: "0 auto 1rem",
            }}
          >
            ✦
          </div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#F1F5F9",
              marginBottom: "0.25rem",
            }}
          >
            Welcome back
          </h1>
          <p style={{ color: "#64748B", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
            Sign in to your TaskEase account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              color: "#EF4444",
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "#94A3B8",
                marginBottom: "0.4rem",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                width: "100%",
                padding: "0.7rem 1rem",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#F1F5F9",
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                outline: "none",
                transition: "border 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "#94A3B8",
                marginBottom: "0.4rem",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                width: "100%",
                padding: "0.7rem 1rem",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#F1F5F9",
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                outline: "none",
                transition: "border 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "10px",
              border: "none",
              background: loading
                ? "rgba(91,140,255,0.5)"
                : "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
              color: "white",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              marginTop: "0.5rem",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        {/* Switch to register */}
        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.875rem",
            color: "#64748B",
          }}
        >
          Don't have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            style={{
              background: "none",
              border: "none",
              color: "#5B8CFF",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}