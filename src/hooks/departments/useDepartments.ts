import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { departmentService } from "../../services/department.service";

export function useDepartments({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.getAll(),
    enabled,
  });
}
