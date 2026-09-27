import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { employeeService } from "../../services/employee.service";

export function useDeleteEmployee() {
  return useMutation({
    mutationFn: (id: string) => employeeService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.employees.all,
      });
    },
  });
}
