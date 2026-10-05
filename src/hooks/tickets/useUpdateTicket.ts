import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";
import type { UpdateTicketPayload } from "../../types/ticket.types";

interface UpdateTicketVariables {
  id: string;
  payload: UpdateTicketPayload;
}

export function useUpdateTicket() {
  return useMutation({
    mutationFn: ({ id, payload }: UpdateTicketVariables) =>
      ticketService.update(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(variables.id),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    },
  });
}
