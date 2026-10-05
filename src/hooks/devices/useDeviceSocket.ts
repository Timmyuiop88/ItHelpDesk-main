import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSocketEvent } from "../../components/SocketProvider";
import { queryKeys } from "../../lib/queryClient";
import type {
  DeviceOnlineEvent,
  DeviceUnlinkedEvent,
} from "../../types/device.types";

interface DeviceSocketOptions {
  onUnlinked?: (event: DeviceUnlinkedEvent) => void;
}

export function useDeviceSocket({ onUnlinked }: DeviceSocketOptions = {}) {
  const queryClient = useQueryClient();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
  };

  useSocketEvent<DeviceOnlineEvent>("device:online", refresh);
  useSocketEvent("device:offline-sweep", refresh);
  useSocketEvent<DeviceUnlinkedEvent>("device:unlinked", (event) => {
    toast.message("Device unlinked", {
      description: `${event.hostname || "A device"} is no longer linked to your account.`,
    });
    refresh();
    onUnlinked?.(event);
  });
}
