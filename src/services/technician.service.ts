import { apiGet } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type { Technician } from "../types/technician.types";

export const technicianService = {
  getAll: (departmentId?: string) =>
    apiGet<Technician[]>(
      ENDPOINTS.technicians.base,
      departmentId ? { departmentId } : undefined,
    ),
};
