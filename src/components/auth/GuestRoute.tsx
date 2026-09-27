import { Navigate } from "react-router-dom";
import { useSyncExternalStore } from "react";
import { getTokenSnapshot, subscribe } from "../../api/tokenStore";
import { useMe } from "../../hooks/auth/useMe";
import { getHomeRouteForRole } from "../../lib/roles";

function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, getTokenSnapshot, getTokenSnapshot);
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthToken();
  const me = useMe();

  if (!token) {
    return children;
  }

  if (me.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (me.data) {
    return <Navigate to={getHomeRouteForRole(me.data.role)} replace />;
  }

  return children;
}
