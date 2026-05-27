import { useState } from "react";
import { Button, TextInput } from "../ui";
import PasswordToggleButton from "./PasswordToggleButton";

export default function RegisterForm({
  fullName,
  username,
  usernameStatus,
  email,
  password,
  confirmPassword,
  onFullNameChange,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  loading,
  error,
  success,
  onResendConfirmation,
  onSwitchToLogin,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        placeholder="Ex. John Doe"
        required
      />
      <TextInput
        label="Username"
        type="text"
        value={username}
        onChange={(value) => onUsernameChange?.(value.toLowerCase().replace(/^@+/, ""))}
        placeholder="Ex. johndoe"
        required
      />
      {usernameStatus && usernameStatus !== "idle" && (
        <p
          aria-live="polite"
          style={{
            marginTop: "-0.65rem",
            color:
              usernameStatus === "available"
                ? "#10B981"
                : usernameStatus === "checking"
                  ? "var(--color-muted)"
                  : "#EF4444",
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            lineHeight: 1.4,
          }}
        >
          {usernameStatus === "checking" && "Checking username..."}
          {usernameStatus === "available" && "Username is available."}
          {usernameStatus === "taken" && "Username is already taken."}
          {usernameStatus === "invalid" && "Use 3-24 letters, numbers, periods, or underscores."}
          {usernameStatus === "unavailable" && "Could not check username right now."}
        </p>
      )}
      <TextInput
        label="Email"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="Ex. you@example.com"
        required
      />
      <TextInput
        label="Password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={onPasswordChange}
        placeholder="Ex. Min. 8 characters"
        required
        inputStyle={{ paddingRight: "3.15rem" }}
        action={
          <PasswordToggleButton
            visible={showPassword}
            onToggle={() => setShowPassword((current) => !current)}
            label={showPassword ? "Hide password" : "Show password"}
          />
        }
      />
      <TextInput
        label="Confirm Password"
        type={showConfirmPassword ? "text" : "password"}
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        placeholder="Re-enter your password"
        required
        inputStyle={{ paddingRight: "3.15rem" }}
        action={
          <PasswordToggleButton
            visible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((current) => !current)}
            label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          />
        }
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


