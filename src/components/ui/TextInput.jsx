export default function TextInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  required,
  style,
  inputStyle,
  action,
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem", ...style }}>
      {label}
      <span style={{ position: "relative", display: "block" }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            width: "100%",
            padding: "0.85rem 1rem",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-foreground)",
            fontFamily: "var(--font-body)",
            fontSize: "0.95rem",
            outline: "none",
            transition: "border-color 0.2s ease",
            ...inputStyle,
          }}
        />
        {action}
      </span>
    </label>
  );
}


