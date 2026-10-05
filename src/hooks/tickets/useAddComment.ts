import { useMutation } from "@tanstack/react-query";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";
import type { CreateCommentPayload } from "../../types/ticket.types";

interface AddCommentVariables {
  id: string;
  payload: CreateCommentPayload;
}

export function useAddComment() {
  return useMutation({
    mutationFn: ({ id, payload }: AddCommentVariables) =>
      ticketService.addComment(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.comments(variables.id),
      });
    },
  });
}
