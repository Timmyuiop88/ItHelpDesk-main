import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { RefreshButton } from "../../components/common/RefreshButton";
import { InboxFilterDialog } from "../../components/tickets/inbox/InboxFilterDialog";
import { InboxTicketList } from "../../components/tickets/inbox/InboxTicketList";
import { useDebouncedValue } from "../../hooks/common/useDebouncedValue";
import { usePaginationState } from "../../hooks/common/usePaginationState";
import { useCurrentTechnicianId } from "../../hooks/technicians/useCurrentTechnicianId";
import { useAssignTicket } from "../../hooks/tickets/useAssignTicket";
import {
  useAllTicketCounts,
  useAllTicketList,
} from "../../hooks/tickets/useTickets";
import { toastApiError } from "../../lib/apiError";
import {
  inboxFilterResetKey,
  inboxFiltersToParams,
  parseInboxFilters,
  toTicketFilterParams,
  type InboxFilters,
} from "../../lib/ticketInbox";

export function DashboardPage() {
  const technicianId = useCurrentTechnicianId();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const assignTicket = useAssignTicket();

  const filters = useMemo(() => parseInboxFilters(searchParams), [searchParams]);
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const resetKey = inboxFilterResetKey(filters, debouncedSearch);

  const { page, limit, setPage, setLimit } = usePaginationState({
    syncToUrl: true,
    resetKey,
  });

  const filterParams = useMemo(
    () => toTicketFilterParams(filters, debouncedSearch),
    [filters, debouncedSearch],
  );

  const ticketQuery = useAllTicketList(filterParams, page, limit, {
    onEmptyPastEnd: (totalPages) => setPage(totalPages),
  });

  const countsQuery = useAllTicketCounts(filterParams, filterDialogOpen);

  const setFilters = useCallback(
    (patch: Partial<InboxFilters>) => {
      setSearchParams(
        (prev) => {
          const merged = { ...parseInboxFilters(prev), ...patch };
          const next = inboxFiltersToParams(merged);
          next.set("page", "1");
          const prevLimit = prev.get("limit");
          if (prevLimit) next.set("limit", prevLimit);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const openTicket = useCallback(
    (ticketId: string) => navigate(`/technician/tickets/${ticketId}`),
    [navigate],
  );

  const takeTicket = useCallback(
    (ticketId: string) => {
      if (!technicianId) {
        toast.error("Your technician profile is still loading. Try again in a moment.");
        return;
      }
      assignTicket.mutate(
        { id: ticketId, payload: { technicianId } },
        {
          onSuccess: () => toast.success("Ticket assigned to you"),
          onError: (err) => toastApiError(err, "Couldn't take ticket"),
        },
      );
    },
    [assignTicket, technicianId],
  );

  const handleRefresh = async () => {
    await Promise.all([
      ticketQuery.refetch(),
      filterDialogOpen ? countsQuery.refetch() : Promise.resolve(),
    ]);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold">All tickets</h1>
          <p className="text-sm text-muted-foreground">
            Every ticket in the system. Take an unassigned one to start working on it.
          </p>
        </div>
        <RefreshButton onRefresh={handleRefresh} iconOnly />
      </header>

      <div className="mt-4 flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border">
        <InboxTicketList
          tickets={ticketQuery.items}
          filters={filters}
          totalCount={ticketQuery.meta?.total}
          pagedQuery={ticketQuery}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          currentTechnicianId={technicianId}
          isLoading={ticketQuery.isLoading}
          isError={ticketQuery.isError}
          onSelect={openTicket}
          onFiltersChange={setFilters}
          onTake={takeTicket}
          takingId={assignTicket.isPending ? assignTicket.variables?.id ?? null : null}
          searchAction={
            <InboxFilterDialog
              filters={filters}
              counts={countsQuery.data}
              onApply={setFilters}
              onOpenChange={setFilterDialogOpen}
            />
          }
          className="w-full"
        />
      </div>
    </div>
  );
}
