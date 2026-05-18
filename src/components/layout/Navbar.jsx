export default function Navbar({ activePage, user, onSignOut, setActivePage, notifications }) {
  const pageLabels = {
    dashboard:     "Dashboard",
    tasks:         "My Tasks",
    pomodoro:      "Pomodoro Timer",
    archive:       "Archive",
    focus:         "Focus Mode",
    collaboration: "Collaboration",
    notifications: "Notifications",
  };

  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "rgba(15,23,42,0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Page title */}
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "#F1F5F9",
        }}
      >
        {pageLabels[activePage] || "TaskEase"}
      </h1>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "0.4rem 0.875rem",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "0.85rem" }}>🔍</span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#64748B" }}>
            Search tasks...
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              color: "#475569",
              backgroundColor: "rgba(255,255,255,0.05)",
              padding: "1px 6px",
              borderRadius: "4px",
            }}
          >
            ⌘K
          </span>
        </div>

        {/* Notification bell */}
        <button
          onClick={() => setActivePage("notifications")}
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.05)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            transition: "all 0.2s",
            position: "relative",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
        >
          🔔
          {notifications?.length > 0 && (
            <span
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#EF4444",
                border: "2px solid #0F172A",
              }}
            />
          )}
        </button>

        {/* Avatar */}
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "0.9rem",
            color: "white",
          }}
        >
          {user?.email?.[0].toUpperCase() ?? "U"}
        </div>

        {/* Sign out */}
        <button
          onClick={onSignOut}
          style={{
            padding: "0.4rem 0.875rem",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "#94A3B8",
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
            e.currentTarget.style.color = "#EF4444";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "#94A3B8";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          Sign out
        </button>

      </div>
    </header>
  );
}