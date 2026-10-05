import type { UserRole } from "../lib/roles";

export type DeviceStatus = "ONLINE" | "OFFLINE";

export interface DeviceOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export type DeviceAccess = "OWNED" | "ASSIGNED_TICKET" | "ADMIN";

export interface DeviceTicketRef {
  id: string;
  ticketNumber?: string | number;
  title: string;
  status: string;
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
  /** Why the current user can see this device. */
  access?: DeviceAccess;
  /** ASSIGNED_TICKET only: the technician's active tickets from the owner. */
  tickets?: DeviceTicketRef[];
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

/** A device of the person who created a ticket (remote-session picker). */
export interface TicketDevice {
  id: string;
  hostname: string;
  operatingSystem?: string;
  status?: DeviceStatus;
  lastSeenAt?: string | null;
  /** The device the employee picked when creating the ticket. */
  attachedToTicket: boolean;
  /** False when the device has no RustDesk ID, so a request would be refused. */
  remoteReady: boolean;
}

export interface TicketDevicesResponse {
  ticketId: string;
  creator: { id: string; firstName: string; lastName: string };
  devices: TicketDevice[];
}
