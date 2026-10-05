import {
  Card,
  CardContent,
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

  return (
    <div className="flex flex-col gap-6">
      <DeviceIssueNotice />
      <MyDevicesCard />

      <h1 className="text-2xl font-semibold">Company devices</h1>

      {devices.isLoading && <p className="text-sm">Loading devices...</p>}
      {devices.isError && (
        <p className="text-sm text-destructive">Failed to load devices.</p>
      )}

      <div className="flex flex-col gap-3">
        {devices.data?.map((device) => (
          <Card key={device.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{device.hostname || device.id}</CardTitle>
              <DeviceStatusBadge device={device} />
            </CardHeader>
            <CardContent className="grid gap-1 text-sm text-muted-foreground">
              <p>
                Owner:{" "}
                {device.owner
                  ? `${fullName(device.owner)} · ${device.owner.email}`
                  : "Unlinked"}
              </p>
              <p>OS: {device.operatingSystem || "—"}</p>
              <p>Serial: {device.serialNumber || "—"}</p>
              {device.lastSeenAt && (
                <p>Last seen {formatRelative(device.lastSeenAt)}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {devices.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No devices found.</p>
        )}
      </div>
    </div>
  );
}
