import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { employeeService } from "../../services/employee.service";
import type { CreateEmployeePayload } from "../../types/employee.types";

export function useCreateEmployee() {
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) =>
      employeeService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.employees.all,
      });
    },
  });
}
