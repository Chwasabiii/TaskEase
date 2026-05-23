import Button from "./Button";
import Card from "./Card";

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Sign out",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        display: "grid",
        placeItems: "center",
        padding: "1.5rem",
      }}
      onClick={onClose}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "1.5rem",
          borderRadius: "1.5rem",
          backgroundColor: "var(--color-surface-strong)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 32px 80px rgba(15, 23, 42, 0.18)",
        }}
      >
        <div onClick={(event) => event.stopPropagation()}>
          <h2
            id="confirm-modal-title"
            style={{
              margin: 0,
              fontFamily: "var(--font-heading)",
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "var(--color-foreground)",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              margin: "0.85rem 0 1.5rem",
              color: "var(--color-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "0.95rem",
              lineHeight: 1.75,
            }}
          >
            {message}
          </p>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              style={{ backgroundColor: "#EF4444", borderColor: "#EF4444" }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
