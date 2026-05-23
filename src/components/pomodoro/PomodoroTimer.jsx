export default function PomodoroTimer({ time, modeLabel, progress, accent }) {
  return (
    <div className="pomodoro-timer" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1.5rem", borderRadius: "24px", backgroundColor: "var(--color-subtle)" }}>
      <div className="pomodoro-timer-ring" style={{ width: "min(260px, 100%)", aspectRatio: "1 / 1", borderRadius: "50%", border: "8px solid var(--color-ring)", position: "relative", display: "grid", placeItems: "center", maxWidth: "100%" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `conic-gradient(${accent || "#5B8CFF"} ${progress}%, var(--color-ring) 0)` }} />
        <div style={{ position: "relative", width: "calc(100% - 40px)", height: "calc(100% - 40px)", maxWidth: "100%", maxHeight: "100%", borderRadius: "50%", backgroundColor: "var(--color-surface-strong)", display: "grid", placeItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "2.75rem", fontWeight: 700, color: "var(--color-foreground)" }}>{time}</div>
            <div style={{ marginTop: "0.35rem", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>{modeLabel}</div>
          </div>
        </div>
      </div>
      <div style={{ width: "100%", height: "8px", backgroundColor: "var(--color-ring)", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: "100%", backgroundColor: accent || "#5B8CFF", transition: "width 0.2s ease" }} />
      </div>
    </div>
  );
}


