import { apiGet, apiPatch } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type {
  Technician,
  TechnicianAvailabilityPayload,
} from "../types/technician.types";

export const technicianService = {
  getAll: (departmentId?: string) =>
    apiGet<Technician[]>(
      ENDPOINTS.technicians.base,
      departmentId ? { departmentId } : undefined,
    ),
  updateAvailability: (payload: TechnicianAvailabilityPayload) =>
    apiPatch<Technician, TechnicianAvailabilityPayload>(
      ENDPOINTS.technicians.meAvailability,
      payload,
    ),
};
