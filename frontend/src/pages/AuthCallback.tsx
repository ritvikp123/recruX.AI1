import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { persistOnboardingPreferences, readOnboardingDraft, clearOnboardingDraft } from "../lib/onboardingPreferences";

/**
 * Supabase OAuth redirects here with tokens in the URL hash.
 * We wait for the client to parse the hash, then update auth state and redirect.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const { setSessionFromAuth } = useAuth();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (cancelled) return;
        if (session) {
          setSessionFromAuth(session);
          // If onboarding draft exists, persist it now that we have an authenticated session.
          const onboardingData = readOnboardingDraft();
          if (onboardingData && session.user?.id) {
            try {
              await persistOnboardingPreferences(session.user.id, onboardingData);
              clearOnboardingDraft();
            } catch (err) {
              console.warn("Failed to persist onboarding preferences:", err);
            }
          }
          navigate("/dashboard", { replace: true });
        } else {
          setMessage("Sign-in was cancelled or failed.");
          setTimeout(() => navigate("/", { replace: true }), 2000);
        }
      });
    };

    const timer = setTimeout(finish, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate, setSessionFromAuth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-js-brand-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-js-brand-primary border-t-transparent" />
      <p className="mt-4 text-sm text-js-brand-deep">{message}</p>
    </div>
  );
}
