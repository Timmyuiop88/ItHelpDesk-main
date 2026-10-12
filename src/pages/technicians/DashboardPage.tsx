import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RefreshButton } from "../../components/common/RefreshButton";
import { InboxFilterDialog } from "../../components/tickets/inbox/InboxFilterDialog";
import { InboxTicketList } from "../../components/tickets/inbox/InboxTicketList";
import { useDebouncedValue } from "../../hooks/common/useDebouncedValue";
import { usePaginationState } from "../../hooks/common/usePaginationState";
import { useMe } from "../../hooks/auth/useMe";
import { useCurrentTechnicianId } from "../../hooks/technicians/useCurrentTechnicianId";
import {
  useTicketCounts,
  useTicketList,
} from "../../hooks/tickets/useTickets";
import {
  inboxFilterResetKey,
  inboxFiltersToParams,
  parseInboxFilters,
  toTicketListParams,
  type InboxFilters,
} from "../../lib/ticketInbox";

export function DashboardPage() {
  const me = useMe();
  const technicianId = useCurrentTechnicianId();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => parseInboxFilters(searchParams), [searchParams]);
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const resetKey = inboxFilterResetKey(filters, debouncedSearch);

  const { page, limit, setPage, setLimit } = usePaginationState({
    syncToUrl: true,
    resetKey,
  });

  const listParams = useMemo(
    () => toTicketListParams(filters, page, limit, debouncedSearch),
    [filters, page, limit, debouncedSearch],
  );

  const ticketQuery = useTicketList(
    {
      status: listParams.status,
      priority: listParams.priority,
      categoryId: listParams.categoryId,
      assignedTo: listParams.assignedTo,
      q: listParams.q,
    },
    page,
    limit,
    { onEmptyPastEnd: (totalPages) => setPage(totalPages) },
  );

  const countsQuery = useTicketCounts();

  const setFilters = useCallback(
    (patch: Partial<InboxFilters>) => {
      setSearchParams(
        (prev) => {
          const merged = { ...parseInboxFilters(prev), ...patch };
          const next = inboxFiltersToParams(merged);
          next.set("page", "1");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const applyFilterDialog = useCallback(
    (selection: Partial<InboxFilters>) => {
      setFilters(selection);
    },
    [setFilters],
  );

  const openTicket = useCallback(
    (ticketId: string) => navigate(`/technician/tickets/${ticketId}`),
    [navigate],
  );

  const handleRefresh = async () => {
    await Promise.all([me.refetch(), ticketQuery.refetch()]);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold">All tickets</h1>
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
          searchAction={
            <InboxFilterDialog
              filters={filters}
              counts={countsQuery.data}
              onApply={applyFilterDialog}
            />
          }
          className="w-full"
        />
      </div>
    </div>
  );
}
