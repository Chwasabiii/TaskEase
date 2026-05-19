import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AuthShell, RegisterForm } from "../components/auth";

export default function Register({ onSwitchToLogin }) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password)
      return setError("Please fill in all fields.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");
    setLoading(true);
    setError("");
    const { error } = await signUp(email, password, fullName);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Account created! Check your email to confirm, then sign in.");
    }
    setLoading(false);
  };

  return (
    <AuthShell title="Create account" subtitle="Start managing tasks with TaskEase">
      <RegisterForm
        fullName={fullName}
        email={email}
        password={password}
        onFullNameChange={setFullName}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleRegister}
        loading={loading}
        error={error}
        success={success}
        onSwitchToLogin={onSwitchToLogin}
      />
    </AuthShell>
  );
}

