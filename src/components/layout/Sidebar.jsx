import { useState } from "react";

const navItems = [
  { icon: "⊞", label: "Dashboard",      id: "dashboard" },
  { icon: "✓", label: "My Tasks",        id: "tasks" },
  { icon: "◷", label: "Pomodoro",        id: "pomodoro" },
  { icon: "⌂", label: "Archive",         id: "archive" },
  { icon: "⚡", label: "Focus Mode",     id: "focus" },
  { icon: "👥", label: "Collaboration",  id: "collaboration" },
  { icon: "🔔", label: "Notifications",  id: "notifications" },
];

export default function Sidebar({ activePage, setActivePage }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? "72px" : "240px",
        transition: "width 0.3s ease",
        backgroundColor: "rgba(17,24,39,0.8)",
        backdropFilter: "blur(12px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 40,
        overflowX: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "1.5rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}
        >
          ✦
        </div>
        {!collapsed && (
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "#F1F5F9",
              whiteSpace: "nowrap",
            }}
          >
            TaskEase
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.75rem",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: isActive ? "rgba(91,140,255,0.15)" : "transparent",
                color: isActive ? "#5B8CFF" : "#94A3B8",
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 400,
                width: "100%",
                textAlign: "left",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "#F1F5F9";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#94A3B8";
                }
              }}
            >
              <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <span
                  style={{
                    marginLeft: "auto",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#5B8CFF",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle + User */}
      <div
        style={{
          padding: "0.75rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.625rem 0.75rem",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            backgroundColor: "transparent",
            color: "#64748B",
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            width: "100%",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "#F1F5F9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#64748B";
          }}
        >
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>
            {collapsed ? "→" : "←"}
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}