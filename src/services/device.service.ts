import { apiGet, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import { cleanParams } from "../lib/pagination";
import type { Page } from "../types/pagination.types";
import type { Device, RegisterDevicePayload } from "../types/device.types";

export interface DeviceListParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const deviceService = {
  // getAll: () => apiGet<Device[]>(ENDPOINTS.devices.base),
  list: (params: DeviceListParams = {}, signal?: AbortSignal) =>
    apiGet<Page<Device>>(
      ENDPOINTS.devices.base,
      cleanParams(params as Record<string, unknown>),
      { signal },
    ),
  getMine: () => apiGet<Device[]>(ENDPOINTS.devices.me),
  getById: (id: string) => apiGet<Device>(ENDPOINTS.devices.byId(id)),
  register: (payload: RegisterDevicePayload) =>
    apiPost<Device, RegisterDevicePayload>(ENDPOINTS.devices.register, payload),
  unlink: (id: string) =>
    apiPost<Device, Record<string, never>>(ENDPOINTS.devices.unlink(id), {}),
  heartbeat: (id: string) =>
    apiPost<void, Record<string, never>>(ENDPOINTS.devices.heartbeat(id), {}),
};
