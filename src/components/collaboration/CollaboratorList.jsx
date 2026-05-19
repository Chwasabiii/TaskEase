const ROLE_COLORS = {
  owner:  { color: "#5B8CFF", bg: "rgba(91,140,255,0.1)"  },
  editor: { color: "#10B981", bg: "rgba(16,185,129,0.1)"  },
  viewer: { color: "var(--color-muted)", bg: "rgba(100,116,139,0.1)" },
};

export default function CollaboratorList({ collaborators, currentUserId, onUpdateRole, onRemove }) {
  const getInitial = (profile) =>
    profile?.full_name?.[0]?.toUpperCase() ?? "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
      {collaborators.map((c) => {
        const role    = ROLE_COLORS[c.role] || ROLE_COLORS.viewer;
        const isOwner = c.role === "owner";
        const isSelf  = c.user_id === currentUserId;

        return (
          <div
            key={c.id}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.625rem 0.875rem",
              borderRadius: "10px",
              backgroundColor: "var(--color-subtle)",
              border: "1px solid var(--color-border)",
            }}
          >
            {/* Avatar */}
            <div style={{
              width: "34px", height: "34px", borderRadius: "8px",
              background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-heading)", fontWeight: 700,
              fontSize: "0.8rem", color: "white", flexShrink: 0,
            }}>
              {getInitial(c.profile)}
            </div>

            {/* Name */}
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.875rem",
                fontWeight: 500, color: "var(--color-muted)",
              }}>
                {c.profile?.full_name ?? "Unknown User"}
                {isSelf && (
                  <span style={{ color: "var(--color-muted)", fontWeight: 400, marginLeft: "0.4rem" }}>
                    (you)
                  </span>
                )}
              </p>
            </div>

            {/* Role badge / selector */}
            {isOwner ? (
              <span style={{
                padding: "2px 10px", borderRadius: "20px",
                fontSize: "0.75rem", fontWeight: 600,
                fontFamily: "var(--font-body)",
                backgroundColor: role.bg, color: role.color,
              }}>
                owner
              </span>
            ) : (
              <select
                value={c.role}
                onChange={(e) => onUpdateRole(c.id, e.target.value)}
                disabled={isSelf}
                style={{
                  padding: "3px 8px", borderRadius: "8px",
                  border: `1px solid ${role.color}33`,
                  backgroundColor: role.bg,
                  color: role.color,
                  fontFamily: "var(--font-body)", fontSize: "0.75rem",
                  fontWeight: 600, cursor: isSelf ? "default" : "pointer",
                  outline: "none",
                }}
              >
                <option value="editor">editor</option>
                <option value="viewer">viewer</option>
              </select>
            )}

            {/* Remove */}
            {!isOwner && !isSelf && (
              <button
                onClick={() => onRemove(c.id)}
                style={{
                  width: "28px", height: "28px", borderRadius: "6px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "transparent",
                  color: "var(--color-muted)", cursor: "pointer", fontSize: "0.8rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
                  e.currentTarget.style.color = "#EF4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--color-muted)";
                }}
                title="Remove collaborator"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

