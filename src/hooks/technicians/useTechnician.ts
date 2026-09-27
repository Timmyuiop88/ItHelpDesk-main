import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { technicianService } from "../../services/technician.service";

export function useTechnician(id: string) {
  return useQuery({
    queryKey: queryKeys.technicians.detail(id),
    queryFn: () => technicianService.getById(id),
    enabled: !!id,
  });
}
