import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles.css";
import { Layout } from "./ui/Layout";
import { SavedPage } from "./ui/pages/SavedPage";
import { AppliedPage } from "./ui/pages/AppliedPage";
import { InsightsPage } from "./ui/pages/InsightsPage";
import { SettingsPage } from "./ui/pages/SettingsPage";
import { SearchJobsPage } from "./ui/pages/SearchJobsPage";
import { ResumePage } from "./ui/pages/ResumePage";
import { RecentJobsPage } from "./ui/pages/RecentJobsPage";
import { AutoApplyPage } from "./ui/pages/AutoApplyPage";
import { LandingPage } from "./pages/LandingPage";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { ForgotPassword } from "./pages/ForgotPassword";
import { AuthCallback } from "./pages/AuthCallback";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page text-text-primary">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"
        />
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
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/reset-password" element={<ForgotPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <SearchJobsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/dashboard/search" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard/resume"
        element={
          <ProtectedRoute>
            <Layout>
              <ResumePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/dashboard/resumematch" element={<Navigate to="/dashboard/resume" replace />} />
      <Route
        path="/dashboard/recent"
        element={
          <ProtectedRoute>
            <Layout>
              <RecentJobsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/autoapply"
        element={
          <ProtectedRoute>
            <Layout>
              <AutoApplyPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/saved"
        element={
          <ProtectedRoute>
            <Layout>
              <SavedPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/applied"
        element={
          <ProtectedRoute>
            <Layout>
              <AppliedPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute>
            <Layout>
              <InsightsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
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

