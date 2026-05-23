import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AuthShell, LoginForm, ForgotPasswordForm } from "../components/auth";

export default function Login({ onSwitchToRegister }) {
  const { signIn, resetPassword, resendConfirmation } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [notice, setNotice]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [showResendPopup, setShowResendPopup] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const isEmailNotConfirmed = (message) =>
    message?.toLowerCase().includes("email not confirmed") ||
    message?.toLowerCase().includes("not confirmed");

  const getResetPasswordErrorMessage = (resetError) => {
    const message = resetError?.message || "";
    const status = resetError?.status;

    if (status === 429) {
      return "Too many reset emails were requested. Wait a minute, then try again.";
    }
    if (message.toLowerCase().includes("error sending recovery email")) {
      return "Supabase could not send the recovery email. Check your custom SMTP host, port, username, password, and verified sender email in Supabase.";
    }

    return message || "Could not send reset email.";
  };

  const handleLogin = async () => {
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true);
    setError("");
    setNotice("");
    setShowResendPopup(false);
    const { error } = await signIn(email, password);
    if (error) {
      if (isEmailNotConfirmed(error.message)) {
        setShowResendPopup(true);
      } else {
        setError("Invalid email or password.");
      }
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    const { error } = await resetPassword(email);
    if (error) {
      console.error("Password reset email failed:", error);
      setError(getResetPasswordErrorMessage(error));
    } else {
      setNotice("Password reset email sent. Check your inbox and follow the link.");
    }
    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    setShowResendPopup(false);
    const { error } = await resendConfirmation(email);
    if (error) {
      setError(error.message);
    } else {
      setNotice("Confirmation email sent. Check your inbox, then sign in.");
    }
    setLoading(false);
  };

  const handleForgotPassword = () => {
    setShowResetPassword(true);
    setError("");
    setNotice("");
    setShowResendPopup(false);
    setPassword("");
  };

  const handleBackToLogin = () => {
    setShowResetPassword(false);
    setError("");
    setNotice("");
  };

  return (
    <AuthShell
      title={showResetPassword ? "Reset your password" : "Welcome back"}
      subtitle={showResetPassword ? "Enter your email and we’ll send a reset link." : "Sign in to your TaskEase account"}
    >
      {showResetPassword ? (
        <ForgotPasswordForm
          email={email}
          onEmailChange={setEmail}
          onSubmit={handleResetPassword}
          loading={loading}
          error={error}
          notice={notice}
          onBackToLogin={handleBackToLogin}
        />
      ) : (
        <LoginForm
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleLogin}
          loading={loading}
          error={error}
          notice={notice}
          onSwitchToRegister={onSwitchToRegister}
          onForgotPassword={handleForgotPassword}
        />
      )}

      {showResendPopup && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }} onClick={() => setShowResendPopup(false)}>
          <div style={{
            backgroundColor: "var(--color-surface)",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 1rem", fontFamily: "var(--font-heading)", fontSize: "1.3rem", color: "var(--color-foreground)" }}>
              Email Not Confirmed
            </h3>
            <p style={{ margin: "0 0 1.5rem", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              Your email address hasn't been confirmed yet. Would you like us to resend the confirmation email?
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowResendPopup(false)}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "transparent",
                  color: "var(--color-muted)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={loading}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "var(--color-primary)",
                  color: "white",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Sending..." : "Resend Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  );
}

