import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TicketMeta } from "../../components/tickets/TicketMeta";
import { useCurrentTechnicianId } from "../../hooks/technicians/useCurrentTechnicianId";
import { useTickets } from "../../hooks/tickets/useTickets";
import { getAssigneeId } from "../../lib/tickets";
import type { Ticket } from "../../types/ticket.types";

export function TicketsPage() {
  const tickets = useTickets();
  const technicianId = useCurrentTechnicianId();

  const groups = { mine: [] as Ticket[], queue: [] as Ticket[], other: [] as Ticket[] };
  for (const ticket of tickets.data ?? []) {
    const assigneeId = getAssigneeId(ticket);
    if (technicianId && assigneeId === technicianId) {
      groups.mine.push(ticket);
    } else if (!assigneeId && ticket.status === "OPEN") {
      groups.queue.push(ticket);
    } else {
      groups.other.push(ticket);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Tickets</h1>

      {tickets.isLoading && <p className="text-sm">Loading tickets...</p>}
      {tickets.isError && (
        <p className="text-sm text-destructive">Failed to load tickets.</p>
      )}
      {tickets.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">No tickets yet.</p>
      )}

      <TicketGroup title="Assigned to me" tickets={groups.mine} />
      <TicketGroup title="Open queue" tickets={groups.queue} />
      <TicketGroup title="Other tickets I'm on" tickets={groups.other} />
    </div>
  );
}

function TicketGroup({ title, tickets }: { title: string; tickets: Ticket[] }) {
  if (tickets.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">
        {title} ({tickets.length})
      </h2>
      {tickets.map((ticket) => (
        <Link key={ticket.id} to={`/technician/tickets/${ticket.id}`}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base">{ticket.title}</CardTitle>
                <TicketMeta ticket={ticket} showRequester />
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{ticket.priority}</Badge>
                <Badge>{ticket.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {ticket.description}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </section>
  );
}
