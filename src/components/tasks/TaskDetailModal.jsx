import { useState } from "react";
import ChecklistPanel from "./ChecklistPanel";
import { useTaskFiles } from "../../hooks/useTaskFiles";

const TABS = ["Details", "Checklist", "Files"];

const PRIORITY_COLORS = {
  low:    "#10B981",
  medium: "#F59E0B",
  high:   "#EF4444",
  urgent: "#7C5CFF",
};

export default function TaskDetailModal({ task, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState("Details");
  const {
    files, loading: filesLoading,
    uploadFile, viewFile, downloadFile, deleteFile,
  } = useTaskFiles(task.id);

  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");

  const formatDate = (date) => date
    ? new Date(date).toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "No due date";

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFileError("");
    const { error } = await uploadFile(file);
    if (error) setFileError(error.message);
    setUploading(false);
    e.target.value = "";
  };

  const tabStyle = (active) => ({
    flex: 1, padding: "0.5rem",
    borderRadius: "8px", border: "none",
    backgroundColor: active ? "rgba(91,140,255,0.15)" : "transparent",
    color: active ? "#5B8CFF" : "var(--color-muted)",
    fontFamily: "var(--font-body)", fontSize: "0.85rem",
    fontWeight: active ? 600 : 400,
    cursor: "pointer", transition: "all 0.2s",
  });

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        backgroundColor: "var(--color-overlay)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-card"
        style={{ width: "100%", maxWidth: "600px", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div style={{
          padding: "1.5rem 1.5rem 1rem",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
                <span style={{
                  width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0,
                  backgroundColor: PRIORITY_COLORS[task.priority] || "#5B8CFF",
                }} />
                <h2 style={{
                  fontFamily: "var(--font-heading)", fontSize: "1.2rem",
                  fontWeight: 700, color: "var(--color-foreground)",
                }}>
                  {task.title}
                </h2>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{
                  padding: "2px 8px", borderRadius: "20px", fontSize: "0.72rem",
                  fontFamily: "var(--font-body)", fontWeight: 600,
                  backgroundColor: `${PRIORITY_COLORS[task.priority]}20`,
                  color: PRIORITY_COLORS[task.priority] || "#5B8CFF",
                }}>
                  {task.priority}
                </span>
                {task.category && (
                  <span style={{
                    padding: "2px 8px", borderRadius: "20px", fontSize: "0.72rem",
                    fontFamily: "var(--font-body)",
                    backgroundColor: "rgba(91,140,255,0.1)", color: "#5B8CFF",
                  }}>
                    {task.category}
                  </span>
                )}
                <span style={{
                  padding: "2px 8px", borderRadius: "20px", fontSize: "0.72rem",
                  fontFamily: "var(--font-body)",
                  backgroundColor: task.status === "done"
                    ? "rgba(16,185,129,0.1)"
                    : "var(--color-hover)",
                  color: task.status === "done" ? "#10B981" : "var(--color-muted)",
                }}>
                  {task.status === "in_progress" ? "In Progress" : task.status === "done" ? "Done" : "To Do"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
              <button
                onClick={() => onEdit(task)}
                style={{
                  padding: "0.4rem 0.875rem", borderRadius: "8px",
                  border: "1px solid rgba(91,140,255,0.3)",
                  backgroundColor: "rgba(91,140,255,0.1)",
                  color: "#5B8CFF", fontFamily: "var(--font-body)",
                  fontSize: "0.8rem", fontWeight: 500, cursor: "pointer",
                }}
              >
                ✎ Edit
              </button>
              <button
                onClick={onClose}
                style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "transparent", color: "var(--color-muted)",
                  cursor: "pointer", fontSize: "1rem",
                }}
              >✕</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "4px", padding: "0.75rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}>
          {TABS.map((tab) => (
            <button key={tab} style={tabStyle(activeTab === tab)} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>

          {/* Details tab */}
          {activeTab === "Details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {task.description && (
                <div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--color-muted)", marginBottom: "0.4rem" }}>
                    Description
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-muted)", lineHeight: 1.6 }}>
                    {task.description}
                  </p>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {[
                  { label: "Due Date",  value: formatDate(task.due_date) },
                  { label: "Priority",  value: task.priority },
                  { label: "Status",    value: task.status },
                  { label: "Category",  value: task.category || "None" },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    padding: "0.875rem",
                    backgroundColor: "var(--color-subtle)",
                    borderRadius: "10px",
                    border: "1px solid var(--color-hover)",
                  }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>
                      {label}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-muted)", fontWeight: 500, textTransform: "capitalize" }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklist tab */}
          {activeTab === "Checklist" && (
            <ChecklistPanel taskId={task.id} />
          )}

          {/* Files tab */}
          {activeTab === "Files" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Upload */}
              <div style={{
                padding: "1.25rem",
                border: "2px dashed rgba(91,140,255,0.2)",
                borderRadius: "10px", textAlign: "center",
                backgroundColor: "rgba(91,140,255,0.03)",
              }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-muted)", marginBottom: "0.75rem" }}>
                  📎 Attach a file to this task
                </p>
                <label style={{
                  padding: "0.5rem 1.25rem", borderRadius: "8px",
                  background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
                  color: "white", fontFamily: "var(--font-body)",
                  fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                }}>
                  {uploading ? "Uploading..." : "Choose File"}
                  <input
                    type="file"
                    onChange={handleUpload}
                    disabled={uploading}
                    style={{ display: "none" }}
                  />
                </label>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.5rem" }}>
                  Max 50MB
                </p>
              </div>

              {fileError && (
                <div style={{
                  backgroundColor: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px", padding: "0.625rem 0.875rem",
                  color: "#EF4444", fontFamily: "var(--font-body)", fontSize: "0.85rem",
                }}>
                  {fileError}
                </div>
              )}

              {/* File list */}
              {filesLoading ? (
                <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
                  Loading files...
                </p>
              ) : files.length === 0 ? (
                <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.875rem", textAlign: "center" }}>
                  No files attached yet
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {files.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.75rem 0.875rem",
                        backgroundColor: "var(--color-subtle)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "10px", transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-border)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--color-subtle)"}
                    >
                      <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>
                        {file.file_type?.startsWith("image/") ? "🖼" :
                         file.file_type?.includes("pdf") ? "📄" :
                         file.file_type?.includes("video") ? "🎬" : "📎"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: "var(--font-body)", fontSize: "0.875rem",
                          color: "var(--color-muted)", fontWeight: 500,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {file.file_name}
                        </p>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                          {formatSize(file.file_size)}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                        <button
                          onClick={() => viewFile(file)}
                          style={{
                            padding: "0.3rem 0.625rem", borderRadius: "6px",
                            border: "1px solid var(--color-border)",
                            backgroundColor: "transparent", color: "var(--color-muted)",
                            fontFamily: "var(--font-body)", fontSize: "0.75rem",
                            cursor: "pointer", transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(91,140,255,0.1)"; e.currentTarget.style.color = "#5B8CFF"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-muted)"; }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => downloadFile(file)}
                          style={{
                            padding: "0.3rem 0.625rem", borderRadius: "6px",
                            border: "1px solid var(--color-border)",
                            backgroundColor: "transparent", color: "var(--color-muted)",
                            fontFamily: "var(--font-body)", fontSize: "0.75rem",
                            cursor: "pointer", transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(16,185,129,0.1)"; e.currentTarget.style.color = "#10B981"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-muted)"; }}
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => deleteFile(file)}
                          style={{
                            padding: "0.3rem 0.625rem", borderRadius: "6px",
                            border: "1px solid var(--color-border)",
                            backgroundColor: "transparent", color: "var(--color-muted)",
                            fontFamily: "var(--font-body)", fontSize: "0.75rem",
                            cursor: "pointer", transition: "all 0.2s",
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

