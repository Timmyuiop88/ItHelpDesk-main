import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
import { getAssigneeId } from "../../lib/tickets";
import type { Ticket } from "../../types/ticket.types";

export function TicketsPage() {
  const tickets = useTickets();
  const technicianId = useCurrentTechnicianId();
  const navigate = useNavigate();

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <RefreshButton onRefresh={async () => { await tickets.refetch(); }} iconOnly />
      </div>

      {tickets.isLoading && <p className="text-sm">Loading tickets...</p>}
      {tickets.isError && (
        <p className="text-sm text-destructive">Failed to load tickets.</p>
      )}
      {tickets.data?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
            <svg className="size-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">No tickets found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            There are currently no tickets in the system.
          </p>
        </div>
      )}

      <TicketGroup title="Assigned to me" tickets={groups.mine} navigate={navigate} />
      <TicketGroup title="Open queue" tickets={groups.queue} navigate={navigate} />
      <TicketGroup title="Other tickets I'm on" tickets={groups.other} navigate={navigate} />
    </div>
  );
}

function TicketGroup({ title, tickets, navigate }: { title: string; tickets: Ticket[]; navigate: (path: string) => void }) {
  if (tickets.length === 0) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
      case "LOW":
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      default:
        return "";
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">
        {title} ({tickets.length})
      </h2>
      {tickets.map((ticket) => (
        <Card 
          key={ticket.id}
          className="cursor-pointer transition-all hover:border-primary/60 hover:shadow-md group"
          onClick={() => navigate(`/technician/tickets/${ticket.id}`)}
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base group-hover:text-primary transition-colors">{ticket.title}</CardTitle>
              <TicketMeta ticket={ticket} showRequester />
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
              <Badge>{ticket.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {ticket.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
