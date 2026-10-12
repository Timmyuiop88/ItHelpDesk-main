import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { technicianService } from "../../services/technician.service";

export function useTechnicians(
  departmentId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return usePagedTechniciansList(departmentId, { enabled });
}

function usePagedTechniciansList(
  departmentId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.technicians.list({ departmentId, page: 1, limit: 100 }),
    queryFn: ({ signal }) =>
      technicianService.list({ departmentId, page: 1, limit: 100 }, signal),
    enabled,
    select: (data) => data.items,
  });
}

/** Full list for dropdowns (fetchAll, 5 min stale). */
export function useAllTechnicians(
  departmentId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.technicians.allItems(departmentId),
    queryFn: () => technicianService.listAll({ departmentId }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
