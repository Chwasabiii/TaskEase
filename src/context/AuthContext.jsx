/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { clearStoredSupabaseSession, isInvalidRefreshTokenError, supabase } from "../lib/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const initializeSession = async () => {
      const { data: { session } = {}, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (isInvalidRefreshTokenError(error)) {
        clearStoredSupabaseSession();
        await supabase.auth.signOut({ scope: "local" });
        setUser(null);
        setSessionNotice("Your session expired. Please sign in again.");
      } else {
        setUser(session?.user ?? null);
        setSessionNotice("");
      }

      setLoading(false);
    };

    initializeSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session) setSessionNotice("");
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const getAppUrl = () =>
    (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, "");

  const getEmailRedirectTo = () => getAppUrl();

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: getEmailRedirectTo(),
        data: { full_name: fullName.trim() },
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (!error) setSessionNotice("");
    return { data, error };
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${getAppUrl()}/reset-password`,
    });
    return { data, error };
  };

  const resendConfirmation = async (email) => {
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: getEmailRedirectTo() },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (isInvalidRefreshTokenError(error)) {
      clearStoredSupabaseSession();
      await supabase.auth.signOut({ scope: "local" });
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, sessionNotice, signUp, signIn, resetPassword, signOut, resendConfirmation }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);


