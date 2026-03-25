import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { SocialButton } from "../components/SocialButton";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

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
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
    navigate(from && from !== "/signin" ? from : "/dashboard", { replace: true });
  };

  const handleGoogleSignIn = async () => {
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (oauthError) {
      setError(oauthError.message || "Google sign-in failed. Try again or use email.");
      setShakeKey((k) => k + 1);
    }
  };

  return (
    <AuthLayout title="Sign in to Recruix.ai" subtitle="Use Google (no password needed), or sign in with the email and password you used when you created your account.">
      <div className="space-y-3">
        <div className="space-y-2">
          <SocialButton
            icon={<span className="flex h-4 w-4 items-center justify-center rounded text-[10px] font-medium text-text-primary bg-bg-badge">G</span>}
            label="Continue with Google"
            onClick={handleGoogleSignIn}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="h-px flex-1 bg-border" />
          <span>or continue with email</span>
          <span className="h-px flex-1 bg-border" />
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
              <span className="text-xs text-text-secondary">Email</span>
              <div
                className="flex items-center gap-2 rounded-button border-2 bg-bg-card px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary"
                style={{ borderColor: "var(--border)" }}
              >
                <Mail size={16} style={{ color: "var(--secondary)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                />
              </div>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-text-secondary">Password</span>
              <div
                className="flex items-center gap-2 rounded-button border-2 bg-bg-card px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary"
                style={{ borderColor: "var(--border)" }}
              >
                <Lock size={16} style={{ color: "var(--secondary)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                />
                <button
                  type="button"
                  className="text-text-muted hover:text-text-secondary"
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
                className="font-medium hover:underline"
                style={{ color: "var(--accent)" }}
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
              className="w-full rounded-button py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-70"
              style={{ background: "var(--accent)" }}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </motion.form>
        </AnimatePresence>

        <p className="mt-2 text-xs text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium hover:underline" style={{ color: "var(--primary)" }}>
            Sign up →
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
