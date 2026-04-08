import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!email) {
      setMessage("Please enter your email.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) {
      setMessage("Unable to send reset email. Please try again.");
    } else {
      setMessage("Password reset email sent!");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!newPassword || newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      setMessage("Failed to update password. Please try again.");
    } else {
      setMessage("Password successfully updated. Redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    }
  };

  if (user) {
    return (
      <AuthLayout title="Update your password" subtitle="Please enter your new password below.">
        <form onSubmit={handleUpdatePassword} className="space-y-3 text-sm">
          <label className="block space-y-1">
            <span className="text-xs text-js-brand-deep">New Password</span>
            <div className="flex items-center gap-2 rounded-lg border-2 border-js-brand-border bg-js-brand-card px-3 py-2.5 focus-within:ring-2 focus-within:ring-js-brand-primary">
              <Lock size={16} className="text-js-brand-primary" />
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
          {message && <p className="text-xs text-js-brand-deep">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-lg bg-js-brand-primary py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-70"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a reset link">
      <form onSubmit={handleSendResetEmail} className="space-y-3 text-sm">
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
        {message && <p className="text-xs text-js-brand-deep">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-lg bg-js-brand-primary py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-70"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  );
}
