import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { employeeService } from "../../services/employee.service";

export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeeService.getAll(),
  });
}
