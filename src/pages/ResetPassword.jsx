import { useEffect, useState } from "react";
import { AuthShell } from "../components/auth";
import { Button, TextInput } from "../components/ui";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let mounted = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const linkError = params.get("error_description") || params.get("error");

    if (linkError) {
      setError(linkError.replace(/\+/g, " "));
      setReady(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        setError(sessionError.message);
      } else if (!data.session) {
        setError("This reset link is invalid or has expired. Request a new password reset email.");
      } else {
        setReady(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setError("");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!ready) {
      setError("Open the password reset link from your email first.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
    } else {
      setPassword("");
      setConfirmPassword("");
      setNotice("Password updated. You can sign in with your new password now.");
      window.history.replaceState({}, document.title, "/");
      window.setTimeout(() => {
        window.location.assign("/");
      }, 1400);
    }

    setLoading(false);
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Enter a new password for your TaskEase account.">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
          label="New password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your new password"
          disabled={!ready || loading || Boolean(notice)}
          required
        />
        <TextInput
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repeat your new password"
          disabled={!ready || loading || Boolean(notice)}
          required
        />

        <Button
          type="submit"
          disabled={!ready || loading || Boolean(notice)}
          fullWidth
          style={{ opacity: !ready || loading || notice ? 0.75 : 1 }}
        >
          {loading ? "Updating password..." : "Update password"}
        </Button>

        <Button type="button" variant="ghost" fullWidth onClick={() => window.location.assign("/")}>
          Back to sign in
        </Button>
      </form>
    </AuthShell>
  );
}
