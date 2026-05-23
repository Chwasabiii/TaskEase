import { useTheme } from "../../context/theme";

const navItems = [
  { icon: "dashboard", label: "Dashboard", id: "dashboard" },
  { icon: "tasks", label: "My Tasks", id: "tasks" },
  { icon: "pomodoro", label: "Pomodoro", id: "pomodoro" },
  { icon: "archive", label: "Archive", id: "archive" },
  { icon: "focus", label: "Focus Mode", id: "focus" },
  { icon: "collaboration", label: "Collaboration", id: "collaboration" },
];

function NavIcon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    tasks: (
      <>
        <path d="M9 7h11" />
        <path d="M9 12h11" />
        <path d="M9 17h11" />
        <path d="m4 7 1 1 2-2" />
        <path d="m4 12 1 1 2-2" />
        <path d="m4 17 1 1 2-2" />
      </>
    ),
    pomodoro: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l3 2" />
        <path d="M9 2h6" />
      </>
    ),
    archive: (
      <>
        <path d="M4 7h16" />
        <path d="M5 7v12h14V7" />
        <path d="M8 7V4h8v3" />
        <path d="M10 12h4" />
      </>
    ),
    focus: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3" />
        <path d="M12 19v3" />
        <path d="M2 12h3" />
        <path d="M19 12h3" />
      </>
    ),
    collaboration: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M3 20c.8-3.4 2.7-5 5-5s4.2 1.6 5 5" />
        <path d="M14 20c.5-2.3 1.8-3.5 3.5-3.5 1.5 0 2.7.9 3.5 3.5" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export default function Sidebar({ activePage, setActivePage, collapsed, setCollapsed, mobileOpen, setMobileSidebarOpen }) {
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? "/taskease-logo-dark.jpg" : "/taskease-logo-light.png";

  return (
    <aside
      className={`app-sidebar${mobileOpen ? " mobile-open" : " mobile-hidden"}`}
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
        className="app-sidebar-brand"
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
            backgroundColor: theme === "dark" ? "#050505" : "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 10px 24px var(--color-glow)",
            overflow: "hidden",
          }}
        >
          <img
            src={logoSrc}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scale(1.65)",
            }}
          />
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

      <nav className="app-sidebar-nav" style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              className={`nav-item interactive-pop${isActive ? " is-active" : ""}`}
              key={item.id}
              onClick={() => {
                setActivePage(item.id);
                setMobileSidebarOpen?.(false);
              }}
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
              <span style={{ flexShrink: 0, width: "1.1rem", height: "1.1rem", display: "grid", placeItems: "center" }}>
                <NavIcon name={item.icon} />
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
        className="app-sidebar-footer"
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


