import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { deviceService } from "../../services/device.service";
import type { UpdateDevicePayload } from "../../types/device.types";

interface UpdateDeviceVariables {
  id: string;
  payload: UpdateDevicePayload;
}

export function useUpdateDevice() {
  return useMutation({
    mutationFn: ({ id, payload }: UpdateDeviceVariables) =>
      deviceService.update(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.devices.detail(variables.id),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
