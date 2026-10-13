import type {
  TicketCounts,
  TicketFilterParams,
  TicketListParams,
  TicketPriority,
  TicketStatus,
} from "../types/ticket.types";
import { ALL_TICKET_PRIORITIES, ALL_TICKET_STATUSES, STATUS_META } from "./ticketDisplay";

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

export function toTicketFilterParams(
  filters: InboxFilters,
  debouncedSearch: string,
): TicketFilterParams {
  const params: TicketFilterParams = {};
  if (filters.view === "mine") params.assignedTo = "me";
  if (filters.view === "unassigned") params.assignedTo = "unassigned";
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  const q = debouncedSearch.trim();
  if (q) params.q = q;
  return params;
}

export function toTicketListParams(
  filters: InboxFilters,
  page: number,
  limit: number,
  debouncedSearch: string,
): TicketListParams {
  return { ...toTicketFilterParams(filters, debouncedSearch), page, limit };
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Number shown next to a filter option; `undefined` value = the "Any …" option. */
export const countFor = {
  view: (c: TicketCounts, view: InboxView) =>
    view === "mine" ? c.assignment.me : view === "unassigned" ? c.assignment.unassigned : c.assignment.all,
  status: (c: TicketCounts, status?: TicketStatus) =>
    status ? c.status[status] ?? 0 : sum(Object.values(c.status)),
  priority: (c: TicketCounts, priority?: string) =>
    priority ? c.priority[priority as TicketPriority] ?? 0 : sum(Object.values(c.priority)),
  category: (c: TicketCounts, id?: string) =>
    id
      ? (c.categories.find((x) => x.id === id)?.count ?? 0)
      : sum(c.categories.map((x) => x.count)),
};

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
  if (count === 1 && filters.status) return STATUS_META[filters.status].label;
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
  const priorityRaw = params.get("priority");
  const priority = ALL_TICKET_PRIORITIES.includes(priorityRaw as TicketPriority)
    ? (priorityRaw as TicketPriority)
    : undefined;
  const categoryId = params.get("category") ?? undefined;
  return {
    view,
    status,
    priority,
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
