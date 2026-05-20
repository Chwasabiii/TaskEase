import { useState, useEffect } from "react";

const CATEGORIES = ["Work", "Personal", "Health", "Learning", "Finance", "Other"];

const getTodayDateValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTimeValue = (date) => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";
  const hours = String(parsedDate.getHours()).padStart(2, "0");
  const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getDateValue = (date) => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function TaskModal({ task, onSave, onClose }) {
  const isEditing = !!task;
  const todayDateValue = getTodayDateValue();

  const [form, setForm] = useState({
    title:       "",
    description: "",
    priority:    "medium",
    category:    "",
    due_date:    "",
    due_time:    "",
    status:      "todo",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (task) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title:       task.title || "",
        description: task.description || "",
        priority:    task.priority || "medium",
        category:    task.category || "",
        due_date:    task.due_date ? getDateValue(task.due_date) : "",
        due_time:    task.due_date ? getTimeValue(task.due_date) : "",
        status:      task.status || "todo",
      });
    }
  }, [task]);

  const handleSave = async () => {
    if (!form.title.trim()) return setError("Title is required.");
    if (form.due_date && form.due_date < todayDateValue) {
      return setError("Due date cannot be in the past.");
    }
    if (form.due_time && !form.due_date) {
      return setError("Choose a due date before adding a due time.");
    }

    const dueDateTime = form.due_date
      ? new Date(`${form.due_date}T${form.due_time || "23:59"}`)
      : null;

    if (dueDateTime && dueDateTime < new Date()) {
      return setError("Due date and time cannot be in the past.");
    }

    setLoading(true);
    setError("");
    const taskPayload = { ...form };
    delete taskPayload.due_time;
    const payload = {
      ...taskPayload,
      due_date: dueDateTime ? dueDateTime.toISOString() : null,
    };
    const { error } = await onSave(payload);
    if (error) setError(error.message);
    else onClose();
    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "0.7rem 1rem",
    borderRadius: "10px",
    border: "1px solid var(--color-border)",
    backgroundColor: "var(--color-hover)",
    color: "var(--color-foreground)",
    fontFamily: "var(--font-body)",
    fontSize: "0.9rem",
    outline: "none",
    transition: "border 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontFamily: "var(--font-body)",
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "var(--color-muted)",
    marginBottom: "0.35rem",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        backgroundColor: "var(--color-overlay)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-card"
        style={{ width: "100%", maxWidth: "500px", padding: "2rem" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-foreground)" }}>
            {isEditing ? "Edit Task" : "New Task"}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: "32px", height: "32px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "transparent",
              color: "var(--color-muted)",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            color: "#EF4444",
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
              onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add more details..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
              onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
            />
          </div>

          {/* Priority + Status row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
                onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
                <option value="urgent">🟣 Urgent</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
                onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
              >
                <option value="todo">📋 To Do</option>
                <option value="in_progress">⚡ In Progress</option>
                <option value="done">✅ Done</option>
              </select>
            </div>
          </div>

          {/* Category + Due date row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
                onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
              >
                <option value="">No category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input
                type="date"
                value={form.due_date}
                min={todayDateValue}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
                onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Due Time</label>
            <input
              type="time"
              value={form.due_time}
              disabled={!form.due_date}
              onChange={(e) => setForm({ ...form, due_time: e.target.value })}
              style={{
                ...inputStyle,
                opacity: form.due_date ? 1 : 0.65,
                cursor: form.due_date ? "text" : "not-allowed",
              }}
              onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
              onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                backgroundColor: "transparent",
                color: "var(--color-muted)",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                flex: 2,
                padding: "0.75rem",
                borderRadius: "10px",
                border: "none",
                background: loading
                  ? "rgba(91,140,255,0.5)"
                  : "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
                color: "white",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

