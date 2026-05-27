import { useState } from "react";
import { Button, TextInput } from "../ui";
import PasswordToggleButton from "./PasswordToggleButton";

export default function LoginForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  loading,
  error,
  notice,
  onSwitchToRegister,
  onForgotPassword,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
        label="Email or username"
        type="text"
        value={email}
        onChange={onEmailChange}
        placeholder="you@example.com or johndoe"
        required
      />
      <TextInput
        label="Password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={onPasswordChange}
        placeholder="••••••••"
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
      <Button
        type="submit"
        disabled={loading}
        variant="primary"
        style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.75 : 1 }}
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
        <button type="button" onClick={onForgotPassword} style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontWeight: 700 }}>
          Forgot password?
        </button>
        <div>
          Don’t have an account?{' '}
          <button type="button" onClick={onSwitchToRegister} style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontWeight: 700 }}>
            Register
          </button>
        </div>
      </div>
    </form>
  );
}


