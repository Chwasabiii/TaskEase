const TIPS = [
  "Break bigger tasks into 10-minute steps.",
  "Use a timer to help start and stop work blocks.",
  "Turn off notifications while you are focusing.",
  "Write down one goal before you begin each session.",
];

export default function ADHDTipsPanel() {
  return (
    <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-foreground)" }}>
        ADHD Focus Tips
      </h3>
      <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
        {TIPS.map((tip) => (
          <li key={tip} style={{ marginBottom: "0.6rem" }}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}


