import TaskCard from "./TaskCard";

export default function TaskList({ tasks, loading, onToggle, onEdit, onDelete, onArchive }) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-card"
            style={{
              padding: "1.25rem",
              height: "80px",
              background: "rgba(255,255,255,0.03)",
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
        <h3 style={{ fontFamily: "var(--font-heading)", color: "#F1F5F9", marginBottom: "0.5rem" }}>
          No tasks yet
        </h3>
        <p style={{ fontFamily: "var(--font-body)", color: "#475569", fontSize: "0.9rem" }}>
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
        />
      ))}
    </div>
  );
}