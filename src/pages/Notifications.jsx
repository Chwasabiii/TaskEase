export default function Notifications({ notifications = [], onClear }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "#F1F5F9", marginBottom: "0.25rem" }}>
          Notifications
        </h2>
        <p style={{ color: "#64748B", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
          Everything happening across your tasks, collaborations, and focus sessions.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <span style={{ color: "#94A3B8", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
          {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={onClear}
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "#F1F5F9",
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          Clear all
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <p style={{ color: "#64748B", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
            No notifications yet. Start working on tasks or run a Pomodoro session and notifications will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {notifications.map((notification) => (
            <div key={notification.id} className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "#F1F5F9", margin: 0 }}>
                  {notification.title}
                </h3>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "#94A3B8" }}>
                  {new Date(notification.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "#CBD5E1", margin: 0 }}>
                {notification.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
