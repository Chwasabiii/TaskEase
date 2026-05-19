export default function BrainDumpPanel({ value, onChange }) {
  return (
    <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--color-foreground)" }}>
        Brain Dump
      </h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write anything on your mind — tasks, ideas, distractions..."
        rows={6}
        style={{ width: "100%", padding: "1rem", borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-hover)", color: "var(--color-foreground)", fontFamily: "var(--font-body)", fontSize: "0.95rem", resize: "vertical" }}
      />
    </div>
  );
}


