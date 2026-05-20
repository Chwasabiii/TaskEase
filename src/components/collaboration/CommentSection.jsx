import { useState } from "react";
import { useComments } from "../../hooks/useComments";
import { useAuth } from "../../context/AuthContext";

export default function CommentSection({ taskId }) {
  const { user } = useAuth();
  const { comments, loading, error, addComment, deleteComment } = useComments(taskId);
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const { error } = await addComment(text.trim());
    if (!error) setText("");
    setSending(false);
  };

  const formatTime = (date) =>
    new Date(date).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });

  const getInitial = (profile) =>
    profile?.full_name?.[0]?.toUpperCase() ?? "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h4 style={{
        fontFamily: "var(--font-heading)", fontSize: "0.95rem",
        fontWeight: 600, color: "var(--color-muted)",
      }}>
        💬 Comments {comments.length > 0 && `(${comments.length})`}
      </h4>

      {error && (
        <p style={{
          margin: 0,
          padding: "0.6rem 0.75rem",
          borderRadius: "8px",
          border: "1px solid rgba(239,68,68,0.25)",
          backgroundColor: "rgba(239,68,68,0.08)",
          color: "#EF4444",
          fontFamily: "var(--font-body)",
          fontSize: "0.82rem",
        }}>
          {error}
        </p>
      )}

      {/* Comment list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "300px", overflowY: "auto" }}>
        {loading ? (
          <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <p style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.85rem" }}>
            No comments yet. Start the conversation!
          </p>
        ) : (
          comments.map((comment) => {
            const isOwn = comment.user_id === user.id;
            return (
              <div
                key={comment.id}
                style={{
                  display: "flex",
                  gap: "0.625rem",
                  alignItems: "flex-start",
                  flexDirection: isOwn ? "row-reverse" : "row",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: "30px", height: "30px", borderRadius: "8px",
                  background: isOwn
                    ? "linear-gradient(135deg, #5B8CFF, #7C5CFF)"
                    : "linear-gradient(135deg, #10B981, #22D3EE)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-heading)", fontWeight: 700,
                  fontSize: "0.75rem", color: "white", flexShrink: 0,
                }}>
                  {getInitial(comment.profile)}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: "75%" }}>
                  <div style={{
                    backgroundColor: isOwn
                      ? "rgba(91,140,255,0.15)"
                      : "var(--color-hover)",
                    border: `1px solid ${isOwn ? "rgba(91,140,255,0.2)" : "var(--color-border)"}`,
                    borderRadius: isOwn ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                    padding: "0.625rem 0.875rem",
                  }}>
                    <p style={{
                      fontFamily: "var(--font-body)", fontSize: "0.875rem",
                      color: "var(--color-muted)", lineHeight: 1.5,
                    }}>
                      {comment.content}
                    </p>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    marginTop: "0.25rem",
                    justifyContent: isOwn ? "flex-end" : "flex-start",
                  }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "var(--color-muted)" }}>
                      {formatTime(comment.created_at)}
                    </span>
                    {isOwn && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        style={{
                          background: "none", border: "none",
                          color: "var(--color-muted)", cursor: "pointer",
                          fontSize: "0.7rem", padding: 0,
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#EF4444"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-muted)"}
                      >
                        delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Write a comment..."
          style={{
            flex: 1,
            padding: "0.6rem 0.875rem",
            borderRadius: "10px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-hover)",
            color: "var(--color-foreground)",
            fontFamily: "var(--font-body)",
            fontSize: "0.875rem",
            outline: "none",
            transition: "border 0.2s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#5B8CFF"}
          onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "10px",
            border: "none",
            background: sending || !text.trim()
              ? "rgba(91,140,255,0.3)"
              : "linear-gradient(135deg, #5B8CFF, #7C5CFF)",
            color: "white",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: sending || !text.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

