import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { employeeService } from "../../services/employee.service";

export function useEmployees(
  departmentId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.employees.list(departmentId),
    queryFn: () => employeeService.getAll(departmentId),
    enabled,
  });
}
