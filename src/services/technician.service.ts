import { apiGet, apiPatch } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import { cleanParams, fetchAll } from "../lib/pagination";
import type { Page } from "../types/pagination.types";
import type {
  Technician,
  TechnicianAvailabilityPayload,
} from "../types/technician.types";

export interface TechnicianListParams {
  page?: number;
  limit?: number;
  departmentId?: string;
  available?: boolean;
}

export const technicianService = {
  // getAll: (departmentId?: string) =>
  //   apiGet<Technician[]>(
  //     ENDPOINTS.technicians.base,
  //     departmentId ? { departmentId } : undefined,
  //   ),
  list: (params: TechnicianListParams = {}, signal?: AbortSignal) =>
    apiGet<Page<Technician>>(
      ENDPOINTS.technicians.base,
      cleanParams(params as Record<string, unknown>),
      { signal },
    ),
  listAll: async (params: Omit<TechnicianListParams, "page" | "limit"> = {}) =>
    fetchAll((page, limit) =>
      technicianService.list({ ...params, page, limit }),
    ),
  updateAvailability: (payload: TechnicianAvailabilityPayload) =>
    apiPatch<Technician, TechnicianAvailabilityPayload>(
      ENDPOINTS.technicians.meAvailability,
      payload,
    ),
};
