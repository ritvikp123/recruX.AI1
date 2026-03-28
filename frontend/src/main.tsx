import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import { LandingPage } from "./pages/LandingPage";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { ForgotPassword } from "./pages/ForgotPassword";
import { AuthCallback } from "./pages/AuthCallback";
import { Dashboard } from "./pages/Dashboard";
import { Jobs } from "./pages/Jobs";
import { ResumeOptimizer } from "./pages/ResumeOptimizer";
import { Progress } from "./pages/Progress";
import { SavedJobs } from "./pages/SavedJobs";
import { AppliedJobs } from "./pages/AppliedJobs";
import { Settings } from "./pages/Settings";
import { Roadmap } from "./pages/Roadmap";
import { OnboardingFlow } from "./components/onboarding/OnboardingFlow";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-page)",
        }}
      >
        <div className="recrux-spinner" />
      </div>
    );
  }

  const authed = !!user;

  return (
    <Routes>
      <Route
        path="/"
        element={authed ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/get-started" element={<OnboardingFlow />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/reset-password" element={<ForgotPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <AppShell>
              <Jobs />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="/resume-optimizer" element={<Navigate to="/resume" replace />} />
      <Route
        path="/resume"
        element={
          <ProtectedRoute>
            <AppShell>
              <ResumeOptimizer />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <AppShell>
              <Progress />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/saved"
        element={
          <ProtectedRoute>
            <AppShell>
              <SavedJobs />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/applied"
        element={
          <ProtectedRoute>
            <AppShell>
              <AppliedJobs />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppShell>
              <Settings />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roadmap"
        element={
          <ProtectedRoute>
            <AppShell>
              <Roadmap />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to={authed ? "/dashboard" : "/"} replace />}
      />
    </Routes>
  );
}

function Root() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
