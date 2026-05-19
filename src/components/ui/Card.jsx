export default function Card({ title, subtitle, children, style, className }) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        maxWidth: "540px",
        padding: "1.5rem",
        borderRadius: "1.25rem",
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
        backdropFilter: "blur(8px)",
        ...style,
      }}
    >
      {(title || subtitle) && (
        <div style={{ marginBottom: "1.5rem" }}>
          {title && (
            <h2 style={{
              margin: 0,
              fontFamily: "var(--font-heading)",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--color-foreground)",
            }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p style={{
              margin: "0.5rem 0 0",
              color: "var(--color-muted)",
              fontFamily: "var(--font-body)",
              fontSize: "0.95rem",
              lineHeight: 1.5,
            }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}


