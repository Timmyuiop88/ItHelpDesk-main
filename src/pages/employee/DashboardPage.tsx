import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDeviceAgentState } from "../../components/DeviceAgentContext";
import { useMe } from "../../hooks/auth/useMe";
import { useTickets } from "../../hooks/tickets/useTickets";

export function DashboardPage() {
  const me = useMe();
  const tickets = useTickets();
  const agent = useDeviceAgentState();
  const openCount =
    tickets.data?.filter((ticket) => ticket.status === "OPEN").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Home</h1>
        <p className="text-sm text-muted-foreground">
          {me.data
            ? `${me.data.firstName} ${me.data.lastName} · ${me.data.role}`
            : "Loading your profile..."}
        </p>
      </div>

      {agent.device && !agent.device.rustdeskId && !agent.isRegistering && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-amber-300/60 bg-amber-50 p-4 dark:bg-amber-500/10">
          <AlertTriangle className="size-5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Set up remote support</p>
            <p className="text-sm text-muted-foreground">
              Add your RustDesk ID so IT Support can help you remotely when you approve it.
            </p>
          </div>
          <Button asChild>
            <Link to="/employee/device">Add RustDesk ID</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>This device</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm">
                {agent.device?.hostname || "Not registered yet"}
              </p>
              {agent.error && (
                <p className="text-sm text-destructive">{agent.error}</p>
              )}
            </div>
            <Badge>{agent.device?.status ?? "UNKNOWN"}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open tickets</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{openCount}</p>
            <Button variant="outline" asChild>
              <Link to="/employee/tickets">View tickets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
