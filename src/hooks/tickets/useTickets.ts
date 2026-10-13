import { useQueries, useQuery } from "@tanstack/react-query";
import { ticketService } from "../../services/ticket.service";
import { queryKeys } from "../../lib/queryClient";
import { usePagedQuery } from "../common/usePagedQuery";
import type {
  TicketFilterParams,
  TicketListParams,
  TicketStatus,
} from "../../types/ticket.types";
import { ALL_TICKET_STATUSES } from "../../lib/ticketDisplay";
import type { InboxCounts, InboxView } from "../../lib/ticketInbox";

export function useTicketList(
  listParams: Omit<TicketListParams, "page" | "limit">,
  page: number,
  limit: number,
  options?: { onEmptyPastEnd?: (totalPages: number) => void },
) {
  return usePagedQuery({
    queryKey: queryKeys.tickets.list(listParams as Record<string, unknown>),
    queryFn: ({ page: p, limit: l, signal }) =>
      ticketService.list({ ...listParams, page: p, limit: l }, signal),
    page,
    limit,
    onEmptyPastEnd: options?.onEmptyPastEnd,
  });
}

/** Technician home: every ticket in the system via `GET /tickets/all`. */
export function useAllTicketList(
  filters: TicketFilterParams,
  page: number,
  limit: number,
  options?: { onEmptyPastEnd?: (totalPages: number) => void },
) {
  return usePagedQuery({
    queryKey: queryKeys.tickets.everyList(filters as Record<string, unknown>),
    queryFn: ({ page: p, limit: l, signal }) =>
      ticketService.listAll({ ...filters, page: p, limit: l }, signal),
    page,
    limit,
    onEmptyPastEnd: options?.onEmptyPastEnd,
  });
}

/** Filter dialog numbers; only fetched while the dialog is open. */
export function useAllTicketCounts(filters: TicketFilterParams, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tickets.everyCounts(filters as Record<string, unknown>),
    queryFn: ({ signal }) => ticketService.countsAll(filters, signal),
    enabled,
    staleTime: 15_000,
  });
}

async function fetchTicketTotal(listParams: TicketListParams): Promise<number> {
  const result = await ticketService.list({ ...listParams, page: 1, limit: 1 });
  return result.meta.total;
}

export function useTicketCounts(): {
  data: InboxCounts | undefined;
  isLoading: boolean;
} {
  const views: InboxView[] = ["all", "mine", "unassigned"];
  const priorities = ["HIGH", "MEDIUM", "LOW"] as const;

  const viewQueries = useQueries({
    queries: views.map((view) => {
      const params: TicketListParams = { page: 1, limit: 1 };
      if (view === "mine") params.assignedTo = "me";
      if (view === "unassigned") params.assignedTo = "unassigned";
      return {
        queryKey: queryKeys.tickets.count({ scope: "view", view }),
        queryFn: () => fetchTicketTotal(params),
        staleTime: 60_000,
      };
    }),
  });

  const statusQueries = useQueries({
    queries: ALL_TICKET_STATUSES.map((status) => ({
      queryKey: queryKeys.tickets.count({ scope: "status", status }),
      queryFn: () => fetchTicketTotal({ page: 1, limit: 1, status }),
      staleTime: 60_000,
    })),
  });

  const priorityQueries = useQueries({
    queries: priorities.map((priority) => ({
      queryKey: queryKeys.tickets.count({ scope: "priority", priority }),
      queryFn: () => fetchTicketTotal({ page: 1, limit: 1, priority }),
      staleTime: 60_000,
    })),
  });

  const isLoading =
    viewQueries.some((q) => q.isLoading) ||
    statusQueries.some((q) => q.isLoading) ||
    priorityQueries.some((q) => q.isLoading);

  const allLoaded =
    viewQueries.every((q) => q.data !== undefined) &&
    statusQueries.every((q) => q.data !== undefined) &&
    priorityQueries.every((q) => q.data !== undefined);

  if (!allLoaded) {
    return { data: undefined, isLoading };
  }

  const viewsRecord = {
    all: viewQueries[0].data ?? 0,
    mine: viewQueries[1].data ?? 0,
    unassigned: viewQueries[2].data ?? 0,
  } satisfies Record<InboxView, number>;

  const statuses = {} as Record<TicketStatus, number>;
  ALL_TICKET_STATUSES.forEach((status, i) => {
    statuses[status] = statusQueries[i].data ?? 0;
  });

  const prioritiesRecord: Record<string, number> = {};
  priorities.forEach((priority, i) => {
    prioritiesRecord[priority] = priorityQueries[i].data ?? 0;
  });

  return {
    data: {
      views: viewsRecord,
      statuses,
      priorities: prioritiesRecord,
    },
    isLoading,
  };
}

/** @deprecated Use useTicketList for paginated lists. */
export function useTickets() {
  return useTicketList({}, 1, 100);
}
