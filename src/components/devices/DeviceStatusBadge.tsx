import { Badge } from "@/components/ui/badge";
import type { Device } from "../../types/device.types";

export function DeviceStatusBadge({ device }: { device: Device }) {
  if (device.ownerId === null) {
    return <Badge variant="outline">Unlinked</Badge>;
  }

  const online = device.status === "ONLINE";

  return (
    <Badge variant={online ? "default" : "secondary"}>
      <span
        className={`size-1.5 rounded-full ${online ? "bg-emerald-300" : "bg-muted-foreground/50"}`}
      />
      {device.status ?? "UNKNOWN"}
    </Badge>
  );
}
