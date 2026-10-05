import { MonitorSmartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeviceIssueNotice } from "../../components/devices/DeviceIssueNotice";
import { DeviceStatusBadge } from "../../components/devices/DeviceStatusBadge";
import { MyDevicesCard } from "../../components/devices/MyDevicesCard";
import { useDevices } from "../../hooks/devices/useDevices";
import { formatRelative, fullName } from "../../lib/format";

export function DevicesPage() {
  const devices = useDevices();
  // The technician's own devices are in "My devices"; this list is for the
  // devices of people whose tickets they're working on.
  const ticketDevices =
    devices.data?.filter((device) => device.access !== "OWNED") ?? [];

  return (
    <div className="flex flex-col gap-6">
      <DeviceIssueNotice />
      <MyDevicesCard />

      <Card>
        <CardHeader>
          <CardTitle>Devices on my tickets</CardTitle>
          <CardDescription>
            Computers of employees you're helping. They disappear from here
            once the ticket is resolved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {devices.isLoading && (
            <p className="text-sm text-muted-foreground">Loading devices...</p>
          )}
          {devices.isError && (
            <p className="text-sm text-destructive">Failed to load devices.</p>
          )}
          {devices.data && ticketDevices.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No devices yet. Take a ticket and the employee's computers will
              show up here.
            </p>
          )}
          {ticketDevices.map((device) => (
            <div
              key={device.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3"
            >
              <MonitorSmartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {device.hostname || device.id}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {device.owner ? fullName(device.owner) : "Unlinked"}
                  {device.operatingSystem ? ` · ${device.operatingSystem}` : ""}
                  {device.lastSeenAt
                    ? ` · seen ${formatRelative(device.lastSeenAt)}`
                    : ""}
                </p>
                {device.tickets && device.tickets.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {device.tickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        to={`/technician/tickets/${ticket.id}`}
                        title={ticket.title}
                      >
                        <Badge variant="outline">
                          Ticket {ticket.ticketNumber ? `#${ticket.ticketNumber}` : ""}
                          {ticket.ticketNumber ? "" : ticket.title}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <DeviceStatusBadge device={device} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
