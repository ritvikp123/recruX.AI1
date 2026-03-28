import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { SocialButton } from "../components/SocialButton";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { persistOnboardingPreferences, readOnboardingDraft, clearOnboardingDraft } from "../lib/onboardingPreferences";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setSessionFromAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      setShakeKey((k) => k + 1);
      return;
    }
    setSubmitting(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError("Invalid email or password.");
      setShakeKey((k) => k + 1);
      return;
    }
    setSessionFromAuth(data.session);

    // If the user came from onboarding, persist preferences after they successfully sign in.
    const onboardingData = readOnboardingDraft();
    if (onboardingData && data.user?.id) {
      try {
        await persistOnboardingPreferences(data.user.id, onboardingData);
        clearOnboardingDraft();
      } catch (err) {
        console.warn("Failed to persist onboarding preferences:", err);
      }
    }
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
    navigate(from && from !== "/signin" ? from : "/dashboard", { replace: true });
  };

  const handleGoogleSignIn = async () => {
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message || "Google sign-in failed. Try again or use email.");
      setShakeKey((k) => k + 1);
    }
  };

  const handleLinkedInSignIn = async () => {
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      // Supabase uses LinkedIn OIDC provider key.
      provider: "linkedin_oidc",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message || "LinkedIn sign-in failed. Try again or use email.");
      setShakeKey((k) => k + 1);
    }
  };

  return (
    <AuthLayout title="Sign in to Recrux" subtitle="Use Google or LinkedIn, or sign in with email and password.">
      <div className="space-y-3">
        <div className="space-y-2">
          <SocialButton
            icon={<span className="flex h-4 w-4 items-center justify-center rounded text-[10px] font-medium text-js-brand-darkest bg-js-brand-light">G</span>}
            label="Continue with Google"
            onClick={handleGoogleSignIn}
          />
          <SocialButton
            icon={<span className="flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold text-white bg-[#0A66C2]">in</span>}
            label="Continue with LinkedIn"
            onClick={handleLinkedInSignIn}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-js-brand-muted">
          <span className="h-px flex-1 bg-js-brand-border" />
          <span>or continue with email</span>
          <span className="h-px flex-1 bg-js-brand-border" />
        </div>

        <AnimatePresence mode="popLayout">
          <motion.form
            key={shakeKey}
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            exit={{ x: [0, -8, 8, -6, 6, -3, 3, 0] }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-3 text-sm"
          >
            <label className="block space-y-1">
              <span className="text-xs text-js-brand-deep">Email</span>
              <div className="flex items-center gap-2 rounded-lg border-2 border-js-brand-border bg-js-brand-card px-3 py-2.5 focus-within:ring-2 focus-within:ring-js-brand-primary">
                <Mail size={16} className="text-js-brand-primary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent text-sm text-js-brand-darkest placeholder:text-js-brand-muted focus:outline-none"
                />
              </div>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-js-brand-deep">Password</span>
              <div className="flex items-center gap-2 rounded-lg border-2 border-js-brand-border bg-js-brand-card px-3 py-2.5 focus-within:ring-2 focus-within:ring-js-brand-primary">
                <Lock size={16} className="text-js-brand-primary" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-sm text-js-brand-darkest placeholder:text-js-brand-muted focus:outline-none"
                />
                <button
                  type="button"
                  className="text-js-brand-muted hover:text-js-brand-deep"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between text-xs">
              <span />
              <button
                type="button"
                className="font-medium text-js-brand-primary hover:underline"
                onClick={async () => {
                  if (!email) {
                    setError("Enter your email above to reset your password.");
                    setShakeKey((k) => k + 1);
                    return;
                  }
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + "/reset-password",
                  });
                  if (error) {
                    setError("Unable to send reset email. Please try again.");
                    setShakeKey((k) => k + 1);
                  } else {
                    setError("Password reset email sent!");
                  }
                }}
              >
                Forgot password?
              </button>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-js-brand-primary py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-70"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </motion.form>
        </AnimatePresence>

        <p className="mt-2 text-xs text-js-brand-deep">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-js-brand-primary hover:underline">
            Sign up →
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
