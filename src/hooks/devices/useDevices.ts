import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { deviceService } from "../../services/device.service";

export function useDevices() {
  return useQuery({
    queryKey: queryKeys.devices.all,
    queryFn: () => deviceService.getAll(),
  });
}
