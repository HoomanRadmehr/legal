import { Navigate, Outlet, useLocation } from "react-router-dom";

import { LoadingState } from "../components/standardStates";
import { useAuth } from "./useAuth";

export function ProtectedRoute() {
  const location = useLocation();
  const { status } = useAuth();

  if (status === "restoring") {
    return (
      <main className="app-shell">
        <LoadingState label="Restoring session" />
      </main>
    );
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
