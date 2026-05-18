export default function Focus() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "#F1F5F9", marginBottom: "0.25rem" }}>
          Focus Mode
        </h2>
        <p style={{ color: "#64748B", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
          A simpler workspace for deep focus is coming soon. In the meantime, use the Pomodoro timer to manage your sessions.
        </p>
      </div>
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <p style={{ color: "#94A3B8", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
          Focus Mode will let you hide distractions, track deep work goals, and stay on task.
        </p>
      </div>
    </div>
  );
}
