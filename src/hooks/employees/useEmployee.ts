import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { employeeService } from "../../services/employee.service";

export function useEmployee(id: string) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeeService.getById(id),
    enabled: !!id,
  });
}
