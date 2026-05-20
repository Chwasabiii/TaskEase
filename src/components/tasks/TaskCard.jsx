export default function TaskCard({ task, onToggle, onEdit, onDelete, onArchive, onView }) {
  const priorityConfig = {
    low:    { color: "#10B981", bg: "rgba(16,185,129,0.1)",  label: "Low" },
    medium: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  label: "Medium" },
    high:   { color: "#EF4444", bg: "rgba(239,68,68,0.1)",   label: "High" },
    urgent: { color: "#7C5CFF", bg: "rgba(124,92,255,0.1)",  label: "Urgent" },
  };

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isDone   = task.status === "done";

  const isOverdue = task.due_date &&
    new Date(task.due_date) < new Date() &&
    !isDone;

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  };

  const completedSubtasks = task.subtasks?.filter((s) => s.is_done).length ?? 0;
  const totalSubtasks     = task.subtasks?.length ?? 0;

  return (
    <div
      className="glass-card"
      style={{
        padding: "1.25rem",
        transition: "all 0.2s ease",
        opacity: isDone ? 0.6 : 1,
        borderLeft: `3px solid ${isDone ? "#10B981" : priority.color}`,
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id, task.status)}
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "6px",
            border: `2px solid ${isDone ? "#10B981" : "rgba(255,255,255,0.2)"}`,
            backgroundColor: isDone ? "#10B981" : "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: "2px",
            transition: "all 0.2s",
          }}
        >
          {isDone && <span style={{ color: "white", fontSize: "12px" }}>✓</span>}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.375rem" }}>
            <h3
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: isDone ? "var(--color-muted)" : "var(--color-foreground)",
                textDecoration: isDone ? "line-through" : "none",
              }}
            >
              {task.title}
            </h3>

            {/* Priority badge */}
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "20px",
                fontSize: "0.7rem",
                fontWeight: 600,
                fontFamily: "var(--font-body)",
                backgroundColor: priority.bg,
                color: priority.color,
              }}
            >
              {priority.label}
            </span>

            {/* Category badge */}
            {task.category && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "20px",
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-body)",
                  backgroundColor: "rgba(91,140,255,0.1)",
                  color: "#5B8CFF",
                }}
              >
                {task.category}
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                color: "var(--color-muted)",
                marginBottom: "0.5rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {task.description}
            </p>
          )}

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap" }}>
            {/* Due date */}
            {task.due_date && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-body)",
                  color: isOverdue ? "#EF4444" : "var(--color-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                {isOverdue ? "⚠" : "📅"} {formatDate(task.due_date)}
              </span>
            )}

            {/* Subtasks progress */}
            {totalSubtasks > 0 && (
              <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-body)", color: "var(--color-muted)" }}>
                ✓ {completedSubtasks}/{totalSubtasks} subtasks
              </span>
            )}
          </div>
        </div>

        {/* Actions */}


        <button
  onClick={() => onView(task)}
  style={{
    width: "30px", height: "30px",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    backgroundColor: "transparent",
    color: "var(--color-muted)", cursor: "pointer",
    fontSize: "0.8rem", transition: "all 0.2s",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = "rgba(34,211,238,0.1)";
    e.currentTarget.style.color = "#22D3EE";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = "transparent";
    e.currentTarget.style.color = "var(--color-muted)";
  }}
  title="View Details"
>
  ⊙
</button>
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          <button
            onClick={() => onEdit(task)}
            style={{
              width: "30px", height: "30px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "transparent",
              color: "var(--color-muted)",
              cursor: "pointer",
              fontSize: "0.8rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(91,140,255,0.1)";
              e.currentTarget.style.color = "#5B8CFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--color-muted)";
            }}
            title="Edit"
          >
            ✎
          </button>
          <button
            onClick={() => onArchive(task.id)}
            style={{
              width: "30px", height: "30px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "transparent",
              color: "var(--color-muted)",
              cursor: "pointer",
              fontSize: "0.8rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(245,158,11,0.1)";
              e.currentTarget.style.color = "#F59E0B";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--color-muted)";
            }}
            title="Archive"
          >
            ⊟
          </button>
          <button
            onClick={() => onDelete(task.id)}
            style={{
              width: "30px", height: "30px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "transparent",
              color: "var(--color-muted)",
              cursor: "pointer",
              fontSize: "0.8rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
              e.currentTarget.style.color = "#EF4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--color-muted)";
            }}
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

