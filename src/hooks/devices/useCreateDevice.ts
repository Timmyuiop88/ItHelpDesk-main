import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { deviceService } from "../../services/device.service";
import type { CreateDevicePayload } from "../../types/device.types";

export function useCreateDevice() {
  return useMutation({
    mutationFn: (payload: CreateDevicePayload) => deviceService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
