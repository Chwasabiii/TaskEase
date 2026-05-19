import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AuthShell, LoginForm } from "../components/auth";

export default function Login({ onSwitchToRegister }) {
  const { signIn } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true);
    setError("");
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your TaskEase account">
      <LoginForm
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
        loading={loading}
        error={error}
        onSwitchToRegister={onSwitchToRegister}
      />
    </AuthShell>
  );
}

