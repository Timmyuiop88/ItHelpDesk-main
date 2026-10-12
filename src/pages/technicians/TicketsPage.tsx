import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "../../components/common/pagination/Pagination";
import { pagedProps } from "../../components/common/pagination/paginationAdapters";
import { RefreshButton } from "../../components/common/RefreshButton";
import { TicketMeta } from "../../components/tickets/TicketMeta";
import { usePaginationState } from "../../hooks/common/usePaginationState";
import { useTicketCounts, useTicketList } from "../../hooks/tickets/useTickets";
import { priorityMeta, STATUS_META } from "../../lib/ticketDisplay";
import type { TicketStatus } from "../../types/ticket.types";

const TABS: { label: string; status: TicketStatus }[] = [
  { label: "In progress", status: "IN_PROGRESS" },
  { label: "Waiting", status: "WAITING_FOR_EMPLOYEE" },
  { label: "Open", status: "OPEN" },
  { label: "Resolved", status: "RESOLVED" },
  { label: "Closed", status: "CLOSED" },
];

export function TicketsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TicketStatus>("IN_PROGRESS");
  const resetKey = status;
  const { page, limit, setPage, setLimit } = usePaginationState({ resetKey });
  const counts = useTicketCounts();

  const ticketQuery = useTicketList(
    { assignedTo: "me", status },
    page,
    limit,
    { onEmptyPastEnd: (totalPages) => setPage(totalPages) },
  );

  const tabCount = (s: TicketStatus) => counts.data?.statuses[s] ?? 0;

  return (
    <div className="flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My tickets</h1>
          <p className="text-sm text-muted-foreground">Tickets assigned to you</p>
        </div>
        <RefreshButton onRefresh={async () => { await ticketQuery.refetch(); }} iconOnly />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab.status}
            type="button"
            size="sm"
            variant={status === tab.status ? "default" : "outline"}
            onClick={() => setStatus(tab.status)}
          >
            {tab.label}
            <span className="ml-1.5 tabular-nums opacity-80">({tabCount(tab.status)})</span>
          </Button>
        ))}
      </div>

      {ticketQuery.isLoading && <p className="text-sm">Loading tickets…</p>}
      {ticketQuery.isError && (
        <p className="text-sm text-muted-foreground">Couldn&apos;t load this list. Try again.</p>
      )}

      {!ticketQuery.isLoading && ticketQuery.items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">No tickets in this tab</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Pick up work from the inbox — unassigned tickets are waiting on Home.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/technician?view=unassigned">Browse unassigned</Link>
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {ticketQuery.items.map((ticket) => {
          const priority = priorityMeta(ticket.priority);
          const statusMeta = STATUS_META[ticket.status];
          return (
            <Card
              key={ticket.id}
              className="group cursor-pointer transition-all hover:border-primary/60 hover:shadow-md"
              onClick={() => navigate(`/technician/tickets/${ticket.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base transition-colors group-hover:text-primary">
                    {ticket.title}
                  </CardTitle>
                  <TicketMeta ticket={ticket} showRequester />
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className={priority.badgeClass}>
                    {priority.label}
                  </Badge>
                  <Badge variant="outline" className={statusMeta.pillClass}>
                    {statusMeta.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {ticket.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {ticketQuery.meta && (
        <Pagination
          variant="pages"
          {...pagedProps(ticketQuery, {
            page,
            limit,
            onPageChange: setPage,
            onPageSizeChange: setLimit,
          })}
        />
      )}
    </div>
  );
}
