import { useState } from "react";

export default function InviteModal({
  task,
  inviteCode,
  expiresAt,
  loading: inviteLoading = false,
  error: inviteError = "",
  onCreateInvite,
  onJoinByCode,
  onClose,
}) {
  const [code, setCode]       = useState("");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [tab, setTab]         = useState("share"); // "share" | "join"

  const handleCopy = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatExpiry = (date) => date
    ? new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  const handleJoin = async () => {
    if (!code.trim()) return setError("Please enter an invite code.");
    setLoading(true);
    setError("");
    const { error, task: joinedTask } = await onJoinByCode(code.trim());
    if (error) {
      setError(error.message);
    } else {
      setSuccess(`Joined "${joinedTask?.title}" successfully!`);
    }
    setLoading(false);
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: "0.5rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: active ? "rgba(91,140,255,0.15)" : "transparent",
    color: active ? "#5B8CFF" : "var(--color-muted)",
    fontFamily: "var(--font-body)",
    fontSize: "0.875rem",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    transition: "all 0.2s",
  });

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        backgroundColor: "var(--color-overlay)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card" style={{ width: "100%", maxWidth: "440px", padding: "2rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700, color: "var(--color-foreground)" }}>
            Collaboration
          </h2>
          <button
            onClick={onClose}
            style={{
              width: "32px", height: "32px", borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "transparent", color: "var(--color-muted)",
              cursor: "pointer", fontSize: "1rem",
            }}
          >✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "4px", padding: "4px",
          backgroundColor: "var(--color-subtle)",
          borderRadius: "10px", marginBottom: "1.5rem",
        }}>
          <button style={tabStyle(tab === "share")} onClick={() => setTab("share")}>
            Share Task
          </button>
          <button style={tabStyle(tab === "join")} onClick={() => setTab("join")}>
            Join a Task
          </button>
        </div>

        {tab === "share" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--color-muted)" }}>
              Share this secure invite code with teammates to let them join:
            </p>
            {inviteError && (
              <div style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px", padding: "0.75rem 1rem",
                color: "#EF4444", fontFamily: "var(--font-body)", fontSize: "0.85rem",
              }}>
                {inviteError}
              </div>
            )}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.875rem 1rem",
              backgroundColor: "rgba(91,140,255,0.08)",
              border: "1px solid rgba(91,140,255,0.2)",
              borderRadius: "10px",
            }}>
              <span style={{
                flex: 1,
                fontFamily: "var(--font-mono)", fontSize: "1.25rem",
                fontWeight: 700, color: "#5B8CFF",
                letterSpacing: "0.15em",
              }}>
                {inviteLoading ? "CREATING..." : inviteCode || "NO CODE"}
              </span>
              <button
                onClick={handleCopy}
                disabled={!inviteCode || inviteLoading}
                style={{
                  padding: "0.4rem 0.875rem", borderRadius: "8px",
                  border: "1px solid rgba(91,140,255,0.3)",
                  backgroundColor: copied ? "rgba(16,185,129,0.15)" : "rgba(91,140,255,0.15)",
                  color: copied ? "#10B981" : "#5B8CFF",
                  fontFamily: "var(--font-body)", fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: !inviteCode || inviteLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            {expiresAt && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--color-muted)" }}>
                Expires: <span style={{ color: "var(--color-muted)" }}>{formatExpiry(expiresAt)}</span>
              </p>
            )}
            {onCreateInvite && (
              <button
                onClick={onCreateInvite}
                disabled={inviteLoading}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(91,140,255,0.3)",
                  backgroundColor: "rgba(91,140,255,0.1)",
                  color: "#5B8CFF",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  cursor: inviteLoading ? "not-allowed" : "pointer",
                }}
              >
                {inviteLoading ? "Generating..." : "Generate New Code"}
              </button>
            )}
            {task && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--color-muted)" }}>
                Task: <span style={{ color: "var(--color-muted)" }}>{task.title}</span>
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--color-muted)" }}>
              Enter an invite code to join a teammate's task:
            </p>

            {error && (
              <div style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px", padding: "0.75rem 1rem",
                color: "#EF4444", fontFamily: "var(--font-body)", fontSize: "0.85rem",
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{
                backgroundColor: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: "10px", padding: "0.75rem 1rem",
                color: "#10B981", fontFamily: "var(--font-body)", fontSize: "0.85rem",
              }}>
                {success}
              </div>
            )}

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="e.g. A1B2C3D4"
              style={{
                width: "100%", padding: "0.7rem 1rem",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-hover)",
                color: "var(--color-foreground)",
                fontFamily: "var(--font-mono)", fontSize: "1rem",
                letterSpacing: "0.1em", outline: "none",
                transition: "border 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
              onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
            />

            <button
              onClick={handleJoin}
              disabled={loading}
              style={{
                width: "100%", padding: "0.75rem",
                borderRadius: "10px", border: "none",
                background: loading
                  ? "rgba(91,140,255,0.5)"
                  : "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
                color: "white",
                fontFamily: "var(--font-body)", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Joining..." : "Join Task"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

