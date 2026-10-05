import type { AuthUser } from "./auth.types";
import type { DepartmentRef } from "./department.types";

export interface Technician {
  id: string;
  userId?: string;
  user?: AuthUser;
  employeeNumber?: string;
  departmentId?: string | null;
  department?: DepartmentRef | null;
}
