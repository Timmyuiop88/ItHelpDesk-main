import { apiGet, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type { Device, RegisterDevicePayload } from "../types/device.types";

export const deviceService = {
  getAll: () => apiGet<Device[]>(ENDPOINTS.devices.base),
  getMine: () => apiGet<Device[]>(ENDPOINTS.devices.me),
  getById: (id: string) => apiGet<Device>(ENDPOINTS.devices.byId(id)),
  register: (payload: RegisterDevicePayload) =>
    apiPost<Device, RegisterDevicePayload>(ENDPOINTS.devices.register, payload),
  unlink: (id: string) =>
    apiPost<Device, Record<string, never>>(ENDPOINTS.devices.unlink(id), {}),
  heartbeat: (id: string) =>
    apiPost<void, Record<string, never>>(ENDPOINTS.devices.heartbeat(id), {}),
};
