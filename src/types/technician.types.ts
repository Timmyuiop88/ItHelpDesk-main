import type { AuthUser } from "./auth.types";
import type { DepartmentRef } from "./department.types";

export interface Technician {
  id: string;
  userId?: string;
  user?: AuthUser;
  employeeNumber?: string;
  departmentId?: string | null;
  department?: DepartmentRef | null;
  acceptsAssignments?: boolean;
  excludedUntil?: string | null;
  excludedReason?: string | null;
  maxActiveTickets?: number | null;
  activeTicketCount?: number;
  // available?: boolean;
  // awayUntil?: string | null;
  // autoAssignCap?: number;
}

/** Body for PATCH /technicians/me/availability. Every field is optional; null clears. */
export interface TechnicianAvailabilityPayload {
  acceptsAssignments?: boolean;
  excludedUntil?: string | null;
  excludedReason?: string | null;
  // Admin only; ignored on /technicians/me/availability.
  // maxActiveTickets?: number | null;
}

export type TechnicianAvailabilityState =
  | { kind: "available" }
  | { kind: "paused" }
  | { kind: "away"; until: string; reason: string | null };

export function technicianAvailabilityState(
  technician: Technician | null | undefined,
): TechnicianAvailabilityState {
  const until = technician?.excludedUntil;
  if (until && Date.parse(until) > Date.now()) {
    return { kind: "away", until, reason: technician?.excludedReason ?? null };
  }
  if (technician?.acceptsAssignments === false) {
    return { kind: "paused" };
  }
  return { kind: "available" };
}
