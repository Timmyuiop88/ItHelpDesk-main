import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { deviceService } from "../../services/device.service";

export function useMyDevices() {
  return useQuery({
    queryKey: queryKeys.devices.mine,
    queryFn: () => deviceService.getMine(),
  });
}
