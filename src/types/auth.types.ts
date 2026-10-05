import type { UserRole } from "../lib/roles";
import type { Device, RegisterDevicePayload } from "./device.types";

export interface LoginRequest {
  email: string;
  password: string;
  /** The machine being logged in from. Required for employees and technicians. */
  device?: RegisterDevicePayload;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  device?: Device | null;
}

export type MeResponse = AuthUser;
