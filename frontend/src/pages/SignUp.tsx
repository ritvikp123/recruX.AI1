import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { SocialButton } from "../components/SocialButton";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const EXPERIENCE_OPTIONS = [
  "Student / New Grad",
  "Entry Level (0-2 yrs)",
  "Mid Level (2-5 yrs)",
  "Senior Level (5+ yrs)",
];

const FIELD_OPTIONS = [
  "AI / Machine Learning",
  "Software Engineering",
  "Cybersecurity / Ethical Hacking",
  "Cloud Engineering",
  "Data Engineering",
  "DevOps",
  "Full Stack",
  "Other",
];

export function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [experience, setExperience] = useState(EXPERIENCE_OPTIONS[0]);
  const [field, setField] = useState(FIELD_OPTIONS[0]);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setSessionFromAuth } = useAuth();

  const passwordStrength = password.length > 10 ? "strong" : password.length > 6 ? "medium" : "weak";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      setShakeKey((k) => k + 1);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setShakeKey((k) => k + 1);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setShakeKey((k) => k + 1);
      return;
    }
    if (!accepted) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      setShakeKey((k) => k + 1);
      return;
    }

    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          experience_level: experience,
          target_field: field,
        },
      },
    });
    setSubmitting(false);

    if (signUpError) {
      const msg = signUpError.message || "Sign up failed.";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("already registered")) {
        setError("This email is already registered. Sign in instead, or use Continue with Google.");
      } else {
        setError(msg);
      }
      setShakeKey((k) => k + 1);
      return;
    }

    if (data.session) {
      setSessionFromAuth(data.session);
      navigate("/dashboard", { replace: true });
      return;
    }

    setError(
      "Account created, but your project requires email confirmation. You’re not getting emails? Use “Continue with Google” to sign in without email, or in Supabase turn off Authentication → Providers → Email → Confirm email."
    );
    setTimeout(() => navigate("/signin", { replace: true }), 5000);
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
    <AuthLayout title="Create your account" subtitle="Join Recruix to get AI-matched to your next role. Or use Google to skip the form.">
      <div className="space-y-3">
        {error && (
          <div className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
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
              <span className="text-xs text-text-secondary">Full Name</span>
              <div
                className="flex items-center gap-2 rounded-button border-2 bg-bg-card px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary"
                style={{ borderColor: "var(--border)" }}
              >
                <UserIcon size={16} style={{ color: "var(--secondary)" }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Annika Doe"
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                />
              </div>
            </label>
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
                className="rounded-button border-2 bg-bg-card px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <Lock size={16} style={{ color: "var(--secondary)" }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border-light">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      passwordStrength === "strong"
                        ? "w-full bg-accent"
                        : passwordStrength === "medium"
                        ? "w-2/3 bg-amber-500"
                        : "w-1/3 bg-red-500"
                    }`}
                  />
                </div>
              </div>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-text-secondary">Confirm Password</span>
              <div
                className="flex items-center gap-2 rounded-button border-2 bg-bg-card px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary"
                style={{ borderColor: "var(--border)" }}
              >
                <Lock size={16} style={{ color: "var(--secondary)" }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                />
              </div>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-text-secondary">What best describes you?</span>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-button border-2 bg-bg-card px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ borderColor: "var(--border)" }}
              >
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-text-secondary">What field are you targeting?</span>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full rounded-button border-2 bg-bg-card px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ borderColor: "var(--border)" }}
              >
                {FIELD_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </label>
            <label className="mt-2 flex items-start gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-border text-accent focus:ring-primary"
                style={{ borderColor: "var(--border)" }}
              />
              <span>
                I agree to the{" "}
                <button type="button" className="underline" style={{ color: "var(--primary)" }}>
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" className="underline" style={{ color: "var(--primary)" }}>
                  Privacy Policy
                </button>
                . <span className="font-medium text-text-primary">(Required)</span>
              </span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="mt-1 w-full rounded-button py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-70"
              style={{ background: "var(--accent)" }}
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </motion.form>
        </AnimatePresence>

        <p className="mt-2 text-xs text-text-secondary">
          Already have an account?{" "}
          <Link to="/signin" className="font-medium hover:underline" style={{ color: "var(--primary)" }}>
            Sign in →
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
