import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}

