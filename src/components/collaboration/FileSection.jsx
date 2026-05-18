import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTaskFiles } from "../../hooks/useTaskFiles";

const formatSize = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (date) =>
  new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const getInitial = (profile) =>
  profile?.full_name?.[0]?.toUpperCase() ?? "?";

export default function FileSection({ taskId }) {
  const { user } = useAuth();
  const { files, loading, error, uploadFile, viewFile, downloadFile, deleteFile } = useTaskFiles(taskId);
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await uploadFile(file);
    setUploading(false);
    event.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <h4 style={{
          fontFamily: "var(--font-heading)", fontSize: "0.95rem",
          fontWeight: 600, color: "#94A3B8",
        }}>
          Files {files.length > 0 && `(${files.length})`}
        </h4>

        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: "0.5rem 0.875rem",
            borderRadius: "10px",
            border: "1px solid rgba(91,140,255,0.3)",
            backgroundColor: uploading ? "rgba(91,140,255,0.08)" : "rgba(91,140,255,0.14)",
            color: "#5B8CFF",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: "0.82rem",
            cursor: uploading ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
        <input ref={inputRef} type="file" onChange={handleUpload} style={{ display: "none" }} />
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
          Loading files...
        </p>
      ) : files.length === 0 ? (
        <p style={{ color: "#334155", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
          No shared files yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {files.map((file) => {
            const isOwn = file.uploaded_by === user.id;

            return (
              <div
                key={file.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 0.875rem",
                  borderRadius: "10px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{
                  width: "34px", height: "34px", borderRadius: "8px",
                  backgroundColor: "rgba(91,140,255,0.14)",
                  color: "#5B8CFF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-heading)", fontWeight: 700,
                  fontSize: "0.72rem", flexShrink: 0,
                }}>
                  {getInitial(file.profile)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: "var(--font-body)", fontSize: "0.875rem",
                    fontWeight: 500, color: "#CBD5E1",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {file.file_name}
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#475569" }}>
                    {formatSize(file.file_size)} · {formatDate(file.created_at)}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                  <button
                    onClick={() => viewFile(file)}
                    style={{
                      padding: "0.35rem 0.625rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                      color: "#94A3B8",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.76rem",
                      cursor: "pointer",
                    }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => downloadFile(file)}
                    style={{
                      padding: "0.35rem 0.625rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(16,185,129,0.25)",
                      backgroundColor: "rgba(16,185,129,0.08)",
                      color: "#10B981",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.76rem",
                      cursor: "pointer",
                    }}
                  >
                    Download
                  </button>
                  {isOwn && (
                    <button
                      onClick={() => deleteFile(file)}
                      style={{
                        width: "30px", height: "30px",
                        borderRadius: "8px",
                        border: "1px solid rgba(239,68,68,0.25)",
                        backgroundColor: "rgba(239,68,68,0.08)",
                        color: "#EF4444",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                      title="Delete file"
                    >
                      x
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
