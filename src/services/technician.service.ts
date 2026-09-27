import { apiDelete, apiGet, apiPatch, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type {
  CreateTechnicianPayload,
  Technician,
  UpdateTechnicianPayload,
} from "../types/technician.types";

export const technicianService = {
  getAll: () => apiGet<Technician[]>(ENDPOINTS.technicians.base),
  getById: (id: string) =>
    apiGet<Technician>(ENDPOINTS.technicians.byId(id)),
  create: (payload: CreateTechnicianPayload) =>
    apiPost<Technician, CreateTechnicianPayload>(
      ENDPOINTS.technicians.base,
      payload,
    ),
  update: (id: string, payload: UpdateTechnicianPayload) =>
    apiPatch<Technician, UpdateTechnicianPayload>(
      ENDPOINTS.technicians.byId(id),
      payload,
    ),
  remove: (id: string) => apiDelete<void>(ENDPOINTS.technicians.byId(id)),
};
