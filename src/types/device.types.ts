import type { UserRole } from "../lib/roles";

export type DeviceStatus = "ONLINE" | "OFFLINE";

export interface DeviceOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface Device {
  id: string;
  hostname: string;
  serialNumber: string;
  operatingSystem: string;
  rustdeskId: string;
  agentVersion: string;
  status?: DeviceStatus;
  fingerprint?: string;
  ownerId?: string | null;
  owner?: DeviceOwner | null;
  lastSeenAt?: string;
}

export interface RegisterDevicePayload {
  fingerprint?: string;
  hostname: string;
  serialNumber: string;
  operatingSystem: string;
  rustdeskId?: string;
  agentVersion: string;
}

export interface DeviceOnlineEvent {
  deviceId: string;
  hostname: string;
  ownerId: string | null;
}

export interface DeviceUnlinkedEvent {
  deviceId: string;
  hostname: string;
}
