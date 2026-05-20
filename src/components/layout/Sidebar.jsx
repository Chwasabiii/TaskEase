const navItems = [
  { icon: "D", label: "Dashboard", id: "dashboard" },
  { icon: "T", label: "My Tasks", id: "tasks" },
  { icon: "P", label: "Pomodoro", id: "pomodoro" },
  { icon: "A", label: "Archive", id: "archive" },
  { icon: "F", label: "Focus Mode", id: "focus" },
  { icon: "C", label: "Collaboration", id: "collaboration" },
];

export default function Sidebar({ activePage, setActivePage, collapsed, setCollapsed }) {
  return (
    <aside
      style={{
        width: collapsed ? "72px" : "240px",
        transition: "width var(--motion-spring)",
        backgroundColor: "var(--color-surface)",
        backdropFilter: "blur(8px)",
        borderRight: "1px solid var(--color-border)",
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
      <button
        onClick={() => setActivePage("dashboard")}
        style={{
          padding: "1.5rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          borderBottom: "1px solid var(--color-border)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          transition: "opacity var(--motion-fast)",
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        aria-label="Go to dashboard"
      >
        <div
          className="interactive-pop"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.9rem",
            fontWeight: 800,
            color: "var(--color-on-primary)",
            flexShrink: 0,
            boxShadow: "0 10px 24px var(--color-glow)",
          }}
        >
          TE
        </div>
        {!collapsed && (
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "var(--color-foreground)",
              whiteSpace: "nowrap",
              opacity: collapsed ? 0 : 1,
              transform: collapsed ? "translateX(-8px)" : "translateX(0)",
              transition: "opacity var(--motion-smooth), transform var(--motion-smooth)",
            }}
          >
            TaskEase
          </span>
        )}
      </button>

      <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              className={`nav-item interactive-pop${isActive ? " is-active" : ""}`}
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
                transition: "color var(--motion-fast), transform var(--motion-fast), box-shadow var(--motion-fast)",
                backgroundColor: "transparent",
                color: isActive ? "var(--color-primary)" : "var(--color-muted)",
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 400,
                width: "100%",
                textAlign: "left",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: "0.82rem", fontWeight: 800, flexShrink: 0, width: "1.1rem", textAlign: "center" }}>
                {item.icon}
              </span>
              {!collapsed && (
                <span
                  style={{
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? "translateX(-8px)" : "translateX(0)",
                    transition: "opacity var(--motion-smooth), transform var(--motion-smooth)",
                  }}
                >
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && (
                <span
                  style={{
                    marginLeft: "auto",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-primary)",
                    boxShadow: "0 0 0 4px var(--color-primary-soft)",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div
        style={{
          padding: "0.75rem",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <button
          className="interactive-pop"
          onClick={() => setCollapsed((current) => !current)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.625rem 0.75rem",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            backgroundColor: "transparent",
            color: "var(--color-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            width: "100%",
            transition: "color var(--motion-fast), background-color var(--motion-fast), transform var(--motion-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-hover)";
            e.currentTarget.style.color = "var(--color-foreground)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--color-muted)";
          }}
        >
          <span
            style={{
              fontSize: "1rem",
              flexShrink: 0,
              transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform var(--motion-spring)",
            }}
          >
            &gt;
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}


