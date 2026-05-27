function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none">
        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M8.4 5.6A10.7 10.7 0 0 1 12 5c5 0 8.4 4.2 9.5 6a13.5 13.5 0 0 1-3.1 3.7M6.2 6.8A13.6 13.6 0 0 0 2.5 11c1.1 1.8 4.5 6 9.5 6 1.2 0 2.4-.2 3.4-.7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function PasswordToggleButton({ visible, onToggle, label }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      style={{
        position: "absolute",
        right: "0.55rem",
        top: "50%",
        transform: "translateY(-50%)",
        width: "2rem",
        height: "2rem",
        display: "grid",
        placeItems: "center",
        border: "1px solid var(--color-border)",
        borderRadius: "10px",
        backgroundColor: "var(--color-subtle)",
        color: "var(--color-muted)",
        cursor: "pointer",
      }}
    >
      <EyeIcon hidden={visible} />
    </button>
  );
}
