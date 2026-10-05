import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";

interface AddParticipantVariables {
  id: string;
  userId: string;
}

export function useAddParticipant() {
  return useMutation({
    mutationFn: ({ id, userId }: AddParticipantVariables) =>
      ticketService.addParticipant(id, { userId }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.participants(variables.id),
      });
    },
  });
}
