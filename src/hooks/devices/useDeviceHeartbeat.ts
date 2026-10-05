import { useMutation } from "@tanstack/react-query";
import { deviceService } from "../../services/device.service";

export function useDeviceHeartbeat() {
  return useMutation({
    mutationFn: (id: string) => deviceService.heartbeat(id),
  });
}
