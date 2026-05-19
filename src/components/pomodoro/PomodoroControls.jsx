export default function PomodoroControls({
  isRunning,
  onStartPause,
  onReset,
  soundEnabled,
  onToggleSound,
  onSave,
  saving,
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
      <button
        type="button"
        onClick={onStartPause}
        style={{ padding: "0.95rem 1.2rem", borderRadius: "999px", border: "none", background: "linear-gradient(135deg, #5B8CFF, #7C5CFF)", color: "var(--color-on-primary)", fontWeight: 700, cursor: "pointer" }}
      >
        {isRunning ? "Pause" : "Start"}
      </button>
      <button
        type="button"
        onClick={onReset}
        style={{ padding: "0.95rem 1.2rem", borderRadius: "999px", border: "1px solid var(--color-border)", backgroundColor: "transparent", color: "var(--color-foreground)", fontWeight: 700, cursor: "pointer" }}
      >
        Reset
      </button>
      <button
        type="button"
        onClick={onToggleSound}
        style={{ padding: "0.95rem 1.2rem", borderRadius: "999px", border: "1px solid var(--color-border)", backgroundColor: soundEnabled ? "var(--color-primary-soft)" : "var(--color-subtle)", color: "var(--color-foreground)", fontWeight: 700, cursor: "pointer" }}
      >
        {soundEnabled ? "Sound On" : "Sound Off"}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        style={{ padding: "0.95rem 1.2rem", borderRadius: "999px", border: "none", background: saving ? "rgba(91,140,255,0.5)" : "rgba(16,185,129,0.9)", color: "var(--color-on-primary)", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
      >
        {saving ? "Saving..." : "Save Session"}
      </button>
    </div>
  );
}


