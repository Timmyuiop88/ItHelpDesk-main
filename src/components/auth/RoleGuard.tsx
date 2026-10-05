import { Navigate } from "react-router-dom";
import { useMe } from "../../hooks/auth/useMe";
import { getHomeRouteForRole, hasRole, type UserRole } from "../../lib/roles";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
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

  if (!hasRole(me.data.role, allowedRoles)) {
    return <Navigate to={getHomeRouteForRole(me.data.role)} replace />;
  }

  return children;
}
