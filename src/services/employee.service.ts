import { apiGet } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type { Employee } from "../types/employee.types";

export const employeeService = {
  getAll: (departmentId?: string) =>
    apiGet<Employee[]>(
      ENDPOINTS.employees.base,
      departmentId ? { departmentId } : undefined,
    ),
  getMe: () => apiGet<Employee>(ENDPOINTS.employees.me),
};
