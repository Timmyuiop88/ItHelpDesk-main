import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { technicianService } from "../../services/technician.service";
import type { CreateTechnicianPayload } from "../../types/technician.types";

export function useCreateTechnician() {
  return useMutation({
    mutationFn: (payload: CreateTechnicianPayload) =>
      technicianService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.technicians.all,
      });
    },
  });
}
