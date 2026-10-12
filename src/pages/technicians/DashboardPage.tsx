import { useCallback, useMemo } from "react";
// import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RefreshButton } from "../../components/common/RefreshButton";
// import { InboxFilterRail } from "../../components/tickets/inbox/InboxFilterRail";
import { InboxFilterDialog } from "../../components/tickets/inbox/InboxFilterDialog";
import { InboxTicketList } from "../../components/tickets/inbox/InboxTicketList";
// import { InboxTicketPreview } from "../../components/tickets/inbox/InboxTicketPreview";
import { useMe } from "../../hooks/auth/useMe";
import { useCurrentTechnicianId } from "../../hooks/technicians/useCurrentTechnicianId";
import { useTickets } from "../../hooks/tickets/useTickets";
import {
  computeInboxCounts,
  // DEFAULT_INBOX_FILTERS,
  filterTickets,
  inboxFiltersToParams,
  parseInboxFilters,
  sortTickets,
  type InboxFilters,
} from "../../lib/ticketInbox";
// import type { InboxView } from "../../lib/ticketInbox";
// import type { TicketStatus } from "../../types/ticket.types";

export function DashboardPage() {
  const me = useMe();
  const tickets = useTickets();
  const technicianId = useCurrentTechnicianId();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Preview pane is hidden for now, so there's no need to track the xl breakpoint.
  // const [xlUp, setXlUp] = useState(() =>
  //   typeof window !== "undefined"
  //     ? window.matchMedia("(min-width: 1280px)").matches
  //     : true,
  // );
  //
  // useEffect(() => {
  //   const mq = window.matchMedia("(min-width: 1280px)");
  //   const update = () => setXlUp(mq.matches);
  //   update();
  //   mq.addEventListener("change", update);
  //   return () => mq.removeEventListener("change", update);
  // }, []);

  const filters = useMemo(() => parseInboxFilters(searchParams), [searchParams]);
  // const selectedTicketId = searchParams.get("ticket");

  const allTickets = tickets.data ?? [];
  const counts = useMemo(
    () => computeInboxCounts(allTickets, technicianId),
    [allTickets, technicianId],
  );

  const filtered = useMemo(() => {
    const list = filterTickets(allTickets, filters, technicianId);
    return sortTickets(list, filters.sort);
  }, [allTickets, filters, technicianId]);

  const setFilters = useCallback(
    (patch: Partial<InboxFilters>) => {
      setSearchParams(inboxFiltersToParams({ ...filters, ...patch }), { replace: true });
    },
    [filters, setSearchParams],
  );

  const openTicket = useCallback(
    (ticketId: string) => navigate(`/technician/tickets/${ticketId}`),
    [navigate],
  );

  // const selectTicket = useCallback(
  //   (ticketId: string) => {
  //     setSearchParams(inboxFiltersToParams(filters, ticketId), { replace: true });
  //   },
  //   [filters, setSearchParams],
  // );
  //
  // useEffect(() => {
  //   if (selectedTicketId && !filtered.some((t) => t.id === selectedTicketId)) {
  //     setSearchParams(inboxFiltersToParams(filters, null), { replace: true });
  //   }
  // }, [filtered, selectedTicketId, filters, setSearchParams]);
  //
  // useEffect(() => {
  //   if (xlUp && !selectedTicketId && filtered.length > 0) {
  //     setSearchParams(inboxFiltersToParams(filters, filtered[0].id), { replace: true });
  //   }
  // }, [filtered, selectedTicketId, filters, setSearchParams, xlUp]);

  const handleRefresh = async () => {
    await Promise.all([me.refetch(), tickets.refetch()]);
  };

  // Used by the KPI chips in the header, which are commented out.
  // const applyKpi = (patch: Partial<InboxFilters>) => {
  //   setSearchParams(
  //     inboxFiltersToParams({
  //       ...DEFAULT_INBOX_FILTERS,
  //       ...patch,
  //       search: filters.search,
  //       sort: filters.sort,
  //     }),
  //     { replace: true },
  //   );
  // };

  // The filter dialog replaces the small-screen dropdown.
  // const mobileFilterValue = filters.emailOnly
  //   ? "email"
  //   : filters.status
  //     ? filters.status
  //     : filters.priority
  //       ? filters.priority
  //       : filters.view !== "all"
  //         ? `view:${filters.view}`
  //         : "all";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold">All tickets</h1>
          {/*<p className="text-sm text-muted-foreground">
            {me.data
              ? `${me.data.firstName} ${me.data.lastName}`
              : "Loading your profile…"}
          </p>*/}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/*<div className="hidden flex-wrap gap-1.5 md:flex">
            <KpiChip
              label="Unassigned"
              count={counts.views.unassigned}
              onClick={() => applyKpi({ views: ["unassigned"] })}
            />
            <KpiChip
              label="Open"
              count={counts.statuses.OPEN}
              onClick={() => applyKpi({ statuses: ["OPEN"] })}
            />
            <KpiChip
              label="In progress"
              count={counts.statuses.IN_PROGRESS}
              onClick={() => applyKpi({ statuses: ["IN_PROGRESS"] })}
            />
            <KpiChip
              label="Waiting"
              count={counts.statuses.WAITING_FOR_EMPLOYEE}
              onClick={() => applyKpi({ statuses: ["WAITING_FOR_EMPLOYEE"] })}
            />
            <KpiChip
              label="Resolved"
              count={counts.statuses.RESOLVED}
              onClick={() => applyKpi({ statuses: ["RESOLVED"] })}
            />
          </div>*/}
          <RefreshButton onRefresh={handleRefresh} iconOnly />
        </div>
      </header>

      {/* Small-screen filter dropdown, replaced by the filter dialog.
      <div className="md:hidden shrink-0 py-2">
        <select
          className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
          value={mobileFilterValue}
          onChange={(e) => {
            const v = e.currentTarget.value;
            if (v === "all") {
              applyKpi({ view: "all", status: null, priority: null, emailOnly: false });
            } else if (v === "email") {
              applyKpi({ emailOnly: true, status: null, view: "all" });
            } else if (v.startsWith("view:")) {
              applyKpi({
                view: v.replace("view:", "") as InboxView,
                status: null,
                priority: null,
                emailOnly: false,
              });
            } else if (["OPEN", "IN_PROGRESS", "WAITING_FOR_EMPLOYEE", "RESOLVED", "CLOSED"].includes(v)) {
              applyKpi({ status: v as TicketStatus, view: "all" });
            } else {
              applyKpi({ priority: v, view: "all", status: null });
            }
          }}
        >
          <option value="all">All tickets</option>
          <option value="view:mine">Assigned to me</option>
          <option value="view:unassigned">Unassigned</option>
          <option value="view:other">Other technicians</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="WAITING_FOR_EMPLOYEE">Waiting</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="HIGH">High priority</option>
          <option value="email">Via email</option>
        </select>
      </div>
      */}

      <div className="mt-4 flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border">
        {/* Filter rail, replaced by the filter dialog next to the search bar.
        <InboxFilterRail
          filters={filters}
          counts={counts}
          onChange={setFilters}
          className="hidden md:flex"
        />
        */}
        <InboxTicketList
          tickets={filtered}
          filters={filters}
          currentTechnicianId={technicianId}
          isLoading={tickets.isLoading}
          onSelect={openTicket}
          onFiltersChange={setFilters}
          searchAction={
            <InboxFilterDialog filters={filters} counts={counts} onApply={setFilters} />
          }
          className="w-full"
        />
        {/* Preview pane, hidden for now; rows open the full ticket page instead.
        <InboxTicketPreview ticketId={selectedTicketId} className="hidden xl:flex" />
        */}
      </div>
    </div>
  );
}

// function KpiChip({
//   label,
//   count,
//   onClick,
// }: {
//   label: string;
//   count: number;
//   onClick: () => void;
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
//     >
//       {label}
//       <span className="tabular-nums text-muted-foreground">{count}</span>
//     </button>
//   );
// }
