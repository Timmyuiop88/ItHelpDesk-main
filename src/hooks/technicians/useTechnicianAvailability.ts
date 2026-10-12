import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { technicianService } from "../../services/technician.service";
import type { TechnicianAvailabilityPayload } from "../../types/technician.types";

export function useUpdateTechnicianAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TechnicianAvailabilityPayload) =>
      technicianService.updateAvailability(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.technicians.all });
    },
  });
}
