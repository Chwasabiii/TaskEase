export default function FocusPrompt({ prompt, onStart }) {
  return (
    <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-foreground)" }}>
          Focus Prompt
        </h3>
        <p style={{ margin: "0.75rem 0 0", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
          {prompt || "Choose one task and begin with a clear next step."}
        </p>
      </div>
      <button
        type="button"
        onClick={onStart}
        style={{ padding: "0.9rem 1rem", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)", color: "white", fontWeight: 700, cursor: "pointer" }}
      >
        Start Focus
      </button>
    </div>
  );
}


