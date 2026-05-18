import { useState } from "react";
import { useArchive } from "../hooks/useArchive";

const PRIORITY_COLORS = {
  low:    { color: "#10B981", bg: "rgba(16,185,129,0.1)"  },
  medium: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
  high:   { color: "#EF4444", bg: "rgba(239,68,68,0.1)"   },
  urgent: { color: "#7C5CFF", bg: "rgba(124,92,255,0.1)"  },
};

export default function Archive() {
  const { archivedTasks, loading, restoreTask, permanentDelete, clearAll } = useArchive();

  const [search,   setSearch]   = useState("");
  const [priority, setPriority] = useState("All");
  const [category, setCategory] = useState("All");

  // Unique categories from archived tasks
  const categories = ["All", ...new Set(archivedTasks.map((t) => t.category).filter(Boolean))];
  const priorities = ["All", "Urgent", "High", "Medium", "Low"];

  const filtered = archivedTasks.filter((t) => {
    const matchSearch   = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priority === "All" || t.priority === priority.toLowerCase();
    const matchCategory = category === "All" || t.category === category;
    return matchSearch && matchPriority && matchCategory;
  });

  const handleRestore = async (id) => {
    await restoreTask(id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Permanently delete this task? This cannot be undone.")) {
      await permanentDelete(id);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm(`Permanently delete all ${archivedTasks.length} archived tasks? This cannot be undone.`)) {
      await clearAll();
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });

  const pillStyle = (active) => ({
    padding: "0.3rem 0.75rem",
    borderRadius: "20px",
    border: `1px solid ${active ? "#5B8CFF" : "rgba(255,255,255,0.08)"}`,
    backgroundColor: active ? "rgba(91,140,255,0.15)" : "transparent",
    color: active ? "#5B8CFF" : "#64748B",
    fontFamily: "var(--font-body)",
    fontSize: "0.78rem",
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
            Archive
          </h2>
          <p style={{ color: "#64748B", fontFamily: "var(--font-body)", fontSize: "0.875rem" }}>
            {archivedTasks.length} archived task{archivedTasks.length !== 1 ? "s" : ""}
          </p>
        </div>

        {archivedTasks.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "10px",
              border: "1px solid rgba(239,68,68,0.3)",
              backgroundColor: "rgba(239,68,68,0.1)",
              color: "#EF4444",
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.2)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"}
          >
            🗑 Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍  Search archived tasks..."
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
        {priorities.map((p) => (
          <button key={p} style={pillStyle(priority === p)} onClick={() => setPriority(p)}>
            {p}
          </button>
        ))}
        <div style={{ width: "1px", backgroundColor: "rgba(255,255,255,0.08)", margin: "0 0.25rem" }} />
        {categories.map((c) => (
          <button key={c} style={pillStyle(category === c)} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                height: "80px",
                background: "rgba(255,255,255,0.03)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🗄</div>
          <h3 style={{ fontFamily: "var(--font-heading)", color: "#F1F5F9", marginBottom: "0.5rem" }}>
            {archivedTasks.length === 0 ? "No archived tasks" : "No results found"}
          </h3>
          <p style={{ fontFamily: "var(--font-body)", color: "#475569", fontSize: "0.9rem" }}>
            {archivedTasks.length === 0
              ? "Archived tasks will appear here"
              : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((task) => {
            const p = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
            return (
              <div
                key={task.id}
                className="glass-card"
                style={{
                  padding: "1.25rem",
                  borderLeft: `3px solid ${p.color}`,
                  opacity: 0.75,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "0.75"}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>

                  {/* Icon */}
                  <div
                    style={{
                      width: "36px", height: "36px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1rem", flexShrink: 0,
                    }}
                  >
                    🗄
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                      <h3 style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        color: "#94A3B8",
                        textDecoration: "line-through",
                      }}>
                        {task.title}
                      </h3>
                      <span style={{
                        padding: "2px 8px", borderRadius: "20px",
                        fontSize: "0.7rem", fontWeight: 600,
                        fontFamily: "var(--font-body)",
                        backgroundColor: p.bg, color: p.color,
                      }}>
                        {task.priority}
                      </span>
                      {task.category && (
                        <span style={{
                          padding: "2px 8px", borderRadius: "20px",
                          fontSize: "0.7rem", fontFamily: "var(--font-body)",
                          backgroundColor: "rgba(91,140,255,0.1)", color: "#5B8CFF",
                        }}>
                          {task.category}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p style={{
                        fontFamily: "var(--font-body)", fontSize: "0.82rem",
                        color: "#475569", marginBottom: "0.375rem",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {task.description}
                      </p>
                    )}

                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#334155" }}>
                      Archived {formatDate(task.updated_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button
                      onClick={() => handleRestore(task.id)}
                      style={{
                        padding: "0.4rem 0.875rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(16,185,129,0.3)",
                        backgroundColor: "rgba(16,185,129,0.1)",
                        color: "#10B981",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.1)"}
                    >
                      ↩ Restore
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      style={{
                        width: "32px", height: "32px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        backgroundColor: "transparent",
                        color: "#64748B",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
                        e.currentTarget.style.color = "#EF4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#64748B";
                      }}
                      title="Permanently delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}