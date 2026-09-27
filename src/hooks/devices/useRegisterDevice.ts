import { useMutation } from "@tanstack/react-query";
import { setStoredDeviceId } from "../../api/deviceStore";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { deviceService } from "../../services/device.service";
import type { RegisterDevicePayload } from "../../types/device.types";

export function useRegisterDevice() {
  return useMutation({
    mutationFn: (payload: RegisterDevicePayload) =>
      deviceService.register(payload),
    onSuccess: async (device) => {
      await setStoredDeviceId(device.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.devices.detail(device.id),
      });
    },
  });
}
