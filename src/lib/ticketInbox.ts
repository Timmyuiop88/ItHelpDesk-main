import type { TicketListParams, TicketStatus } from "../types/ticket.types";
import { ALL_TICKET_STATUSES } from "./ticketDisplay";

export type InboxView = "all" | "mine" | "unassigned";

export const ALL_INBOX_VIEWS: InboxView[] = ["all", "mine", "unassigned"];

// export type InboxView = "mine" | "unassigned" | "other";
// export const ALL_INBOX_VIEWS: InboxView[] = ["mine", "unassigned", "other"];
// export type InboxSort = "activity" | "newest" | "priority";

/** Server-backed filters: one choice per group. */
export interface InboxFilters {
  view: InboxView;
  status?: TicketStatus;
  priority?: string;
  categoryId?: string;
  search: string;
  // sort: InboxSort;
}

export const DEFAULT_INBOX_FILTERS: InboxFilters = {
  view: "all",
  search: "",
};

export function activeFilterCount(filters: InboxFilters): number {
  let n = 0;
  if (filters.view !== "all") n += 1;
  if (filters.status) n += 1;
  if (filters.priority) n += 1;
  if (filters.categoryId) n += 1;
  return n;
}

export function toTicketListParams(
  filters: InboxFilters,
  page: number,
  limit: number,
  debouncedSearch: string,
): TicketListParams {
  const params: TicketListParams = { page, limit };
  if (filters.view === "mine") params.assignedTo = "me";
  if (filters.view === "unassigned") params.assignedTo = "unassigned";
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  const q = debouncedSearch.trim();
  if (q) params.q = q;
  return params;
}

export function inboxFilterResetKey(filters: InboxFilters, debouncedSearch: string): string {
  return JSON.stringify({
    view: filters.view,
    status: filters.status ?? "",
    priority: filters.priority ?? "",
    categoryId: filters.categoryId ?? "",
    q: debouncedSearch.trim(),
  });
}

export function viewLabel(view: InboxView): string {
  switch (view) {
    case "mine":
      return "Assigned to me";
    case "unassigned":
      return "Unassigned";
    case "all":
    default:
      return "All tickets";
  }
}

export function inboxTitle(filters: InboxFilters): string {
  const count = activeFilterCount(filters);
  if (count === 0) return "All tickets";
  if (count === 1 && filters.view !== "all") return viewLabel(filters.view);
  if (count === 1 && filters.status) return filters.status.replace(/_/g, " ");
  return "Filtered tickets";
}

export function parseInboxFilters(params: URLSearchParams): InboxFilters {
  const viewRaw = params.get("view");
  const view: InboxView =
    viewRaw === "mine" || viewRaw === "unassigned" ? viewRaw : "all";
  const statusRaw = params.get("status");
  const status = ALL_TICKET_STATUSES.includes(statusRaw as TicketStatus)
    ? (statusRaw as TicketStatus)
    : undefined;
  const priority = params.get("priority") ?? undefined;
  const categoryId = params.get("category") ?? undefined;
  return {
    view,
    status,
    priority: priority || undefined,
    categoryId: categoryId || undefined,
    search: params.get("q") ?? "",
  };
}

export function inboxFiltersToParams(
  filters: InboxFilters,
  ticketId: string | null = null,
): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.view !== "all") p.set("view", filters.view);
  if (filters.status) p.set("status", filters.status);
  if (filters.priority) p.set("priority", filters.priority);
  if (filters.categoryId) p.set("category", filters.categoryId);
  if (filters.search) p.set("q", filters.search);
  if (ticketId) p.set("ticket", ticketId);
  return p;
}

export interface InboxCounts {
  views: Record<InboxView, number>;
  statuses: Record<TicketStatus, number>;
  priorities: Record<string, number>;
}

// --- Legacy client-side inbox (commented out; replaced by server pagination) ---
// import { getAssigneeId, getRequesterName, isEmailTicket, ticketLabel } from "./tickets";
// import { lastActivityMs } from "./ticketDisplay";
// import type { Ticket } from "../types/ticket.types";
//
// export function toggleValue<T>(list: T[], value: T): T[] {
//   return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
// }
//
// export function matchesView(
//   ticket: Ticket,
//   view: InboxView,
//   technicianId: string | null,
// ): boolean { ... }
//
// export function filterTickets(...) { ... }
// export function sortTickets(...) { ... }
// export function computeInboxCounts(...) { ... }
