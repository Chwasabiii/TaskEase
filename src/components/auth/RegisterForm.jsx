import { Button, TextInput } from "../ui";

export default function RegisterForm({
  fullName,
  email,
  password,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  loading,
  error,
  success,
  onResendConfirmation,
  onSwitchToLogin,
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {error && (
        <div style={{ color: "#EF4444", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "0.85rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ color: "#10B981", backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "0.85rem" }}>
          {success}
        </div>
      )}
      <TextInput
        label="Full Name"
        type="text"
        value={fullName}
        onChange={onFullNameChange}
        placeholder="John Doe"
        required
      />
      <TextInput
        label="Email"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="you@example.com"
        required
      />
      <TextInput
        label="Password"
        type="password"
        value={password}
        onChange={onPasswordChange}
        placeholder="Min. 6 characters"
        required
      />
      <Button
        type="submit"
        disabled={loading}
        variant="primary"
        style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.75 : 1 }}
      >
        {loading ? "Creating account..." : "Create account"}
      </Button>
      {success && onResendConfirmation && (
        <button
          type="button"
          onClick={onResendConfirmation}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-primary)",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "var(--font-body)",
            fontWeight: 700,
          }}
        >
          Resend confirmation email
        </button>
      )}
      <div style={{ textAlign: "center", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontWeight: 700 }}>
          Sign in
        </button>
      </div>
    </form>
  );
}


