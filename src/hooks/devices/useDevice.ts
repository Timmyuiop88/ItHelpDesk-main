import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { deviceService } from "../../services/device.service";

export function useDevice(id: string) {
  return useQuery({
    queryKey: queryKeys.devices.detail(id),
    queryFn: () => deviceService.getById(id),
    enabled: !!id,
  });
}
