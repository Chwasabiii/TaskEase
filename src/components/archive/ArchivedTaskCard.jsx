export default function ArchivedTaskCard({ task, onRestore, onDelete }) {
  const priorityColor = {
    low: "#10B981",
    medium: "#F59E0B",
    high: "#EF4444",
    urgent: "#7C5CFF",
  }[task.priority?.toLowerCase()] || "#5B8CFF";

  return (
    <div className="glass-card" style={{ padding: "1.25rem", borderLeft: `3px solid ${priorityColor}`, display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-foreground)" }}>{task.title}</h3>
          {task.category && <p style={{ margin: "0.35rem 0 0", color: "var(--color-muted)", fontSize: "0.85rem" }}>{task.category}</p>}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => onRestore(task.id)} style={{ padding: "0.55rem 0.95rem", borderRadius: "999px", border: "1px solid rgba(16,185,129,0.35)", backgroundColor: "rgba(16,185,129,0.1)", color: "#10B981", cursor: "pointer" }}>
            Restore
          </button>
          <button onClick={() => onDelete(task.id)} style={{ padding: "0.55rem 0.95rem", borderRadius: "999px", border: "1px solid rgba(239,68,68,0.35)", backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", cursor: "pointer" }}>
            Delete
          </button>
        </div>
      </div>
      {task.description && <p style={{ margin: 0, color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>{task.description}</p>}
      <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-muted)", fontSize: "0.82rem" }}>
        <span>{task.priority?.toUpperCase() || "No priority"}</span>
        <span>{task.updated_at ? new Date(task.updated_at).toLocaleDateString() : "Unknown date"}</span>
      </div>
    </div>
  );
}


