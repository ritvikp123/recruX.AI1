import { Navigate } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { useAuth } from "../context/AuthContext";
import { urlIndicatesPasswordRecovery } from "../lib/authRecovery";

/**
 * `/` when logged in normally → dashboard.
 * `/` with Supabase recovery hash (wrong redirect URL) → `/reset-password` with same hash so updateUser works.
 */
export function RootIndexRoute() {
  const { user, passwordRecoveryPending } = useAuth();

  if (urlIndicatesPasswordRecovery()) {
    const tail = window.location.hash || window.location.search;
    return <Navigate to={`/reset-password${tail}`} replace />;
  }

  if (passwordRecoveryPending) {
    return <Navigate to="/reset-password" replace />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
}
