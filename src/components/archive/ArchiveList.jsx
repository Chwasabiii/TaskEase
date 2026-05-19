import ArchivedTaskCard from "./ArchivedTaskCard";

export default function ArchiveList({ tasks, loading, onRestore, onDelete }) {
  if (loading) {
    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        {[1, 2, 3].map((item) => (
          <div key={item} className="glass-card" style={{ height: "100px", backgroundColor: "var(--color-subtle)" }} />
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="glass-card" style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted)" }}>
        No archived tasks yet.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {tasks.map((task) => (
        <ArchivedTaskCard key={task.id} task={task} onRestore={onRestore} onDelete={onDelete} />
      ))}
    </div>
  );
}


