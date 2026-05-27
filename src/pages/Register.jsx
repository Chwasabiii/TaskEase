import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AuthShell, RegisterForm } from "../components/auth";
import { supabase } from "../lib/supabase";

export default function Register({ onSwitchToLogin }) {
  const { signUp, resendConfirmation } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [usernameStatus, setUsernameStatus] = useState("idle");

  const cleanUsername = useMemo(
    () => username.trim().toLowerCase().replace(/^@+/, ""),
    [username]
  );

  const usernameIsValid = /^[a-z0-9._]{3,24}$/.test(cleanUsername);

  useEffect(() => {
    if (!cleanUsername) {
      setUsernameStatus("idle");
      return undefined;
    }

    if (!usernameIsValid) {
      setUsernameStatus("invalid");
      return undefined;
    }

    let cancelled = false;
    setUsernameStatus("checking");

    const timeoutId = window.setTimeout(async () => {
      const { data, error: availabilityError } = await supabase.rpc("is_username_available", {
        requested_username: cleanUsername,
      });

      if (cancelled) return;

      if (availabilityError) {
        setUsernameStatus("unavailable");
        return;
      }

      setUsernameStatus(data ? "available" : "taken");
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [cleanUsername, usernameIsValid]);

  const handleRegister = async () => {
    if (!fullName || !username || !email || !password || !confirmPassword)
      return setError("Please fill in all fields.");
    if (!usernameIsValid)
      return setError("Username must be 3-24 characters and use only letters, numbers, periods, or underscores.");
    if (usernameStatus === "taken")
      return setError("That username is already taken.");
    if (usernameStatus === "checking")
      return setError("Wait a moment while we check your username.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");
    setLoading(true);
    setError("");
    const { error } = await signUp(email, password, fullName, cleanUsername);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Account created! Check your email to confirm, then sign in.");
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
    const { error } = await resendConfirmation(email);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Confirmation email sent. Check your inbox before signing in.");
    }
    setLoading(false);
  };

  return (
    <AuthShell title="Create account" subtitle="Start managing tasks with TaskEase">
      <RegisterForm
        fullName={fullName}
        username={username}
        usernameStatus={usernameStatus}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        onFullNameChange={setFullName}
        onUsernameChange={setUsername}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handleRegister}
        loading={loading}
        error={error}
        success={success}
        onResendConfirmation={handleResendConfirmation}
        onSwitchToLogin={onSwitchToLogin}
      />
    </AuthShell>
  );
}

