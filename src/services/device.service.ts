import { apiDelete, apiGet, apiPatch, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type {
  CreateDevicePayload,
  Device,
  RegisterDevicePayload,
  UpdateDevicePayload,
} from "../types/device.types";

export const deviceService = {
  getAll: () => apiGet<Device[]>(ENDPOINTS.devices.base),
  getById: (id: string) => apiGet<Device>(ENDPOINTS.devices.byId(id)),
  create: (payload: CreateDevicePayload) =>
    apiPost<Device, CreateDevicePayload>(ENDPOINTS.devices.base, payload),
  update: (id: string, payload: UpdateDevicePayload) =>
    apiPatch<Device, UpdateDevicePayload>(
      ENDPOINTS.devices.byId(id),
      payload,
    ),
  remove: (id: string) => apiDelete<void>(ENDPOINTS.devices.byId(id)),
  register: (payload: RegisterDevicePayload) =>
    apiPost<Device, RegisterDevicePayload>(ENDPOINTS.devices.register, payload),
  heartbeat: (id: string) =>
    apiPost<void, Record<string, never>>(ENDPOINTS.devices.heartbeat(id), {}),
};
