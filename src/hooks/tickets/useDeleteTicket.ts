import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";

export function useDeleteTicket() {
  return useMutation({
    mutationFn: (id: string) => ticketService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    },
  });
}
