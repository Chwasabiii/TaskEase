export default function ArchiveFilter({
  search,
  onSearchChange,
  priority,
  onPriorityChange,
  category,
  onCategoryChange,
  priorityOptions,
  categoryOptions,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search archived tasks..."
        style={{ width: "100%", padding: "0.85rem 1rem", borderRadius: "14px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-hover)", color: "var(--color-foreground)" }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          style={{ padding: "0.85rem 1rem", borderRadius: "14px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-hover)", color: "var(--color-foreground)", minWidth: "160px" }}
        >
          {priorityOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{ padding: "0.85rem 1rem", borderRadius: "14px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-hover)", color: "var(--color-foreground)", minWidth: "160px" }}
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
    </div>
  );
}


