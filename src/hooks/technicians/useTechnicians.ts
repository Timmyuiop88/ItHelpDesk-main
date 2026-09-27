import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { technicianService } from "../../services/technician.service";

export function useTechnicians() {
  return useQuery({
    queryKey: queryKeys.technicians.all,
    queryFn: () => technicianService.getAll(),
  });
}
