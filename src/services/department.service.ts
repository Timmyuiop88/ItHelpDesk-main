import { apiGet } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type { Department } from "../types/department.types";

export const departmentService = {
  getAll: () => apiGet<Department[]>(ENDPOINTS.departments.base),
};
