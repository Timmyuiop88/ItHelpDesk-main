import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { employeeService } from "../../services/employee.service";

export function useEmployees(
  departmentId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.employees.list({ departmentId, page: 1, limit: 100 }),
    queryFn: ({ signal }) =>
      employeeService.list({ departmentId, page: 1, limit: 100 }, signal),
    enabled,
    select: (data) => data.items,
  });
}

export function useAllEmployees(
  departmentId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.employees.allItems(departmentId),
    queryFn: () => employeeService.listAll({ departmentId }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
