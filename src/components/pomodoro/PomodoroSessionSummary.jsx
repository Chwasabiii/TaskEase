export default function PomodoroSessionSummary({ sessions, loading }) {
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: "1.5rem", color: "var(--color-muted)" }}>
        Loading sessions...
      </div>
    );
  }

  if (!sessions || !sessions.length) {
    return (
      <div className="glass-card" style={{ padding: "1.5rem", color: "var(--color-muted)" }}>
        No saved sessions yet.
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-foreground)" }}>Recent Sessions</h3>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {sessions.map((session) => (
          <div key={session.id} style={{ padding: "1rem", borderRadius: "18px", backgroundColor: "var(--color-subtle)", display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "var(--font-body)", color: "var(--color-foreground)", fontWeight: 700 }}>{session.task?.title || "Unnamed task"}</div>
              <div style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", fontSize: "0.85rem" }}>{new Date(session.started_at).toLocaleString()}</div>
            </div>
            <div style={{ color: "#10B981", fontWeight: 700 }}>{session.duration_mins}m</div>
          </div>
        ))}
      </div>
    </div>
  );
}


