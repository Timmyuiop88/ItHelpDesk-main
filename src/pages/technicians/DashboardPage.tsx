import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RefreshButton } from "../../components/common/RefreshButton";
import { useMe } from "../../hooks/auth/useMe";
import { useTickets } from "../../hooks/tickets/useTickets";

export function DashboardPage() {
  const me = useMe();
  const tickets = useTickets();
  const navigate = useNavigate();

  const openCount =
    tickets.data?.filter((ticket) => ticket.status === "OPEN").length ?? 0;
  const activeCount =
    tickets.data?.filter((ticket) =>
      ["IN_PROGRESS", "WAITING_FOR_EMPLOYEE"].includes(ticket.status),
    ).length ?? 0;

  const handleRefresh = async () => {
    await Promise.all([
      me.refetch(),
      tickets.refetch(),
    ]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Technician home</h1>
          <p className="text-sm text-muted-foreground">
            {me.data
              ? `${me.data.firstName} ${me.data.lastName} · ${me.data.role}`
              : "Loading your profile..."}
          </p>
        </div>
        <RefreshButton onRefresh={handleRefresh} iconOnly />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card 
          className="cursor-pointer transition-all hover:border-primary/60 hover:shadow-md group"
          onClick={() => navigate("/technician/tickets")}
        >
          <CardHeader>
            <CardTitle className="group-hover:text-primary transition-colors">Open tickets</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{openCount}</p>
            <Button variant="outline" asChild className="pointer-events-none">
              <span>View tickets</span>
            </Button>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-all hover:border-primary/60 hover:shadow-md group"
          onClick={() => navigate("/technician/tickets")}
        >
          <CardHeader>
            <CardTitle className="group-hover:text-primary transition-colors">Active tickets</CardTitle>
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
