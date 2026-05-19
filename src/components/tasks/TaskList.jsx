import TaskCard from "./TaskCard";

export default function TaskList({ tasks, loading, onToggle, onEdit, onDelete, onArchive, onView }) {  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-card"
            style={{
              padding: "1.25rem",
              height: "80px",
              background: "var(--color-subtle)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div
        className="glass-card"
        style={{ padding: "3rem", textAlign: "center" }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📋</div>
        <h3 style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)", marginBottom: "0.5rem" }}>
          No tasks yet
        </h3>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", fontSize: "0.9rem" }}>
          Click "New Task" to get started
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {tasks.map((task) => (
        <TaskCard
  key={task.id}
  task={task}
  onToggle={onToggle}
  onEdit={onEdit}
  onDelete={onDelete}
  onArchive={onArchive}
  onView={onView}
/>
      ))}
    </div>
  );
}

