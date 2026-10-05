import { MonitorSmartphone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMyDevices } from "../../hooks/devices/useMyDevices";
import { formatRelative } from "../../lib/format";
import { useDeviceAgentState } from "../DeviceAgentContext";
import { DeviceStatusBadge } from "./DeviceStatusBadge";
import { UnlinkDeviceButton } from "./UnlinkDeviceButton";

export function MyDevicesCard() {
  const devices = useMyDevices();
  const agent = useDeviceAgentState();

  return (
    <Card>
      <CardHeader>
        <CardTitle>My devices</CardTitle>
        <CardDescription>
          Computers linked to your account. Unlink one you no longer use to free it up.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {devices.isLoading && (
          <p className="text-sm text-muted-foreground">Loading devices...</p>
        )}
        {devices.isError && (
          <p className="text-sm text-destructive">Failed to load your devices.</p>
        )}
        {devices.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No devices linked yet.</p>
        )}
        {devices.data?.map((device) => (
          <div
            key={device.id}
            className="flex items-center gap-3 rounded-lg border border-border p-3"
          >
            <MonitorSmartphone className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-sm font-medium">
                {device.hostname || device.id}
                {device.id === agent.device?.id && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    This computer
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {device.operatingSystem || "Unknown OS"}
                {device.lastSeenAt
                  ? ` · seen ${formatRelative(device.lastSeenAt)}`
                  : ""}
              </p>
            </div>
            <DeviceStatusBadge device={device} />
            <UnlinkDeviceButton device={device} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
