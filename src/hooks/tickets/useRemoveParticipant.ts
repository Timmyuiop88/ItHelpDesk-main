import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";

interface RemoveParticipantVariables {
  id: string;
  userId: string;
}

export function useRemoveParticipant() {
  return useMutation({
    mutationFn: ({ id, userId }: RemoveParticipantVariables) =>
      ticketService.removeParticipant(id, userId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.participants(variables.id),
      });
    },
  });
}
