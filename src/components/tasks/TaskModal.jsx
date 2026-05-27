import { useEffect, useState } from "react";

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

export default function TaskModal({ task, initialTask, onSave, onClose, onFindArchivedSuggestion }) {
  const isEditing = !!task;
  const todayDateValue = getTodayDateValue();

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
    due_date: "",
    due_time: "",
    status: "todo",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const [checkingSuggestion, setCheckingSuggestion] = useState(false);

  useEffect(() => {
    if (task || initialTask) {
      const sourceTask = task || initialTask;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title: sourceTask.title || "",
        description: sourceTask.description || "",
        priority: sourceTask.priority || "medium",
        category: sourceTask.category || "",
        due_date: sourceTask.due_date ? getDateValue(sourceTask.due_date) : "",
        due_time: sourceTask.due_date ? getTimeValue(sourceTask.due_date) : "",
        status: sourceTask.status || "todo",
      });
    }
  }, [initialTask, task]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loading, onClose]);

  useEffect(() => {
    if (isEditing || !onFindArchivedSuggestion) return undefined;

    const cleanTitle = form.title.trim();
    if (cleanTitle.length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestion(null);
      setCheckingSuggestion(false);
      return undefined;
    }

    let cancelled = false;
    setCheckingSuggestion(true);

    const timeoutId = window.setTimeout(async () => {
      const archivedSuggestion = await onFindArchivedSuggestion(cleanTitle);
      if (cancelled) return;
      setSuggestion(archivedSuggestion);
      setCheckingSuggestion(false);
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [form.title, isEditing, onFindArchivedSuggestion]);

  const applySuggestion = () => {
    if (!suggestion) return;

    setForm((current) => ({
      ...current,
      title: suggestion.title || current.title,
      description: suggestion.description || "",
      priority: suggestion.priority || "medium",
      category: suggestion.category || "",
      status: "todo",
    }));
    setSuggestion(null);
  };

  const handleSave = async (event) => {
    event?.preventDefault();
    if (loading) return;
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

    try {
      const { error: saveError } = await onSave(payload);
      if (saveError) setError(saveError.message);
      else onClose();
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (updates) => setForm((current) => ({ ...current, ...updates }));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      className="task-modal-overlay"
      onClick={(event) => event.target === event.currentTarget && !loading && onClose()}
    >
      <form className="task-modal-panel" onSubmit={handleSave}>
        <div className="task-modal-header">
          <div>
            <h2 id="task-modal-title" className="task-modal-title">
              {isEditing ? "Edit Task" : initialTask ? "Review Voice Task" : "New Task"}
            </h2>
            <p className="task-modal-subtitle">
              {isEditing
                ? "Update task details and schedule."
                : initialTask
                ? "Review the voice suggestion and save it as a new task."
                : "Create a focused task with priority, category, and due date."
              }
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={loading} aria-label="Close task modal" className="task-modal-close">
            ×
          </button>
        </div>

        <div className="task-modal-body">
          {error && <div className="task-modal-error">{error}</div>}

          <div className="task-modal-fieldset">
            <div>
              <label htmlFor="task-title" className="task-modal-label">Title *</label>
              <input
                id="task-title"
                type="text"
                value={form.title}
                onChange={(event) => updateForm({ title: event.target.value })}
                placeholder="What needs to be done?"
                className="task-modal-input"
                autoFocus
              />
            </div>

            {!isEditing && (suggestion || checkingSuggestion) && (
              <div className="task-modal-help">
                {checkingSuggestion ? (
                  <p style={{ margin: 0 }}>Checking completed tasks for reusable task details…</p>
                ) : (
                  <>
                    <p style={{ margin: 0, fontWeight: 700, color: "var(--color-foreground)" }}>
                      Reuse a completed task?
                    </p>
                    <p style={{ margin: "0.45rem 0 0", color: "var(--color-muted)", fontSize: "0.92rem", lineHeight: 1.6 }}>
                      We found "{suggestion.title}" in your archive. Reuse its details and choose a new date.
                    </p>
                    <button
                      type="button"
                      onClick={applySuggestion}
                      className="task-modal-button-secondary"
                      style={{ width: "fit-content", borderColor: "rgba(91, 140, 255, 0.45)", backgroundColor: "rgba(91, 140, 255, 0.12)", color: "#5b8cff" }}
                    >
                      Use this template
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="task-modal-fieldset">
            <div>
              <label htmlFor="task-description" className="task-modal-label">Description</label>
              <textarea
                id="task-description"
                value={form.description}
                onChange={(event) => updateForm({ description: event.target.value })}
                placeholder="Add more details..."
                className="task-modal-input task-modal-textarea"
              />
            </div>
          </div>

          <div className="task-modal-fieldset">
            <p className="task-modal-fieldset-title">Task details</p>
            <div className="task-modal-grid">
              <div>
                <label htmlFor="task-priority" className="task-modal-label">Priority</label>
                <select
                  id="task-priority"
                  value={form.priority}
                  onChange={(event) => updateForm({ priority: event.target.value })}
                  className="task-modal-input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label htmlFor="task-status" className="task-modal-label">Status</label>
                <select
                  id="task-status"
                  value={form.status}
                  onChange={(event) => updateForm({ status: event.target.value })}
                  className="task-modal-input"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label htmlFor="task-category" className="task-modal-label">Category</label>
                <select
                  id="task-category"
                  value={form.category}
                  onChange={(event) => updateForm({ category: event.target.value })}
                  className="task-modal-input"
                >
                  <option value="">No category</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-due-date" className="task-modal-label">Due Date</label>
                <input
                  id="task-due-date"
                  type="date"
                  value={form.due_date}
                  min={todayDateValue}
                  onChange={(event) => updateForm({ due_date: event.target.value })}
                  className="task-modal-input"
                />
              </div>
            </div>
          </div>

          <div className="task-modal-fieldset">
            <p className="task-modal-fieldset-title">Schedule</p>
            <div className="task-modal-grid">
              <div>
                <label htmlFor="task-due-time" className="task-modal-label">Due Time</label>
                <input
                  id="task-due-time"
                  type="time"
                  value={form.due_time}
                  disabled={!form.due_date}
                  onChange={(event) => updateForm({ due_time: event.target.value })}
                  className="task-modal-input"
                  style={{ opacity: form.due_date ? 1 : 0.65, cursor: form.due_date ? "text" : "not-allowed" }}
                />
              </div>
              <div>
                <p className="task-modal-label" style={{ visibility: "hidden", height: 0, marginBottom: 0 }}>Spacer</p>
                <div className="task-modal-help" style={{ padding: "0.85rem 1rem" }}>
                  Set a date first to enable a due time.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="task-modal-footer">
          <button type="button" onClick={onClose} disabled={loading} className="task-modal-button-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="task-modal-button-primary">
            {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
