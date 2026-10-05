import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMe } from "../../hooks/auth/useMe";
import { useTickets } from "../../hooks/tickets/useTickets";

export function DashboardPage() {
  const me = useMe();
  const tickets = useTickets();

  const openCount =
    tickets.data?.filter((ticket) => ticket.status === "OPEN").length ?? 0;
  const activeCount =
    tickets.data?.filter((ticket) =>
      ["IN_PROGRESS", "WAITING_FOR_EMPLOYEE"].includes(ticket.status),
    ).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Technician home</h1>
        <p className="text-sm text-muted-foreground">
          {me.data
            ? `${me.data.firstName} ${me.data.lastName} · ${me.data.role}`
            : "Loading your profile..."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Open tickets</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{openCount}</p>
            <Button variant="outline" asChild>
              <Link to="/technician/tickets">View tickets</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{activeCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              In progress or waiting for employee
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
