import { apiDelete, apiGet, apiPatch, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type {
  CreateEmployeePayload,
  Employee,
  UpdateEmployeePayload,
} from "../types/employee.types";

export const employeeService = {
  getAll: () => apiGet<Employee[]>(ENDPOINTS.employees.base),
  getById: (id: string) => apiGet<Employee>(ENDPOINTS.employees.byId(id)),
  create: (payload: CreateEmployeePayload) =>
    apiPost<Employee, CreateEmployeePayload>(
      ENDPOINTS.employees.base,
      payload,
    ),
  update: (id: string, payload: UpdateEmployeePayload) =>
    apiPatch<Employee, UpdateEmployeePayload>(
      ENDPOINTS.employees.byId(id),
      payload,
    ),
  remove: (id: string) => apiDelete<void>(ENDPOINTS.employees.byId(id)),
};
