export type UserRole = "ADMIN" | "EMPLOYEE" | "TECHNICIAN";

export const ROLE_HOME: Record<UserRole, string> = {
  EMPLOYEE: "/employee",
  TECHNICIAN: "/technician",
  ADMIN: "/unauthorized",
};

const USER_ROLES: UserRole[] = ["ADMIN", "EMPLOYEE", "TECHNICIAN"];

export function isUserRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

export function getHomeRouteForRole(role: string): string {
  if (isUserRole(role)) {
    return ROLE_HOME[role];
  }

  return "/login";
}

export function hasRole(userRole: string, allowed: UserRole[]): boolean {
  return isUserRole(userRole) && allowed.includes(userRole);
}
