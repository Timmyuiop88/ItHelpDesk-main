import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { employeeService } from "../../services/employee.service";
import type { UpdateEmployeePayload } from "../../types/employee.types";

interface UpdateEmployeeVariables {
  id: string;
  payload: UpdateEmployeePayload;
}

export function useUpdateEmployee() {
  return useMutation({
    mutationFn: ({ id, payload }: UpdateEmployeeVariables) =>
      employeeService.update(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.employees.detail(variables.id),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.employees.all,
      });
    },
  });
}
