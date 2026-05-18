import { useState } from "react";

export default function JoinModal({ onJoinByCode, onClose }) {
  const [code, setCode]       = useState("");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) return setError("Please enter an invite code.");
    setLoading(true);
    setError("");
    setSuccess("");
    const { error, task } = await onJoinByCode(code.trim());
    if (error) {
      setError(error.message);
    } else {
      setSuccess(`✅ Joined "${task?.title}" successfully! Check the Shared tab.`);
      setCode("");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card" style={{ width: "100%", maxWidth: "420px", padding: "2rem" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: "1.5rem",
        }}>
          <div>
            <h2 style={{
              fontFamily: "var(--font-heading)", fontSize: "1.2rem",
              fontWeight: 700, color: "#F1F5F9", marginBottom: "0.2rem",
            }}>
              🔗 Join a Task
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#64748B" }}>
              Enter an invite code from a teammate
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px", height: "32px", borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "transparent", color: "#64748B",
              cursor: "pointer", fontSize: "1rem",
            }}
          >✕</button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "10px", padding: "0.75rem 1rem",
            marginBottom: "1rem", color: "#EF4444",
            fontFamily: "var(--font-body)", fontSize: "0.85rem",
          }}>
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            backgroundColor: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "10px", padding: "0.75rem 1rem",
            marginBottom: "1rem", color: "#10B981",
            fontFamily: "var(--font-body)", fontSize: "0.85rem",
          }}>
            {success}
          </div>
        )}

        {/* Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="e.g. A1B2C3D4"
            autoFocus
            style={{
              width: "100%", padding: "0.875rem 1rem",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "#F1F5F9", fontFamily: "var(--font-mono)",
              fontSize: "1.25rem", letterSpacing: "0.2em",
              textAlign: "center", outline: "none", transition: "border 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
            onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
          />

          <button
            onClick={handleJoin}
            disabled={loading || !code.trim()}
            style={{
              width: "100%", padding: "0.75rem",
              borderRadius: "10px", border: "none",
              background: loading || !code.trim()
                ? "rgba(91,140,255,0.4)"
                : "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
              color: "white", fontFamily: "var(--font-body)",
              fontWeight: 600, fontSize: "0.95rem",
              cursor: loading || !code.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Joining..." : "Join Task"}
          </button>

          {success && (
            <button
              onClick={onClose}
              style={{
                width: "100%", padding: "0.625rem",
                borderRadius: "10px",
                border: "1px solid rgba(16,185,129,0.3)",
                backgroundColor: "rgba(16,185,129,0.1)",
                color: "#10B981", fontFamily: "var(--font-body)",
                fontWeight: 500, fontSize: "0.875rem", cursor: "pointer",
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}