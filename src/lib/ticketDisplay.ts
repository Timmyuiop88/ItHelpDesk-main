import type { Ticket, TicketStatus } from "../types/ticket.types";

export interface StatusMeta {
  label: string;
  dotClass: string;
  pillClass: string;
  avatarRingClass: string;
}

export const STATUS_META: Record<TicketStatus, StatusMeta> = {
  OPEN: {
    label: "Open",
    dotClass: "bg-slate-500",
    pillClass:
      "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300",
    avatarRingClass: "ring-slate-400/60",
  },
  IN_PROGRESS: {
    label: "In progress",
    dotClass: "bg-blue-600",
    pillClass:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    avatarRingClass: "ring-blue-500/50",
  },
  WAITING_FOR_EMPLOYEE: {
    label: "Waiting",
    dotClass: "bg-amber-500",
    pillClass:
      "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    avatarRingClass: "ring-amber-500/50",
  },
  RESOLVED: {
    label: "Resolved",
    dotClass: "bg-teal-600",
    pillClass:
      "border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    avatarRingClass: "ring-teal-500/50",
  },
  CLOSED: {
    label: "Closed",
    dotClass: "bg-muted-foreground/60",
    pillClass: "border-border bg-muted text-muted-foreground",
    avatarRingClass: "ring-border",
  },
};

export const ALL_TICKET_STATUSES: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_EMPLOYEE",
  "RESOLVED",
  "CLOSED",
];

export interface PriorityMeta {
  label: string;
  badgeClass: string;
}

export const PRIORITY_META: Record<string, PriorityMeta> = {
  HIGH: {
    label: "High",
    badgeClass:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  },
  LOW: {
    label: "Low",
    badgeClass:
      "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
};

export function priorityMeta(priority: string): PriorityMeta {
  return (
    PRIORITY_META[priority] ?? {
      label: priority,
      badgeClass: "border-border bg-muted text-foreground",
    }
  );
}

export function initials(name: string): string {
  return name
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function lastActivityIso(ticket: Ticket): string | undefined {
  return ticket.updatedAt ?? ticket.createdAt;
}

export function lastActivityMs(ticket: Ticket): number {
  const iso = lastActivityIso(ticket);
  if (!iso) return 0;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}
