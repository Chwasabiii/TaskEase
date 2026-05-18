import { useRef, useState } from "react";
import { useChecklist } from "../../hooks/useChecklist";

const formatSize = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

function ChecklistFileInput({ item, onUpload }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await onUpload(item, file);
    setUploading(false);
    event.target.value = "";
  };

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          padding: "0.35rem 0.625rem",
          borderRadius: "8px",
          border: "1px solid rgba(91,140,255,0.25)",
          backgroundColor: uploading ? "rgba(91,140,255,0.08)" : "rgba(91,140,255,0.12)",
          color: "#5B8CFF",
          fontFamily: "var(--font-body)",
          fontSize: "0.76rem",
          cursor: uploading ? "not-allowed" : "pointer",
        }}
      >
        {uploading ? "Uploading..." : "Attach File"}
      </button>
      <input ref={inputRef} type="file" onChange={handleChange} style={{ display: "none" }} />
    </>
  );
}

export default function ChecklistSection({ taskId }) {
  const {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    uploadItemFile,
    viewFile,
    downloadFile,
    deleteFile,
  } = useChecklist(taskId);

  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const { error: createError } = await createItem(newTitle);
    if (!createError) setNewTitle("");
    setCreating(false);
  };

  const completedCount = items.filter((item) => item.is_done).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <h4 style={{
          fontFamily: "var(--font-heading)", fontSize: "0.95rem",
          fontWeight: 600, color: "#94A3B8",
        }}>
          Checklist {items.length > 0 && `(${completedCount}/${items.length})`}
        </h4>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleCreate()}
          placeholder="Add a checklist item..."
          style={{
            flex: 1,
            padding: "0.6rem 0.875rem",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "#F1F5F9",
            fontFamily: "var(--font-body)",
            fontSize: "0.875rem",
            outline: "none",
          }}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newTitle.trim()}
          style={{
            padding: "0.6rem 0.875rem",
            borderRadius: "10px",
            border: "none",
            background: creating || !newTitle.trim()
              ? "rgba(91,140,255,0.3)"
              : "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
            color: "white",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: creating || !newTitle.trim() ? "not-allowed" : "pointer",
          }}
        >
          Add
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "10px",
          padding: "0.75rem 1rem",
          color: "#EF4444",
          fontFamily: "var(--font-body)",
          fontSize: "0.85rem",
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#475569", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
          Loading checklist...
        </p>
      ) : items.length === 0 ? (
        <p style={{ color: "#334155", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
          No checklist items yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "0.875rem",
                borderRadius: "10px",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <button
                  onClick={() => updateItem(item.id, { is_done: !item.is_done })}
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "6px",
                    border: `2px solid ${item.is_done ? "#10B981" : "rgba(255,255,255,0.2)"}`,
                    backgroundColor: item.is_done ? "#10B981" : "transparent",
                    color: "white",
                    cursor: "pointer",
                    flexShrink: 0,
                    marginTop: "0.25rem",
                    fontSize: "0.72rem",
                  }}
                >
                  {item.is_done ? "✓" : ""}
                </button>

                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <input
                    value={item.title}
                    onChange={(event) => updateItem(item.id, { title: event.target.value })}
                    style={{
                      width: "100%",
                      border: "none",
                      backgroundColor: "transparent",
                      color: item.is_done ? "#64748B" : "#CBD5E1",
                      textDecoration: item.is_done ? "line-through" : "none",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />
                  <textarea
                    value={item.notes || ""}
                    onChange={(event) => updateItem(item.id, { notes: event.target.value })}
                    placeholder="Add notes or requirements..."
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.7rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      backgroundColor: "rgba(255,255,255,0.03)",
                      color: "#94A3B8",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8rem",
                      resize: "vertical",
                      outline: "none",
                    }}
                  />
                </div>

                <button
                  onClick={() => deleteItem(item)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    border: "1px solid rgba(239,68,68,0.25)",
                    backgroundColor: "rgba(239,68,68,0.08)",
                    color: "#EF4444",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                  title="Delete checklist item"
                >
                  x
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.74rem", color: "#475569" }}>
                  {(item.files || []).length} file{(item.files || []).length === 1 ? "" : "s"} attached
                </p>
                <ChecklistFileInput item={item} onUpload={uploadItemFile} />
              </div>

              {(item.files || []).length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {item.files.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 0.625rem",
                        borderRadius: "8px",
                        backgroundColor: "rgba(15,23,42,0.45)",
                      }}
                    >
                      <span style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "#CBD5E1",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.8rem",
                      }}>
                        {file.file_name}
                      </span>
                      <span style={{ color: "#475569", fontFamily: "var(--font-body)", fontSize: "0.72rem" }}>
                        {formatSize(file.file_size)}
                      </span>
                      <button onClick={() => viewFile(file)} style={fileButtonStyle}>View</button>
                      <button onClick={() => downloadFile(file)} style={fileButtonStyle}>Download</button>
                      <button onClick={() => deleteFile(file)} style={deleteButtonStyle}>x</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const fileButtonStyle = {
  padding: "0.3rem 0.5rem",
  borderRadius: "7px",
  border: "1px solid rgba(255,255,255,0.08)",
  backgroundColor: "rgba(255,255,255,0.04)",
  color: "#94A3B8",
  fontFamily: "var(--font-body)",
  fontSize: "0.72rem",
  cursor: "pointer",
};

const deleteButtonStyle = {
  ...fileButtonStyle,
  border: "1px solid rgba(239,68,68,0.25)",
  backgroundColor: "rgba(239,68,68,0.08)",
  color: "#EF4444",
};
