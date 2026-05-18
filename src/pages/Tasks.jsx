import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import TaskList from "../components/tasks/TaskList";
import TaskModal from "../components/tasks/TaskModal";

const FILTERS   = ["All", "Todo", "In Progress", "Done"];
const PRIORITIES = ["All", "Urgent", "High", "Medium", "Low"];

export default function Tasks({ onNotify }) {
  const {
    tasks, loading,
    createTask, updateTask,
    deleteTask, toggleComplete, archiveTask,
  } = useTasks();

  const [showModal, setShowModal]     = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter]           = useState("All");
  const [priority, setPriority]       = useState("All");
  const [search, setSearch]           = useState("");

  const handleSave = async (formData) => {
    if (editingTask) {
      const result = await updateTask(editingTask.id, formData);
      onNotify?.({
        title: "Task updated",
        message: `${formData.title} was updated successfully.`,
        type: "task",
      });
      return result;
    }

    const result = await createTask(formData);
    onNotify?.({
      title: "New task created",
      message: `${formData.title} was added to your list.`,
      type: "task",
    });
    return result;
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const handleToggle = async (id, currentStatus) => {
    toggleComplete(id, currentStatus);
    onNotify?.({
      title: currentStatus === "done" ? "Task reopened" : "Task completed",
      message: currentStatus === "done"
        ? "A task was reopened."
        : "A task was marked complete.",
      type: "task",
    });
  };

  const handleArchive = async (id) => {
    archiveTask(id);
    onNotify?.({
      title: "Task archived",
      message: "A task was moved to the archive.",
      type: "task",
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this task?")) {
      deleteTask(id);
      onNotify?.({
        title: "Task deleted",
        message: "A task was deleted from your list.",
        type: "task",
      });
    }
  };

  // Filter logic
  const filtered = tasks.filter((t) => {
    const matchStatus = filter === "All" ||
      (filter === "Todo"        && t.status === "todo") ||
      (filter === "In Progress" && t.status === "in_progress") ||
      (filter === "Done"        && t.status === "done");

    const matchPriority = priority === "All" ||
      t.priority === priority.toLowerCase();

    const matchSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());

    return matchStatus && matchPriority && matchSearch;
  });

  const pillStyle = (active) => ({
    padding: "0.35rem 0.875rem",
    borderRadius: "20px",
    border: `1px solid ${active ? "#5B8CFF" : "rgba(255,255,255,0.08)"}`,
    backgroundColor: active ? "rgba(91,140,255,0.15)" : "transparent",
    color: active ? "#5B8CFF" : "#64748B",
    fontFamily: "var(--font-body)",
    fontSize: "0.8rem",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    transition: "all 0.2s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, color: "#F1F5F9" }}>
            My Tasks
          </h2>
          <p style={{ color: "#64748B", fontFamily: "var(--font-body)", fontSize: "0.875rem" }}>
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "0.625rem 1.25rem",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
            color: "white",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          + New Task
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍  Search tasks..."
        style={{
          width: "100%",
          padding: "0.7rem 1rem",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "rgba(255,255,255,0.05)",
          color: "#F1F5F9",
          fontFamily: "var(--font-body)",
          fontSize: "0.9rem",
          outline: "none",
        }}
        onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
      />

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {FILTERS.map((f) => (
          <button key={f} style={pillStyle(filter === f)} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
        <div style={{ width: "1px", backgroundColor: "rgba(255,255,255,0.08)", margin: "0 0.25rem" }} />
        {PRIORITIES.map((p) => (
          <button key={p} style={pillStyle(priority === p)} onClick={() => setPriority(p)}>
            {p}
          </button>
        ))}
      </div>

      {/* Task list */}
      <TaskList
        tasks={filtered}
        loading={loading}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onArchive={handleArchive}
      />

      {/* Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
}