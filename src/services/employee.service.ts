import { apiGet } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import { cleanParams, fetchAll } from "../lib/pagination";
import type { Page } from "../types/pagination.types";
import type { Employee } from "../types/employee.types";

export interface EmployeeListParams {
  page?: number;
  limit?: number;
  departmentId?: string;
}

export const employeeService = {
  // getAll: (departmentId?: string) =>
  //   apiGet<Employee[]>(
  //     ENDPOINTS.employees.base,
  //     departmentId ? { departmentId } : undefined,
  //   ),
  list: (params: EmployeeListParams = {}, signal?: AbortSignal) =>
    apiGet<Page<Employee>>(
      ENDPOINTS.employees.base,
      cleanParams(params as Record<string, unknown>),
      { signal },
    ),
  listAll: async (params: Omit<EmployeeListParams, "page" | "limit"> = {}) =>
    fetchAll((page, limit) => employeeService.list({ ...params, page, limit })),
  getMe: () => apiGet<Employee>(ENDPOINTS.employees.me),
};
