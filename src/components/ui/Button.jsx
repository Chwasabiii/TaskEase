export default function Button({
  variant = "primary",
  fullWidth = false,
  style,
  children,
  ...props
}) {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    borderRadius: "1rem",
    border: "1px solid transparent",
    fontFamily: "inherit",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
    padding: "0.75rem 1.25rem",
    minHeight: "44px",
    width: fullWidth ? "100%" : undefined,
    ...style,
  };

  const variants = {
    primary: {
      backgroundColor: "var(--color-primary)",
      color: "var(--color-on-primary)",
      borderColor: "var(--color-primary)",
      boxShadow: "0 12px 24px var(--color-glow)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--color-foreground)",
      borderColor: "var(--color-border)",
    },
    secondary: {
      backgroundColor: "var(--color-surface)",
      color: "var(--color-foreground)",
      borderColor: "var(--color-border)",
    },
  };

  return (
    <button style={{ ...baseStyle, ...(variants[variant] ?? variants.primary) }} {...props}>
      {children}
    </button>
  );
}


