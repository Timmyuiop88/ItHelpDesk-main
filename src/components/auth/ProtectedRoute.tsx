import { useSyncExternalStore } from "react";
import { Navigate } from "react-router-dom";
import { getTokenSnapshot, subscribe } from "../../api/tokenStore";

function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, getTokenSnapshot, getTokenSnapshot);
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
