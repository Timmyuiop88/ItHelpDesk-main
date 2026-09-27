import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTickets } from "../../hooks/tickets/useTickets";

export function TicketsPage() {
  const tickets = useTickets();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Tickets</h1>

      {tickets.isLoading && <p className="text-sm">Loading tickets...</p>}
      {tickets.isError && (
        <p className="text-sm text-destructive">Failed to load tickets.</p>
      )}

      <div className="flex flex-col gap-3">
        {tickets.data?.map((ticket) => (
          <Link to={`/technician/tickets/${ticket.id}`}>
            <Card key={ticket.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {ticket.title}
                </CardTitle>
                <Badge>{ticket.status}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {ticket.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {tickets.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No tickets yet.</p>
        )}
      </div>
    </div>
  );
}
