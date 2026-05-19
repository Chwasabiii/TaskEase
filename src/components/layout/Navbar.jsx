import { useEffect, useRef, useState } from "react";
import ThemeToggle from "../ui/ThemeToggle";

export default function Navbar({
  activePage,
  user,
  onSignOut,
  notifications = [],
  onClearNotifications,
  onNotificationAction,
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);

  const pageLabels = {
    dashboard: "Dashboard",
    tasks: "My Tasks",
    pomodoro: "Pomodoro Timer",
    archive: "Archive",
    focus: "Focus Mode",
    collaboration: "Collaboration",
  };

  useEffect(() => {
    if (!notificationsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen]);

  const handleNotificationClick = (notification) => {
    onNotificationAction?.(notification);
    setNotificationsOpen(false);
  };

  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "var(--color-surface)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "var(--color-foreground)",
        }}
      >
        {pageLabels[activePage] || "TaskEase"}
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <ThemeToggle />

        <div
          className="interactive-pop"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "0.4rem 0.875rem",
            cursor: "pointer",
          }}
        >
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-muted)", fontWeight: 700 }}>
            Search
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-muted)" }}>
            Search tasks...
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              color: "var(--color-muted)",
              backgroundColor: "var(--color-subtle)",
              padding: "1px 6px",
              borderRadius: "4px",
            }}
          >
            Ctrl K
          </span>
        </div>

        <div ref={notificationRef} style={{ position: "relative" }}>
          <button
            className="interactive-pop"
            onClick={() => setNotificationsOpen((current) => !current)}
            aria-label="Open notifications"
            aria-expanded={notificationsOpen}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              border: notificationsOpen ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
              backgroundColor: notificationsOpen ? "var(--color-primary-soft)" : "var(--color-surface)",
              color: notificationsOpen ? "var(--color-primary)" : "var(--color-foreground)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.95rem",
              fontWeight: 800,
              position: "relative",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "relative",
                width: "15px",
                height: "16px",
                display: "inline-block",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: "2px",
                  top: "3px",
                  width: "11px",
                  height: "10px",
                  border: "2px solid currentColor",
                  borderBottom: "none",
                  borderRadius: "8px 8px 3px 3px",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "1px",
                  bottom: "2px",
                  width: "13px",
                  height: "2px",
                  borderRadius: "999px",
                  backgroundColor: "currentColor",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "6px",
                  bottom: "-1px",
                  width: "3px",
                  height: "3px",
                  borderRadius: "50%",
                  backgroundColor: "currentColor",
                }}
              />
            </span>
            {notifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  minWidth: "16px",
                  height: "16px",
                  padding: "0 4px",
                  borderRadius: "999px",
                  backgroundColor: "#EF4444",
                  border: "2px solid var(--color-surface-strong)",
                  color: "white",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.62rem",
                  lineHeight: "12px",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {Math.min(notifications.length, 9)}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              className="notification-menu"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 0.75rem)",
                width: "360px",
                maxWidth: "calc(100vw - 2rem)",
                borderRadius: "16px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface-strong)",
                boxShadow: "0 22px 60px rgba(15, 23, 42, 0.28)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: "1rem",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-foreground)" }}>
                    Notifications
                  </h2>
                  <p style={{ margin: "0.2rem 0 0", fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-muted)" }}>
                    {notifications.length ? `${notifications.length} recent update${notifications.length === 1 ? "" : "s"}` : "All quiet"}
                  </p>
                </div>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearNotifications}
                    style={{
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-subtle)",
                      color: "var(--color-muted)",
                      borderRadius: "10px",
                      padding: "0.45rem 0.65rem",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div style={{ maxHeight: "360px", overflowY: "auto", padding: notifications.length ? "0.5rem" : "1rem" }}>
                {notifications.length === 0 ? (
                  <p style={{ margin: 0, color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                    No notifications yet. Updates from tasks, collaboration, and focus sessions will show here.
                  </p>
                ) : (
                  notifications.slice(0, 8).map((notification, index) => (
                    <button
                      key={notification.id}
                      type="button"
                      className="notification-item interactive-pop"
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        animationDelay: `${index * 28}ms`,
                        width: "100%",
                        border: "none",
                        borderRadius: "12px",
                        backgroundColor: "transparent",
                        padding: "0.85rem",
                        cursor: "pointer",
                        display: "grid",
                        gap: "0.35rem",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.92rem", color: "var(--color-foreground)", fontWeight: 700 }}>
                          {notification.title}
                        </span>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-muted)", flexShrink: 0 }}>
                          {new Date(notification.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.84rem", color: "var(--color-muted)", lineHeight: 1.45 }}>
                        {notification.message}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
            color: "var(--color-on-primary)",
          }}
        >
          {user?.email?.[0].toUpperCase() ?? "U"}
        </div>

        <button
          className="interactive-pop"
          onClick={onSignOut}
          style={{
            padding: "0.4rem 0.875rem",
            borderRadius: "10px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
            e.currentTarget.style.color = "#EF4444";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-surface)";
            e.currentTarget.style.color = "var(--color-muted)";
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
