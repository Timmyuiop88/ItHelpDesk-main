import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { technicianService } from "../../services/technician.service";

export function useDeleteTechnician() {
  return useMutation({
    mutationFn: (id: string) => technicianService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.technicians.all,
      });
    },
  });
}
