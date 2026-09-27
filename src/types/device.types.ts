export type DeviceStatus = "ONLINE" | "OFFLINE";

export interface Device {
  id: string;
  hostname: string;
  serialNumber: string;
  operatingSystem: string;
  rustdeskId: string;
  agentVersion: string;
  status?: DeviceStatus;
}

export interface RegisterDevicePayload {
  hostname: string;
  serialNumber: string;
  operatingSystem: string;
  rustdeskId?: string;
  agentVersion: string;
}

export type CreateDevicePayload = RegisterDevicePayload;
export type UpdateDevicePayload = Partial<CreateDevicePayload>;
