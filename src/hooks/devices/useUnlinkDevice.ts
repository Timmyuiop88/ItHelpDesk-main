import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { deviceService } from "../../services/device.service";

export function useUnlinkDevice() {
  return useMutation({
    mutationFn: (id: string) => deviceService.unlink(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
