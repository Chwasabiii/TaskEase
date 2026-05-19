export default function PomodoroModeSelector({ modes, activeMode, onSelectMode }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
      {modes.map((item) => {
        const active = item.id === activeMode;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectMode(item.id)}
            style={{
              flex: 1,
              minWidth: "110px",
              padding: "0.75rem 0.9rem",
              borderRadius: "12px",
              border: active ? `1px solid ${item.accent}` : "1px solid var(--color-border)",
              backgroundColor: active ? "var(--color-primary-soft)" : "transparent",
              color: active ? "var(--color-foreground)" : "var(--color-muted)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontWeight: active ? 600 : 500,
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}


