import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";
import type { AssignTicketPayload } from "../../types/ticket.types";

interface AssignTicketVariables {
  id: string;
  payload: AssignTicketPayload;
}

export function useAssignTicket() {
  return useMutation({
    mutationFn: ({ id, payload }: AssignTicketVariables) =>
      ticketService.assign(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(variables.id),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    },
  });
}
