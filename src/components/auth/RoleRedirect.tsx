import { Navigate } from "react-router-dom";
import { useMe } from "../../hooks/auth/useMe";
import { getHomeRouteForRole } from "../../lib/roles";

export function RoleRedirect() {
  const me = useMe();

  if (me.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (me.isError || !me.data) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getHomeRouteForRole(me.data.role)} replace />;
}
