import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";

export function useCloseTicket() {
  return useMutation({
    mutationFn: (id: string) => ticketService.close(id),
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(id),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    },
  });
}
