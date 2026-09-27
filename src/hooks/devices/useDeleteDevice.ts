import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { deviceService } from "../../services/device.service";

export function useDeleteDevice() {
  return useMutation({
    mutationFn: (id: string) => deviceService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
