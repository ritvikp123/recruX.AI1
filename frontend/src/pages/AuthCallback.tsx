import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { persistOnboardingPreferences, readOnboardingDraft, clearOnboardingDraft } from "../lib/onboardingPreferences";
import { urlIndicatesPasswordRecovery } from "../lib/authRecovery";

/**
 * Supabase OAuth redirects here with tokens in the URL hash.
 * We wait for the client to parse the hash, then update auth state and redirect.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const { setSessionFromAuth } = useAuth();
  const [message, setMessage] = useState("Signing you in…");
  const [initialHash] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""));
  const [initialSearch] = useState(() => (typeof window !== "undefined" ? window.location.search : ""));

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
          const recovery =
            urlIndicatesPasswordRecovery() ||
            initialHash.includes("type=recovery") ||
            initialHash.includes("type%3Drecovery") ||
            initialSearch.includes("type=recovery") ||
            initialSearch.includes("type%3Drecovery");
          if (recovery) {
            const tail = window.location.hash || window.location.search || initialHash || initialSearch;
            navigate(`/reset-password${tail}`, { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
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
  }, [navigate, setSessionFromAuth, initialHash, initialSearch]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-js-brand-bg">
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-js-brand-primary border-t-transparent" />
        <p className="mt-4 text-sm text-js-brand-deep">{message}</p>
      </div>
      <SiteFooter surface="auth" />
    </div>
  );
}
