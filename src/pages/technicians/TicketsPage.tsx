import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RefreshButton } from "../../components/common/RefreshButton";
import { TicketMeta } from "../../components/tickets/TicketMeta";
import { useCurrentTechnicianId } from "../../hooks/technicians/useCurrentTechnicianId";
import { useTickets } from "../../hooks/tickets/useTickets";
import { priorityMeta, STATUS_META } from "../../lib/ticketDisplay";
import { getAssigneeId } from "../../lib/tickets";
import type { Ticket, TicketStatus } from "../../types/ticket.types";

const GROUPS: { title: string; statuses: TicketStatus[]; statusKey: TicketStatus }[] = [
  {
    title: "Active",
    statuses: ["IN_PROGRESS", "WAITING_FOR_EMPLOYEE"],
    statusKey: "IN_PROGRESS",
  },
  { title: "Open", statuses: ["OPEN"], statusKey: "OPEN" },
  { title: "Resolved", statuses: ["RESOLVED"], statusKey: "RESOLVED" },
  { title: "Closed", statuses: ["CLOSED"], statusKey: "CLOSED" },
];

export function TicketsPage() {
  const tickets = useTickets();
  const technicianId = useCurrentTechnicianId();
  const navigate = useNavigate();

  const mine = (tickets.data ?? []).filter(
    (ticket) => technicianId && getAssigneeId(ticket) === technicianId,
  );

  return (
    <div className="flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My tickets</h1>
          <p className="text-sm text-muted-foreground">
            Tickets assigned to you
          </p>
        </div>
        <RefreshButton onRefresh={async () => { await tickets.refetch(); }} iconOnly />
      </div>

      {tickets.isLoading && <p className="text-sm">Loading tickets…</p>}
      {tickets.isError && (
        <p className="text-sm text-destructive">Failed to load tickets.</p>
      )}

      {!tickets.isLoading && mine.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">No tickets assigned to you</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Pick up work from the inbox — unassigned tickets are waiting on Home.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/technician?view=unassigned">Browse unassigned</Link>
          </Button>
        </div>
      )}

      {GROUPS.map((group) => (
        <TicketGroup
          key={group.title}
          title={group.title}
          statusKey={group.statusKey}
          tickets={mine.filter((t) => group.statuses.includes(t.status))}
          navigate={navigate}
        />
      ))}
    </div>
  );
}

function TicketGroup({
  title,
  statusKey,
  tickets,
  navigate,
}: {
  title: string;
  statusKey: TicketStatus;
  tickets: Ticket[];
  navigate: (path: string) => void;
}) {
  if (tickets.length === 0) {
    return null;
  }

  const header = STATUS_META[statusKey];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <span className={`size-2 rounded-full ${header.dotClass}`} />
        {title}
        <span className="text-muted-foreground">({tickets.length})</span>
      </h2>
      {tickets.map((ticket) => {
        const priority = priorityMeta(ticket.priority);
        const status = STATUS_META[ticket.status];
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
                <Badge variant="outline" className={status.pillClass}>
                  {status.label}
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
    </section>
  );
}
