import type { TicketStatus } from "../types/ticket.types";

export type TicketActorRole = "employee" | "technician";

export interface TransitionContext {
  assignedToMe: boolean;
  assigneeId: string | null;
}

/** Client-side hint for clickable pills; server remains authoritative. */
export function getClickableStatuses(
  role: TicketActorRole,
  current: TicketStatus,
  ctx: TransitionContext,
): TicketStatus[] {
  if (current === "CLOSED") {
    return [];
  }

  if (role === "employee") {
    if (current === "RESOLVED") {
      return ["CLOSED"];
    }
    return [];
  }

  const targets: TicketStatus[] = [];

  if (current === "OPEN") {
    if (!ctx.assigneeId || ctx.assignedToMe) {
      targets.push("IN_PROGRESS");
    }
  }

  if (ctx.assignedToMe) {
    if (current === "IN_PROGRESS") {
      targets.push("WAITING_FOR_EMPLOYEE", "RESOLVED");
    }
    if (current === "WAITING_FOR_EMPLOYEE") {
      targets.push("IN_PROGRESS", "RESOLVED");
    }
    if (current === "RESOLVED") {
      targets.push("CLOSED");
    }
  }

  return targets.filter((s) => s !== current);
}
