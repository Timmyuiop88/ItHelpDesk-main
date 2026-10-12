import { getAssigneeId, getRequesterName, isEmailTicket, ticketLabel } from "./tickets";
import { ALL_TICKET_STATUSES, lastActivityMs } from "./ticketDisplay";
import type { Ticket, TicketStatus } from "../types/ticket.types";

export type InboxView = "mine" | "unassigned" | "other";

export const ALL_INBOX_VIEWS: InboxView[] = ["mine", "unassigned", "other"];

export type InboxSort = "activity" | "newest" | "priority";

const PRIORITY_RANK: Record<string, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

/** Values within one filter type are OR-ed; different filter types are AND-ed. */
export interface InboxFilters {
  views: InboxView[];
  statuses: TicketStatus[];
  priorities: string[];
  categoryIds: string[];
  emailOnly: boolean;
  search: string;
  sort: InboxSort;
}

export const DEFAULT_INBOX_FILTERS: InboxFilters = {
  views: [],
  statuses: [],
  priorities: [],
  categoryIds: [],
  emailOnly: false,
  search: "",
  sort: "activity",
};

export function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function activeFilterCount(filters: InboxFilters): number {
  return (
    filters.views.length +
    filters.statuses.length +
    filters.priorities.length +
    filters.categoryIds.length +
    (filters.emailOnly ? 1 : 0)
  );
}

export function matchesView(
  ticket: Ticket,
  view: InboxView,
  technicianId: string | null,
): boolean {
  const assigneeId = getAssigneeId(ticket);
  switch (view) {
    case "mine":
      return !!technicianId && assigneeId === technicianId;
    case "unassigned":
      return !assigneeId && ticket.status === "OPEN";
    case "other":
      return !!assigneeId && assigneeId !== technicianId;
    default:
      return true;
  }
}

export function filterTickets(
  tickets: Ticket[],
  filters: InboxFilters,
  technicianId: string | null,
): Ticket[] {
  const q = filters.search.trim().toLowerCase();

  return tickets.filter((ticket) => {
    if (
      filters.views.length > 0 &&
      !filters.views.some((view) => matchesView(ticket, view, technicianId))
    ) {
      return false;
    }
    if (filters.statuses.length > 0 && !filters.statuses.includes(ticket.status)) {
      return false;
    }
    if (filters.priorities.length > 0 && !filters.priorities.includes(ticket.priority)) {
      return false;
    }
    if (
      filters.categoryIds.length > 0 &&
      !(ticket.categoryId && filters.categoryIds.includes(ticket.categoryId))
    ) {
      return false;
    }
    if (filters.emailOnly && !isEmailTicket(ticket)) return false;

    if (q) {
      const haystack = [
        ticket.title,
        ticket.description,
        getRequesterName(ticket),
        ticket.ticketNumber !== undefined ? String(ticket.ticketNumber) : "",
        ticketLabel(ticket),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

export function sortTickets(tickets: Ticket[], sort: InboxSort): Ticket[] {
  const copy = [...tickets];
  copy.sort((a, b) => {
    if (sort === "priority") {
      const pa = PRIORITY_RANK[a.priority] ?? 99;
      const pb = PRIORITY_RANK[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
    }
    return lastActivityMs(b) - lastActivityMs(a);
  });
  return copy;
}

export interface InboxCounts {
  views: Record<"all" | InboxView, number>;
  statuses: Record<TicketStatus, number>;
  priorities: Record<string, number>;
  categories: { id: string; name: string; count: number }[];
  email: number;
}

export function computeInboxCounts(
  tickets: Ticket[],
  technicianId: string | null,
): InboxCounts {
  const views: Record<"all" | InboxView, number> = {
    all: tickets.length,
    mine: 0,
    unassigned: 0,
    other: 0,
  };

  const statuses = {
    OPEN: 0,
    IN_PROGRESS: 0,
    WAITING_FOR_EMPLOYEE: 0,
    RESOLVED: 0,
    CLOSED: 0,
  } satisfies Record<TicketStatus, number>;

  const priorities: Record<string, number> = {};
  const categoryMap = new Map<string, { id: string; name: string; count: number }>();
  let email = 0;

  for (const ticket of tickets) {
    for (const view of ALL_INBOX_VIEWS) {
      if (matchesView(ticket, view, technicianId)) views[view] += 1;
    }

    statuses[ticket.status] += 1;
    priorities[ticket.priority] = (priorities[ticket.priority] ?? 0) + 1;

    if (ticket.categoryId && ticket.category?.name) {
      const existing = categoryMap.get(ticket.categoryId);
      if (existing) {
        existing.count += 1;
      } else {
        categoryMap.set(ticket.categoryId, {
          id: ticket.categoryId,
          name: ticket.category.name,
          count: 1,
        });
      }
    }

    if (isEmailTicket(ticket)) email += 1;
  }

  return {
    views,
    statuses,
    priorities,
    categories: [...categoryMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    email,
  };
}

export function viewLabel(view: InboxView): string {
  switch (view) {
    case "mine":
      return "Assigned to me";
    case "unassigned":
      return "Unassigned";
    case "other":
      return "Other technicians";
    default:
      return "Tickets";
  }
}

export function inboxTitle(filters: InboxFilters): string {
  const count = activeFilterCount(filters);
  if (count === 0) return "All tickets";
  if (count === 1 && filters.views.length === 1) return viewLabel(filters.views[0]);
  return "Filtered tickets";
}

function parseList(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export function parseInboxFilters(params: URLSearchParams): InboxFilters {
  const sort = params.get("sort");
  return {
    views: parseList(params.get("view")).filter((v): v is InboxView =>
      ALL_INBOX_VIEWS.includes(v as InboxView),
    ),
    statuses: parseList(params.get("status")).filter((s): s is TicketStatus =>
      ALL_TICKET_STATUSES.includes(s as TicketStatus),
    ),
    priorities: parseList(params.get("priority")),
    categoryIds: parseList(params.get("category")),
    emailOnly: params.get("email") === "1",
    search: params.get("q") ?? "",
    sort: sort === "newest" || sort === "priority" ? sort : "activity",
  };
}

export function inboxFiltersToParams(
  filters: InboxFilters,
  ticketId: string | null = null,
): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.views.length) p.set("view", filters.views.join(","));
  if (filters.statuses.length) p.set("status", filters.statuses.join(","));
  if (filters.priorities.length) p.set("priority", filters.priorities.join(","));
  if (filters.categoryIds.length) p.set("category", filters.categoryIds.join(","));
  if (filters.emailOnly) p.set("email", "1");
  if (filters.search) p.set("q", filters.search);
  if (filters.sort !== "activity") p.set("sort", filters.sort);
  if (ticketId) p.set("ticket", ticketId);
  return p;
}
