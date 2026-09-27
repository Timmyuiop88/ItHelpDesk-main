import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { technicianService } from "../../services/technician.service";
import type { UpdateTechnicianPayload } from "../../types/technician.types";

interface UpdateTechnicianVariables {
  id: string;
  payload: UpdateTechnicianPayload;
}

export function useUpdateTechnician() {
  return useMutation({
    mutationFn: ({ id, payload }: UpdateTechnicianVariables) =>
      technicianService.update(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.technicians.detail(variables.id),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.technicians.all,
      });
    },
  });
}
