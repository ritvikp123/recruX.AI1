import { useState } from "react";
import { Mail } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { supabase } from "../lib/supabase";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!email) {
      setMessage("Please enter your email.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) {
      setMessage("Unable to send reset email. Please try again.");
    } else {
      setMessage("Password reset email sent!");
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a reset link">
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
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
          className="mt-1 w-full rounded-lg bg-js-brand-primary py-2.5 text-sm font-bold text-white transition hover:opacity-90"
        >
          Send reset link
        </button>
      </form>
    </AuthLayout>
  );
}
