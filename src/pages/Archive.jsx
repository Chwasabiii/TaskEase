import { useState } from "react";
import { useArchive } from "../hooks/useArchive";
import { ArchiveFilter, ArchiveList } from "../components/archive";

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-foreground)" }}>
            Archive
          </h2>
          <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.875rem" }}>
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

      <ArchiveFilter
        search={search}
        onSearchChange={setSearch}
        priority={priority}
        onPriorityChange={setPriority}
        category={category}
        onCategoryChange={setCategory}
        priorityOptions={priorities}
        categoryOptions={categories}
      />

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                height: "80px",
                background: "var(--color-subtle)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🗄</div>
          <h3 style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)", marginBottom: "0.5rem" }}>
            {archivedTasks.length === 0 ? "No archived tasks" : "No results found"}
          </h3>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", fontSize: "0.9rem" }}>
            {archivedTasks.length === 0
              ? "Archived tasks will appear here"
              : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <ArchiveList tasks={filtered} loading={loading} onRestore={handleRestore} onDelete={handleDelete} />
      )}
    </div>
  );
}

