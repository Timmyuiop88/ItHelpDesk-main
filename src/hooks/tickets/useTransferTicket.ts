import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";
import type { TransferTicketPayload } from "../../types/ticket.types";

interface TransferTicketVariables {
  id: string;
  payload: TransferTicketPayload;
}

export function useTransferTicket() {
  return useMutation({
    mutationFn: ({ id, payload }: TransferTicketVariables) =>
      ticketService.transfer(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    },
  });
}
