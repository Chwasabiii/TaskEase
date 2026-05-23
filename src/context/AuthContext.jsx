/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const isInvalidRefreshTokenError = (error) =>
    error?.message?.toLowerCase().includes("invalid refresh token");

  const clearStoredSupabaseSession = () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"))
      .forEach((key) => localStorage.removeItem(key));
  };

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const initializeSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (isInvalidRefreshTokenError(error)) {
        clearStoredSupabaseSession();
        await supabase.auth.signOut({ scope: "local" });
        setUser(null);
      } else {
        setUser(session?.user ?? null);
      }

      setLoading(false);
    };

    initializeSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
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
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, resetPassword, signOut, resendConfirmation }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);


