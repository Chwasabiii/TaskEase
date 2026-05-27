import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const projectRef = supabaseUrl?.match(/^https:\/\/([^.]+)\.supabase\.co/i)?.[1];

export const supabaseAuthStorageKey = projectRef
  ? `sb-${projectRef}-auth-token`
  : "sb-auth-token";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables. Check your .env file.");
}

export const isInvalidRefreshTokenError = (error) =>
  error?.message?.toLowerCase().includes("invalid refresh token") ||
  error?.message?.toLowerCase().includes("refresh token not found");

export const clearStoredSupabaseSession = () => {
  if (typeof window === "undefined") return;

  [window.localStorage, window.sessionStorage].forEach((storage) => {
    Object.keys(storage)
      .filter((key) => key === supabaseAuthStorageKey || (key.startsWith("sb-") && key.endsWith("-auth-token")))
      .forEach((key) => storage.removeItem(key));
  });
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: supabaseAuthStorageKey,
  },
});
