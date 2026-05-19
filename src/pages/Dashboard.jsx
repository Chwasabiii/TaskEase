import { useAuth } from "../context/AuthContext";
import { useTasks } from "../hooks/useTasks";
import { useCollaboration } from "../hooks/useCollaboration";

export default function Dashboard({ setActivePage, onSelectSharedTask }) {
  const { user } = useAuth();
  const { tasks, loading } = useTasks();
  const { sharedTasks, loading: sharedLoading } = useCollaboration();
  const isLoading = loading || sharedLoading;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const sharedTaskItems = (sharedTasks || []).map((item) => item.task).filter(Boolean);
  const mergedTasks = Array.from(new Map([...tasks, ...sharedTaskItems].map((task) => [task.id, task])).values())
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total       = mergedTasks.length;
  const inProgress  = mergedTasks.filter((t) => t.status === "in_progress").length;
  const today       = new Date().toDateString();
  const doneToday   = tasks.filter(
    (t) => t.status === "done" && new Date(t.updated_at).toDateString() === today
  ).length;
  const overdue = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
  ).length;

  const stats = [
    { label: "Total Tasks",     value: total,      icon: "✓", color: "#5B8CFF" },
    { label: "In Progress",     value: inProgress,  icon: "◷", color: "#7C5CFF" },
    { label: "Completed Today", value: doneToday,   icon: "⚡", color: "#10B981" },
    { label: "Overdue",         value: overdue,     icon: "⚠", color: "#EF4444" },
  ];

  const recentTasks = mergedTasks.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Welcome */}
      <div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "var(--color-foreground)", marginBottom: "0.25rem" }}>
          {greeting} 👋
        </h2>
        <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
          Here's what's on your plate today — including tasks shared with you.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.25rem" }}>{stat.icon}</span>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: stat.color }} />
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700, color: stat.color, marginBottom: "0.25rem" }}>
              {isLoading ? "—" : stat.value}
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-muted)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Shared with me */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 600, color: "var(--color-foreground)" }}>
            Shared with me
          </h3>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-muted)" }}>
            {sharedTaskItems.length} task{sharedTaskItems.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>Loading shared tasks...</p>
        ) : sharedTaskItems.length === 0 ? (
          <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
            No shared tasks yet — collaborate with a teammate or join using an invite code.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {sharedTaskItems.slice(0, 3).map((task) => (
              <div key={task.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", padding: "0.75rem 0", borderBottom: "1px solid var(--color-subtle)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0 }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                    Shared by {task.user_id === user?.id ? "you" : "a collaborator"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                    {task.priority}
                  </span>
                  <button
                    onClick={() => {
                      onSelectSharedTask?.(task.id);
                      setActivePage?.("collaboration");
                    }}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(91,140,255,0.2)",
                      backgroundColor: "rgba(91,140,255,0.1)",
                      color: "#5B8CFF",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent tasks */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 600, color: "var(--color-foreground)", marginBottom: "1rem" }}>
          Recent Tasks
        </h3>
        {isLoading ? (
          <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>Loading...</p>
        ) : recentTasks.length === 0 ? (
          <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
            No tasks yet — go to My Tasks to create one!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {recentTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.625rem 0",
                  borderBottom: "1px solid var(--color-subtle)",
                }}
              >
                <span style={{
                  width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                  backgroundColor: task.status === "done" ? "#10B981" : task.status === "in_progress" ? "#7C5CFF" : "#5B8CFF",
                }} />
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: "0.875rem",
                  color: task.status === "done" ? "var(--color-muted)" : "var(--color-muted)",
                  textDecoration: task.status === "done" ? "line-through" : "none",
                  flex: 1,
                }}>
                  {task.title}
                  {user && task.user_id !== user.id ? (
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "var(--color-muted)" }}>
                      (Shared)
                    </span>
                  ) : null}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

