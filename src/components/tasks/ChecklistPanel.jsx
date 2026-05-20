import { useState } from "react";
import { useChecklist } from "../../hooks/useChecklist";

export default function ChecklistPanel({ taskId }) {
  const {
    items, loading, error,
    createItem, updateItem, deleteItem,
    uploadItemFile, viewFile, downloadFile, deleteFile,
  } = useChecklist(taskId);

  const [newTitle, setNewTitle]     = useState("");
  const [adding, setAdding]         = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [editTitle, setEditTitle]   = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  const completedCount = items.filter((i) => i.is_done).length;
  const totalCount     = items.length;
  const progress       = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // ── Add item ──
  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    await createItem(newTitle.trim());
    setNewTitle("");
    setAdding(false);
  };

  // ── Toggle done ──
  const handleToggle = async (item) => {
    await updateItem(item.id, { is_done: !item.is_done });
  };

  // ── Edit ──
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const handleSaveEdit = async (item) => {
    if (editTitle.trim() && editTitle.trim() !== item.title) {
      await updateItem(item.id, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  // ── Delete item ──
  const handleDelete = async (item) => {
    if (window.confirm(`Delete "${item.title}"?`)) {
      await deleteItem(item);
    }
  };

  // ── Upload file to item ──
  const handleUploadFile = async (item, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(item.id);
    await uploadItemFile(item, file);
    setUploadingId(null);
    e.target.value = "";
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type) => {
    if (!type) return "📎";
    if (type.startsWith("image/")) return "🖼";
    if (type.includes("pdf"))      return "📄";
    if (type.startsWith("video/")) return "🎬";
    if (type.startsWith("audio/")) return "🎵";
    return "📎";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── Header + progress ── */}
      <div>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: "0.5rem",
        }}>
          <h4 style={{
            fontFamily: "var(--font-heading)", fontSize: "0.95rem",
            fontWeight: 600, color: "var(--color-muted)",
          }}>
            ☑ Checklist {totalCount > 0 && `(${completedCount}/${totalCount})`}
          </h4>
          {totalCount > 0 && (
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "0.75rem",
              color: progress === 100 ? "#10B981" : "#5B8CFF",
              fontWeight: 600,
            }}>
              {progress}%
            </span>
          )}
        </div>

        {totalCount > 0 && (
          <div style={{
            width: "100%", height: "4px",
            backgroundColor: "var(--color-border)",
            borderRadius: "2px", overflow: "hidden",
          }}>
            <div style={{
              width: `${progress}%`, height: "100%",
              background: progress === 100
                ? "#10B981"
                : "linear-gradient(90deg, #5B8CFF, #7C5CFF)",
              borderRadius: "2px",
              transition: "width 0.4s ease",
            }} />
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          backgroundColor: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "8px", padding: "0.625rem 0.875rem",
          color: "#EF4444", fontFamily: "var(--font-body)", fontSize: "0.82rem",
        }}>
          {error}
        </div>
      )}

      {/* ── Items ── */}
      {loading ? (
        <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
          Loading checklist...
        </p>
      ) : items.length === 0 ? (
        <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem", textAlign: "center" }}>
          No checklist items yet — add one below
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {items.map((item) => {
            const isExpanded  = expandedId === item.id;
            const isEditing   = editingId === item.id;
            const isUploading = uploadingId === item.id;
            const fileCount   = item.files?.length ?? 0;

            return (
              <div
                key={item.id}
                style={{
                  borderRadius: "10px",
                  border: `1px solid ${isExpanded ? "rgba(91,140,255,0.2)" : "var(--color-hover)"}`,
                  backgroundColor: isExpanded
                    ? "rgba(91,140,255,0.05)"
                    : "var(--color-subtle)",
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}
              >
                {/* ── Item row ── */}
                <div style={{
                  display: "flex", alignItems: "center",
                  gap: "0.625rem", padding: "0.625rem 0.75rem",
                }}>

                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(item)}
                    style={{
                      width: "18px", height: "18px", flexShrink: 0,
                      borderRadius: "5px",
                      border: `2px solid ${item.is_done ? "#10B981" : "var(--color-border)"}`,
                      backgroundColor: item.is_done ? "#10B981" : "var(--color-surface)",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    {item.is_done && (
                      <span style={{ color: "white", fontSize: "10px", fontWeight: 700 }}>✓</span>
                    )}
                  </button>

                  {/* Title — editable inline */}
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")  handleSaveEdit(item);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={() => handleSaveEdit(item)}
                      style={{
                        flex: 1, background: "transparent",
                        border: "none", outline: "none",
                        color: "var(--color-foreground)", fontFamily: "var(--font-body)",
                        fontSize: "0.875rem",
                      }}
                    />
                  ) : (
                    <span
                      onDoubleClick={() => handleStartEdit(item)}
                      style={{
                        flex: 1,
                        fontFamily: "var(--font-body)", fontSize: "0.875rem",
                        color: item.is_done ? "var(--color-muted)" : "var(--color-muted)",
                        textDecoration: item.is_done ? "line-through" : "none",
                        cursor: "text",
                      }}
                    >
                      {item.title}
                    </span>
                  )}

                  {/* File count badge */}
                  {fileCount > 0 && (
                    <span style={{
                      padding: "1px 6px", borderRadius: "20px",
                      backgroundColor: "rgba(91,140,255,0.1)",
                      color: "#5B8CFF",
                      fontFamily: "var(--font-mono)", fontSize: "0.7rem",
                      flexShrink: 0,
                    }}>
                      📎 {fileCount}
                    </span>
                  )}

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    style={{
                      width: "24px", height: "24px", borderRadius: "6px",
                      border: "none", backgroundColor: "transparent",
                      color: isExpanded ? "#5B8CFF" : "var(--color-muted)",
                      cursor: "pointer", fontSize: "0.7rem",
                      transition: "all 0.2s", flexShrink: 0,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#5B8CFF"}
                    onMouseLeave={(e) => e.currentTarget.style.color = isExpanded ? "#5B8CFF" : "var(--color-muted)"}
                    title="Expand"
                  >
                    {isExpanded ? "▲" : "▼"}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(item)}
                    style={{
                      width: "24px", height: "24px", borderRadius: "6px",
                      border: "none", backgroundColor: "transparent",
                      color: "var(--color-muted)", cursor: "pointer",
                      fontSize: "0.75rem", transition: "all 0.2s", flexShrink: 0,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#EF4444"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-muted)"}
                    title="Delete item"
                  >
                    ✕
                  </button>
                </div>

                {/* ── Expanded panel: files ── */}
                {isExpanded && (
                  <div style={{
                    padding: "0.75rem",
                    borderTop: "1px solid var(--color-hover)",
                    display: "flex", flexDirection: "column", gap: "0.625rem",
                  }}>

                    {/* File list */}
                    {fileCount === 0 ? (
                      <p style={{
                        fontFamily: "var(--font-body)", fontSize: "0.8rem",
                        color: "var(--color-muted)", textAlign: "center",
                      }}>
                        No files attached to this item
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        {item.files.map((file) => (
                          <div
                            key={file.id}
                            style={{
                              display: "flex", alignItems: "center", gap: "0.5rem",
                              padding: "0.5rem 0.625rem",
                              backgroundColor: "var(--color-subtle)",
                              borderRadius: "8px",
                              border: "1px solid var(--color-hover)",
                            }}
                          >
                            <span style={{ fontSize: "1rem", flexShrink: 0 }}>
                              {getFileIcon(file.file_type)}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontFamily: "var(--font-body)", fontSize: "0.8rem",
                                color: "var(--color-muted)",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>
                                {file.file_name}
                              </p>
                              <p style={{
                                fontFamily: "var(--font-body)", fontSize: "0.7rem",
                                color: "var(--color-muted)",
                              }}>
                                {formatSize(file.file_size)}
                              </p>
                            </div>
                            <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                              <button
                                onClick={() => viewFile(file)}
                                style={{
                                  padding: "0.25rem 0.5rem", borderRadius: "5px",
                                  border: "1px solid var(--color-border)",
                                  backgroundColor: "transparent",
                                  color: "var(--color-muted)", fontFamily: "var(--font-body)",
                                  fontSize: "0.72rem", cursor: "pointer", transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(91,140,255,0.1)"; e.currentTarget.style.color = "#5B8CFF"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-muted)"; }}
                              >
                                View
                              </button>
                              <button
                                onClick={() => downloadFile(file)}
                                style={{
                                  padding: "0.25rem 0.5rem", borderRadius: "5px",
                                  border: "1px solid var(--color-border)",
                                  backgroundColor: "transparent",
                                  color: "var(--color-muted)", fontFamily: "var(--font-body)",
                                  fontSize: "0.72rem", cursor: "pointer", transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.1)"; e.currentTarget.style.color = "#10B981"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-muted)"; }}
                              >
                                ↓
                              </button>
                              <button
                                onClick={() => deleteFile(file)}
                                style={{
                                  padding: "0.25rem 0.5rem", borderRadius: "5px",
                                  border: "1px solid var(--color-border)",
                                  backgroundColor: "transparent",
                                  color: "var(--color-muted)", fontFamily: "var(--font-body)",
                                  fontSize: "0.72rem", cursor: "pointer", transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#EF4444"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-muted)"; }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload file to this item */}
                    <label style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.4rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px dashed rgba(91,140,255,0.25)",
                      backgroundColor: "rgba(91,140,255,0.03)",
                      color: isUploading ? "var(--color-muted)" : "#5B8CFF",
                      fontFamily: "var(--font-body)", fontSize: "0.8rem",
                      fontWeight: 500, cursor: isUploading ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}>
                      {isUploading ? "⏳ Uploading..." : "📎 Attach file"}
                      <input
                        type="file"
                        disabled={isUploading}
                        onChange={(e) => handleUploadFile(item, e)}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add new item ── */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add checklist item..."
          style={{
            flex: 1, padding: "0.5rem 0.75rem",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-hover)",
            color: "var(--color-foreground)", fontFamily: "var(--font-body)",
            fontSize: "0.875rem", outline: "none", transition: "border 0.2s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
          onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newTitle.trim()}
          style={{
            padding: "0.5rem 0.875rem", borderRadius: "8px", border: "none",
            background: adding || !newTitle.trim()
              ? "rgba(91,140,255,0.3)"
              : "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
            color: "white", fontFamily: "var(--font-body)",
            fontWeight: 600, fontSize: "0.8rem",
            cursor: adding || !newTitle.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {adding ? "..." : "+ Add"}
        </button>
      </div>

      {items.length > 0 && (
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.72rem",
          color: "var(--color-muted)", textAlign: "center",
        }}>
          Double-click any item to edit • Click ▼ to attach files
        </p>
      )}
    </div>
  );
}

