import { Button, TextInput } from "../ui";

export default function ForgotPasswordForm({
  email,
  onEmailChange,
  onSubmit,
  loading,
  error,
  notice,
  onBackToLogin,
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {error && (
        <div style={{ color: "#EF4444", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "0.85rem" }}>
          {error}
        </div>
      )}
      {notice && (
        <div style={{ color: "#10B981", backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "0.85rem" }}>
          {notice}
        </div>
      )}
      <TextInput
        label="Email"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="you@example.com"
        required
      />

      <Button
        type="submit"
        disabled={loading}
        variant="primary"
        style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.75 : 1 }}
      >
        {loading ? "Sending reset link..." : "Send reset link"}
      </Button>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
        <button
          type="button"
          onClick={onBackToLogin}
          style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontWeight: 700 }}
        >
          Back to sign in
        </button>
        <span style={{ flex: "1 1 100%", color: "var(--color-muted)", fontSize: "0.8rem" }}>
          We’ll email you a link to reset your password.
        </span>
      </div>
    </form>
  );
}
