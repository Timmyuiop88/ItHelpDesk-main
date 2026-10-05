import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { technicianService } from "../../services/technician.service";

export function useTechnicians(
  departmentId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.technicians.list(departmentId),
    queryFn: () => technicianService.getAll(departmentId),
    enabled,
  });
}
